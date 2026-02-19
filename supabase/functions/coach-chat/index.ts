import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'jsr:@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ChatRequest {
    seller_id: string
    message: string
    conversation_history?: { role: string; content: string }[]
}

interface SellerContext {
    seller_type: string
    recent_scores: number[]
    strengths: string[]
    weaknesses: string[]
    tenure_months: number
}

async function buildSellerContext(supabase: any, sellerId: string): Promise<SellerContext> {
    // Fetch seller profile
    const { data: seller } = await supabase
        .from('users')
        .select('seller_type, created_at')
        .eq('id', sellerId)
        .single()

    const sellerType = seller?.seller_type || 'seller'
    const createdAt = seller?.created_at ? new Date(seller.created_at) : new Date()
    const tenureMonths = Math.max(1, Math.floor((Date.now() - createdAt.getTime()) / (30 * 24 * 60 * 60 * 1000)))

    // Fetch recent analyses for context
    const { data: recentAnalyses } = await supabase
        .from('analyses')
        .select('score, strengths, improvements, submission_id')
        .in('submission_id',
            supabase
                .from('daily_submissions')
                .select('id')
                .eq('seller_id', sellerId)
                .order('submission_date', { ascending: false })
                .limit(10)
        )
        .order('created_at', { ascending: false })
        .limit(5)

    // Aggregate context
    const scores = (recentAnalyses || []).map((a: any) => a.score).filter(Boolean)
    const allStrengths = (recentAnalyses || []).flatMap((a: any) => a.strengths || [])
    const allWeaknesses = (recentAnalyses || []).flatMap((a: any) => a.improvements || [])

    // Deduplicate
    const strengths = [...new Set(allStrengths)].slice(0, 5)
    const weaknesses = [...new Set(allWeaknesses)].slice(0, 5)

    return {
        seller_type: sellerType,
        recent_scores: scores,
        strengths,
        weaknesses,
        tenure_months: tenureMonths,
    }
}

function buildSystemPrompt(ctx: SellerContext): string {
    const roleDescription = ctx.seller_type === 'closer'
        ? 'Seu foco é técnicas de fechamento, calls, contorno de objeções e taxa de conversão.'
        : 'Seu foco é prospecção, abordagem via social selling, follow-up e geração de oportunidades.'

    return `Você é o Treinador de Bolso, um coach de vendas IA da Nextbase 360.
Tom: informal mas profissional, como um mentor de vendas experiente.
Idioma: Português BR.
${roleDescription}

CONTEXTO DO VENDEDOR:
- Tipo: ${ctx.seller_type}
- Scores recentes: ${ctx.recent_scores.length ? ctx.recent_scores.join(', ') : 'Ainda sem avaliações'}
- Pontos fortes: ${ctx.strengths.length ? ctx.strengths.join(', ') : 'Ainda sem dados'}
- Áreas de melhoria: ${ctx.weaknesses.length ? ctx.weaknesses.join(', ') : 'Ainda sem dados'}
- Tempo de empresa: ${ctx.tenure_months} meses

REGRAS:
1. Personalize TODA resposta com dados reais do vendedor quando disponíveis
2. Cite métricas específicas quando possível
3. Seja acionável: dê passos concretos, não teoria genérica
4. Se não souber responder, admita e sugira perguntar ao Ronaldo
5. Máximo 300 palavras por resposta
6. Use emojis com moderação para manter leitura agradável
7. Sempre termine com uma pergunta ou sugestão de próximo passo`
}

Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const authHeader = req.headers.get('Authorization')
        if (!authHeader) {
            throw new Error('Missing authorization header')
        }

        // Auth client to verify user
        const authClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            { global: { headers: { Authorization: authHeader } } }
        )

        const { data: { user }, error: authError } = await authClient.auth.getUser()
        if (authError || !user) {
            throw new Error('Unauthorized')
        }

        // Service role client for DB operations
        const supabase = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
        )

        const { seller_id, message, conversation_history = [] } = await req.json() as ChatRequest

        if (!message?.trim()) {
            throw new Error('Message is required')
        }

        const effectiveSellerId = seller_id || user.id

        // Rate limit: max 30 messages per day
        const today = new Date().toISOString().split('T')[0]
        const { count } = await supabase
            .from('coach_interactions')
            .select('*', { count: 'exact', head: true })
            .eq('seller_id', effectiveSellerId)
            .gte('created_at', `${today}T00:00:00`)

        if ((count || 0) >= 30) {
            return new Response(
                JSON.stringify({
                    answer: '⏳ Você atingiu o limite diário de 30 mensagens. Volte amanhã para continuar nosso papo! Enquanto isso, revise suas últimas análises no dashboard.',
                    interaction_id: null,
                    context_used: {},
                }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // Build seller context from real data
        const context = await buildSellerContext(supabase, effectiveSellerId)
        const systemPrompt = buildSystemPrompt(context)

        // Build messages for OpenAI
        const messages = [
            { role: 'system', content: systemPrompt },
            ...conversation_history.slice(-10), // Last 10 messages for context
            { role: 'user', content: message.trim() },
        ]

        // Call OpenRouter
        const apiKey = Deno.env.get('OPENROUTER_API_KEY')
        if (!apiKey) {
            throw new Error('OpenRouter API Key not configured. Contact support.')
        }

        const aiResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
                'HTTP-Referer': 'https://nextbase360.com',
                'X-Title': 'Treinador de Bolso',
            },
            body: JSON.stringify({
                model: 'openai/gpt-4o',
                messages,
                temperature: 0.7,
                max_tokens: 600,
            }),
        })

        if (!aiResponse.ok) {
            const errBody = await aiResponse.text()
            console.error('OpenAI error:', errBody)
            throw new Error('AI service temporarily unavailable')
        }

        const aiData = await aiResponse.json()
        const answer = aiData.choices?.[0]?.message?.content || 'Desculpe, não consegui processar sua pergunta. Tente novamente.'

        // Save interaction
        const { data: interaction, error: saveError } = await supabase
            .from('coach_interactions')
            .insert({
                seller_id: effectiveSellerId,
                question: message.trim(),
                answer,
                context: {
                    seller_type: context.seller_type,
                    recent_scores: context.recent_scores,
                    strengths: context.strengths,
                    weaknesses: context.weaknesses,
                    tenure_months: context.tenure_months,
                },
            })
            .select('id')
            .single()

        if (saveError) {
            console.error('Failed to save interaction:', saveError)
        }

        return new Response(
            JSON.stringify({
                answer,
                interaction_id: interaction?.id || null,
                context_used: {
                    recent_scores: context.recent_scores,
                    strengths: context.strengths,
                    weaknesses: context.weaknesses,
                },
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error'
        console.error('Coach chat error:', message)
        return new Response(
            JSON.stringify({ error: message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        )
    }
})
