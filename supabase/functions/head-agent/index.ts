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
            .from('daily_reports')
            .select(`
        *,
        seller:users!seller_id(name),
        client:clients!client_id(name, company)
      `)
            .eq('id', report_id)
            .single()

        if (reportError || !report) {
            throw new Error('Report not found')
        }

        // 2. Fetch recent call logs for context (last 24h)
        const { data: calls } = await supabase
            .from('call_logs')
            .select('*')
            .eq('client_id', report.client_id)
            .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())

        // 3. Prepare Prompt
        const prompt = `
    Atue como um Head de Vendas experiente, analítico e focado em metodologia.
    Analise os dados do consultor de vendas e forneça feedback estruturado.
    
    DADOS DO RELATÓRIO:
    Consultor: ${report.seller?.name}
    Cliente: ${report.client?.name} (${report.client?.company})
    
    METRICAS DO FUNIL (Hoje):
    - Chat Ativo: ${report.chat_ativo}
    - Boas Vindas: ${report.boas_vindas}
    - Reaquecimento: ${report.reaquecimento}
    - Nutrição: ${report.nutricao}
    - Conexões: ${report.conexoes}
    - Mapeamentos: ${report.mapeamentos}
    - Pitchs: ${report.pitchs}
    - Capturas (Vendas): ${report.capturas}
    - Follow-ups: ${report.followups}
    
    NOTAS DO CONSULTOR:
    "${report.notes}"
    
    CONTEXTO DE LIGAÇÕES (Últimas 24h):
    ${calls?.map((c: any) => `- [${c.outcome}] ${c.notes || ''}`).join('\n') || 'Nenhuma ligação registrada.'}
    
    TAREFA:
    Forneça uma análise JSON com a seguinte estrutura:
    {
      "operational_analysis": "Análise sobre volume, ritmo e organização (ex: gargalo em conexões, poucas boas vindas).",
      "tactical_analysis": "Análise sobre a qualidade da abordagem e conversão (ex: seguiu o script? ofertou o produto certo?).",
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
                model: 'openai/gpt-4o',
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
                model: 'gpt-4o',
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
