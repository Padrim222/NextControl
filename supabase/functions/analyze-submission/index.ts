import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'jsr:@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const SOCIAL_SELLING_PROMPT = `Você é o CONSULTOR DE BOLSO da Next Control.
Sua missão: Acelerar resultados de vendas via Redes Sociais.
Analise os dados e prints fornecidos.
Seja CURTO, GROSSO e DIRETO. Sem "parabéns pelo esforço". Foco em DINHEIRO.

Estrutura de Resposta (obrigatória):
1. 🛑 O Erro: Onde ele está perdendo dinheiro hoje? (Max 1 frase)
2. 🚀 A Solução: O que fazer AMANHÃ para vender? (Max 2 bullets acionáveis)
3. 💡 Dica de Mestre: Um hack psicológico curto.

Tom de voz: Head de Vendas sênior falando com júnior.

RETORNE SOMENTE JSON válido no seguinte formato:
{
    "score": <número 0-100>,
    "content": "<análise textual em Markdown, siga a estrutura acima>",
    "strengths": ["ponto forte 1"],
    "improvements": ["melhoria 1"],
    "patterns": {
        "approach": "<análise>",
        "discovery": "<análise>",
        "presentation": "<análise>",
        "close": "<análise>"
    },
    "next_steps": ["ação 1", "ação 2"]
}`

const CALL_ANALYSIS_PROMPT = `Você é o CLOSER DE ELITE da Next Control.
Sua missão: Aumentar a conversão de fechamento.
Analise os números e a gravação (se houver).
Seja CURTO, GROSSO e DIRETO. Sem rodeios. Foco em FECHAR.

Estrutura de Resposta (obrigatória):
1. 🛑 O Gargalo: Por que o lead não comprou? (Max 1 frase)
2. 🚀 A Solução: Qual pergunta faltou fazer? (Max 2 bullets acionáveis)
3. 💡 Dica de Mestre: Um hack de negociação curto.

Tom de voz: Head de Vendas sênior falando com júnior.

RETORNE SOMENTE JSON válido no seguinte formato:
{
    "score": <número 0-100>,
    "content": "<análise textual em Markdown, siga a estrutura acima>",
    "strengths": ["ponto forte 1"],
    "improvements": ["melhoria 1"],
    "patterns": {
        "objections": ["objeção 1"],
        "discovery": "<análise>",
        "close": "<análise>"
    },
    "next_steps": ["ação 1", "ação 2"]
}`

const METRICS_PROMPT = `Você é um analista de performance de vendas da Next Control.
Analise as métricas do dia do vendedor e forneça insights.

