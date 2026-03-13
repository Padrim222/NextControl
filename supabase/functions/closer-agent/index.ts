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
    npqc_stage?: string;
    lead_context?: any;
    product_id?: string;
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

        return `\n\n=== CONTEXTO RAG VECTOR ===\n${contextText}\n=======================================\nBaseie sua resposta nesses dados oficiais do NPQC.`;
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

        const { capability, channel, input_type, input_data, npqc_stage, lead_context, product_id } = await req.json() as RequestPayload;

        const supabase = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            { global: { headers: { Authorization: authHeader } } }
        );

        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) throw new Error('Unauthorized');

        const sellerId = user.id;

        const openRouterKey = Deno.env.get('OPENROUTER_API_KEY');
        if (!openRouterKey) throw new Error('OPENROUTER_API_KEY is not set');

        // Enforcement de Regra NPQC
        if (capability === 'generate-npqc-questions' && npqc_stage === 'fechamento') {
             // Avaliar lead_context. Se faltar estrela_norte, bloqueia e avisa
             const stagesSoFar = lead_context?.stages_covered || [];
             if (!stagesSoFar.includes('estrela_norte') || !stagesSoFar.includes('problema')) {
                 return new Response(JSON.stringify({ 
                     answer: "⚠️ **AVISO DE VIOLAÇÃO NPQC:** Você ainda não explorou a *Situação Atual* ou o *Problema* mapeado do Lead. É arriscado pular direto para o Fechamento. Sugiro cobrir essas etapas antes. Qual a sua meta/Dificuldade principal agora com este Prospect, para que eu te guie à fase devida?",
                     warning: true
                 }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
             }
        }
        
        if (capability === 'generate-pitch') {
             const mappedPain = lead_context?.mapped_pain;
             if (!mappedPain) {
                 return new Response(JSON.stringify({ 
                     answer: "⚠️ **AVISO NPQC:** Sem entender a Dor (Fase 3: Problema) que acende a urgência do lead, o pitch vai ser generalista. Sugiro mapear as dores antes via diagnóstico NPQC (fase anterior) ou forneça manualmente qual dor resolverei.",
                     warning: true
                 }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
             }
        }

        const queryText = input_type === 'text' ? input_data : `Capability: ${capability} NPQC Stage: ${npqc_stage}`;
        const ragContext = await fetchRAGContext(supabase, sellerId, queryText);

        let actPrompt = "";
        let basePrompt = `Você é o Head de Bolso Closer — assistente de fechamento de vendas de Ticket Alto. Guiado pela metodologia NPQC do Rafael Yorik (Nunca pule as Fases de 1 a 4).
Canal selecionado: ${channel.toUpperCase()}`;

        if (capability === 'analyze-lead-card') actPrompt = "CAPABILITY: ANALYZE_LEAD_CARD\nExtraia os dados, identifique os GAPS de informação explícitos do Input e sugira até 3 Próximos Passos baseados em estreitar essa vulnerabilidade (Sem dar Pitching).";
        else if (capability === 'generate-npqc-questions') actPrompt = `CAPABILITY: GENERATE_NPQC_QUESTIONS\nFase Alvo: ${npqc_stage?.toUpperCase()}\nForje 3-5 Perguntas Fortes (Que atinjam diretamente a dor/realidade base) inerentes APENAS da etapa selecionada.`;
        else if (capability === 'generate-pitch') actPrompt = `CAPABILITY: GENERATE_PITCH\nFaça um Pitch agressivo mas elegante adaptado ao canal de fala, atacando a dor identificada: [${lead_context?.mapped_pain || 'N/A'}] com o Produto ${product_id || 'Serviço'}. Entregue CTA curto de avanço (micro-yes).`;
        else if (capability === 'improve-script') actPrompt = "CAPABILITY: IMPROVE_SCRIPT\nFiltre o Roteiro do usuário contra o NPQC. Identifique os furos (transgressões e banalidades). Dê a versão aprimorada ANTES x DEPOIS e justifique a tática psicológica usada no DepioS.";

        const finalSystemPrompt = `${basePrompt}\n\n${actPrompt}\n\n${ragContext}`;
        const messages: any[] = [{ role: 'system', content: finalSystemPrompt }];

        if (input_type === 'image') {
            messages.push({
                role: 'user',
                content: [
                    { type: 'text', text: 'Analise o seguinte material gráfico e proceda com as instruções da System Prompt.' },
                    { type: 'image_url', image_url: { url: input_data } }
                ]
            });
        } else {
            messages.push({ role: 'user', content: `Dados/Contexto do Usuário: ${input_data}` });
        }

        const openRouterUrl = 'https://openrouter.ai/api/v1/chat/completions';
        const openRouterResponse = await fetch(openRouterUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${openRouterKey}`,
                'HTTP-Referer': 'https://nextcontrol.pro',
                'X-Title': 'NextControl Head Closer',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: input_type === 'image' ? 'google/gemini-2.5-flash' : 'openai/gpt-4o',
                messages: messages,
                max_tokens: 1500,
                temperature: 0.6,
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
            agent_type: 'closer',
            channel: channel,
            lead_context: lead_context || {},
            messages: messages.concat([{ role: 'assistant', content: llmAnswer }]),
            capability_used: capability
        }).then(({ error }) => {
            if (error) console.error("Falha ao salvar log da agent_conversation:", error);
        });

        return new Response(JSON.stringify({ answer: llmAnswer }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    } catch (error: any) {
        console.error('Closer Agent Error:', error);
        return new Response(JSON.stringify({ error: error.message || 'Erro inesperado no Closer Agent' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 });
    }
});
