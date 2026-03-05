# Tasklist NextControl — Backlog Completo
> **Última atualização:** 2026-03-04 18h05 | **Origem:** Call de revisão da plataforma com time NEXTBASE

---

## ✅ P0 — BUGS CRÍTICOS (RESOLVIDOS em 04/03)

- [x] **[ADMIN]** Submissões não funcionam no painel admin — ✅ Criada Edge Function `analyze-form-submission` + modal de detalhes no AdminFormPanel
- [x] **[ADMIN]** Bug do print/evidências: URL lovable.app — ✅ Validação de URL no AdminDashboard + CSInbox (prints mock mostram "Indisponível")
- [x] **[SELLER]** Erro ao enviar resumo da semana — ✅ Validação step-by-step no ExpertForm (canProceed por step)
- [x] **[SELLER/CS]** Consultoria de bolso mock — ✅ Removido fallback mock do CoachChat, agora mostra erro real quando API key ausente
- [x] **[SELLER/CS]** Gravação de áudio — ✅ Edge function `transcribe-audio` atualizada para formato moderno + mensagens de erro claras
- [x] **[ADMIN]** Estrategista Yorik genérico — ✅ Reescrito StrategistPanel para usar IA real via edge function `coach-chat`
- [x] **[COACH]** API key do Coach — ✅ Código pronto. **⚠️ AÇÃO MANUAL:** Adicionar `OPENROUTER_API_KEY` nos secrets do Supabase (Dashboard > Edge Functions > Secrets)
- [x] **[UPLOAD]** Upload de prints/calls usava edge function instável — ✅ DailyCheckinWizard + formSubmission.ts agora usam Supabase Storage direto

---

## 🟠 P1 — FEATURES DE ALTO IMPACTO

### 🧑 Seller
- [x] Melhorar painel de "Métricas do Dia" com insights proativos (ex: *"Esta semana está com baixo volume de pitchs — consulte o Coach!"*) — ✅ Feito (Banner dinâmico IA)
- [x] Ajustar estrutura do relatório diário: novos seguidores, conversas iniciadas, oportunidades, follow-ups, objeções, qualidade, anexos — ✅ Feito
- [x] Implementar campo para prints do CRM e texto/prints de conversas no check-in diário — ✅ Feito
- [x] Melhorar visual dos botões de adicionar/remover (muito pequenos — especialmente no Seller) — ✅ Feito
- [x] Ajustar tempo estimado de preenchimento para 3 minutos — ✅ Feito
- [x] Criar **Blacklist de abordagens** que não funcionaram (para evitar repetição) — ✅ Feito (Check-in Sync)
- [x] Criar **Acervo de Scripts** onde Seller salva manualmente o que está funcionando — ✅ Feito (Check-in Sync)
- [x] Tirar a taxa de conversão do check-in do **Closer** para simplificar — ✅ Removido do Seller e Closer Forms

### 🔐 Admin
- [x] Adicionar documentos na **Base RAG** para que o Estrategista Yorik responda com contexto do cliente — ✅ Feito
- [x] Criar opção no Admin para enviar materiais (vídeos, áudios, documentos) diretamente ao cliente (substitui grupo de WhatsApp) — ✅ Feito (ClientMaterialsPanel)
- [x] Implementar **campo de upload de materiais** na base de conhecimento do cliente (RAG embedado) — ✅ Feito
- [x] Integrar IA Gemini 2.0 na **Consultoria de Bolso** com contexto de métricas reais — ✅ Feito (Edge Function coach-chat)

### 👤 Cliente
- [x] Na aba "Meu Plano", o cliente pode clicar e ver exatamente o que foi passado no onboarding com o Rafael (fase atual, próxima etapa, o que implementar) — ✅ Feito (via aba Meu Plano)
- [x] Botão de **voltar** na tela de relatório semanal — ✅ Atualizado navegação direta
- [x] Seção de **Materiais de Treinamento** completa: materiais de onboarding enviados pelo Admin exibidos ali — ✅ Feito

### 🔗 Closer
- [x] Widget de insights de **Follow-up** (ex: *"Você conversou com Fulano em XX/XX — hora do FUP!"*) — ✅ CloserInsightsWidget ativado com botão "Agendar" funcional
- [x] Filtros de feedback por **mês** (além do semanal atual) — ✅ Filtro de tempo já aplicava a análises via chain de submission_id. Confirmado.

---

## 🟡 P2 — FEATURES MÉDIAS

### Formulário e Onboarding
- [ ] Atualizar modelo e formulário do cliente para incluir todas as seções (Fórmula X, Fase-Empresa, Bloco 1, Bloco 2, Bloco 3)
- [ ] Bloco 3 (Posicionamento e Decisão Estratégica) deve corresponder ao modelo do Curso
- [ ] Transformar formulário atual no **documento de onboarding completo** (19 páginas do Rafael)
- [x] Configurar **webhook do Respondi** — ✅ Edge function `sync-respondi` v1 deployada (verify_jwt: false). **⚠️ AÇÃO MANUAL:** Configurar URL no Respondi.co

### Automação e Inteligência
- [ ] Sistema para analisar **taxa de passagem** e identificar modelos de abordagem mais eficazes (A vs B)
- [ ] Atualização da base de conhecimento a **cada 15 dias** automaticamente com documentos acumulados
- [x] Materiais de Treinamento devem se **retroalimentar** — ✅ Edge function `auto-training-materials` v1 deployada. Agrupa Q&A por tema e gera materiais automáticos.

### Design e Front-end
- [ ] Finalizar **melhorias visuais** do front-end antes de produzir conteúdo e gerar demanda
- [ ] Revisão geral de **dinamismo e qualidade visual** do site público

---

## 🔵 P3 — ROADMAP ESTRATÉGICO (Próximas Fases)

### Fase 1: Expansão de Canais
- [ ] Integração **Alphaflow** (Instagram DMs → `pasted_messages` automático)
- [ ] Integração **WhatsApp Web** (Chrome Extension ou Z-API / Evolution API)
- [ ] Edge Function `analyze-text-chat`

### Fase 2: Consultoria de Bolso 2.0
- [ ] CRON Job `daily-health-check` com alertas de queda >20%
- [ ] Dashboard **War Room** (quadrantes Esforço vs Conversão, Top 5 Objeções)
- [ ] Benchmark de mercado por nicho

### Fase 3: UX Refinements
- [ ] Template Builder de análises (SPIN Selling, BANT, Challenger Sale)
- [ ] Player de áudio com Click-to-Seek e pinos visuais de Gaps

---

## ✅ Sprints Concluídos
- [x] Sprint 1 — Pipeline de Calls (FFmpeg.wasm Client-Side)
- [x] Sprint 2 — Ajustes de UI / CRM / Checklist Seller
- [x] Sprint 3 — Relatórios Diários, Semanais e Mensais
- [x] Sprint 4 — Formato Sanduíche + Agente de Bolso com contexto
- [x] Sprint 6 — Beta Management e Feature Flags
