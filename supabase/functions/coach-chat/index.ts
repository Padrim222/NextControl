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
    today_metrics: Record<string, number>
    yesterday_metrics: Record<string, number>
    metric_deltas: Record<string, number>
    call_scores: { score: number; nivel: string; date: string }[]
    discarded_strategies: string[]
    active_strategies: { description: string; impact: number }[]
    weekly_trend: 'improving' | 'declining' | 'stable' | 'unknown'
}

async function buildSellerContext(supabase: any, sellerId: string): Promise<SellerContext> {
    const { data: seller } = await supabase
        .from('users')
        .select('seller_type, created_at')
        .eq('id', sellerId)
        .single()

    const sellerType = seller?.seller_type || 'seller'
    const createdAt = seller?.created_at ? new Date(seller.created_at) : new Date()
    const tenureMonths = Math.max(1, Math.floor((Date.now() - createdAt.getTime()) / (30 * 24 * 60 * 60 * 1000)))

    // Fetch recent analyses
    const { data: recentAnalyses } = await supabase
        .from('analyses')
        .select('score, strengths, improvements, created_at')
        .eq('submission_id', supabase
            .from('daily_submissions')
            .select('id')
            .eq('seller_id', sellerId)
            .order('submission_date', { ascending: false })
            .limit(10)
        )
        .order('created_at', { ascending: false })
        .limit(5)

    const scores = (recentAnalyses || []).map((a: any) => a.score).filter(Boolean)
    const allStrengths = (recentAnalyses || []).flatMap((a: any) => a.strengths || [])
    const allWeaknesses = (recentAnalyses || []).flatMap((a: any) => a.improvements || [])
    const strengths = [...new Set(allStrengths)].slice(0, 5)
    const weaknesses = [...new Set(allWeaknesses)].slice(0, 5)

    // Real-time metrics: today vs yesterday via DB function
    let todayMetrics: Record<string, number> = {}
    let yesterdayMetrics: Record<string, number> = {}
    let metricDeltas: Record<string, number> = {}

    try {
        const { data: deltaData } = await supabase.rpc('get_seller_daily_delta', { p_seller_id: sellerId })
        if (deltaData?.[0]) {
            todayMetrics = deltaData[0].today_metrics || {}
            yesterdayMetrics = deltaData[0].yesterday_metrics || {}
            metricDeltas = deltaData[0].delta || {}
        }
    } catch (e) {
        console.warn('Delta fetch failed:', e)
    }

    // Call evaluation scores (last 5)
    const { data: callEvals } = await supabase
        .from('call_evaluations')
        .select('score_geral, nivel, created_at')
        .eq('closer_id', sellerId)
        .order('created_at', { ascending: false })
        .limit(5)

    const callScores = (callEvals || []).map((e: any) => ({
        score: e.score_geral,
        nivel: e.nivel,
        date: new Date(e.created_at).toLocaleDateString('pt-BR'),
    }))

    // Strategy log: discarded and active
    const { data: strategies } = await supabase
        .from('strategy_log')
        .select('strategy_description, impact_score, discarded, reason')
        .eq('seller_id', sellerId)
        .order('created_at', { ascending: false })
        .limit(15)

    const discardedStrategies = (strategies || [])
        .filter((s: any) => s.discarded)
        .map((s: any) => `${s.strategy_description} (motivo: ${s.reason || 'não funcionou'})`)
        .slice(0, 5)

    const activeStrategies = (strategies || [])
        .filter((s: any) => !s.discarded && s.impact_score != null)
        .map((s: any) => ({ description: s.strategy_description, impact: s.impact_score }))
        .slice(0, 5)

    // Weekly trend: compare last 2 weeks of scores
    let weeklyTrend: 'improving' | 'declining' | 'stable' | 'unknown' = 'unknown'
    if (scores.length >= 2) {
        const recent = scores.slice(0, Math.ceil(scores.length / 2))
        const older = scores.slice(Math.ceil(scores.length / 2))
        const recentAvg = recent.reduce((a: number, b: number) => a + b, 0) / recent.length
        const olderAvg = older.reduce((a: number, b: number) => a + b, 0) / older.length
        if (recentAvg > olderAvg + 3) weeklyTrend = 'improving'
        else if (recentAvg < olderAvg - 3) weeklyTrend = 'declining'
        else weeklyTrend = 'stable'
    }

    return {
        seller_type: sellerType,
        recent_scores: scores,
        strengths,
        weaknesses,
        tenure_months: tenureMonths,
        today_metrics: todayMetrics,
        yesterday_metrics: yesterdayMetrics,
        metric_deltas: metricDeltas,
        call_scores: callScores,
        discarded_strategies: discardedStrategies,
        active_strategies: activeStrategies,
        weekly_trend: weeklyTrend,
    }
}

