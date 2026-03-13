import "jsr:@supabase/functions-js/edge-runtime.d.ts"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const contentType = req.headers.get("content-type") || ""

        if (!contentType.includes("multipart/form-data")) {
            throw new Error("Content-Type must be multipart/form-data")
        }

        // 1. Parse form data
        const formData = await req.formData()
        const audioFile = formData.get('file')

        if (!audioFile || !(audioFile instanceof File)) {
            throw new Error("No audio file uploaded.")
        }

        console.log(`Received audio file: ${audioFile.name} (${audioFile.size} bytes)`)

        // 2. Try Groq first, fall back with a clear error
        const groqApiKey = Deno.env.get('GROQ_API_KEY')
        const openRouterKey = Deno.env.get('OPENROUTER_API_KEY')

        if (!groqApiKey && !openRouterKey) {
            throw new Error("No transcription API key configured. Set GROQ_API_KEY in Supabase Edge Function secrets.")
        }

        let transcriptionText = ''

        if (groqApiKey) {
            // Use Groq Whisper
            const groqFormData = new FormData()
            groqFormData.append('file', audioFile)
            groqFormData.append('model', 'whisper-large-v3')
            groqFormData.append('language', 'pt')
            groqFormData.append('response_format', 'json')

            const response = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${groqApiKey}`,
                },
                body: groqFormData,
            })

            if (!response.ok) {
                const errorText = await response.text()
                console.error('Groq Error:', errorText)
                throw new Error(`Groq API Error: ${response.status} - ${errorText}`)
            }

            const data = await response.json()
            transcriptionText = data.text
        } else {
            // OpenRouter does not expose a Whisper endpoint — require GROQ_API_KEY
            throw new Error("Transcrição de áudio requer GROQ_API_KEY. Configure nos secrets do Supabase (Dashboard > Edge Functions > Secrets).")
        }

        console.log('Transcription success:', transcriptionText.substring(0, 50) + '...')

        return new Response(JSON.stringify({
            text: transcriptionText,
            language: 'pt',
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        })

    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error'
        console.error('Transcription error:', message)
        return new Response(JSON.stringify({ error: message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            // Return 200 so Supabase client doesn't mask the error body
            status: 200,
        })
    }
})
