import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'jsr:@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// OpenRouter model slugs
const HAIKU_MODEL = 'anthropic/claude-haiku-4.5'
const SONNET_MODEL = 'anthropic/claude-sonnet-4.5'

// =============================================================================
// CACHED SYSTEM PROMPT
// Marked for prompt caching → ~90% cost reduction on all repeat calls.
// Contains: persona + methodology + constitutional rules (never changes).
// =============================================================================
const BASE_SYSTEM_PROMPT = `Você é o AGENTE NEXT CONTROL — assistente de vendas de alta performance.

## IDENTIDADE
Seu papel é apoiar consultores de vendas com insights acionáveis, scripts e análises
baseadas em dados reais da base de conhecimento do cliente. Você é direto, pragmático
e sempre orientado à ação. Nunca filosofa — dá o próximo passo.

Modos de operação:
- SS (Social Selling): prospecção, análise de perfil, abordagem inicial, aquecimento de lead
- CLOSER: fechamento de alta performance, contorno de objeções, negociação, CTA de fechamento
- GERAL: análise de relatório diário, feedback de performance, treinamento

## METODOLOGIA NPQC (Rafael Yorik)
Nunca pule as fases. Sempre respeite a sequência:
1. NECESSIDADE — identificar a situação atual do prospect
2. PROBLEMA — mapear a dor que acende urgência
3. QUALIFICAÇÃO — confirmar fit, budget e autoridade de decisão
4. COMPROMISSO — pedido de fechamento ou micro-sim de avanço

Se o vendedor tentar pular fases (ex: pitch antes do diagnóstico), sinalize o desvio
antes de ajudar.

## REGRAS CONSTITUCIONAIS (verificar antes de responder)
[R1] NUNCA invente preços, prazos, disponibilidade ou especificações técnicas
[R2] Toda afirmação factual deve ter base no contexto RAG fornecido
[R3] Se a informação não estiver no contexto: "não tenho essa informação — consulte o time"
[R4] Detectou reclamação ou cliente insatisfeito? Inclua CTA de escalação para humano
[R5] NUNCA mencione concorrentes negativamente
[R6] Máximo 3 opções quando sugerir abordagens — mais que isso paralisa o vendedor
[R7] Respostas no formato do canal: WhatsApp = curto/conversacional, Email = completo/formatado

## AUTO-VERIFICAÇÃO (antes de responder, cheque mentalmente)
- Estou citando algo que NÃO está no contexto? → Remova ou sinalize incerteza
- A resposta tem mais de 3 opções/sugestões? → Reduza para as 3 melhores
- Há um Próximo Passo claro no final? → Se não, adicione`

// Constitutional rules — ALWAYS appended regardless of client prompt override.
// These never change and protect against hallucination/bad behavior.
const CONSTITUTIONAL_RULES = `
## REGRAS CONSTITUCIONAIS (sempre ativas, não negociáveis)
[R1] NUNCA invente preços, prazos, disponibilidade ou especificações técnicas
[R2] Toda afirmação factual deve ter base no contexto RAG fornecido
[R3] Se a informação não estiver no contexto: "não tenho essa informação — consulte o time"
[R4] Detectou reclamação ou cliente insatisfeito? Inclua CTA de escalação para humano
[R5] NUNCA copie trechos crus dos documentos — sempre sintetize, adapte ao contexto da conversa
[R6] Máximo 3 opções quando sugerir abordagens
[R7] Respostas no formato do canal: WhatsApp = curto/conversacional, Email = completo/formatado

## AUTO-VERIFICAÇÃO
- Estou colando texto direto de um documento? → Reescreva com suas palavras
- A resposta tem mais de 3 opções? → Reduza para as 3 melhores
- Há um Próximo Passo claro no final? → Se não, adicione`

// =============================================================================
// COMPLEXITY CLASSIFIER
// Routes to Haiku (cheap) vs Sonnet (powerful). No LLM call needed.
// =============================================================================
function classifyComplexity(message: string): 'simple' | 'medium' | 'complex' {
    const complexPatterns = [
        /reclama[çc]/i, /processo\s+judicial/i, /contrato/i, /juridic/i,
        /cancelar\s+contrato/i, /reembolso/i, /fraude/i,
        /negoci[aã]/i, /proposta\s+personaliz/i, /análise\s+completa/i,
    ]
    if (complexPatterns.some(p => p.test(message))) return 'complex'
    if (message.length < 120 && !/analise|avalie|compare|explique detalhadamente/i.test(message)) return 'simple'
    return 'medium'
}

