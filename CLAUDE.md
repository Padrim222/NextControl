# NEXT CONTROL — CLAUDE.md

## Visão Geral
Sistema de gestão de conteúdo e marketing para negócios locais. Permite que clientes enviem materiais (fotos, vídeos, textos) e recebam conteúdo processado por IA de volta via WhatsApp.

**Status:** ~70% completo
**Owner:** Bruno (@cigano.agi) — Gypsi Company
**Venture Partner:** Rafael Yorik
**Time dev:** Bruno + Guilherme (Gui é single point of failure — dev, CS e management)

---

## Stack Completa

### Frontend
- **React 18** + **TypeScript 5.8** + **Vite 5**
- **Tailwind CSS 3** + `tailwindcss-animate`
- **shadcn/ui** (Radix UI primitives + CVA + cmdk + vaul + sonner)
- **Framer Motion** — animações
- **Recharts** — gráficos/dashboards
- **React Hook Form + Zod** — formulários tipados
- **React Router DOM 6** — SPA com rotas protegidas
- **TanStack React Query 5** — data fetching/caching
- **date-fns** — manipulação de datas
- **jsPDF + html2canvas-pro** — exportação PDF
- **@ffmpeg/ffmpeg** — processamento de áudio client-side

### Backend
- **Supabase** (projeto: `mldbflihdejmddmapwnz`)
- Auth via Supabase Auth
- Storage para uploads
- 15 Edge Functions (Deno/TypeScript)
- Migrations versionadas

### IA
- Gemini (processamento de conteúdo)
- GPT-4o (geração de texto/copy)

### Testing
- **Vitest** + **@testing-library/react** + **jsdom**

---

## Estrutura do Projeto

```
src/
├── components/          # 83+ componentes
│   ├── admin/           # AdminFormPanel, ClientMaterialsPanel, HeadAgentPanel, ImprovementChecklist, StrategistPanel
│   ├── analysis/        # SandwichAnalysisView
│   ├── calls/           # CallUploadCard, VideoUploader
│   ├── charts/          # FunnelChart
│   ├── client/          # ProjectTimeline
│   ├── closer/          # CallReportCard, CloserInsightsWidget
│   ├── forms/           # FormIdentification, FormPendingBanner, FormWizard, PublicFormLayout
│   ├── layout/          # DashboardLayout, MobileBottomNav, PageTransition, RoleGuard
│   ├── reports/         # MonthlyReportViewer
│   ├── seller/          # AIFeedbackDisplay, DailyCheckinWizard, DailyProgressCard, SellerPlaybook, StrategyAnalytics, SubmissionTimeline
│   └── ui/              # shadcn/ui components (button, card, dialog, toast, etc.)
├── contexts/
│   └── AuthContext.tsx   # Autenticação global via Supabase Auth
├── hooks/
│   ├── use-mobile.tsx    # Detecção de viewport mobile
│   └── use-toast.ts      # Hook do sistema de toast
├── lib/
│   ├── supabase.ts       # Cliente Supabase singleton
│   ├── utils.ts          # Helpers (cn, etc.)
│   ├── audio-extractor.ts # Extração de áudio via FFmpeg
│   ├── formSubmission.ts  # Lógica de envio de formulários
│   ├── pdf-export.ts      # Exportação de relatórios PDF
│   ├── sandwich-templates.ts # Templates método sanduíche
│   └── urlValidation.ts  # Validação de URLs
├── pages/
│   ├── admin/            # AdminDashboard, AdminManage, BetaManagement, CallsPipeline, RagManager
│   ├── auth/             # Login, Register
│   ├── client/           # ClientDashboard, WeeklyReportPage
│   ├── closer/           # CallAnalysis, CloserDashboard
│   ├── cs/               # CSInbox
│   ├── forms/            # CloserForm, ExpertForm, SellerForm, FormSuccess
│   ├── seller/           # SellerDashboard, DailyReport, WeeklyEvolution
│   └── training/         # CoachChat, TrainingHub
├── test/                 # Testes
└── types/
    ├── database.types.ts  # Tipos gerados do Supabase
    ├── forms.ts           # Tipos de formulários
    └── index.ts           # Tipos exportados

supabase/
├── config.toml
├── functions/            # 15 Edge Functions
│   ├── analyze-call/
│   ├── analyze-form-submission/
│   ├── analyze-submission/
│   ├── auto-training-materials/
│   ├── coach-chat/
│   ├── deliver-report/
│   ├── generate-monthly-report/
│   ├── generate-report/
│   ├── generate-weekly-report/
│   ├── head-agent/
│   ├── notify-client/
│   ├── process-upload/
│   ├── rag-auto-update/
│   ├── sync-respondi/
│   └── transcribe-audio/
└── migrations/
    └── 20260211123500_conselho_ry_schema.sql
```

---

## Comandos

```bash
npm run dev          # dev server (Vite)
npm run build        # build produção
npm run lint         # ESLint
npm run test         # Vitest (run once)
npm run test:watch   # Vitest (watch mode)
npx supabase functions serve <nome>   # Edge Function local
npx supabase gen types typescript     # Regenerar tipos do banco
```

---

## Convenções de Código

