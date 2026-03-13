import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'jsr:@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface MonthlyReportRequest {
    client_id: string
    seller_id?: string
    closer_id?: string
    month: number // 1-12
    year: number
}

Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const authHeader = req.headers.get('Authorization')
        if (!authHeader) throw new Error('Missing authorization header')

        const authClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            { global: { headers: { Authorization: authHeader } } }
        )

        const { data: { user }, error: authError } = await authClient.auth.getUser()
        if (authError || !user) throw new Error('Unauthorized')

        const supabase = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
        )

        // Admin check
        const { data: adminCheck } = await supabase
            .from('users')
            .select('role')
            .eq('id', user.id)
            .single()

        if (adminCheck?.role !== 'admin') {
            throw new Error('Only admins can generate monthly reports')
        }

        const { client_id, seller_id, closer_id, month, year } = await req.json() as MonthlyReportRequest

        if (!client_id || !month || !year) {
            throw new Error('client_id, month, and year are required')
        }

        const monthStart = `${year}-${String(month).padStart(2, '0')}-01`
        const nextMonth = month === 12 ? `${year + 1}-01-01` : `${year}-${String(month + 1).padStart(2, '0')}-01`

        // 1. Weekly reports for the month
        const { data: weeklyReports } = await supabase
            .from('weekly_analysis_reports')
            .select('*')
            .eq('client_id', client_id)
            .gte('week_start', monthStart)
            .lt('week_start', nextMonth)
            .order('week_start', { ascending: true })

        // 2. All call evaluations for the month
        const { data: callEvals } = await supabase
            .from('call_uploads')
            .select('id, prospect_name, call_date, duration_minutes, evaluation_id')
            .eq('client_id', client_id)
            .gte('call_date', monthStart)
            .lt('call_date', nextMonth)
            .in('status', ['analyzed', 'approved'])

        const evalIds = (callEvals || []).map((c: any) => c.evaluation_id).filter(Boolean)
        let evaluations: any[] = []
        if (evalIds.length > 0) {
            const { data: evalData } = await supabase
                .from('call_evaluations')
                .select('id, score_geral, nivel, pontos_positivos, gaps_criticos, acoes_recomendadas')
                .in('id', evalIds)
            evaluations = evalData || []
        }

        // 3. Seller metrics for the month
        let sellerData: any[] = []
        if (seller_id) {
            const { data } = await supabase
                .from('daily_submissions')
                .select('submission_date, metrics')
                .eq('seller_id', seller_id)
                .gte('submission_date', monthStart)
                .lt('submission_date', nextMonth)
                .order('submission_date')
            sellerData = data || []
        }

        // 4. Closer metrics if separate
        let closerData: any[] = []
        if (closer_id) {
            const { data } = await supabase
                .from('daily_submissions')
                .select('submission_date, metrics')
                .eq('seller_id', closer_id)
                .gte('submission_date', monthStart)
                .lt('submission_date', nextMonth)
                .order('submission_date')
            closerData = data || []
        }

        // Aggregate metrics
        const aggregateMetrics = (rows: any[]) => {
            const totals: Record<string, number> = {}
            for (const row of rows) {
                if (row.metrics && typeof row.metrics === 'object') {
                    for (const [k, v] of Object.entries(row.metrics)) {
                        if (typeof v === 'number') totals[k] = (totals[k] || 0) + v
                    }
                }
            }
            return totals
        }

        const sellerTotals = aggregateMetrics(sellerData)
        const closerTotals = aggregateMetrics(closerData)

        // Call stats
        const callScores = evaluations.map((e: any) => e.score_geral).filter(Boolean)
        const avgCallScore = callScores.length > 0
            ? callScores.reduce((a: number, b: number) => a + b, 0) / callScores.length
            : null

        // Weekly score trends
        const weeklyScores = (weeklyReports || [])
            .map((w: any) => ({ week: w.week_start, score: w.overall_score }))
            .filter((w: any) => w.score != null)

        // Generate AI monthly analysis
        const apiKey = Deno.env.get('OPENROUTER_API_KEY')
        if (!apiKey) throw new Error('OpenRouter API Key not configured')

        const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
            'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']

        const aiPrompt = `Voce e um ANALISTA DE PERFORMANCE MENSAL da Next Control.
Gere um relatorio mensal consolidado com 3 perspectivas.

MES: ${monthNames[month - 1]} ${year}

=== PERSPECTIVA 1: EMPRESA (FUNIL) ===
Calls realizadas: ${(callEvals || []).length}
Score medio calls: ${avgCallScore ? avgCallScore.toFixed(1) : 'N/A'}
Semanas com dados: ${weeklyScores.length}
Scores semanais: ${weeklyScores.map((w: any) => `${w.week}: ${w.score}`).join(', ') || 'N/A'}

=== PERSPECTIVA 2: CLOSER ===
${Object.entries(closerTotals).map(([k, v]) => `${k}: ${v}`).join('\n') || 'Sem dados de closer'}

=== PERSPECTIVA 3: SELLER ===
${Object.entries(sellerTotals).map(([k, v]) => `${k}: ${v}`).join('\n') || 'Sem dados de seller'}
Dias com checkin: ${sellerData.length}

Responda em JSON:
{
  "empresa": {
    "resumo": "2 frases sobre performance geral",
    "destaques": ["max 3"],
    "gaps": ["max 3"],
    "score": 0-100
  },
  "closer": {
    "resumo": "2 frases sobre closer",
    "destaques": ["max 3"],
    "gaps": ["max 3"],
    "score": 0-100
  },
  "seller": {
    "resumo": "2 frases sobre seller",
    "destaques": ["max 3"],
    "gaps": ["max 3"],
    "score": 0-100
  },
  "tendencia": "improving|declining|stable",
  "palavra_chave": "uma palavra que resume o mes",
  "acoes_proximo_mes": ["top 5 acoes priorizadas"]
}`

        const aiResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
                'HTTP-Referer': 'https://nextbase360.com',
                'X-Title': 'Monthly Report Generator',
            },
            body: JSON.stringify({
                model: 'google/gemini-2.0-flash-001',
                messages: [
                    { role: 'system', content: 'Voce e analista de vendas. Responda APENAS em JSON valido.' },
                    { role: 'user', content: aiPrompt },
                ],
                temperature: 0.3,
                max_tokens: 2500,
                response_format: { type: 'json_object' },
            }),
        })

        if (!aiResponse.ok) {
            const errText = await aiResponse.text()
            console.error('AI error:', errText)
            throw new Error('AI analysis failed')
        }

        const aiData = await aiResponse.json()
        const aiContent = aiData.choices?.[0]?.message?.content || '{}'

        let analysis: any = {}
        try {
            analysis = JSON.parse(aiContent)
        } catch {
            analysis = {
                empresa: { resumo: 'Indisponivel', destaques: [], gaps: [], score: 0 },
                closer: { resumo: 'Indisponivel', destaques: [], gaps: [], score: 0 },
                seller: { resumo: 'Indisponivel', destaques: [], gaps: [], score: 0 },
                tendencia: 'stable',
                palavra_chave: 'dados_insuficientes',
                acoes_proximo_mes: [],
            }
        }

        // Overall score = average of 3 perspectives
        const overallScore = Math.round(
            ((analysis.empresa?.score || 0) + (analysis.closer?.score || 0) + (analysis.seller?.score || 0)) / 3
        )

        // Save as a weekly_analysis_report with special type
        const { data: report, error: saveError } = await supabase
            .from('weekly_analysis_reports')
            .insert({
                client_id,
                seller_id: seller_id || null,
                week_start: monthStart,
                week_end: nextMonth,
                call_summaries: (callEvals || []).map((c: any) => ({
                    prospect: c.prospect_name,
                    date: c.call_date,
                    duration: c.duration_minutes,
                    score: evaluations.find((e: any) => e.id === c.evaluation_id)?.score_geral,
                })),
                checklist_actions: analysis.acoes_proximo_mes?.map((a: string, i: number) => ({
                    acao: a,
                    prioridade: i < 2 ? 'alta' : 'media',
                    categoria: 'mensal',
                })) || [],
                metrics_summary: {
                    type: 'monthly',
                    month,
                    year,
                    empresa: analysis.empresa,
                    closer: analysis.closer,
                    seller: analysis.seller,
                    tendencia: analysis.tendencia,
                    palavra_chave: analysis.palavra_chave,
                    calls_count: (callEvals || []).length,
                    avg_call_score: avgCallScore,
                    seller_checkins: sellerData.length,
                    closer_totals: closerTotals,
                    seller_totals: sellerTotals,
                    weekly_scores: weeklyScores,
                },
                overall_score: overallScore,
                highlights: [
                    ...(analysis.empresa?.destaques || []),
                    ...(analysis.closer?.destaques || []),
                    ...(analysis.seller?.destaques || []),
                ].slice(0, 5),
                improvements: [
                    ...(analysis.empresa?.gaps || []),
                    ...(analysis.closer?.gaps || []),
                    ...(analysis.seller?.gaps || []),
                ].slice(0, 5),
                admin_approved: false,
                client_visible: false,
                created_by: user.id,
            })
            .select('id')
            .single()

        if (saveError) {
            console.error('Save error:', saveError)
            throw new Error('Failed to save monthly report')
        }

        return new Response(
            JSON.stringify({
                success: true,
                report_id: report?.id,
                score: overallScore,
                trend: analysis.tendencia,
                keyword: analysis.palavra_chave,
                calls_analyzed: (callEvals || []).length,
                weeks_with_data: weeklyScores.length,
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error'
        console.error('Monthly report error:', message)
        return new Response(
            JSON.stringify({ error: message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        )
    }
})
