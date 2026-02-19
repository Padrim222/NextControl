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
        const authHeader = req.headers.get('Authorization')
        if (!authHeader) {
            throw new Error('Missing authorization header')
        }

        // Verify user is admin/CS
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

        // Verify admin role
        const { data: userRecord } = await supabase
            .from('users')
            .select('role')
            .eq('id', user.id)
            .single()

        if (userRecord?.role !== 'admin') {
            throw new Error('Only admins/CS can generate reports')
        }

        const { submission_id, analysis_id } = await req.json()
        if (!submission_id || !analysis_id) {
            throw new Error('submission_id and analysis_id are required')
        }

        // Fetch submission + analysis + seller
        const { data: submission } = await supabase
            .from('daily_submissions')
            .select('*, seller:users!seller_id(name, email, seller_type)')
            .eq('id', submission_id)
            .single()

        if (!submission) {
            throw new Error('Submission not found')
        }

        const { data: analysis } = await supabase
            .from('analyses')
            .select('*')
            .eq('id', analysis_id)
            .single()

        if (!analysis) {
            throw new Error('Analysis not found')
        }

        // Generate HTML report
        const sellerName = submission.seller?.name || 'Vendedor'
        const sellerType = submission.seller?.seller_type === 'closer' ? 'Closer' : 'Seller'
        const date = new Date(submission.submission_date).toLocaleDateString('pt-BR')

        const scoreColor = analysis.score >= 70 ? '#22c55e' : analysis.score >= 40 ? '#eab308' : '#ef4444'

        const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', sans-serif; color: #1a1a1a; padding: 40px; max-width: 800px; margin: 0 auto; }
    .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 32px; border-bottom: 3px solid #E6B84D; padding-bottom: 16px; }
    .logo { font-size: 24px; font-weight: 800; color: #0A0B0D; }
    .logo span { color: #E6B84D; }
    .date { color: #666; font-size: 14px; }
    .seller-info { background: #f8f8f8; padding: 20px; border-radius: 12px; margin-bottom: 24px; }
    .score-badge { display: inline-flex; align-items: center; gap: 8px; background: ${scoreColor}22; color: ${scoreColor}; padding: 8px 16px; border-radius: 20px; font-weight: 700; font-size: 20px; }
    .section { margin-bottom: 24px; }
    .section h2 { font-size: 16px; text-transform: uppercase; letter-spacing: 1px; color: #666; margin-bottom: 12px; border-left: 4px solid #E6B84D; padding-left: 12px; }
    .content { line-height: 1.6; font-size: 15px; }
    .list { list-style: none; padding: 0; }
    .list li { padding: 8px 0; border-bottom: 1px solid #eee; display: flex; align-items: flex-start; gap: 8px; }
    .list li::before { content: '→'; color: #E6B84D; font-weight: 700; }
    .strengths li::before { content: '✓'; color: #22c55e; }
    .improvements li::before { content: '!'; color: #eab308; }
    .footer { margin-top: 40px; text-align: center; color: #999; font-size: 12px; border-top: 1px solid #eee; padding-top: 16px; }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo">Next <span>Control</span></div>
    <div class="date">${date}</div>
  </div>
  
  <div class="seller-info">
    <h1 style="font-size: 22px; margin-bottom: 8px;">Relatório de Performance</h1>
    <p><strong>${sellerName}</strong> · ${sellerType} · ${date}</p>
    <div style="margin-top: 12px;">
      <span class="score-badge">Score: ${analysis.score}/100</span>
    </div>
  </div>

  <div class="section">
    <h2>Análise</h2>
    <p class="content">${analysis.content}</p>
  </div>

  <div class="section">
    <h2>Pontos Fortes</h2>
    <ul class="list strengths">${(analysis.strengths || []).map((s: string) => `<li>${s}</li>`).join('')}</ul>
  </div>

  <div class="section">
    <h2>Melhorias</h2>
    <ul class="list improvements">${(analysis.improvements || []).map((i: string) => `<li>${i}</li>`).join('')}</ul>
  </div>

  <div class="section">
    <h2>Próximos Passos</h2>
    <ul class="list">${(analysis.next_steps || []).map((s: string) => `<li>${s}</li>`).join('')}</ul>
  </div>

  <div class="section">
    <h2>Métricas do Dia</h2>
    <p class="content">${JSON.stringify(submission.metrics, null, 2).replace(/\n/g, '<br>').replace(/ /g, '&nbsp;')}</p>
  </div>

  <div class="footer">
    Relatório gerado automaticamente pela Consultoria de Bolso · Next Control<br>
    Este documento é confidencial
  </div>
</body>
</html>`

        // For MVP: store HTML as report content (client can render/print)
        // Phase 2: use Puppeteer to generate actual PDF

        // Upload HTML to storage
        const reportPath = `${submission.seller_id}/${Date.now()}_report.html`
        const { error: uploadError } = await supabase.storage
            .from('reports')
            .upload(reportPath, new Blob([html], { type: 'text/html' }), {
                contentType: 'text/html',
                upsert: false,
            })

        if (uploadError) {
            console.error('Upload error:', uploadError)
            // Continue even if storage fails - save the HTML inline
        }

        const { data: { publicUrl } } = supabase.storage
            .from('reports')
            .getPublicUrl(reportPath)

        // Create report record
        const { data: report, error: reportError } = await supabase
            .from('reports')
            .insert({
                seller_id: submission.seller_id,
                submission_id,
                analysis_id,
                pdf_url: uploadError ? null : publicUrl,
                status: 'pending',
                reviewed_by: user.id,
            })
            .select()
            .single()

        if (reportError) {
            throw new Error(`Failed to create report: ${reportError.message}`)
        }

        return new Response(
            JSON.stringify({
                report_id: report.id,
                pdf_url: publicUrl,
                html_content: html,
                status: 'pending',
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error'
        console.error('Generate report error:', message)
        return new Response(
            JSON.stringify({ error: message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        )
    }
})
