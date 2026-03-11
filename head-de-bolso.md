# Next Control — Plano de Produto v3: Head de Bolso

**Data:** 10 de Março de 2026
**PO:** Bruno Fabricio (Cigano.agi)
**Stakeholder Metodologia:** Rafael Yorik
**Versão:** v3 — Corrigida após input direto do Rafa

---

## Correção de Rota

O plano v2 tratou o Módulo de Calls como feature principal. O Rafa esclareceu:

- **Head de Bolso = 2 agentes de chat** (SS + Closer) que ajudam o vendedor em tempo real
- **Plataforma de Calls/Conversas = produto separado** (onde sobe gravações pra análise posterior)

O que já existe: interface multimodal (Gemini Vision), RAG (Paiol), seletor de canal, Edge Functions com Chain of Thought. Isso é a fundação. O que falta é a **inteligência específica de cada agente** e os **fluxos de uso reais** que o Rafa descreveu.

---

## Os 2 Agentes

### Agente SS (Sales Specialist) — Prospecção

O SS é o copiloto do SDR. Ele ajuda a abrir conversas, manter engajamento e quebrar objeções na fase de prospecção.

**Capabilities que o Rafa pediu:**

| # | Capability | Input do Vendedor | Output do Agente |
|---|-----------|-------------------|------------------|
| SS-1 | Analisar perfil do Instagram | Print/screenshot do perfil (bio + feed) | Resumo do lead + pontos de conexão + sugestão de abertura |
| SS-2 | Analisar story postado | Print/screenshot do story | Abordagem contextualizada baseada no conteúdo do story |
| SS-3 | Gerar mensagem por canal | Vendedor seleciona: WhatsApp, Instagram DM ou LinkedIn | Tom e formato ajustados ao canal (informal → formal) |
| SS-4 | Analisar conversa em andamento | Print/screenshot ou texto da conversa | Sugestões de próxima mensagem para avançar o lead |
| SS-5 | Quebrar objeções | Print/screenshot da objeção recebida | 2-3 opções de resposta baseadas na metodologia |
| SS-6 | Conduzir lead pós-disparo | Contexto: "fiz disparo, lead respondeu X" | Script de condução baseado no modelo de script do vendedor |

### Agente Closer — Fechamento

O Closer é o copiloto do vendedor na fase de fechamento. Ele ajuda a conduzir a conversa pelo framework NPQC e a apresentar o produto de forma estratégica.

**Capabilities que o Rafa pediu:**

| # | Capability | Input do Vendedor | Output do Agente |
|---|-----------|-------------------|------------------|
| CL-1 | Analisar card do lead | Dados do CRM (print ou integração) | Contexto completo + gaps de informação + próximos passos sugeridos |
| CL-2 | Gerar perguntas por etapa NPQC | Etapa atual + contexto do lead | Perguntas personalizadas para cada etapa (Estrela Norte → Situação Atual → Problema → Fechamento) |
| CL-3 | Apresentar produto | Produto + canal + perfil do lead | Pitch personalizado ajustado ao canal e à dor identificada |
| CL-4 | Analisar script e melhorar | Vendedor cola/envia seu script atual | Análise com sugestões de melhoria baseadas na metodologia |
| CL-5 | Adaptar comunicação ao canal | Canal selecionado + contexto | Mesma mensagem reescrita pro tom do canal |

---

## Regra de Ouro (Do Rafa)

> "A IA é algemada. Ela não pode inventar."

Isso se traduz em regras técnicas:

1. **Toda resposta deve ser rastreável a um documento do RAG** — o agente nunca "inventa" uma técnica que não está nos briefings do Rafa
2. **O fluxo NPQC é obrigatório para o Closer** — ele não pode pular etapas, mesmo que o vendedor peça
3. **O SS segue o modelo de script** — se o vendedor tem um script de disparo, o agente respeita esse framework
4. **Quando não sabe, admite** — melhor dizer "não tenho informação suficiente sobre esse lead" do que inventar

---

## Arquitetura de Implementação

O que muda na arquitetura existente não é a infraestrutura (já está pronta), é a **camada de prompts, fluxos de interação e processamento de input**.

### O que já existe e será reaproveitado:
- Gemini 2.0 Flash Vision → processa prints/screenshots (SS-1, SS-2, SS-4, SS-5, CL-1)
- RAG com pgvector → recupera documentos da metodologia e briefings
- Seletor de canal (chips de UI) → ajusta System Prompt (SS-3, CL-5)
- Edge Functions com Chain of Thought → engine de resposta

### O que precisa ser construído:

