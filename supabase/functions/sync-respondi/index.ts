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

        const payload = await req.json()

        // --- RESPONDI PAYLOAD PARSING ---
        // Respondi structure varies, but usually has 'answers' or similar.
        // We look for email/name/company to map to a client.

        const answers = payload.form_response?.answers || []
        const variables = payload.form_response?.variables || {}

        // Extracting basic info (mapping depends on the form fields)
        let email = variables.email || ''
        let name = variables.name || ''
        let company = variables.company || ''

        // If not in variables, check answers (Respondi field IDs are needed for perfect mapping)
        if (!email) {
            const emailField = answers.find((a: any) => a.type === 'email' || a.field?.type === 'email')
            email = emailField?.email || ''
        }

        if (!name) {
            const nameField = answers.find((a: any) => a.field?.title?.toLowerCase().includes('nome'))
            name = nameField?.text || ''
        }

        if (!email) {
            console.error('No email found in Respondi payload', JSON.stringify(payload))
            return new Response(JSON.stringify({ status: 'ignored', reason: 'Email not found' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200
            })
        }

        // 1. Search for existing client
        const { data: existingClient } = await supabase
            .from('clients')
            .select('id')
            .eq('email', email)
            .maybeSingle()

        if (existingClient) {
            // Update client with onboarding data
            await supabase
                .from('clients')
                .update({
                    onboarding_completed: true,
                    onboarding_data: payload // Store full payload for audit
                })
                .eq('id', existingClient.id)

            console.log(`Updated client ${email} with onboarding data`)
        } else {
            // Auto-create client? (Depends on business logic)
            // For now, let's just log it or create a pending record
            console.warn(`No client found with email ${email} to sync onboarding`)
        }

        return new Response(JSON.stringify({ status: 'success' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200
        })

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500
        })
    }
})
