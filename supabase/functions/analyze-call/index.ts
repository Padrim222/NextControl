import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'jsr:@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const CALL_EVALUATION_PROMPT = `Você é um AVALIADOR PROFISSIONAL DE CALLS DE VENDAS da Next Control.
Analise a transcrição de call e avalie o closer em 6 dimensões.
Seja direto, preciso e acionável. Português BR.

Dimensões de Avaliação (0-10 cada):
1. ABERTURA: Rapport, tom, presença
2. DESCOBERTA: Perguntas de diagnóstico, investigação de dor
3. APRESENTAÇÃO: Clareza, conexão com a dor, valor percebido
4. OBJEÇÕES: Contorno, reframing, redução de risco
5. FECHAMENTO: Pedido de fechamento, urgentização, CTA
6. COMUNICAÇÃO: Fluidez, escuta ativa, linguagem corporal vocal

RETORNE SOMENTE JSON válido:
{
  "score_abertura": <0-10>,
  "score_descoberta": <0-10>,
  "score_apresentacao": <0-10>,
  "score_objecoes": <0-10>,
  "score_fechamento": <0-10>,
  "score_comunicacao": <0-10>,
  "score_geral": <média ponderada, 1 decimal>,
  "pontos_fortes": ["string"],
  "melhorias": ["string"],
  "resultado": "vendeu" | "perdeu" | "follow-up",
  "feedback_detalhado": "<análise em markdown, 150-250 palavras>",
  "nivel": "Iniciante" | "Intermediário" | "Avançado" | "Expert"
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

        const authClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            { global: { headers: { Authorization: authHeader } } }
        )
        const { data: { user }, error: authError } = await authClient.auth.getUser()
        if (authError || !user) {
            throw new Error('Unauthorized')
        }

        const supabase = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
        )

        const { transcription, prospect_name, duration_minutes, client_id } = await req.json()

        if (!transcription?.trim()) {
            throw new Error('transcription is required')
        }

        // Rate limit: max 5 analyses per day
        const today = new Date().toISOString().split('T')[0]
        const { count } = await supabase
            .from('call_evaluations')
            .select('*', { count: 'exact', head: true })
            .eq('closer_id', user.id)
            .gte('created_at', `${today}T00:00:00`)

        if ((count || 0) >= 5) {
            return new Response(
                JSON.stringify({ error: 'Limite diário de 5 análises de calls atingido.' }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 429 }
            )
        }

        const apiKey = Deno.env.get('OPENROUTER_API_KEY')
        if (!apiKey) {
            throw new Error('OpenRouter API Key not configured')
        }

        // Fetch closer name for context
        const { data: closer } = await supabase
            .from('users')
            .select('name')
            .eq('id', user.id)
            .single()

        const userPrompt = `Closer: ${closer?.name || 'Desconhecido'}
Prospect: ${prospect_name || 'N/A'}
Duração: ${duration_minutes || 'N/A'} minutos

TRANSCRIÇÃO DA CALL:
${transcription}`

        const aiResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
                'HTTP-Referer': 'https://nextbase360.com',
                'X-Title': 'Call Analysis - Next Control',
            },
            body: JSON.stringify({
                model: 'google/gemini-2.0-flash-001',
                messages: [
                    { role: 'system', content: CALL_EVALUATION_PROMPT },
                    { role: 'user', content: userPrompt }
                ],
                temperature: 0.3,
                max_tokens: 1500,
                response_format: { type: 'json_object' },
            }),
        })

        if (!aiResponse.ok) {
            const errBody = await aiResponse.text()
            console.error('AI error:', errBody)
            throw new Error('AI analysis service temporarily unavailable')
        }

        const aiData = await aiResponse.json()
        const rawContent = aiData.choices?.[0]?.message?.content || '{}'
        const evaluation = JSON.parse(rawContent.replace(/```json\n?|\n?```/g, ''))

        // Create call_log first
        const { data: callLog } = await supabase
            .from('call_logs')
            .insert({
                closer_id: user.id,
                client_id: client_id || null,
                call_date: today,
                transcription: transcription.substring(0, 10000),
                outcome: evaluation.resultado === 'vendeu' ? 'sale' : evaluation.resultado === 'follow-up' ? 'reschedule' : 'no_sale',
                prospect_name: prospect_name || null,
                duration_minutes: duration_minutes || null,
            })
            .select('id')
            .single()

        // Save evaluation
        const { data: savedEvaluation, error: saveError } = await supabase
            .from('call_evaluations')
            .insert({
                call_log_id: callLog?.id || null,
                closer_id: user.id,
                prospect_name: prospect_name || null,
                duration_minutes: duration_minutes || null,
                score_abertura: evaluation.score_abertura || 0,
                score_descoberta: evaluation.score_descoberta || 0,
                score_apresentacao: evaluation.score_apresentacao || 0,
                score_objecoes: evaluation.score_objecoes || 0,
                score_fechamento: evaluation.score_fechamento || 0,
                score_comunicacao: evaluation.score_comunicacao || 0,
                score_geral: evaluation.score_geral || 0,
                pontos_fortes: evaluation.pontos_fortes || [],
                melhorias: evaluation.melhorias || [],
                resultado: evaluation.resultado || 'perdeu',
                feedback_detalhado: evaluation.feedback_detalhado || '',
                nivel: evaluation.nivel || 'Iniciante',
                ai_model: 'gemini-2.0-flash',
            })
            .select()
            .single()

        if (saveError) {
            console.error('Failed to save evaluation:', saveError)
            throw new Error('Failed to save evaluation')
        }

        return new Response(
            JSON.stringify(savedEvaluation),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error'
        console.error('Analyze call error:', message)
        return new Response(
            JSON.stringify({ error: message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        )
    }
})
