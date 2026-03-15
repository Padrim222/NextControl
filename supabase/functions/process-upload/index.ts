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

        const bucket = type === 'call' ? 'call-recordings' : 'submissions'
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

        // For call uploads: create a call_uploads record and kick off transcription pipeline
        if (type === 'call' && uploadedUrls.length > 0) {
            const callUploadRecords: any[] = []

            for (const url of uploadedUrls) {
                // Create call_uploads record with status 'uploaded'
                const { data: callUpload, error: insertError } = await supabase
                    .from('call_uploads')
                    .insert({
                        closer_id: user.id,
                        upload_source: 'manual',
                        mp3_url: url,
                        status: 'uploaded',
                        call_date: new Date().toISOString().split('T')[0],
                    })
                    .select('id')
                    .single()

                if (insertError) {
                    // Non-fatal: table may not exist yet — log and continue
                    console.warn('call_uploads insert skipped (table may not exist):', insertError.message)
                } else if (callUpload) {
                    callUploadRecords.push(callUpload)

                    // Kick off transcription: update status to 'transcribing' and invoke transcribe-audio
                    // The transcription is done async — update status first
                    await supabase
                        .from('call_uploads')
                        .update({ status: 'transcribing' })
                        .eq('id', callUpload.id)

                    // Fetch the file bytes to send to transcribe-audio
                    // Note: we re-fetch from storage since the File object was already consumed
                    try {
                        const audioResponse = await fetch(url)
                        if (audioResponse.ok) {
                            const audioBlob = await audioResponse.blob()
                            const transcribeForm = new FormData()
                            transcribeForm.append('file', audioBlob, 'audio.mp3')

                            const transcribeResponse = await fetch(
                                `${Deno.env.get('SUPABASE_URL')}/functions/v1/transcribe-audio`,
                                {
                                    method: 'POST',
                                    headers: {
                                        Authorization: `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
                                    },
                                    body: transcribeForm,
                                }
                            )

                            const transcribeData = await transcribeResponse.json()

                            if (transcribeData.text) {
                                // Save transcription and mark ready for review
                                await supabase
                                    .from('call_uploads')
                                    .update({
                                        transcription_text: transcribeData.text,
                                        status: 'ready',
                                    })
                                    .eq('id', callUpload.id)
                            } else {
                                // Transcription failed — mark with error
                                await supabase
                                    .from('call_uploads')
                                    .update({
                                        status: 'uploaded',
                                        admin_notes: `Transcription error: ${transcribeData.error || 'Unknown'}`,
                                    })
                                    .eq('id', callUpload.id)
                                console.error('Transcription failed for', callUpload.id, ':', transcribeData.error)
                            }
                        }
                    } catch (transcribeErr) {
                        console.error('Transcription pipeline error:', transcribeErr)
                        // Revert to 'uploaded' so admin can retry
                        await supabase
                            .from('call_uploads')
                            .update({ status: 'uploaded' })
                            .eq('id', callUpload.id)
                    }
                }
            }

            return new Response(
                JSON.stringify({
                    urls: uploadedUrls,
                    bucket,
                    count: uploadedUrls.length,
                    call_upload_ids: callUploadRecords.map((r) => r.id),
                }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        return new Response(
            JSON.stringify({ urls: uploadedUrls, bucket, count: uploadedUrls.length }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error'
        console.error('process-upload error:', message)
        return new Response(
            JSON.stringify({ error: message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
    }
})
