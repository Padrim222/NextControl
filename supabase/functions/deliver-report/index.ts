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
            throw new Error('Only admins/CS can deliver reports')
        }

        const { report_id, review_notes } = await req.json()
        if (!report_id) {
            throw new Error('report_id is required')
        }

        // Fetch report + seller
        const { data: report, error: reportError } = await supabase
            .from('reports')
            .select('*, seller:users!seller_id(name, phone, email)')
            .eq('id', report_id)
            .single()

        if (reportError || !report) {
            throw new Error('Report not found')
        }

        if (report.status === 'delivered') {
            throw new Error('Report already delivered')
        }

        // Update report status to approved
        const { error: updateError } = await supabase
            .from('reports')
            .update({
                status: 'approved',
                reviewed_by: user.id,
                review_notes: review_notes || null,
            })
            .eq('id', report_id)

        if (updateError) {
            throw new Error(`Failed to update report: ${updateError.message}`)
        }

        // Try WhatsApp delivery if configured
        let whatsappDelivered = false
        let whatsappMessageId: string | null = null

        const whatsappApiKey = Deno.env.get('WHATSAPP_API_KEY')
        const whatsappApiUrl = Deno.env.get('WHATSAPP_API_URL')
        const sellerPhone = report.seller?.phone

        if (whatsappApiKey && whatsappApiUrl && sellerPhone) {
            try {
                const whatsappResponse = await fetch(whatsappApiUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${whatsappApiKey}`,
                    },
                    body: JSON.stringify({
                        phone: sellerPhone,
                        message: `📊 *Relatório de Performance - Nextbase 360*\n\nOlá ${report.seller?.name}! Seu relatório está pronto.\n\n📎 Acesse aqui: ${report.pdf_url}\n\n_Treinador de Bolso - Nextbase 360_`,
                        ...(report.pdf_url ? { document: report.pdf_url } : {}),
                    }),
                })

                if (whatsappResponse.ok) {
                    const waData = await whatsappResponse.json()
                    whatsappDelivered = true
                    whatsappMessageId = waData.id || waData.message_id || 'sent'

                    // Update to delivered
                    await supabase
                        .from('reports')
                        .update({
                            status: 'delivered',
                            sent_at: new Date().toISOString(),
                        })
                        .eq('id', report_id)
                } else {
                    console.error('WhatsApp delivery failed:', await whatsappResponse.text())
                }
            } catch (waError) {
                console.error('WhatsApp error:', waError)
            }
        }

        return new Response(
            JSON.stringify({
                report_id,
                status: whatsappDelivered ? 'delivered' : 'approved',
                whatsapp_delivered: whatsappDelivered,
                whatsapp_message_id: whatsappMessageId,
                message: whatsappDelivered
                    ? `Relatório aprovado e enviado via WhatsApp para ${report.seller?.name}`
                    : `Relatório aprovado. WhatsApp não configurado — entrega manual necessária.`,
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error'
        console.error('Deliver report error:', message)
        return new Response(
            JSON.stringify({ error: message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        )
    }
})