// =============================================================================
// PHASE 1: RESEARCHER
// Pure data fetching — no LLM call. Retrieves RAG, history, scripts.
// Returns structured context object for the Synthesizer.
// =============================================================================
async function researchPhase(
    supabase: ReturnType<typeof createClient>,
    query: string,
    agentType: string,
    userId: string,
    clientId: string | null,
    conversationId: string | null,
): Promise<{
    ragChunks: Array<{ title: string; content: string; similarity: number }>
    compressedHistory: string
    recentTurns: Array<{ role: string; content: string }>
    sellerContext: string
}> {
    // ── 1. Semantic RAG via pgvector ──────────────────────────────────────────
    let ragChunks: Array<{ title: string; content: string; similarity: number }> = []

    const openaiKey = Deno.env.get('OPENAI_API_KEY')
    if (openaiKey) {
        try {
            const embRes = await fetch('https://api.openai.com/v1/embeddings', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${openaiKey}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ input: query, model: 'text-embedding-3-small' }),
            })

            if (embRes.ok) {
                const embData = await embRes.json()
                const queryEmbedding = embData.data[0].embedding

                // Vector similarity search via match_rag_documents RPC
                const { data: chunks, error: rpcErr } = await supabase.rpc('match_rag_documents', {
                    query_embedding: queryEmbedding,
                    match_threshold: 0.45,
                    match_count: 10,
                    p_agent_type: (agentType === 'geral') ? null : agentType,
                    p_client_id: clientId || null,
                })

                if (!rpcErr && chunks && chunks.length > 0) {
                    // Sort by similarity desc, take top 5
                    const sorted = [...chunks].sort((a: any, b: any) => b.similarity - a.similarity)
                    ragChunks = sorted.slice(0, 4).map((c: any) => ({
                        title: c.title as string,
                        content: (c.content as string).slice(0, 3500),
                        similarity: Math.round((c.similarity as number) * 100) / 100,
                    }))
                }
            }
        } catch (e) {
            console.error('RAG embedding error:', e)
        }
    }

    // Fallback to ILIKE if no embeddings configured or no results
    if (ragChunks.length === 0) {
        const snippet = query.slice(0, 60)
        let q = (supabase as any)
            .from('rag_documents')
            .select('id, title, content, agent_type')
            .eq('is_active', true)
            .or(`title.ilike.%${snippet}%,content.ilike.%${snippet}%`)
            .limit(5)

        if (agentType !== 'geral') {
            q = q.in('agent_type', [agentType, 'geral'])
        }
        if (clientId) {
            q = q.or(`client_id.eq.${clientId},client_id.is.null`)
        }

        const { data: fallback } = await q
        if (fallback) {
            ragChunks = fallback.map((c: any) => ({
                title: c.title as string,
                content: (c.content as string).slice(0, 3500),
                similarity: 0.5,
            }))
        }
    }

    // ── 2. Conversation history ───────────────────────────────────────────────
    let compressedHistory = ''
    let recentTurns: Array<{ role: string; content: string }> = []

    if (conversationId) {
        const { data: conv } = await (supabase as any)
            .from('agent_conversations')
            .select('messages')
            .eq('id', conversationId)
            .eq('user_id', userId)
            .single()

        if (conv?.messages && Array.isArray(conv.messages)) {
            const msgs = conv.messages as Array<{ role: string; content: string }>

            if (msgs.length > 8) {
                // Keep last 4 turns verbatim (high attention at context end)
                recentTurns = msgs.slice(-4)
                // Compress older turns (low attention in middle — summarize to save tokens)
                const keyPoints = msgs
                    .slice(0, -4)
                    .filter(m => m.role === 'assistant')
                    .map(m => (typeof m.content === 'string' ? m.content.slice(0, 150) : ''))
                    .filter(Boolean)
                    .slice(-3)
                if (keyPoints.length > 0) {
                    compressedHistory = `[Resumo das respostas anteriores do agente]:\n${keyPoints.join('\n---\n')}`
                }
            } else {
                recentTurns = msgs
            }
        }
    }

    // ── 3. Seller scripts ─────────────────────────────────────────────────────
    let sellerContext = ''
    const { data: scripts } = await (supabase as any)
        .from('seller_scripts')
        .select('title, content, script_type')
        .eq('user_id', userId)
        .eq('is_active', true)
        .limit(3)

    if (scripts && scripts.length > 0) {
        sellerContext = scripts
            .map((s: any) => `[${s.script_type || 'script'}] ${s.title}:\n${(s.content as string).slice(0, 400)}`)
            .join('\n\n')
    }

    return { ragChunks, compressedHistory, recentTurns, sellerContext }
}