\`\`\`
src/
├── app/
│   ├── ss/                           # Interface do Agente SS
│   │   └── page.tsx                  # Chat do SS com contexto de prospecção
│   ├── closer/                       # Interface do Agente Closer
│   │   └── page.tsx                  # Chat do Closer com contexto NPQC
│   └── layout.tsx                    # Navegação entre agentes
├── components/
│   ├── chat/
│   │   ├── AgentChat.tsx             # Chat base reutilizável
│   │   ├── ImageUpload.tsx           # Upload de prints/screenshots (já existe?)
│   │   ├── ChannelSelector.tsx       # Chips de canal (já existe)
│   │   └── ConversationViewer.tsx    # Visualização de conversa colada
│   ├── ss/
│   │   ├── ProfileAnalysis.tsx       # Card de análise de perfil
│   │   ├── ObjectionBreaker.tsx      # UI de opções de resposta a objeções
│   │   └── ScriptFlow.tsx            # Indicador de onde está no script
│   └── closer/
│       ├── LeadCard.tsx              # Card de contexto do lead
│       ├── NPQCTracker.tsx           # Tracker visual das 4 etapas
│       ├── QuestionSuggestions.tsx   # Sugestões de perguntas por etapa
│       └── ProductPitch.tsx          # Card de pitch personalizado
├── lib/
│   ├── agents/
│   │   ├── ss-system-prompt.ts       # System prompt do SS (por canal)
│   │   ├── closer-system-prompt.ts   # System prompt do Closer (por canal)
│   │   ├── ss-capabilities.ts        # Lógica de roteamento de capabilities SS
│   │   └── closer-capabilities.ts    # Lógica de roteamento de capabilities Closer
│   └── prompts/
│       ├── analyze-profile.ts        # Prompt: análise de perfil Instagram
│       ├── analyze-story.ts          # Prompt: análise de story
│       ├── analyze-conversation.ts   # Prompt: análise de conversa em andamento
│       ├── break-objection.ts        # Prompt: quebra de objeção
│       ├── post-dispatch.ts          # Prompt: condução pós-disparo
│       ├── analyze-lead-card.ts      # Prompt: análise de card do CRM
│       ├── generate-npqc-questions.ts# Prompt: perguntas por etapa NPQC
│       ├── generate-pitch.ts         # Prompt: pitch de produto
│       └── improve-script.ts         # Prompt: análise e melhoria de script
supabase/
├── functions/
│   ├── ss-agent/
│   │   └── index.ts                  # Edge Function do Agente SS
│   └── closer-agent/
│       └── index.ts                  # Edge Function do Agente Closer
├── migrations/
│   ├── 20260310_001_create_conversations_table.sql  # Histórico de interações
│   └── 20260310_002_create_scripts_table.sql        # Scripts dos vendedores
\`\`\`

---

## As 13 Tasks

### BLOCO 1: FUNDAÇÃO DE AGENTES (Tasks 1-3)

System prompts, roteamento de capabilities e schema.

---

#### Task 1 — System Prompts: SS e Closer

**Objetivo:** Criar os system prompts que definem o comportamento de cada agente. Estes são o DNA do produto.

**System Prompt do SS (\`ss-system-prompt.ts\`):**

\`\`\`
Você é o Head de Bolso SS — assistente de prospecção de vendas.

## QUEM VOCÊ É
- Especialista em abertura de conversas e prospecção
- Treinado na metodologia de vendas do Rafael Yorik
- Seu papel é SUGERIR, nunca executar. O vendedor decide.

## REGRAS ABSOLUTAS
1. NUNCA invente informações sobre o lead. Use APENAS o que foi fornecido (print, texto, perfil).
2. SEMPRE baseie suas sugestões nos documentos da metodologia. Se não encontrar referência, diga.
3. ADAPTE o tom ao canal selecionado:
   - WhatsApp: Informal, direto, curto. Emojis OK. Máximo 3 linhas.
   - Instagram DM: Casual, referência ao conteúdo da pessoa. 2-4 linhas.
   - LinkedIn: Profissional, orientado a valor. 3-5 linhas.
4. Quando receber uma OBJEÇÃO, ofereça 2-3 opções de resposta, nunca uma só.
5. Se o vendedor tem um MODELO DE SCRIPT, respeite a estrutura dele.

## O QUE VOCÊ PODE FAZER
- Analisar perfis de Instagram (bio, feed, stories)
- Sugerir mensagens de abertura personalizadas
- Analisar conversas e sugerir próximos passos
- Quebrar objeções com opções de resposta
- Conduzir vendedor após disparo quando lead engajou

## O QUE VOCÊ NÃO PODE FAZER
- Inventar dados sobre o lead
- Pular etapas da metodologia
- Dar respostas genéricas sem contexto
- Responder sobre fechamento (encaminhe pro Closer)
\`\`\`

**System Prompt do Closer (\`closer-system-prompt.ts\`):**

\`\`\`
Você é o Head de Bolso Closer — assistente de fechamento de vendas.

## QUEM VOCÊ É
- Especialista em condução de reuniões e fechamento
- Treinado na metodologia NPQC do Rafael Yorik
- Seu papel é guiar o vendedor pelas 4 etapas, nunca pular.

## FRAMEWORK NPQC (OBRIGATÓRIO)
Toda interação segue esta sequência:
1. ESTRELA NORTE: Ajudar o lead a visualizar o futuro ideal
2. SITUAÇÃO ATUAL: Mapear onde o lead está hoje
3. PROBLEMA: Aprofundar o gap entre atual e ideal, criar urgência
4. FECHAMENTO: Conduzir para decisão com compromisso

## REGRAS ABSOLUTAS
1. NUNCA pule etapas do NPQC. Se o vendedor está na etapa 1, não sugira perguntas da etapa 4.
2. SEMPRE baseie perguntas nos documentos da metodologia + contexto do lead.
3. Ao analisar um card do lead, identifique GAPS de informação antes de sugerir ações.
4. Ao gerar pitch de produto, CONECTE features com as dores identificadas nas etapas anteriores.
5. ADAPTE comunicação ao canal (WhatsApp, call, e-mail, LinkedIn).

## O QUE VOCÊ PODE FAZER
- Analisar card do lead do CRM
- Gerar perguntas personalizadas para cada etapa NPQC
- Sugerir formas de apresentar o produto conectadas às dores
- Analisar scripts existentes e sugerir melhorias
- Adaptar mensagens ao canal de comunicação

## O QUE VOCÊ NÃO PODE FAZER
- Pular etapas do NPQC
- Inventar dores que o lead não mencionou
- Dar pitch genérico sem contexto do lead
- Responder sobre prospecção (encaminhe pro SS)
\`\`\`

**Variação por canal (ambos os agentes):**
- Cada system prompt recebe um sufixo baseado no canal selecionado
- O sufixo ajusta: tamanho da resposta, tom, formatação, uso de emojis

**INPUT:** Documentos da metodologia do Rafa (já no RAG) + requirements acima
**OUTPUT:** \`src/lib/agents/ss-system-prompt.ts\` + \`src/lib/agents/closer-system-prompt.ts\`
**VERIFY:**
- [ ] SS com canal WhatsApp gera mensagens curtas (< 3 linhas) e informais
- [ ] SS com canal LinkedIn gera mensagens profissionais (3-5 linhas)
- [ ] Closer RECUSA sugerir perguntas de Fechamento se vendedor ainda está em Estrela Norte
- [ ] Closer identifica gaps no card do lead antes de sugerir ações
- [ ] Ambos citam a metodologia nas respostas (rastreabilidade ao RAG)
- [ ] Ambos admitem quando não têm informação suficiente
- [ ] SS redireciona para Closer quando vendedor pergunta sobre fechamento
- [ ] Closer redireciona para SS quando vendedor pergunta sobre prospecção

---

#### Task 2 — Prompts especializados por capability

**Objetivo:** Criar os prompts específicos para cada ação que os agentes executam. Cada capability tem um prompt otimizado.

**Prompts do SS:**

| Arquivo | Capability | Input esperado | Instruções especiais |
|---------|-----------|----------------|---------------------|
| \`analyze-profile.ts\` | SS-1 | Imagem (perfil Instagram) | Extrair: nome, bio, nicho, últimos posts, pontos de conexão. Retornar: resumo + 3 opções de abertura. |
| \`analyze-story.ts\` | SS-2 | Imagem (story) | Identificar: tema do story, emoção, contexto. Gerar: reply contextualizada ao story como gancho de abertura. |
| \`analyze-conversation.ts\` | SS-4 | Imagem ou texto (conversa) | Identificar: etapa da conversa, tom do lead, sinais de interesse/desinteresse. Sugerir: próxima mensagem com justificativa. |
| \`break-objection.ts\` | SS-5 | Imagem ou texto (objeção) | Classificar: tipo de objeção (preço, timing, autoridade, necessidade). Gerar: 2-3 respostas baseadas na metodologia, rankeadas por assertividade. |
| \`post-dispatch.ts\` | SS-6 | Contexto do disparo + resposta do lead | Identificar: nível de engajamento do lead. Gerar: script de condução respeitando o modelo do vendedor. |

**Prompts do Closer:**

| Arquivo | Capability | Input esperado | Instruções especiais |
|---------|-----------|----------------|---------------------|
| \`analyze-lead-card.ts\` | CL-1 | Imagem ou texto (card do CRM) | Extrair: dados do lead, histórico, produto de interesse. Identificar: gaps de informação. Sugerir: próximos passos. |
| \`generate-npqc-questions.ts\` | CL-2 | Etapa NPQC + contexto do lead | Gerar: 3-5 perguntas personalizadas para a etapa. Perguntas devem usar dados reais do lead, não genéricas. |
| \`generate-pitch.ts\` | CL-3 | Produto + canal + dores do lead | Gerar: pitch que conecta features do produto com dores identificadas nas etapas anteriores. Adaptar ao canal. |
| \`improve-script.ts\` | CL-4 | Script do vendedor (texto) | Analisar: aderência ao NPQC, qualidade das perguntas, transições entre etapas. Sugerir: melhorias específicas com antes/depois. |

**INPUT:** Requirements acima + documentos da metodologia via RAG
**OUTPUT:** 9 arquivos em \`src/lib/prompts/\`
**VERIFY:**
- [ ] \`analyze-profile\` com print real de Instagram gera 3 opções de abertura relevantes
- [ ] \`analyze-story\` com print de story gera reply que referencia o conteúdo específico
- [ ] \`analyze-conversation\` identifica corretamente se o lead está frio, morno ou quente
- [ ] \`break-objection\` classifica corretamente objeção de preço vs. timing
- [ ] \`break-objection\` gera respostas rankeadas (diplomática → assertiva → confrontacional)
- [ ] \`post-dispatch\` respeita modelo de script quando fornecido
- [ ] \`analyze-lead-card\` lista gaps de informação explicitamente
- [ ] \`generate-npqc-questions\` gera perguntas usando dados REAIS do lead (não genéricas)
- [ ] \`generate-pitch\` conecta features com dores (não é pitch genérico)
- [ ] \`improve-script\` mostra antes/depois com justificativa

---

#### Task 3 — Schema de banco: histórico e scripts

**Objetivo:** Estrutura de dados para persistir interações e scripts dos vendedores.

**Tabela \`agent_conversations\`:**
- \`id\` (uuid, PK)
- \`seller_id\` (uuid, FK → auth.users)
- \`agent_type\` (text — 'ss' ou 'closer')
- \`channel\` (text — 'whatsapp', 'instagram', 'linkedin')
- \`lead_context\` (jsonb — dados do lead extraídos, perfil analisado, etc.)
- \`messages\` (jsonb — array de mensagens do chat)
- \`capability_used\` (text — qual capability foi acionada)
- \`created_at\` (timestamptz)

**Tabela \`seller_scripts\`:**
- \`id\` (uuid, PK)
- \`seller_id\` (uuid, FK → auth.users)
- \`name\` (text — ex: "Script de disparo WhatsApp")
- \`content\` (text — o script completo)
- \`script_type\` (text — 'dispatch', 'followup', 'closing')
- \`is_active\` (boolean, default true)
- \`created_at\` (timestamptz)
- \`updated_at\` (timestamptz)

**RLS:**
- Vendedor acessa apenas seus dados
- Gestor acessa dados da equipe

**INPUT:** Requirements acima
**OUTPUT:** \`supabase/migrations/20260310_001_create_agent_tables.sql\`
**VERIFY:**
- [ ] Migrations rodam sem erro
- [ ] Insert + select funciona em ambas as tabelas
- [ ] RLS testada: vendedor A não vê dados do vendedor B
- [ ] Campo \`messages\` aceita JSON de conversa completa
- [ ] Campo \`lead_context\` aceita JSON com dados variados (perfil, card, etc.)

---

### BLOCO 2: EDGE FUNCTIONS DOS AGENTES (Tasks 4-6)

Backend que processa os inputs e gera respostas.

---

#### Task 4 — Edge Function: \`ss-agent\`

**Objetivo:** Endpoint que recebe input do SS e retorna resposta contextualizada.

**Fluxo:**
1. Recebe POST com: \`{ capability, channel, input_type, input_data, lead_context?, script_id? }\`
   - \`capability\`: 'analyze-profile' | 'analyze-story' | 'analyze-conversation' | 'break-objection' | 'post-dispatch'
   - \`input_type\`: 'image' | 'text'
   - \`input_data\`: base64 da imagem OU texto da conversa/objeção
2. Se \`input_type = 'image'\`: envia para Gemini Vision extrair informação textual
3. Monta contexto: system prompt do SS (por canal) + prompt da capability + documentos do RAG
4. Se \`script_id\` fornecido: recupera script do vendedor e inclui no contexto
5. Chama LLM com Chain of Thought
6. Parseia resposta e retorna JSON estruturado
7. Salva interação na tabela \`agent_conversations\`

**Roteamento por capability:**

| Capability | Precisa Vision? | Precisa RAG? | Precisa Script? |
|-----------|----------------|-------------|----------------|
| analyze-profile | ✅ Sim | ✅ Sim (abertura) | ❌ Não |
| analyze-story | ✅ Sim | ✅ Sim (abertura) | ❌ Não |
| analyze-conversation | ✅ Opcional | ✅ Sim (condução) | ❌ Não |
| break-objection | ✅ Opcional | ✅ Sim (objeções) | ❌ Não |
| post-dispatch | ❌ Não | ✅ Sim (condução) | ✅ Se disponível |

**INPUT:** Request do cliente com capability + dados
**OUTPUT:** \`supabase/functions/ss-agent/index.ts\`
**VERIFY:**
- [ ] analyze-profile com print de Instagram → retorna resumo + 3 aberturas
- [ ] analyze-story com print de story → retorna abordagem contextualizada
- [ ] analyze-conversation com print de DM → retorna sugestão de próxima msg
- [ ] break-objection com "tá caro" → retorna 2-3 opções rankeadas
- [ ] post-dispatch com contexto de disparo → retorna script de condução
- [ ] Canal WhatsApp → respostas curtas e informais
- [ ] Canal LinkedIn → respostas profissionais e mais longas
- [ ] Request com script_id → resposta respeita modelo do vendedor
- [ ] Request sem auth → 401
- [ ] Capability inválida → 400 com mensagem clara
- [ ] Interação salva em \`agent_conversations\`

---

#### Task 5 — Edge Function: \`closer-agent\`

**Objetivo:** Endpoint que recebe input do Closer e retorna resposta contextualizada com enforcement do NPQC.

**Fluxo:**
1. Recebe POST com: \`{ capability, channel, input_type, input_data, npqc_stage?, lead_context?, product_id? }\`
   - \`capability\`: 'analyze-lead-card' | 'generate-npqc-questions' | 'generate-pitch' | 'improve-script'
   - \`npqc_stage\`: 'estrela_norte' | 'situacao_atual' | 'problema' | 'fechamento' (obrigatório para generate-npqc-questions)
2. Se \`input_type = 'image'\`: envia para Gemini Vision
3. **ENFORCEMENT NPQC:** Se capability = 'generate-npqc-questions':
   - Verifica se \`npqc_stage\` foi informado
   - Recupera do \`lead_context\` quais etapas anteriores já foram cobertas
   - Se vendedor pede etapa 3 sem ter feito etapa 1 e 2: retorna warning + perguntas das etapas faltantes
4. Monta contexto: system prompt do Closer (por canal) + prompt da capability + RAG
5. Chama LLM
6. Parseia e retorna JSON estruturado
7. Salva interação

**Enforcement do NPQC (Regra de Ouro):**

| Vendedor pede | Etapas já cobertas | Resposta do agente |
|--------------|-------------------|-------------------|
| Perguntas de Fechamento | Estrela Norte + Situação Atual + Problema | ✅ Gera perguntas de fechamento |
| Perguntas de Fechamento | Apenas Estrela Norte | ⚠️ "Você ainda não explorou a Situação Atual e o Problema. Sugiro cobrir essas etapas antes. Aqui vão perguntas para Situação Atual:" |
| Perguntas de Fechamento | Nenhuma etapa | 🚫 "Vamos começar pelo início. Aqui vão perguntas de Estrela Norte para esse lead:" |
| Pitch de produto | Nenhuma etapa coberta | ⚠️ "Sem entender as dores do lead, o pitch vai ser genérico. Sugiro começar pelo NPQC. Mas se precisar, aqui vai um pitch básico:" |

**INPUT:** Request do cliente com capability + dados
**OUTPUT:** \`supabase/functions/closer-agent/index.ts\`
**VERIFY:**
- [ ] analyze-lead-card com print de CRM → retorna dados + gaps + próximos passos
- [ ] generate-npqc-questions etapa 1 → perguntas de Estrela Norte personalizadas
- [ ] generate-npqc-questions etapa 4 sem ter feito 1-3 → warning + redirect pra etapa 1
- [ ] generate-npqc-questions etapa 4 com 1-3 cobertas → perguntas de fechamento
- [ ] generate-pitch com dores mapeadas → pitch conecta features com dores
- [ ] generate-pitch SEM dores → warning + pitch básico com aviso
- [ ] improve-script com script colado → análise com antes/depois
- [ ] Canal ajusta tom corretamente
- [ ] Request sem auth → 401
- [ ] Interação salva em \`agent_conversations\`

---

#### Task 6 — Teste de integração: ambos os agentes

**Objetivo:** Validar os 2 agentes com cenários reais do dia a dia de vendas.

**Cenários SS:**

| # | Cenário | Input | Expected |
|---|---------|-------|----------|
| 1 | Abrir conversa via Insta | Print de perfil de coach fitness | Abertura referenciando bio e nicho do coach |
| 2 | Responder story | Print de story de viagem | Reply casual conectando o story com abertura |
| 3 | Lead respondeu frio | Print: "Não tenho interesse" | 2-3 opções: diplomatica, curiosidade, retirada elegante |
| 4 | Objeção de preço | Print: "Tá muito caro" | Respostas que reframe valor, não preço |
| 5 | Pós-disparo | "Mandei disparo sobre mentoria, lead respondeu 'me conta mais'" | Script de condução que qualifica antes de vender |

**Cenários Closer:**

| # | Cenário | Input | Expected |
|---|---------|-------|----------|
| 6 | Card do lead novo | Print de CRM com dados parciais | Lista de gaps + perguntas pra preencher |
| 7 | Gerar perguntas etapa 1 | Lead: empresário de e-commerce, faturando 50k/mês | Perguntas de Estrela Norte sobre crescimento e meta |
| 8 | Tentar pular pro fechamento | Pedir etapa 4 sem contexto | Warning + redirect pra etapa 1 |
| 9 | Pitch de produto | Dores mapeadas + produto mentoria | Pitch conectando mentoria com gap identificado |
| 10 | Melhorar script | Script genérico colado | Análise com pontos fracos + versão melhorada |

**INPUT:** Dados simulados dos cenários acima
**OUTPUT:** \`tests/integration/agents.test.ts\`
**VERIFY:**
- [ ] Todos os 10 cenários passam
- [ ] Respostas do SS são rastreáveis à metodologia (citam técnicas do RAG)
- [ ] Closer NUNCA pula etapas quando contexto está incompleto
- [ ] Respostas variam por canal (mesma pergunta no WhatsApp ≠ LinkedIn)

---

### BLOCO 3: INTERFACE (Tasks 7-10)

O que o vendedor vê e interage.

---

#### Task 7 — UI: Chat base reutilizável (AgentChat)

**Objetivo:** Componente de chat que funciona para ambos os agentes, com suporte a imagem e texto.

**Features:**
- Input de texto com envio por Enter
- Upload de imagem (botão + paste do clipboard + drag & drop)
- Preview da imagem antes de enviar
- Área de mensagens com scroll
- Mensagens do agente com markdown renderizado
- Loading state enquanto agente processa
- Suporte a respostas estruturadas (cards, opções, listas)

**Diferente de um chat genérico:**
- Cada mensagem do agente pode ter "ações rápidas" (botões pra executar sugestão)
- Mensagens com múltiplas opções (ex: 3 aberturas) mostram como cards clicáveis
- Contexto do lead persiste na sidebar (não some entre mensagens)

**INPUT:** Design system existente
**OUTPUT:** \`src/components/chat/AgentChat.tsx\` + subcomponentes
**VERIFY:**
- [ ] Enviar texto funciona (Enter + botão)
- [ ] Upload de imagem funciona (botão, paste, drag & drop)
- [ ] Preview da imagem aparece antes do envio
- [ ] Markdown nas respostas renderiza corretamente (bold, listas, etc.)
- [ ] Loading state aparece enquanto processa
- [ ] Scroll automático para última mensagem
- [ ] Funciona em mobile (teclado não cobre input)
- [ ] Paste de screenshot do clipboard funciona (atalho comum pra vendedores)

---

#### Task 8 — UI: Interface do Agente SS

**Objetivo:** Página do SS com chat + contexto + seleção de capability.

**Layout:**
- Header: "Head de Bolso SS — Prospecção" + seletor de canal (chips: WhatsApp | Instagram | LinkedIn)
- Área principal: AgentChat
- Sidebar (desktop) ou bottom sheet (mobile):
  - Contexto do lead detectado (atualiza quando envia print de perfil)
  - Capability ativa (detectada automaticamente pelo tipo de input, mas selecionável)
  - Script selecionado (dropdown dos scripts do vendedor, se houver)

**Detecção automática de capability:**
- Vendedor envia imagem de perfil → \`analyze-profile\`
- Vendedor envia imagem de story → \`analyze-story\`
- Vendedor envia imagem de conversa → \`analyze-conversation\`
- Vendedor escreve "objeção" ou envia print de objeção → \`break-objection\`
- Vendedor menciona "disparo" ou "blast" → \`post-dispatch\`
- Vendedor pode sempre forçar capability manualmente via chips

**INPUT:** AgentChat (Task 7) + ss-agent Edge Function (Task 4)
**OUTPUT:** \`src/app/ss/page.tsx\` + componentes SS
**VERIFY:**
- [ ] Seletor de canal funciona e persiste
- [ ] Enviar print de perfil aciona analyze-profile automaticamente
- [ ] Enviar print de conversa com objeção aciona break-objection
- [ ] Contexto do lead na sidebar atualiza após análise de perfil
- [ ] Vendedor pode mudar capability manualmente
- [ ] Script dropdown carrega scripts do vendedor (tabela \`seller_scripts\`)
- [ ] Layout responsivo: desktop com sidebar, mobile com bottom sheet

---

#### Task 9 — UI: Interface do Agente Closer

**Objetivo:** Página do Closer com chat + tracker NPQC + contexto do lead.

**Layout:**
- Header: "Head de Bolso Closer — Fechamento" + seletor de canal
- Área principal: AgentChat
- Sidebar (desktop):
  - **NPQCTracker:** Barra visual com 4 etapas (Estrela Norte → Situação Atual → Problema → Fechamento). Etapas cobertas ficam verdes. Etapa atual pulsa. Clicável pra mudar de etapa.
  - **LeadCard:** Resumo do lead (atualiza quando analisa card do CRM)
  - Produto selecionado (dropdown, usado pra pitch)

**Tracker NPQC (Feature diferencial):**
- Atualiza automaticamente baseado no fluxo de conversa
- Se o vendedor está na etapa 2 e pede algo da etapa 4, o tracker mostra visualmente o "pulo" e o warning do agente
- Vendedor pode clicar em uma etapa pra pedir perguntas daquela etapa

**INPUT:** AgentChat (Task 7) + closer-agent Edge Function (Task 5)
**OUTPUT:** \`src/app/closer/page.tsx\` + componentes Closer
**VERIFY:**
- [ ] NPQCTracker renderiza as 4 etapas com visual claro
- [ ] Clicar em etapa gera perguntas para aquela etapa
- [ ] Tracker atualiza quando agente confirma que etapa foi coberta
- [ ] Warning visual quando vendedor tenta pular etapa
- [ ] LeadCard atualiza após análise de card do CRM
- [ ] Seletor de produto funciona
- [ ] Layout responsivo

---

#### Task 10 — UI: Navegação e onboarding

**Objetivo:** O vendedor precisa saber qual agente usar e quando.

**Navegação:**
- Tab bar ou sidebar com: "SS (Prospecção)" e "Closer (Fechamento)"
- Badge indicando se há conversas em andamento em cada agente
- Transição suave entre agentes mantendo contexto do lead (se o mesmo lead passar de prospecção pra fechamento)

**Onboarding (primeira vez):**
- Tela simples explicando os 2 agentes:
  - "SS: Mande prints de perfis e conversas. Ele te ajuda a abrir portas."
  - "Closer: Mande o card do lead. Ele te guia pelo NPQC até o fechamento."
- Mostrar exemplos visuais de cada capability

**Gestão de Scripts:**
- Tela simples para vendedor cadastrar seus modelos de script
- CRUD básico: nome, tipo, conteúdo
- Scripts ficam disponíveis nos dropdowns dos agentes

**INPUT:** Páginas SS (Task 8) + Closer (Task 9)
**OUTPUT:** \`src/app/layout.tsx\` (navegação) + \`src/app/onboarding/page.tsx\` + \`src/app/scripts/page.tsx\`
**VERIFY:**
- [ ] Navegação entre SS e Closer funciona sem perder estado
- [ ] Onboarding aparece apenas na primeira visita
- [ ] CRUD de scripts funciona (criar, editar, deletar)
- [ ] Scripts aparecem no dropdown dos agentes
- [ ] Badge de conversa ativa funciona

---

### BLOCO 4: HARDENING (Tasks 11-13)

Qualidade, segurança e validação com o Rafa.

---

#### Task 11 — Qualidade do RAG: tuning dos prompts com dados reais

**Objetivo:** Os prompts da Task 2 são v1. Agora testamos com dados reais e ajustamos.

**Processo:**
1. Coletar 5 prints reais de perfis Instagram (variados: coach, SaaS, infoprodutor, e-commerce, serviço local)
2. Coletar 3 exemplos reais de objeções comuns
3. Coletar 2 cards reais de CRM
4. Rodar cada um pelos agentes
5. Rafael avalia: "A IA responderia o que eu responderia?"
6. Ajustar prompts baseado no feedback

**Critério do Rafa (Gold Standard):**
- Concordância > 80% com o que o Rafa diria
- Perguntas NPQC são "fortes" (na linguagem dele: "perguntas que doem")
- Abordagens são personalizadas (não genéricas)

**INPUT:** Dados reais + feedback do Rafael
**OUTPUT:** Prompts ajustados em \`src/lib/prompts/\` + relatório de tuning
**VERIFY:**
- [ ] 5 perfis Instagram analisados com resultado aprovado pelo Rafa
- [ ] 3 objeções quebradas com resultado aprovado
- [ ] 2 cards de lead analisados com resultado aprovado
- [ ] Perguntas NPQC de pelo menos 3 etapas aprovadas como "fortes"
- [ ] Prompts versionados (v1 → v2 com changelog do que mudou)

---

#### Task 12 — Segurança e RLS

**Objetivo:** Garantir isolamento de dados entre vendedores.

**Testes:**

| # | Ataque | Expected |
|---|--------|----------|
| 1 | Vendedor A lê conversations de B | Bloqueado por RLS |
| 2 | Vendedor A lê scripts de B | Bloqueado por RLS |
| 3 | Request sem auth em ss-agent | 401 |
| 4 | Request sem auth em closer-agent | 401 |
| 5 | Gestor vê conversations da equipe | Permitido |
| 6 | Gestor vê conversations de outra equipe | Bloqueado |

**INPUT:** Sistema completo
**OUTPUT:** \`tests/security/rls-audit.md\` + correções
**VERIFY:**
- [ ] Todos os 6 cenários passam
- [ ] Edge Functions validam auth em toda request

---

#### Task 13 — Teste end-to-end: jornada completa do vendedor

**Objetivo:** Simular um dia real de uso, da prospecção ao fechamento.

**Jornada:**

\`\`\`
1. Vendedor abre o SS
2. Seleciona canal: Instagram
3. Envia print do perfil do lead
   → Recebe análise + 3 opções de abertura
4. Escolhe abertura e envia
5. Lead responde com objeção: "Não conheço vocês"
6. Vendedor manda print da objeção
   → Recebe 3 opções de resposta
7. Lead engaja → Vendedor agenda call

--- TRANSIÇÃO ---

8. Vendedor abre o Closer
9. Envia print do card do lead no CRM
   → Recebe análise + gaps identificados
10. Tracker NPQC começa em Estrela Norte
11. Vendedor pede perguntas da etapa 1
    → Recebe perguntas personalizadas
12. Vendedor avança pelo NPQC (etapas 1→2→3→4)
13. Vendedor pede pitch do produto
    → Recebe pitch conectado com as dores mapeadas
14. Fechamento conduzido
\`\`\`

**INPUT:** Sistema completo + dados simulados
**OUTPUT:** \`tests/e2e/full-journey.test.ts\`
**VERIFY:**
- [ ] Jornada completa funciona sem erros
- [ ] Transição SS → Closer mantém contexto do lead
- [ ] NPQCTracker reflete progresso correto em cada etapa
- [ ] Respostas são consistentes ao longo da jornada (não contradizem entre etapas)
- [ ] Performance: resposta de cada agente < 10s
- [ ] Mobile: jornada funciona em tela 375px

---

## Grafo de Dependências

\`\`\`
Task 1 (System Prompts) ──┬──→ Task 4 (SS Edge Function) ──→ Task 8 (UI SS) ────────┐
                           │                                                           │
Task 2 (Prompts caps.) ───┤                                                           ├→ Task 10 (Navegação)
                           │                                                           │
Task 3 (Schema) ──────────┼──→ Task 5 (Closer Edge Function) → Task 9 (UI Closer) ──┘
                           │                                           │
                           └──→ Task 7 (AgentChat base) ──────────────┘
                           
Task 6 (Teste integração agentes) ← depende de Tasks 4 + 5
Task 11 (Tuning com Rafa) ← depende de Tasks 4 + 5 + dados reais
Task 12 (Segurança) ← depende de Tasks 3 + 4 + 5
Task 13 (E2E) ← depende de TUDO
\`\`\`

### Ordem de Execução

| Sprint | Tasks | Foco |
|--------|-------|------|
| 1 | 1, 2, 3 | Fundação: prompts + schema |
| 2 | 4, 5 | Backend: Edge Functions dos 2 agentes |
| 3 | 6 | Teste dos agentes com cenários reais |
| 4 | 7 | UI: componente de chat base |
| 5 | 8, 9 | UI: interfaces SS + Closer |
| 6 | 10 | UI: navegação + onboarding + scripts |
| 7 | 11, 12, 13 | Hardening: tuning + segurança + E2E |

---

## Prompts para Claude Code

### Prompt Único

\`\`\`
Leia o arquivo head-de-bolso.md na raiz do projeto. Este é o plano de produto aprovado.

Contexto técnico:
- Stack: Next.js App Router + Supabase (Edge Functions Deno + pgvector + Storage + Realtime)
- LLMs: Gemini 2.0 Flash (vision/multimodal) + GPT-4o (análise textual) + OpenAI embeddings
- JÁ EXISTE: Interface multimodal, RAG (Paiol), seletor de canal, Edge Functions base

Execute as 13 tasks na ordem dos sprints.
Para cada task:
1. Implemente conforme descrito
2. Rode TODOS os checks de VERIFY
3. Só avance se todos passarem

Trabalhe em português. Commite após cada sprint.
\`\`\`

---

## E o Módulo de Calls?

O Módulo de Calls (plano v2) continua válido como **produto separado**. Quando o Head de Bolso estiver em produção, o Calls será a próxima entrega. A boa notícia: a infraestrutura de RAG, prompts NPQC e schema que estamos construindo aqui será 100% reaproveitada.

Roadmap:
1. ✅ Head de Bolso (SS + Closer) ← ESTAMOS AQUI
2. ⬜ Plataforma de Calls + Análise
3. ⬜ Dashboard de Performance
4. ⬜ Feedback Loop (melhoria contínua do RAG)
