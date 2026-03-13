import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'jsr:@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface WeeklyReportRequest {
    client_id: string
    seller_id?: string
    week_start: string // YYYY-MM-DD
    week_end: string   // YYYY-MM-DD
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

        // Verify admin role
        const { data: adminCheck } = await supabase
            .from('users')
            .select('role')
            .eq('id', user.id)
            .single()

        if (adminCheck?.role !== 'admin') {
            throw new Error('Only admins can generate weekly reports')
        }

        const { client_id, seller_id, week_start, week_end } = await req.json() as WeeklyReportRequest

        if (!client_id || !week_start || !week_end) {
            throw new Error('client_id, week_start, and week_end are required')
        }

        // 1. Fetch call uploads for the week
        const callQuery = supabase
            .from('call_uploads')
            .select('id, prospect_name, call_date, duration_minutes, transcription_text, status, evaluation_id')
            .eq('client_id', client_id)
            .gte('call_date', week_start)
            .lte('call_date', week_end)
            .in('status', ['analyzed', 'approved'])
            .order('call_date', { ascending: true })

        const { data: calls } = await callQuery

        // 2. Fetch call evaluations for analyzed calls
        const evaluationIds = (calls || []).map(c => c.evaluation_id).filter(Boolean)
        let evaluations: any[] = []
        if (evaluationIds.length > 0) {
            const { data: evalData } = await supabase
                .from('call_evaluations')
                .select('id, score_geral, nivel, pontos_positivos, gaps_criticos, acoes_recomendadas')
                .in('id', evaluationIds)

            evaluations = evalData || []
        }

        // 3. Fetch daily submissions for the week (from seller)
        let submissions: any[] = []
        if (seller_id) {
            const { data: subData } = await supabase
                .from('daily_submissions')
                .select('id, submission_date, metrics, notes')
                .eq('seller_id', seller_id)
                .gte('submission_date', week_start)
                .lte('submission_date', week_end)
                .order('submission_date', { ascending: true })

            submissions = subData || []
        }

        // 4. Build aggregated metrics
        const metricsAggregate: Record<string, number> = {}
        for (const sub of submissions) {
            if (sub.metrics && typeof sub.metrics === 'object') {
                for (const [key, value] of Object.entries(sub.metrics)) {
                    if (typeof value === 'number') {
                        metricsAggregate[key] = (metricsAggregate[key] || 0) + value
                    }
                }
            }
        }

        // 5. Build call summaries
        const callSummaries = (calls || []).map(call => {
            const evaluation = evaluations.find(e => e.id === call.evaluation_id)
            return {
                prospect: call.prospect_name || 'Sem nome',
                date: call.call_date,
                duration: call.duration_minutes,
                score: evaluation?.score_geral || null,
                nivel: evaluation?.nivel || null,
                positives: evaluation?.pontos_positivos || [],
                gaps: evaluation?.gaps_criticos || [],
                actions: evaluation?.acoes_recomendadas || [],
            }
        })

        // 6. Generate AI weekly analysis
        const apiKey = Deno.env.get('OPENROUTER_API_KEY')
        if (!apiKey) throw new Error('OpenRouter API Key not configured')

        const avgCallScore = callSummaries.length > 0
            ? callSummaries.reduce((sum, c) => sum + (c.score || 0), 0) / callSummaries.filter(c => c.score).length
            : null

        const aiPrompt = `Você é um ANALISTA DE PERFORMANCE SEMANAL da Next Control.
Gere um relatório semanal consolidado em Português BR.

DADOS DA SEMANA (${week_start} a ${week_end}):

MÉTRICAS ACUMULADAS:
${Object.entries(metricsAggregate).map(([k, v]) => `- ${k}: ${v}`).join('\n') || 'Sem métricas disponíveis'}

CALLS REALIZADAS (${callSummaries.length}):
${callSummaries.map(c => `- ${c.prospect} (${c.date}): Score ${c.score || 'N/A'} | ${c.nivel || 'N/A'}
  Positivos: ${(c.positives as string[]).slice(0, 2).join(', ') || 'N/A'}
  Gaps: ${(c.gaps as string[]).slice(0, 2).join(', ') || 'N/A'}`).join('\n') || 'Nenhuma call analisada'}

SCORE MÉDIO CALLS: ${avgCallScore ? avgCallScore.toFixed(1) : 'N/A'}

Gere em JSON:
{
  "resumo_executivo": "2-3 frases resumindo a semana",
  "destaques": ["highlight 1", "highlight 2", "highlight 3"],
  "areas_melhoria": ["improvement 1", "improvement 2", "improvement 3"],
  "checklist_semana": [
    {"acao": "descrição da ação", "prioridade": "alta|media|baixa", "categoria": "calls|prospeccao|follow_up|conversao"}
  ],
  "score_semanal": 0-100,
  "tendencia": "improving|declining|stable"
}`

        const aiResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
                'HTTP-Referer': 'https://nextbase360.com',
                'X-Title': 'Weekly Report Generator',
            },
            body: JSON.stringify({
                model: 'google/gemini-2.0-flash-001',
                messages: [
                    { role: 'system', content: 'Você é um analista de vendas. Responda APENAS em JSON válido.' },
                    { role: 'user', content: aiPrompt },
                ],
                temperature: 0.3,
                max_tokens: 2000,
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
        } catch (e) {
            console.error('Failed to parse AI response:', e)
            analysis = { resumo_executivo: 'Análise indisponível', destaques: [], areas_melhoria: [], checklist_semana: [], score_semanal: 0, tendencia: 'stable' }
        }

        // 7. Save weekly report
        const { data: report, error: saveError } = await supabase
            .from('weekly_analysis_reports')
            .insert({
                client_id,
                seller_id: seller_id || null,
                week_start,
                week_end,
                call_summaries: callSummaries,
                checklist_actions: analysis.checklist_semana || [],
                metrics_summary: {
                    totals: metricsAggregate,
                    calls_count: callSummaries.length,
                    avg_call_score: avgCallScore,
                    executive_summary: analysis.resumo_executivo,
                    highlights: analysis.destaques,
                    improvements: analysis.areas_melhoria,
                    trend: analysis.tendencia,
                },
                overall_score: analysis.score_semanal || null,
                highlights: analysis.destaques || [],
                improvements: analysis.areas_melhoria || [],
                admin_approved: false,
                client_visible: false,
                created_by: user.id,
            })
            .select('*')
            .single()

        if (saveError) {
            console.error('Save error:', saveError)
            throw new Error('Failed to save weekly report')
        }

        return new Response(
            JSON.stringify({
                success: true,
                report_id: report.id,
                summary: analysis.resumo_executivo,
                score: analysis.score_semanal,
                calls_analyzed: callSummaries.length,
                days_with_data: submissions.length,
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error'
        console.error('Weekly report error:', message)
        return new Response(
            JSON.stringify({ error: message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        )
    }
})
