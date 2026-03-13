import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'jsr:@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface RequestPayload {
    capability: string;
    channel: string;
    input_type: 'image' | 'text';
    input_data: string;
    lead_context?: any;
    script_id?: string;
}

async function fetchRAGContext(supabase: any, sellerId: string, message: string): Promise<string> {
    if (!message || message.trim() === '') return '';

    try {
        const openaiKey = Deno.env.get('OPENAI_API_KEY');
        if (!openaiKey) return '';

        const embeddingResponse = await fetch('https://api.openai.com/v1/embeddings', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${openaiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ input: message, model: 'text-embedding-3-small' })
        });

        if (!embeddingResponse.ok) return '';
        const embeddingData = await embeddingResponse.json();
        const queryEmbedding = embeddingData.data[0].embedding;

        // Semantic Search via match_materials
        const { data: chunks, error } = await supabase.rpc('match_materials', {
            query_embedding: queryEmbedding,
            match_threshold: 0.5,
            match_count: 5,
            p_seller_id: sellerId
        });

        if (error || !chunks || chunks.length === 0) return '';

        chunks.sort((a: any, b: any) => a.material_type === 'metodologia_master' ? -1 : 1);
        const contextText = chunks.map((c: any) => `* TIPO DE DOC: ${c.material_type} \n* FRAGMENTO: ${c.content}`).join('\n\n---\n\n');

        return `\n\n=== CONTEXTO RAG VECTOR ===\n${contextText}\n=======================================\nBaseie sua resposta nesses dados oficiais.`;
    } catch (e) {
        console.error('Vector DB Fetch Error:', e);
    }
    return '';
}

Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

    try {
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) throw new Error('Missing authorization header');

        const { capability, channel, input_type, input_data, lead_context, script_id } = await req.json() as RequestPayload;

        const supabase = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            { global: { headers: { Authorization: authHeader } } }
        );

        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) throw new Error('Unauthorized');

        const sellerId = user.id;

        // Fetch Script if any
        let scriptContext = '';
        if (script_id) {
            const { data: scriptData } = await supabase.from('seller_scripts').select('content').eq('id', script_id).single();
            if (scriptData) scriptContext = `\n[ MODELO DE SCRIPT DO VENDEDOR ]:\n${scriptData.content}\nSiga este modelo ao construir sua sugestão de cópia.\n`;
        }

        const openRouterKey = Deno.env.get('OPENROUTER_API_KEY');
        if (!openRouterKey) throw new Error('OPENROUTER_API_KEY is not set');

        // Extract textual equivalent of input_data for RAG matching
        const queryText = input_type === 'text' ? input_data : `Capability: ${capability} Image Context`;
        const ragContext = await fetchRAGContext(supabase, sellerId, queryText);

        const systemPromptUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/get-prompts`; 
        // Em vez de chamar import dinâmico que não seria trivial em Edge s/ build step, embutiremos uma abstração de prompt builder ou usaremos o modelo Base puro.
        
        let actPrompt = "";
        let basePrompt = `Você é o Head de Bolso SS — assistente de prospecção de vendas. Treinado na metodologia de vendas do Rafael Yorik.
Seu papel é SUGERIR, nunca executar. O vendedor decide. NUNCA invente informações. 
Canal selecionado: ${channel.toUpperCase()}`;

        if (capability === 'analyze-profile') actPrompt = "CAPABILITY: ANALYZE_PROFILE\nExtraia nome, bio, nicho. Liste 2-3 pontos de conexão. Escreva 3 opções curtas de abertura.";
        else if (capability === 'analyze-story') actPrompt = "CAPABILITY: ANALYZE_STORY\nIdentifique o contexto. Gere 2-3 approaches curtos pra reply no story (orgânicos).";
        else if (capability === 'analyze-conversation') actPrompt = "CAPABILITY: ANALYZE_CONVERSATION\nDiagnóstico de temperatura da dm (fria/quente). O que fazer para não perder o lead? Dê 2 mini-sugestões de nova mensagem.";
        else if (capability === 'break-objection') actPrompt = "CAPABILITY: BREAK_OBJECTION\nClassifique a objeção. Qual estratégia de contorno usar? Gere 3 alternativas (Diplomática, Desafio, Curiosidade Invertida).";
        else if (capability === 'post-dispatch') actPrompt = "CAPABILITY: POST_DISPATCH\nAnalise o nível de engajamento do lead e construa um roteiro orgânico de próximos passos para qualificar (sem dar preço de cara).";

        const finalSystemPrompt = `${basePrompt}\n\n${actPrompt}\n${scriptContext}\n${ragContext}`;

        const messages: any[] = [{ role: 'system', content: finalSystemPrompt }];

        if (input_type === 'image') {
            messages.push({
                role: 'user',
                content: [
                    { type: 'text', text: 'Siga a CAPABILITY atual baseando-se no texto e informações desta imagem:' },
                    { type: 'image_url', image_url: { url: input_data } }
                ]
            });
        } else {
            messages.push({ role: 'user', content: `Dados do Lead/Conversa: ${input_data}` });
        }

        const openRouterUrl = 'https://openrouter.ai/api/v1/chat/completions';
        const openRouterResponse = await fetch(openRouterUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${openRouterKey}`,
                'HTTP-Referer': 'https://nextcontrol.pro',
                'X-Title': 'NextControl Head SS',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: input_type === 'image' ? 'google/gemini-2.5-flash' : 'openai/gpt-4o-mini',
                messages: messages,
                max_tokens: 1500,
                temperature: 0.7,
            })
        });

        if (!openRouterResponse.ok) {
            const errBody = await openRouterResponse.text();
            throw new Error(`OpenRouter error: ${errBody}`);
        }

        const llmData = await openRouterResponse.json();
        const llmAnswer = llmData.choices[0].message.content;

        // Save interaction asyncly
        const sysSupabase = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');
        
        sysSupabase.from('agent_conversations').insert({
            seller_id: sellerId,
            agent_type: 'ss',
            channel: channel,
            lead_context: lead_context || {},
            messages: messages.concat([{ role: 'assistant', content: llmAnswer }]),
            capability_used: capability
        }).then(({ error }) => {
            if (error) console.error("Falha ao salvar log da agent_conversation:", error);
        });

        return new Response(JSON.stringify({ answer: llmAnswer }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    } catch (error: any) {
        console.error('SS Agent Error:', error);
        return new Response(JSON.stringify({ error: error.message || 'Erro inesperado no SS Agent' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 });
    }
});
