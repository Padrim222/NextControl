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
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
        )

        // Verify auth
        const authHeader = req.headers.get('Authorization')
        if (!authHeader) {
            throw new Error('Missing authorization header')
        }

        const { data: { user }, error: authError } = await createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            { global: { headers: { Authorization: authHeader } } }
        ).auth.getUser()

        if (authError || !user) {
            throw new Error('Unauthorized')
        }

        const formData = await req.formData()
        const type = formData.get('type') as string // 'print' | 'call'
        const files = formData.getAll('files') as File[]

        if (!files.length) {
            throw new Error('No files provided')
        }

        if (type === 'print' && files.length > 5) {
            throw new Error('Maximum 5 print files allowed')
        }

        const bucket = 'submissions'
        const uploadedUrls: string[] = []

        for (const file of files) {
            const ext = file.name.split('.').pop() || 'jpg'
            const path = `${user.id}/${type}s/${Date.now()}_${crypto.randomUUID().slice(0, 8)}.${ext}`

            const { error: uploadError } = await supabase.storage
                .from(bucket)
                .upload(path, file, {
                    contentType: file.type,
                    upsert: false,
                })

            if (uploadError) {
                console.error('Upload error:', uploadError)
                throw new Error(`Failed to upload ${file.name}: ${uploadError.message}`)
            }

            const { data: { publicUrl } } = supabase.storage
                .from(bucket)
                .getPublicUrl(path)

            uploadedUrls.push(publicUrl)
        }

        return new Response(
            JSON.stringify({ urls: uploadedUrls, bucket, count: uploadedUrls.length }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error'
        return new Response(
            JSON.stringify({ error: message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
    }
})
