# ROADMAP: NextControl — Próximas Fases (Q2 2026)

> **Status Atual:** Sprints 1 a 4 e 6 (Google Drive/FFmpeg, Aprovações, Relatórios Multi-Nível, Sanduíche, Beta) entregues com sucesso. 
> **Foco Atual:** Expandir a plataforma para integrações externas (Instagram), deep analytics e automações preditivas.

---

## 🎯 Fase 1: Expansão de Canais (Instagram + WhatsApp)
*O objetivo desta fase é trazer os canais onde a venda realmente acontece para dentro do ecossistema de dados da NextControl, eliminando o "copiar e colar" manual dos vendedores.*

### 1.1 Integração Alphaflow (Instagram DMs)
- [ ] **Pesquisa API:** Mapear a documentação do Alphaflow.
- [ ] **Auth Flow:** Criar página `/seller/integrations` com OAuth/Login para o vendedor conectar a própria conta do Instagram.
- [ ] **Tabela `instagram_connections`:** Salvar credenciais/tokens com RLS (Row Level Security).
- [ ] **Webhook Receiver (`instagram-webhook`):** Edge Function para receber DMs em tempo real.
- [ ] **Auto-Log:** Injetar DMs automaticamente no campo `pasted_messages` do Daily Report do vendedor.
- [ ] **Billing Control:** Criar painel Admin para rastrear custos de API do Alphaflow por cliente.

### 1.2 Integração WhatsApp Web (Chrome Extension / Webhook)
- [ ] **Mapeamento Técnico:** Decidir entre extensão do Chrome (raspagem local amigável) ou provedor oficial (Z-API, Evolution API).
- [ ] **Sync de Conversas:** Botão mágico no WhatsApp Web para "Enviar para NextControl" analisando a conversa atual com 1 clique vs. Auto-Sync.
- [ ] **Análise Direta:** Edge function `analyze-text-chat` (similar a analisar calls, mas focada em gatilhos de texto).

---

## 🧠 Fase 2: Consultoria de Bolso 2.0 (Deep AI)
*Agora que o Coach Chat tem contexto das métricas diárias, precisamos torná-lo ativo e não apenas passivo (reativo).*

### 2.1 Alertas Proativos (Push/Email)
- [ ] **Trigger Diário:** Job CRON rodando todo fim de tarde para analisar a meta do Closer.
- [ ] **Notificações:** Se a métrica cair >20% da média móvel, o Coach envia um alerta (via push no app ou email) com o diagnóstico e 1 ação imediata.

### 2.2 Dashboard "War Room" (Visão Macro do C-Level)
- [ ] **Comparativo de Sellers:** Gráfico de quadrantes (Esforço vs. Conversão) mostrando quem é o Top Performer e quem precisa de ajuda urgente.
- [ ] **Tabela `benchmarks`:** A IA calcula e expõe a média do mercado/nicho do cliente vs. os resultados atuais da operação dele.
- [ ] **Filtro de Objeções:** Um ranking vivo das Top 5 objeções mais ouvidas nas calls da última semana (extraído via Whisper + Gemini de todas as calls da empresa).

---

## ⚙️ Fase 3: Automação e UX Refinements
*Polimento da plataforma para reduzir fricção, velocidade e escalabilidade.*

### 3.1 Template Builder (Formatos de Análise Customizáveis)
- [ ] **Admin UI:** Interface para o Admin (Jô/Ronny) criarem novos formatos de análise além do "Sanduíche" (ex: SPIN Selling, BANT, Challenger Sale).
- [ ] **Prompts Dinâmicos:** As Edge Functions de análise devem buscar o prompt matriz no banco de dados (`analysis_templates`) em vez de estarem hardcoded no código TypeScript.

### 3.2 Melhorias de UX no Player de Call
- [ ] **Audio/Video Player Dinâmico:** Se o upload for MP3 (gerado pelo FFmpeg), a tela de Review Admin mostra um player de áudio com as `timestamps` marcadas onde a IA detectou os Gaps.
- [ ] **Click-to-Seek:** Clicar num trecho da transcrição pula o Player para o minuto exato do áudio.

---

## 🛠️ Arquitetura Necessária

**Tabelas Novas:**
- `instagram_connections` (id, seller_id, token, status)
- `analysis_templates` (id, name, system_prompt_structure, is_active)
- `benchmarks` (id, niche, metric_name, value, updated_at)

**Edge Functions Novas/Alteradas:**
- `instagram-connect`
- `instagram-webhook`
- `analyze-text-chat`
- `daily-health-check` (CRON)

---

> **Ação Imediata:** Aprovar os próximos Sprints (Fases 1, 2 e 3 acima) com o Rafael/Jô/Ronny antes de iniciar o código. O módulo do Alphaflow (Instagram) seria o ponto de partida lógico.