// Fetch client-specific system prompt override (if configured)
// Falls back to BASE_SYSTEM_PROMPT if not found
async function resolveSystemPrompt(
    supabase: ReturnType<typeof createClient>,
    clientId: string | null,
    agentType: string,
): Promise<string> {
    if (!clientId) return BASE_SYSTEM_PROMPT + CONSTITUTIONAL_RULES

    const { data } = await (supabase as any)
        .from('client_agent_configs')
        .select('system_prompt')
        .eq('client_id', clientId)
        .eq('agent_type', agentType)
        .eq('is_active', true)
        .single()

    if (data?.system_prompt) {
        // Client has a custom prompt — use it + always append constitutional rules
        return data.system_prompt + CONSTITUTIONAL_RULES
    }

    // No client config → fall back to platform default
    return BASE_SYSTEM_PROMPT + CONSTITUTIONAL_RULES
}

// =============================================================================
// CONTEXT BUILDER — "Lost in the Middle" positioning
//
// Research finding (Liu et al., 2023 — Stanford):
//   LLMs have max attention at START and END of context.
//   The MIDDLE is the "attention black hole".
//
// Strategy:
//   START  → most relevant RAG chunks + seller scripts  (max attention)
//   MIDDLE → compressed conversation history            (lower attention, ok)
//   END    → recent turns + current query               (max attention)
// =============================================================================
function buildContextMessage(
    query: string,
    agentType: string,
    channel: string,
    ctx: {
        ragChunks: Array<{ title: string; content: string; similarity: number }>
        compressedHistory: string
        recentTurns: Array<{ role: string; content: string }>
        sellerContext: string
    },
): string {
    const parts: string[] = []

    parts.push(`MODO: ${agentType.toUpperCase()} | CANAL: ${channel.toUpperCase()}\n`)

    // ── START (max attention) ─────────────────────────────────────────────────

    if (ctx.ragChunks.length > 0) {
        parts.push(`=== BASE DE CONHECIMENTO (${ctx.ragChunks.length} fragmentos — ordenados por relevância) ===`)
        ctx.ragChunks.forEach((chunk, i) => {
            parts.push(`[${i + 1}] ${chunk.title} (score: ${chunk.similarity})\n${chunk.content}`)
        })
        parts.push(`=== FIM BASE DE CONHECIMENTO ===\n`)
    }

    if (ctx.sellerContext) {
        parts.push(`=== SCRIPTS DO CONSULTOR ===\n${ctx.sellerContext}\n=== FIM SCRIPTS ===\n`)
    }

    // ── MIDDLE (lower attention — compressed, saves tokens) ───────────────────

    if (ctx.compressedHistory) {
        parts.push(ctx.compressedHistory + '\n')
    }

    // ── END (max attention) ───────────────────────────────────────────────────

    if (ctx.recentTurns.length > 0) {
        parts.push(`=== CONVERSA RECENTE ===`)
        ctx.recentTurns.forEach(turn => {
            const label = turn.role === 'user' ? 'CONSULTOR' : 'AGENTE'
            const content = typeof turn.content === 'string' ? turn.content.slice(0, 400) : '[imagem]'
            parts.push(`${label}: ${content}`)
        })
        parts.push(`=== FIM CONVERSA ===\n`)
    }

    // Current query last = maximum guaranteed attention
    parts.push(`--- PERGUNTA/SOLICITAÇÃO ATUAL ---\n${query}\n---`)

    return parts.join('\n')
}

