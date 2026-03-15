# HANDOFF PARA ANTIGRAVITY — NextControl
> **De:** Claude Sonnet 4.6 (sessão ativa)
> **Para:** Agente Antigravity (próxima sessão / instância paralela)
> **Data:** 2026-03-15
> **Status do MCP Supabase:** ✅ CONECTADO (projeto mldbflihdejmddmapwnz)

---

## CONTEXTO DO PROJETO

NextControl é um sistema de gestão de vendas/conteúdo B2B. Stack: React 18 + TypeScript + Vite + Supabase + shadcn/ui + Tailwind CSS. Working dir: `c:/Users/Fabricio Padrin/OneDrive/Documentos/NEXT CONTROL/NextControl`

---

## O QUE EU JÁ FIZ

1. Varredura completa do codebase via explorer-agent
2. Consultei o banco via MCP (`list_tables` + `list_migrations`)
3. Criei `docs/PLAN-orchestration-fix.md` com os sprints planejados
4. Identifiquei os problemas críticos listados abaixo

---

## ESTADO REAL DO BANCO (confirmado via MCP 2026-03-15)

### Tabelas que EXISTEM no DB:
`users`, `clients`, `call_uploads`, `call_logs`, `call_evaluations`, `daily_submissions`, `analyses`, `ai_feedback`, `weekly_analysis_reports`, `rag_documents`, `agent_suggestions`, `training_materials`, `client_questions`, `form_submissions`, `client_onboarding`

### Tabelas que NÃO EXISTEM no DB (mas o código usa):
| Tabela | Usada em | Urgência |
|---|---|---|
| `content_outputs` | ClientDashboard, futura entrega de conteúdo | 🔴 URGENTE — migration existe mas não foi aplicada |
| `reports` | ClientDashboard linha 157, AdminDashboard | 🔴 URGENTE |
| `client_materials` | ClientMaterialsPanel, AdminDashboard, ClientDashboard | 🔴 URGENTE |
| `seller_scripts` | SellerPlaybook | 🟠 Alta |
| `agent_conversations` | CoachChat, DailyCheckinWizard | 🟠 Alta |
| `material_chunks` | pgvector/RAG | 🟠 Alta |

### Migration pendente (arquivo local existe, não foi aplicada):
- `supabase/migrations/20260313000000_create_content_outputs.sql`

### Últimas migrations aplicadas no banco:
- `20260313154131` — fix_rls_client_materials
- `20260313154413` — **rollback_next_control_tables** ← isso pode ter dropado client_materials, seller_scripts, etc
- `20260313172346` — create_client_onboarding_table
- `20260313222028` — nextcontrol_001_core_tables
- `20260313222131` — nextcontrol_002_rag_and_suggestions
- `20260313222248` — nextcontrol_003_rls_consolidated
- `20260313234114` — maintenance_mode_rpc

---

## PROBLEMAS CRÍTICOS IDENTIFICADOS

### 🔴 1. `database.types.ts` completamente desatualizado
**Arquivo:** `src/types/database.types.ts`
**Problema:** Só tem 6 tabelas tipadas. O banco tem 20+ tabelas do NextControl. Isso força `(supabase as any)` em 90+ lugares em 24 arquivos.
**Solução:** Usar MCP `generate_typescript_types` e sobrescrever o arquivo.

### 🔴 2. Bug de segurança — `reports` sem filtro por cliente
**Arquivo:** `src/pages/client/ClientDashboard.tsx` linhas 157-161
**Problema:** A query busca todos os relatórios com `status='delivered'` sem filtrar por `client_id`. Qualquer cliente autenticado vê relatórios de outros.
**Solução:**
```ts
// ANTES (BUG)
.from('reports').select('id, status, pdf_url, created_at, review_notes')
.eq('status', 'delivered')

// DEPOIS
.from('reports').select('id, status, pdf_url, created_at, review_notes')
.eq('client_id', clientId)
.eq('status', 'delivered')
```

### 🔴 3. Tabelas críticas não existem no banco
**Problema:** `client_materials`, `reports`, `content_outputs` são usadas no código mas não existem no banco (após o rollback de 2026-03-13).
**Solução:** Aplicar `content_outputs` via MCP e criar migrations para as demais com `CREATE TABLE IF NOT EXISTS`.

