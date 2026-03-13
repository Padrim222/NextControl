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
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        // 1. Fetch recent coach interactions (last 30 days)
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

        const { data: interactions, error: fetchError } = await supabase
            .from('coach_interactions')
            .select('id, user_message, ai_response, created_at')
            .gte('created_at', thirtyDaysAgo.toISOString())
            .order('created_at', { ascending: false })
            .limit(100)

        if (fetchError) throw fetchError

        if (!interactions || interactions.length < 5) {
            return new Response(JSON.stringify({
                status: 'skipped',
                reason: 'Not enough interactions to generate materials',
                count: interactions?.length || 0
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200
            })
        }

        // 2. Group by common themes using keyword extraction
        const themes: Record<string, { questions: string[], answers: string[], count: number }> = {}

        const keywords: Record<string, string> = {
            'objeção': 'Lidando com Objeções',
            'objeções': 'Lidando com Objeções',
            'preço': 'Negociação de Preço',
            'desconto': 'Negociação de Preço',
            'valor': 'Negociação de Preço',
            'follow': 'Estratégias de Follow-up',
            'followup': 'Estratégias de Follow-up',
            'fup': 'Estratégias de Follow-up',
            'abordagem': 'Técnicas de Abordagem',
            'prospecção': 'Técnicas de Abordagem',
            'prospectar': 'Técnicas de Abordagem',
            'cold': 'Técnicas de Abordagem',
            'pitch': 'Pitch e Apresentação',
            'apresentação': 'Pitch e Apresentação',
            'fechamento': 'Técnicas de Fechamento',
            'fechar': 'Técnicas de Fechamento',
            'contrato': 'Técnicas de Fechamento',
            'qualificação': 'Qualificação de Leads',
            'qualificar': 'Qualificação de Leads',
            'lead': 'Qualificação de Leads',
            'rapport': 'Construindo Rapport',
            'relacionamento': 'Construindo Rapport',
            'confiança': 'Construindo Rapport',
        }

        for (const interaction of interactions) {
            const text = `${interaction.user_message} ${interaction.ai_response}`.toLowerCase()
            let matched = false

            for (const [keyword, theme] of Object.entries(keywords)) {
                if (text.includes(keyword)) {
                    if (!themes[theme]) {
                        themes[theme] = { questions: [], answers: [], count: 0 }
                    }
                    if (themes[theme].questions.length < 3) {
                        themes[theme].questions.push(interaction.user_message)
                        themes[theme].answers.push(interaction.ai_response)
                    }
                    themes[theme].count++
                    matched = true
                    break
                }
            }

            if (!matched) {
                const genericTheme = 'Dicas Gerais de Vendas'
                if (!themes[genericTheme]) {
                    themes[genericTheme] = { questions: [], answers: [], count: 0 }
                }
                if (themes[genericTheme].questions.length < 2) {
                    themes[genericTheme].questions.push(interaction.user_message)
                    themes[genericTheme].answers.push(interaction.ai_response)
                }
                themes[genericTheme].count++
            }
        }

        // 3. Generate training materials for themes with >= 3 mentions
        const materialsCreated: string[] = []

        for (const [theme, data] of Object.entries(themes)) {
            if (data.count < 3) continue

            // Check if material already exists for this theme this month
            const monthStart = new Date()
            monthStart.setDate(1)
            monthStart.setHours(0, 0, 0, 0)

            const { data: existing } = await supabase
                .from('training_materials')
                .select('id')
                .eq('title', `[Auto] ${theme}`)
                .gte('created_at', monthStart.toISOString())
                .limit(1)

            if (existing && existing.length > 0) continue

            // Build content from Q&A pairs
            const content = data.questions.map((q, i) => {
                return `### Pergunta\n${q}\n\n### Resposta\n${data.answers[i]}\n`
            }).join('\n---\n\n')

            const { error: insertError } = await supabase
                .from('training_materials')
                .insert({
                    title: `[Auto] ${theme}`,
                    description: `Material auto-gerado a partir de ${data.count} interações frequentes sobre "${theme}". Baseado nas perguntas mais comuns do time.`,
                    content: `# ${theme}\n\n> 🤖 Material gerado automaticamente pelo sistema com base nas perguntas mais frequentes do time.\n> Interações analisadas: ${data.count}\n\n${content}`,
                    type: 'guide',
                    category: 'auto_generated',
                })

            if (!insertError) {
                materialsCreated.push(theme)
            }
        }

        return new Response(JSON.stringify({
            status: 'success',
            interactions_analyzed: interactions.length,
            themes_found: Object.keys(themes).length,
            materials_created: materialsCreated,
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200
        })

    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error'
        console.error('Auto-training error:', message)
        return new Response(JSON.stringify({ error: message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200
        })
    }
})
