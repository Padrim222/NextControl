
import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'jsr:@supabase/supabase-js@2'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const { submission_id } = await req.json()

        if (!submission_id) {
            throw new Error('Missing submission_id')
        }

        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

        // 1. Fetch submission and seller
        const { data: submission, error: subError } = await supabase
            .from('daily_submissions')
            .select('*, users!daily_submissions_seller_id_fkey(client_id, name)')
            .eq('id', submission_id)
            .single()

        if (subError || !submission) {
            console.error('Submission error:', subError)
            throw new Error('Submission not found')
        }

        const clientId = submission.users?.client_id
        if (!clientId) {
            console.log('No client_id linked to seller')
            return new Response(JSON.stringify({ message: 'No client linked' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
        }

        // 2. Find Client Account(s)
        const { data: clientUsers, error: clientError } = await supabase
            .from('users')
            .select('email, name')
            .eq('client_id', clientId)
            .eq('role', 'client')

        if (clientError || !clientUsers || clientUsers.length === 0) {
            console.log('No client users found to notify')
            return new Response(JSON.stringify({ message: 'No client users found' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
        }

        // 3. Send Emails
        const results = []

        for (const clientUser of clientUsers) {
            if (!clientUser.email) continue

            const subject = `Seu Treinador de Bolso analisou o dia de ${submission.users?.name || 'sua equipe'}! 🚀`
            const html = `
        <div style="font-family: sans-serif; color: #333;">
            <div style="background-color: #0A0B0D; padding: 20px; text-align: center;">
                <h1 style="color: #E6B84D;">Next Control</h1>
            </div>
            <div style="padding: 20px;">
                <h2>Olá ${clientUser.name}, seu feedback diário está pronto!</h2>
                <p>Nossa IA analisou os números e conversas de hoje.</p>
                <div style="background-color: #f4f4f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
                    <p><strong>Vendedor:</strong> ${submission.users?.name}</p>
                    <p><strong>Data:</strong> ${new Date(submission.submission_date).toLocaleDateString('pt-BR')}</p>
                </div>
                <p>Acesse o app para ver os detalhes e planos de ação:</p>
                <a href="https://nextcontrol.app/client" style="display: inline-block; background-color: #E6B84D; color: #000; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Ver Análise Completa</a>
            </div>
        </div>
        `

            if (RESEND_API_KEY) {
                try {
                    const res = await fetch('https://api.resend.com/emails', {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${RESEND_API_KEY}`,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            // TODO: verificar domínio nextcontrol.app no painel Resend antes do deploy
                            from: 'Treinador <noreply@nextcontrol.app>',
                            to: clientUser.email,
                            subject,
                            html
                        })
                    })
                    const data = await res.json()
                    results.push({ email: clientUser.email, status: res.ok ? 'sent' : 'failed', data })
                } catch (e) {
                    console.error('Resend error:', e)
                    results.push({ email: clientUser.email, status: 'error', error: e })
                }
            } else {
                console.log(`[SIMULATION] Email to ${clientUser.email}:`, subject)
                results.push({ email: clientUser.email, status: 'simulated' })
            }
        }

        return new Response(JSON.stringify({ success: true, results }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })

    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error'
        return new Response(JSON.stringify({ error: message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
        })
    }
})