### TypeScript
- Sempre tipar, NUNCA usar `any`
- Interfaces prefixadas com `I` (ex: `IClient`, `IMaterial`)
- Enums em UPPER_SNAKE_CASE
- Componentes funcionais com hooks

### React
- Um componente por arquivo
- Hooks customizados em `/hooks`
- Contexts em `/contexts`
- Pages em `/pages`, components em `/components`
- Data fetching com TanStack React Query (useQuery/useMutation)
- Forms com React Hook Form + Zod schema validation

### Supabase
- Edge Functions em **Deno** TypeScript (NÃO Node.js)
- RLS (Row Level Security) OBRIGATÓRIO em todas as tabelas
- Migrations versionadas — NUNCA alterar uma já aplicada
- Client Supabase em `src/lib/supabase.ts`

### Git
- Commits em português, prefixados: `feat:`, `fix:`, `refactor:`, `docs:`
- Branch principal: `main`
- Feature branches: `feat/nome-da-feature`

---

## Arquitetura do Banco (Supabase)

### Tabelas principais
- `clients` — cadastro de clientes/negócios
- `client_materials` — materiais enviados pelos clientes (fotos, vídeos, textos)
- `call_uploads` — uploads vindos de chamadas/pipeline de processamento
- `content_outputs` — conteúdo gerado pela IA pronto pra entrega
- `subscriptions` — planos e pagamentos

### Relacionamentos-chave
- `clients` → `client_materials` (1:N)
- `clients` → `subscriptions` (1:N)
- `client_materials` → `content_outputs` (1:N via processamento IA)
- `call_uploads` → pipeline de processamento

### Roles (autenticação)
O sistema usa roles: `admin`, `seller`, `closer`, `client`, `cs`
Cada role tem acesso a páginas específicas, controlado pelo `RoleGuard` component.

---

## GAPS CRÍTICOS (prioridade de resolução)

### 1. 🔴 RLS OFF em `client_materials` — SEGURANÇA
- **Problema:** Row Level Security desabilitada — qualquer user autenticado vê materiais alheios
- **Ação:** Criar policies de RLS baseadas no `client_id` do usuário autenticado
- **Prioridade:** URGENTE — antes de qualquer outra feature

### 2. 🟡 Pipeline `call_uploads` parcial
- **Problema:** Pipeline de processamento nunca completou um ciclo ponta a ponta
- **Ação:** Debugar: upload → `process-upload` → `transcribe-audio` → `analyze-call` → content_output
- **Prioridade:** Alta — é o core do produto

### 3. 🟡 Painel do Cliente incompleto
- **Problema:** Interface do lado do cliente não está funcional
- **O que falta:** Tela de upload de materiais, visualização de conteúdo gerado, status do processamento
- **Ação:** Completar rotas e componentes do painel do cliente
- **Prioridade:** Alta — sem pipeline, não tem o que mostrar

### 4. 🟠 Entrega via WhatsApp incerta
- **Problema:** Integração WhatsApp para entrega de conteúdo não confirmada
- **Ação:** Validar se `notify-client` Edge Function funciona, testar com número real
- **Prioridade:** Média — depende do pipeline funcionar primeiro

---

## Edge Functions — Mapa de Responsabilidades

| Function | Responsabilidade |
|---|---|
| `analyze-call` | Análise de chamadas de vendas com IA |
| `analyze-form-submission` | Processar respostas de formulários |
| `analyze-submission` | Análise genérica de submissões |
| `auto-training-materials` | Geração automática de materiais de treino |
| `coach-chat` | Chat de coaching IA (Treinador de Bolso) |
| `deliver-report` | Entrega de relatórios |
| `generate-monthly-report` | Relatórios mensais |
| `generate-report` | Geração genérica de relatórios |
| `generate-weekly-report` | Relatórios semanais |
| `head-agent` | Agente principal de processamento IA |
| `notify-client` | Notificação ao cliente (WhatsApp?) |
| `process-upload` | Processamento de uploads de materiais |
| `rag-auto-update` | Atualização automática da base RAG |
| `sync-respondi` | Sincronização com Respondi (formulários) |
| `transcribe-audio` | Transcrição de áudio para texto |

---

## Regras Importantes

- NUNCA alterar migrations já aplicadas — sempre criar nova migration
- NUNCA expor service_role key no frontend
- Testar Edge Functions localmente antes de deploy: `npx supabase functions serve <nome>`
- Ao criar novas tabelas, SEMPRE incluir RLS policies
- Não instalar dependências sem confirmar com o dev (Bruno ou Gui)
- Arquivos `.env` são SOMENTE LEITURA — não alterar, não exibir

---

## Workflow de Desenvolvimento

1. Criar branch `feat/nome`
2. Implementar com testes mínimos
3. Testar localmente (`npm run dev` + `npm run test`)
4. PR → review → merge → deploy

---

## O que NÃO fazer

- Não refatorar código que está funcionando sem pedir
- Não criar arquivos de teste extensivos sem solicitação
- Não alterar configurações do Supabase (auth, storage buckets) sem confirmar
- Não fazer `supabase db push` sem aprovação explícita
- Não mexer em `.env` ou arquivos de credenciais
- Não fazer deploy de Edge Functions sem aprovação
