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

        const formData = await req.formData()
        const audioFile = formData.get('file')

        if (!audioFile || !(audioFile instanceof File)) {
            throw new Error("No audio file uploaded.")
        }

        console.log(`Received audio file: ${audioFile.name} (${audioFile.size} bytes)`)

        // Try Groq first, then fall back to OpenRouter whisper
        const groqApiKey = Deno.env.get('GROQ_API_KEY')
        const openRouterKey = Deno.env.get('OPENROUTER_API_KEY')

        if (!groqApiKey && !openRouterKey) {
            throw new Error("No transcription API key configured. Set GROQ_API_KEY or OPENROUTER_API_KEY in Supabase secrets.")
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
                throw new Error(`Groq API Error: ${response.status}`)
            }

            const data = await response.json()
            transcriptionText = data.text
        } else if (openRouterKey) {
            // Fallback: convert audio to base64 and use OpenRouter chat model to "transcribe"
            // This is a workaround — real transcription needs Groq or OpenAI Whisper
            const arrayBuffer = await audioFile.arrayBuffer()
            const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)))

            // Since OpenRouter doesn't have a direct whisper endpoint,
            // we'll inform the user that GROQ_API_KEY is needed for transcription
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
            status: 200, // Return 200 so Supabase client doesn't mask the error
        })
    }
})
