import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'jsr:@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const supabase = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
        )

        const { report_id } = await req.json()

        if (!report_id) {
            throw new Error('Report ID is required')
        }

        // 1. Fetch the report
        const { data: report, error: reportError } = await supabase
            .from('daily_submissions')
            .select(`
        *,
        seller:users!seller_id(id, name, seller_type, client_id)
      `)
            .eq('id', report_id)
            .single()

        if (reportError || !report) {
            throw new Error('Report not found')
        }

        // 2. Identify the client
        let clientId = report.seller?.client_id;
        let clientName = 'Cliente';

        if (!clientId) {
            // Fallback: search in clients table where this seller is assigned
            const { data: clientData } = await supabase
                .from('clients')
                .select('id, name')
                .or(`assigned_seller_id.eq.${report.seller_id},assigned_closer_id.eq.${report.seller_id}`)
                .maybeSingle();

            if (clientData) {
                clientId = clientData.id;
                clientName = clientData.name;
            }
        } else {
            // Get client name if we have the ID
            const { data: clientData } = await supabase
                .from('clients')
                .select('name')
                .eq('id', clientId)
                .single();
            if (clientData) clientName = clientData.name;
        }

        if (!clientId) {
            console.warn('No client identified for this report/seller');
        }

        // 3. Fetch recent call logs for context (last 24h)
        const { data: calls } = clientId
            ? await supabase
                .from('call_logs')
                .select('*')
                .eq('client_id', clientId)
                .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
            : { data: [] };

        // 4. Fetch RAG materials for context
        let ragContext = '';
        if (clientId) {
            const { data: materials } = await supabase
                .from('client_materials')
                .select('title, description')
                .eq('client_id', clientId)
                .eq('is_rag_active', true);

            if (materials && materials.length > 0) {
                ragContext = `\n\n=== CONTEXTO DA BASE RAG DO CLIENTE (${clientName}) ===\n` +
                    materials.map((m: any) => `* MATERIAL: ${m.title}\n* CONTEÚDO/RESUMO: ${m.description || 'Sem descrição detalhada'}`).join('\n\n') +
                    "\n=======================================\n\nUse estritamente as informações do contexto acima para fundamentar falhas identificadas e estratégias novas.";
            }
        }

        // 3.1 Fetch Seller Playbook (Scripts & Blacklist)
        const { data: playbook } = await supabase
            .from('seller_playbooks')
            .select('type, title, content')
            .eq('user_id', report.seller_id)

        const playbookContext = playbook?.length ?
            `=== PLAYBOOK DO CONSULTOR ===\n` +
            playbook.map((p: any) => `[${p.type.toUpperCase()}] ${p.title}: ${p.content}`).join('\n') :
            'Sem playbook cadastrado.'

        // 4. Construct AI Prompt
        const prompt = `
    VOCÊ É O HEAD-AGENT DA NEXT CONTROL.
    Sua missão é dar feedback de alto nível para o consultor de vendas: ${report.seller?.name || 'Desconhecido'}.
    
    DADOS DO CLIENTE VENDIDO (${clientName}):
    ${ragContext}
    
    ${playbookContext}
    
    DADOS DO RELATÓRIO DO DIA (${report.submission_date}):
    MÉTRICAS: ${JSON.stringify(report.metrics)}
    PRINTS: ${report.conversation_prints?.length || 0} anexados
    
    NOTAS DO CONSULTOR:
    "${report.notes || 'Sem notas'}"
    
    CONTEXTO DE LIGAÇÕES (Últimas 24h):
    ${calls?.map((c: any) => `- [${c.outcome}] ${c.notes || ''}`).join('\n') || 'Nenhuma ligação registrada.'}
    
    TAREFA:
    Analise o desempenho comparando o RAG do Cliente (o que deve ser vendido/como) com o que o consultor está fazendo (Relatório + Métricas).
    Verifique se ele está seguindo o PLAYBOOK ou usando itens da BLACKLIST.
    
    Forneça uma análise JSON com a seguinte estrutura:
    {
      "operational_analysis": "Análise sobre volume, ritmo e organização.",
      "tactical_analysis": "Análise sobre a qualidade da abordagem e conversão. Se seguiu o Playbook.",
      "errors_identified": "Liste pontos específicos onde o consultor falhou, desviou do RAG ou usou termos da BLACKLIST.",
      "new_strategies": "Sugira estratégias de reaquecimento baseadas no Playbook e no RAG.",
      "suggested_scripts": "Script sugerido para a situação atual.",
      "recommendations": ["Sugestão 1", "Sugestão 2", "Sugestão 3"],
      "score": number (0-10)
    }
    
    Seja direto e construtivo. Retorne APENAS o JSON.
    `

        // 4. Call OpenRouter
        const apiKey = Deno.env.get('OPENROUTER_API_KEY')
        if (!apiKey) {
            throw new Error('OpenRouter API Key not configured')
        }

        const aiResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
                'HTTP-Referer': 'https://nextbase360.com',
                'X-Title': 'LeadFlow Head Agent',
            },
            body: JSON.stringify({
                model: 'google/gemini-2.0-flash-001',
                messages: [
                    { role: 'system', content: 'You are a helpful assistant that outputs only valid JSON.' },
                    { role: 'user', content: prompt }
                ],
                temperature: 0.7,
                response_format: { type: 'json_object' },
            })
        })

        const aiData = await aiResponse.json()
        const content = aiData.choices?.[0]?.message?.content

        // Parse JSON from content (handle potential markdown fences)
        const jsonStr = content.replace(/```json\n?|\n?```/g, '')
        const analysis = JSON.parse(jsonStr)

        // 5. Store Feedback
        const { error: saveError } = await supabase
            .from('ai_feedback')
            .insert({
                report_id: report_id,
                feedback_text: JSON.stringify(analysis),
                model: 'gemini-2.0-flash',
                generated_by: null // System generated
            })

        if (saveError) {
            console.error('Failed to save feedback:', saveError)
        }

        return new Response(
            JSON.stringify(analysis),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error'
        console.error('Head agent error:', message)
        return new Response(
            JSON.stringify({ error: message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        )
    }
})