### 🟠 4. `logout` causa reload desnecessário
**Arquivo:** `src/contexts/AuthContext.tsx`
**Problema:** `window.location.href = '/'` ao invés de `navigate('/')`.
**Solução:** Usar React Router navigate.

### 🟠 5. Código morto — `src/app/`
**Problema:** 4 arquivos em estrutura Next.js não registrados no React Router.
**Arquivos:**
- `src/app/closer/page.tsx`
- `src/app/scripts/page.tsx`
- `src/app/ss/page.tsx`
- `src/app/onboarding/page.tsx`
**Solução:** Deletar ou mover para `archive/`.

### 🟡 6. Migrations avulsas em `src/lib/`
**Problema:** 8 arquivos SQL em `src/lib/` fora do diretório oficial.
**Solução:** Mover para `supabase/migrations/archive/`.

---

## DIVISÃO DE TRABALHO PROPOSTA

### Claude faz (nesta sessão, com MCP conectado):
- [ ] Aplicar migration `content_outputs` via MCP
- [ ] Regenerar `database.types.ts` via MCP `generate_typescript_types`
- [ ] Fix bug de segurança em `ClientDashboard.tsx` (linha 157-161)
- [ ] Fix `AuthContext.tsx` logout

### Antigravity faz (sua sessão):
- [ ] Criar migration para `client_materials` (com RLS) — verificar estrutura no código e recriar
- [ ] Criar migration para `reports` (com RLS)
- [ ] Tipar `materials: any[]` e `contents: any[]` em `ClientDashboard.tsx` após tipos regenerados
- [ ] Limpar `src/app/` (código morto)
- [ ] Mover migrations avulsas de `src/lib/` para `supabase/migrations/archive/`
- [ ] Verificar se pipeline `call_uploads` funciona end-to-end

---

## COMO USAR O MCP SUPABASE

O MCP já está conectado na sessão do Claude. Se tiver na tua sessão também:

```
# Listar tabelas
mcp__supabase__list_tables({ schemas: ["public"], verbose: true })

# Aplicar migration
mcp__supabase__apply_migration({ name: "nome_migration", query: "SQL..." })

# Gerar tipos
mcp__supabase__generate_typescript_types()
```

---

## REGRAS DO PROJETO (NÃO VIOLAR)

1. NUNCA alterar migrations já aplicadas — sempre criar nova
2. NUNCA expor service_role key no frontend
3. Ao criar tabelas, SEMPRE incluir RLS policies
4. Usar `CREATE TABLE IF NOT EXISTS` para tabelas que podem existir
5. Não instalar dependências sem confirmar
6. Não fazer deploy de Edge Functions sem aprovação
7. `.env` é SOMENTE LEITURA

---

## ARQUIVOS CHAVE

| Arquivo | Responsabilidade |
|---|---|
| `src/types/database.types.ts` | Tipos do banco — REGENERAR via MCP |
| `src/contexts/AuthContext.tsx` | Auth global — fix logout |
| `src/pages/client/ClientDashboard.tsx` | Painel cliente — fix security bug |
| `src/pages/admin/CallsPipeline.tsx` | Pipeline calls — verificar |
| `src/components/admin/ClientMaterialsPanel.tsx` | Upload materiais — depende de client_materials existir |
| `supabase/migrations/` | Migrations versionadas |
| `docs/PLAN-orchestration-fix.md` | Plano completo dos sprints |

---

## ESTADO DO GIT

Branch: `main`
Arquivos modificados (não commitados):
- `src/pages/admin/CallsPipeline.tsx`
- `src/pages/client/ClientDashboard.tsx`
- `supabase/migrations/20260313000000_create_content_outputs.sql`
- `.env`

---

## PRÓXIMO PASSO RECOMENDADO

1. Verificar estrutura das tabelas faltantes via `verbose: true` no `list_tables` de tabelas similares
2. Criar migration consolidada para `client_materials` e `reports`
3. Após Claude regenerar os tipos, tipar os componentes críticos
