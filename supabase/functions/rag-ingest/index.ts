import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'jsr:@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface IngestRequest {
    title: string
    content: string
    category?: string
    agent_type?: 'ss' | 'closer' | 'geral'
    client_id?: string
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

        // Verify user
        const authClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            { global: { headers: { Authorization: authHeader } } }
        )

        const { data: { user }, error: authError } = await authClient.auth.getUser()
        if (authError || !user) {
            throw new Error('Unauthorized')
        }

        // Service role for DB writes
        const supabase = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
        )

        // Verify caller is admin or cs
        const { data: profile } = await supabase
            .from('users')
            .select('role')
            .eq('id', user.id)
            .single()

        if (!profile || !['admin', 'cs'].includes(profile.role)) {
            throw new Error('Forbidden: only admin/cs can ingest RAG documents')
        }

        const { title, content, category, agent_type = 'geral', client_id } = await req.json() as IngestRequest

        if (!title?.trim() || !content?.trim()) {
            throw new Error('title and content are required')
        }

        // Insert into rag_documents
        const { data: doc, error: insertError } = await supabase
            .from('rag_documents')
            .insert({
                title: title.trim(),
                content: content.trim(),
                category: category || 'geral',
                agent_type,
                client_id: client_id || null,
                is_active: true,
            })
            .select('id')
            .single()

        if (insertError) {
            console.error('RAG insert error:', insertError)
            throw new Error(`Failed to insert document: ${insertError.message}`)
        }

        return new Response(
            JSON.stringify({ success: true, document_id: doc.id }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error'
        console.error('rag-ingest error:', message)
        return new Response(
            JSON.stringify({ error: message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        )
    }
})
