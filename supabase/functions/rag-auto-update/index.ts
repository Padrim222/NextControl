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

        // 1. Fetch all active client_materials uploaded in the last 15 days
        const fifteenDaysAgo = new Date()
        fifteenDaysAgo.setDate(fifteenDaysAgo.getDate() - 15)

        const { data: materials, error: matError } = await supabase
            .from('client_materials')
            .select('id, title, description, file_url, material_type, created_at')
            .gte('created_at', fifteenDaysAgo.toISOString())
            .order('created_at', { ascending: false })

        if (matError) throw matError

        if (!materials || materials.length === 0) {
            return new Response(JSON.stringify({
                status: 'skipped',
                reason: 'No new materials in the last 15 days',
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200
            })
        }

        // 2. Check which materials are already in rag_documents
        const { data: existingDocs } = await supabase
            .from('rag_documents')
            .select('metadata')

        const existingMaterialIds = new Set(
            (existingDocs || [])
                .map((d: any) => d.metadata?.source_material_id)
                .filter(Boolean)
        )

        // 3. Insert new materials into rag_documents
        const newDocs: any[] = []

        for (const mat of materials) {
            if (existingMaterialIds.has(mat.id)) continue

            // For text-based materials, use the description as content
            // For files (pdf, video, audio), we note the URL for future processing
            const content = mat.description
                ? `# ${mat.title}\n\n${mat.description}`
                : `# ${mat.title}\n\nMaterial do tipo ${mat.material_type}. URL: ${mat.file_url || 'N/A'}`

            newDocs.push({
                title: `[Material] ${mat.title}`,
                content: content,
                category: 'client_material',
                is_active: true,
                metadata: {
                    source_material_id: mat.id,
                    material_type: mat.material_type,
                    file_url: mat.file_url,
                    synced_at: new Date().toISOString(),
                }
            })
        }

        if (newDocs.length > 0) {
            const { error: insertError } = await supabase
                .from('rag_documents')
                .insert(newDocs)

            if (insertError) throw insertError
        }

        // 4. Also sync recent training_materials into RAG
        const { data: trainingMats } = await supabase
            .from('training_materials')
            .select('id, title, content, type, category, created_at')
            .gte('created_at', fifteenDaysAgo.toISOString())

        let trainingDocsAdded = 0

        for (const tm of (trainingMats || [])) {
            if (existingMaterialIds.has(`training_${tm.id}`)) continue

            const { error: tmError } = await supabase
                .from('rag_documents')
                .insert({
                    title: `[Training] ${tm.title}`,
                    content: tm.content || `Material de treinamento: ${tm.title}`,
                    category: 'training',
                    is_active: true,
                    metadata: {
                        source_material_id: `training_${tm.id}`,
                        material_type: tm.type,
                        category: tm.category,
                        synced_at: new Date().toISOString(),
                    }
                })

            if (!tmError) trainingDocsAdded++
        }

        return new Response(JSON.stringify({
            status: 'success',
            client_materials_synced: newDocs.length,
            training_materials_synced: trainingDocsAdded,
            total_materials_checked: materials.length,
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200
        })

    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error'
        console.error('RAG auto-update error:', message)
        return new Response(JSON.stringify({ error: message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200
        })
    }
})
