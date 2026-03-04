# Tasklist NextControl (Fases Q2 2026)

Este documento centraliza as tarefas acionáveis derivadas do `PLAN-next-phases.md`.

## Sprints Anteriores (Concluídos)
- [x] Sprint 1 (Google Drive / FFmpeg Client-Side)
- [x] Sprint 2 (Ajustes de UI / CRM / Checklist Seller)
- [x] Sprint 3 (Relatórios Diários, Semanais, Mensais)
- [x] Sprint 4 (Sanduíche, Agente de Bolso com contexto)
- [x] Sprint 6 (Beta Management e Feature Flags)

---

## 🎯 Fase 1: Expansão de Canais (Instagram + WhatsApp)

### 1.1 Integração Alphaflow (Instagram DMs)
- [ ] Pesquisar e documentar API do Alphaflow
- [ ] Criar UI `/seller/integrations` para OAuth do Instagram
- [ ] Criar tabela `instagram_connections` no Supabase
- [ ] Desenvolver Edge Function `instagram-webhook` para receber DMs
- [ ] Injetar DMs automaticamente no `pasted_messages` do Seller
- [ ] Dashboard de custos da API no Admin

### 1.2 Integração WhatsApp Web
- [ ] Definir arquitetura técnica (Chrome Extension vs Z-API)
- [ ] Criar UI de Sync de Conversas para o Closer
- [ ] Desenvolver Edge Function `analyze-text-chat`

---

## 🧠 Fase 2: Consultoria de Bolso 2.0 (Deep AI)

### 2.1 Alertas Proativos
- [ ] Criar CRON Job `daily-health-check` 
- [ ] Desenvolver lógica de queda de performance (>20% drop)
- [ ] Configurar disparo de Push/Email com Ação de Bolso

### 2.2 Dashboard "War Room" (Admin)
- [ ] Criar gráfico de Quadrantes (Esforço vs Conversão)
- [ ] Desenvolver tabela e lógica de `benchmarks` de mercado
- [ ] Criar widget vivo: "Top 5 Objeções da Semana"

---

## ⚙️ Fase 3: Automação e UX Refinements

### 3.1 Template Builder (Análises Customizadas)
- [ ] Criar tabela `analysis_templates`
- [ ] Desenvolver Editor Visual de Prompts no Admin
- [ ] Refatorar funções de análise para consumir templates dinâmicos

### 3.2 Novo Player de Áudio
- [ ] Desenvolver Componente Player Audio/Video
- [ ] Integrar Click-to-Seek (Transcrição -> Minuto do Áudio)
- [ ] Exibir Pinos de Gaps visuais na barra de progresso do áudio