function buildSystemPrompt(ctx: SellerContext): string {
    const roleDescription = ctx.seller_type === 'closer'
        ? 'Seu foco é técnicas de fechamento, calls, contorno de objeções e taxa de conversão.'
        : 'Seu foco é prospecção, abordagem via social selling, follow-up e geração de oportunidades.'

    const metricsSection = Object.keys(ctx.today_metrics).length > 0
        ? `\nMÉTRICAS DE HOJE:\n${Object.entries(ctx.today_metrics).map(([k, v]) => {
            const delta = ctx.metric_deltas[k]
            const arrow = delta > 0 ? `↑ +${delta}` : delta < 0 ? `↓ ${delta}` : '→ 0'
            return `- ${k}: ${v} (vs ontem: ${arrow})`
        }).join('\n')}`
        : '\nMÉTRICAS DE HOJE: Ainda não enviou check-in hoje.'

    const callSection = ctx.call_scores.length > 0
        ? `\nÚLTIMAS CALLS:\n${ctx.call_scores.map(c => `- Score ${c.score} (${c.nivel}) em ${c.date}`).join('\n')}`
        : ''

    const strategySection = ctx.discarded_strategies.length > 0
        ? `\n⚠️ ESTRATÉGIAS JÁ DESCARTADAS (NÃO RECOMENDAR):\n${ctx.discarded_strategies.map(s => `- ${s}`).join('\n')}`
        : ''

    const activeSection = ctx.active_strategies.length > 0
        ? `\n✅ ESTRATÉGIAS ATIVAS (impacto comprovado):\n${ctx.active_strategies.map(s => `- ${s.description} (impacto: ${s.impact}/10)`).join('\n')}`
        : ''

    const trendBadge = {
        improving: '📈 Tendência: EM ALTA — mantenha o ritmo!',
        declining: '📉 Tendência: EM QUEDA — identifique o que mudou.',
        stable: '➡️ Tendência: ESTÁVEL — hora de experimentar algo novo.',
        unknown: '',
    }[ctx.weekly_trend]

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
${trendBadge ? `- ${trendBadge}` : ''}
${metricsSection}${callSection}${strategySection}${activeSection}

REGRAS:
1. NUNCA recomende estratégias que já foram descartadas
2. Cite métricas REAIS do vendedor — números do dia, deltas, scores de calls
3. Se o vendedor tem tendência de queda, priorize diagnóstico antes de novas estratégias
4. Quando sugerir nova estratégia, pergunte se quer registrar no strategy log
5. Máximo 300 palavras por resposta
6. Seja acionável: passos concretos, não teoria genérica
7. Use emojis com moderação
8. Sempre termine com pergunta ou próximo passo`
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

        const { seller_id, message, conversation_history = [] } = await req.json() as ChatRequest

        if (!message?.trim()) {
            throw new Error('Message is required')
        }

        const effectiveSellerId = seller_id || user.id

        // Rate limit
        const today = new Date().toISOString().split('T')[0]
        const { count } = await supabase
            .from('coach_interactions')
            .select('*', { count: 'exact', head: true })
            .eq('seller_id', effectiveSellerId)
            .gte('created_at', `${today}T00:00:00`)

        if ((count || 0) >= 30) {
            return new Response(
                JSON.stringify({
                    answer: '⏳ Limite diário de 30 mensagens atingido. Volte amanhã! Enquanto isso, revise suas análises no dashboard.',
                    interaction_id: null,
                    context_used: {},
                }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // Build rich context with real-time metrics
        const context = await buildSellerContext(supabase, effectiveSellerId)
        const systemPrompt = buildSystemPrompt(context)

        const messages = [
            { role: 'system', content: systemPrompt },
            ...conversation_history.slice(-10),
            { role: 'user', content: message.trim() },
        ]

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
                'X-Title': 'Treinador de Bolso - Next Control',
            },
            body: JSON.stringify({
                model: 'google/gemini-2.0-flash-001',
                messages,
                temperature: 0.7,
                max_tokens: 800,
            }),
        })

        if (!aiResponse.ok) {
            const errBody = await aiResponse.text()
            console.error('AI error:', errBody)
            throw new Error('AI service temporarily unavailable')
        }

        const aiData = await aiResponse.json()
        const answer = aiData.choices?.[0]?.message?.content || 'Desculpe, não consegui processar. Tente novamente.'

        // Save interaction with enriched context
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
                    today_metrics: context.today_metrics,
                    metric_deltas: context.metric_deltas,
                    weekly_trend: context.weekly_trend,
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
                    today_metrics: context.today_metrics,
                    metric_deltas: context.metric_deltas,
                    call_scores: context.call_scores,
                    weekly_trend: context.weekly_trend,
                    discarded_strategies_count: context.discarded_strategies.length,
                    active_strategies_count: context.active_strategies.length,
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