RETORNE SOMENTE JSON válido no seguinte formato:
{
    "score": <número 0-100>,
    "content": "<análise das métricas em PT-BR, 100-150 palavras>",
    "strengths": ["ponto forte 1"],
    "improvements": ["melhoria 1"],
    "patterns": {},
    "next_steps": ["ação 1", "ação 2"]
}`

Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const authHeader = req.headers.get('Authorization')
        if (!authHeader) {
            throw new Error('Missing authorization header')
        }

        // Verify user
        const authClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            { global: { headers: { Authorization: authHeader } } }
        )
        const { data: { user }, error: authError } = await authClient.auth.getUser()
        if (authError || !user) {
            throw new Error('Unauthorized')
        }

        // Service role for DB operations
        const supabase = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
        )

        const { submission_id } = await req.json()
        if (!submission_id) {
            throw new Error('submission_id is required')
        }

        // Rate limit: max 3 analyses per day per seller
        const today = new Date().toISOString().split('T')[0]
        const { data: submission, error: subError } = await supabase
            .from('daily_submissions')
            .select('*')
            .eq('id', submission_id)
            .single()

        if (subError || !submission) {
            throw new Error('Submission not found')
        }

        // Fetch user info to check role
        const { data: currentUser } = await supabase
            .from('users')
            .select('role')
            .eq('id', user.id)
            .single()

        const isAdmin = currentUser?.role === 'admin'

        if (!isAdmin) {
            // Rate limit: max 3 analyses per day per seller
            const today = new Date().toISOString().split('T')[0]

            // Two-step query: first get today's submission IDs, then count analyses
            const { data: todaySubs } = await supabase
                .from('daily_submissions')
                .select('id')
                .eq('seller_id', submission.seller_id)
                .gte('submission_date', today)

            const todaySubIds = (todaySubs || []).map((s: any) => s.id)

            const { count: analysisCount } = todaySubIds.length > 0
                ? await supabase
                    .from('analyses')
                    .select('*', { count: 'exact', head: true })
                    .in('submission_id', todaySubIds)
                : { count: 0 }

            if ((analysisCount || 0) >= 3) {
                return new Response(
                    JSON.stringify({ error: 'Daily analysis limit reached (max 3)' }),
                    { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 429 }
                )
            }
        } else {
            console.log(`Admin ${user.id} bypassing analysis limits for seller ${submission.seller_id}`)
        }

        // Fetch seller info
        const { data: seller } = await supabase
            .from('users')
            .select('name, seller_type')
            .eq('id', submission.seller_id)
            .single()

        // --- RAG CONTEXT FETCH ---
        let ragContext = "";
        const { data: clientData } = await supabase
            .from('clients')
            .select('id, name')
            .or(`assigned_seller_id.eq.${submission.seller_id},assigned_closer_id.eq.${submission.seller_id}`)
            .maybeSingle();

        if (clientData) {
            const { data: materials } = await supabase
                .from('client_materials')
                .select('title, description')
                .eq('client_id', clientData.id)
                .eq('is_rag_active', true);

            if (materials && materials.length > 0) {
                ragContext = "\n\n=== CONTEXTO RAG DO CLIENTE (" + clientData.name + ") ===\n" +
                    materials.map((m: any) => `* MATERIAL: ${m.title}\n* CONTEÚDO/REGRAS: ${m.description || 'Sem descrição'}`).join('\n\n') +
                    "\n=======================================\n\nUse este contexto para validar se o vendedor está seguindo o playbook e as regras do produto.";
            }
        }
        // -------------------------

        const sellerType = seller?.seller_type || 'seller'
        const hasPrints = submission.conversation_prints?.length > 0
        const hasCall = !!submission.call_recording

        // Determine agent type
        let agentType: string
        let systemPrompt: string
        const openAiMessages: any[] = []

        if (hasPrints && sellerType === 'seller') {
            agentType = 'social_selling'
            systemPrompt = SOCIAL_SELLING_PROMPT

            // Build vision messages with print URLs
            const imageContent = submission.conversation_prints.map((url: string) => ({
                type: 'image_url',
                image_url: { url, detail: 'low' },
            }))

            openAiMessages.push(
                { role: 'system', content: systemPrompt },
                {
                    role: 'user',
                    content: [
                        { type: 'text', text: `Vendedor: ${seller?.name || 'Desconhecido'} \nMétricas do dia: ${JSON.stringify(submission.metrics)}\nNotas: ${submission.notes || 'Nenhuma'}${ragContext} \n\nAnalise os prints de conversa abaixo: ` },
                        ...imageContent,
                    ],
                }
            )
        } else if (hasCall && sellerType === 'closer') {
            agentType = 'call_analysis'
            systemPrompt = CALL_ANALYSIS_PROMPT

            // For call analysis, we'd use Whisper first, then GPT-4o
            // For MVP: analyze based on metrics + notes
            openAiMessages.push(
                { role: 'system', content: systemPrompt },
                {
                    role: 'user',
                    content: `Closer: ${seller?.name || 'Desconhecido'} \nMétricas do dia: ${JSON.stringify(submission.metrics)}\nNotas: ${submission.notes || 'Nenhuma'} \nGravação de call: ${submission.call_recording}${ragContext} \n\nAnalise a performance com base nos dados disponíveis.`,
                }
            )
        } else {
            // Metrics-only analysis
            agentType = 'metrics'
            systemPrompt = METRICS_PROMPT

            openAiMessages.push(
                { role: 'system', content: systemPrompt },
                {
                    role: 'user',
                    content: `${sellerType === 'closer' ? 'Closer' : 'Vendedor'}: ${seller?.name || 'Desconhecido'} \nMétricas do dia: ${JSON.stringify(submission.metrics)}\nNotas: ${submission.notes || 'Nenhuma'}${ragContext} \n\nAnalise as métricas e forneça feedback.`,
                }
            )
        }

        // Call OpenRouter
        const apiKey = Deno.env.get('OPENROUTER_API_KEY')
        if (!apiKey) {
            throw new Error('OpenRouter API Key not configured')
        }

        const aiResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
                'HTTP-Referer': 'https://nextcontrol.app',
                'X-Title': 'Consultoria de Bolso',
            },
            body: JSON.stringify({
                model: 'google/gemini-2.0-flash-001',
                messages: openAiMessages,
                temperature: 0.5,
                max_tokens: 1000,
                response_format: { type: 'json_object' },
            }),
        })

        if (!aiResponse.ok) {
            const errBody = await aiResponse.text()
            console.error('OpenAI error:', errBody)
            throw new Error('AI analysis service temporarily unavailable')
        }

        const aiData = await aiResponse.json()
        const rawContent = aiData.choices?.[0]?.message?.content || '{}'
        const analysis = JSON.parse(rawContent.replace(/```json\n ?|\n ? ```/g, ''))

        // Validate score
        const score = Math.min(100, Math.max(0, analysis.score || 0))

        // Save analysis
        const { data: savedAnalysis, error: saveError } = await supabase
            .from('analyses')
            .insert({
                submission_id,
                agent_type: agentType,
                content: analysis.content || '',
                strengths: analysis.strengths || [],
                improvements: analysis.improvements || [],
                patterns: analysis.patterns || {},
                next_steps: analysis.next_steps || [],
                score,
            })
            .select()
            .single()

        if (saveError) {
            console.error('Failed to save analysis:', saveError)
            throw new Error('Failed to save analysis')
        }

        return new Response(
            JSON.stringify(savedAnalysis),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error'
        console.error('Analyze submission error:', message)
        return new Response(
            JSON.stringify({ error: message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        )
    }
})