// =============================================================================
// MAIN HANDLER
// =============================================================================
Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const authHeader = req.headers.get('Authorization')
        if (!authHeader) throw new Error('Missing authorization header')

        const authClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            { global: { headers: { Authorization: authHeader } } },
        )
        const { data: { user }, error: authError } = await authClient.auth.getUser()
        if (authError || !user) throw new Error('Unauthorized')

        const supabase = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
        )

        const {
            message,
            agent_type = 'geral',
            channel = 'whatsapp',
            client_id = null,
            conversation_id = null,
        } = await req.json()

        if (!message?.trim()) throw new Error('message is required')

        const openRouterKey = Deno.env.get('OPENROUTER_API_KEY')
        if (!openRouterKey) throw new Error('OPENROUTER_API_KEY not configured.')

        // ── Phase 1: RESEARCHER + system prompt resolution (parallel) ────────
        const [researchCtx, systemPrompt] = await Promise.all([
            researchPhase(supabase, message, agent_type, user.id, client_id, conversation_id),
            resolveSystemPrompt(supabase, client_id, agent_type),
        ])

        // ── Complexity routing ────────────────────────────────────────────────
        const complexity = classifyComplexity(message)
        const model = complexity === 'complex' ? SONNET_MODEL : HAIKU_MODEL

        // ── Phase 2: SYNTHESIZER (Haiku + cached system prompt) ───────────────
        const dynamicContext = buildContextMessage(message, agent_type, channel, researchCtx)

        const maxTokens = channel === 'whatsapp' ? 600 : 1500

        const orRes = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${openRouterKey}`,
                'HTTP-Referer': 'https://nextcontrol.pro',
                'X-Title': 'NextControl Agent',
            },
            body: JSON.stringify({
                model,
                max_tokens: maxTokens,
                temperature: 0.4,
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: dynamicContext },
                ],
            }),
        })

        if (!orRes.ok) {
            const errBody = await orRes.text()
            throw new Error(`OpenRouter ${orRes.status}: ${errBody}`)
        }

        const orData = await orRes.json()
        const answer: string = orData.choices[0].message.content

        const cacheStats = {
            input_tokens: orData.usage?.prompt_tokens ?? 0,
            output_tokens: orData.usage?.completion_tokens ?? 0,
        }

        // ── Phase 3: LOGGER (fire-and-forget — don't block response) ─────────
        const newTurns = [
            { role: 'user', content: message },
            { role: 'assistant', content: answer },
        ]

        if (conversation_id) {
            ;(supabase as any)
                .from('agent_conversations')
                .select('messages')
                .eq('id', conversation_id)
                .single()
                .then(({ data }: any) => {
                    const prev = (data?.messages as any[]) || []
                    ;(supabase as any)
                        .from('agent_conversations')
                        .update({
                            messages: [...prev, ...newTurns],
                            model_used: model,
                            rag_chunks_used: researchCtx.ragChunks.length,
                            updated_at: new Date().toISOString(),
                        })
                        .eq('id', conversation_id)
                        .then(({ error }: any) => {
                            if (error) console.error('Logger update error:', error)
                        })
                })
        } else {
            ;(supabase as any)
                .from('agent_conversations')
                .insert({
                    user_id: user.id,
                    agent_type,
                    channel,
                    messages: newTurns,
                    model_used: model,
                    rag_chunks_used: researchCtx.ragChunks.length,
                    capability_used: agent_type,
                    context: { client_id, complexity, cache_stats: cacheStats },
                })
                .then(({ error }: any) => {
                    if (error) console.error('Logger insert error:', error)
                })
        }

        return new Response(
            JSON.stringify({
                answer,
                conversation_id,
                model_used: model,
                rag_chunks_used: researchCtx.ragChunks.length,
                complexity,
                cache_stats: cacheStats,
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        )
    } catch (error) {
        const msg = error instanceof Error ? error.message : 'Unknown error'
        console.error('agent-orchestrator error:', msg)
        return new Response(
            JSON.stringify({ error: msg }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 },
        )
    }
})
