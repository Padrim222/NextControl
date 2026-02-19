
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const { headers } = req;
        const contentType = headers.get("content-type") || "";

        if (!contentType.includes("multipart/form-data")) {
            throw new Error("Content-Type must be multipart/form-data");
        }

        // 1. Parse Output
        const formData = await req.formData();
        const audioFile = formData.get('file');

        if (!audioFile || !(audioFile instanceof File)) {
            throw new Error("No audio file uploaded.");
        }

        console.log(`Received audio file: ${audioFile.name} (${audioFile.size} bytes)`);

        // 2. Prepare Groq Request
        const groqApiKey = Deno.env.get('GROQ_API_KEY');
        if (!groqApiKey) {
            throw new Error("GROQ_API_KEY is not set.");
        }

        // Convert File to Blob for fetch
        // Note: Deno's fetch handles FormData nicely
        const groqFormData = new FormData();
        groqFormData.append('file', audioFile);
        groqFormData.append('model', 'whisper-large-v3'); // or 'distil-whisper-large-v3-en' but user speaks PT
        groqFormData.append('language', 'pt');
        groqFormData.append('response_format', 'json');

        // 3. Call Groq
        const response = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${groqApiKey}`,
            },
            body: groqFormData,
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Groq Error:', errorText);
            throw new Error(`Groq API Error: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        console.log('Transcription success:', data.text.substring(0, 50) + '...');

        return new Response(JSON.stringify({
            text: data.text,
            language: 'pt', // Force PT for now or usage detection
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        });

    } catch (error) {
        console.error('Error:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        });
    }
});
