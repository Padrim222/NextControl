import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'jsr:@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface RagQueryRequest {
    query: string
    category?: string
    agent_type?: 'ss' | 'closer' | 'geral'
    client_id?: string
    max_results?: number
}

interface RagResult {
    id: string
    title: string
    content: string
    category: string
    agent_type: string
    score: number
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

        const {
            query,
            category,
            agent_type,
            client_id,
            max_results = 5,
        } = await req.json() as RagQueryRequest

        if (!query?.trim()) {
            throw new Error('query is required')
        }

        const searchTerm = `%${query.trim()}%`
        const limit = Math.min(Math.max(1, max_results), 20)

        // Build query with ILIKE search on title and content
        let dbQuery = supabase
            .from('rag_documents')
            .select('id, title, content, category, agent_type')
            .eq('is_active', true)
            .or(`title.ilike.${searchTerm},content.ilike.${searchTerm}`)
            .limit(limit)

        if (category) {
            dbQuery = dbQuery.eq('category', category)
        }

        if (agent_type) {
            dbQuery = dbQuery.eq('agent_type', agent_type)
        }

        if (client_id) {
            dbQuery = dbQuery.eq('client_id', client_id)
        }

        const { data: documents, error: queryError } = await dbQuery

        if (queryError) {
            console.error('DB query error:', queryError)
            throw new Error('Failed to query documents')
        }

        const results: RagResult[] = (documents || []).map((doc: any) => ({
            id: doc.id,
            title: doc.title,
            content: (doc.content as string).slice(0, 500),
            category: doc.category,
            agent_type: doc.agent_type,
            score: 1.0,
        }))

        return new Response(
            JSON.stringify({ results }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error'
        console.error('RAG query error:', message)
        return new Response(
            JSON.stringify({ error: message }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: message === 'Unauthorized' || message === 'Missing authorization header' ? 401 : 500,
            }
        )
    }
})
