# NEXT CONTROL — Plano de Produção

**Data:** 2026-03-23 | **Status:** Aguardando aprovação
**Objetivo:** Varredura total → consistência → produção

---

## FASE 1 — Segurança & Bugs Críticos
> Nada vai a produção sem isso resolvido

### 1.1 [CRÍTICO] Edge Function com nome errado
- **Arquivo:** `src/lib/formSubmission.ts:79`
- **Problema:** `functions.invoke('analyze-form', ...)` — função se chama `analyze-form-submission`
- **Ação:** Corrigir o nome. Pipeline de formulários públicos (SellerForm, CloserForm, ExpertForm) está completamente quebrado.
- **Complexidade:** P

### 1.2 [CRÍTICO] ThemeProvider ausente no App.tsx
- **Arquivo:** `src/App.tsx`
- **Problema:** `ThemeProvider` existe em `src/contexts/ThemeContext.tsx` mas não está no tree de providers. `useTheme()` explode em runtime.
- **Ação:** Adicionar `<ThemeProvider>` como wrapper em `App.tsx` ou remover `ThemeToggle` de toda a UI.
- **Complexidade:** P

### 1.3 [ALTO] URL do Supabase hardcoded no bundle
- **Arquivos:**
  - `src/pages/admin/CallsPipeline.tsx:357`
  - `src/pages/admin/AdminDashboard.tsx:590`
  - `src/pages/cs/CSInbox.tsx:216`
- **Problema:** Fallback `|| 'https://mldbflihdejmddmapwnz.supabase.co'` expõe Project ID no JS compilado
- **Ação:** Remover os fallbacks — usar apenas `import.meta.env.VITE_SUPABASE_URL`
- **Complexidade:** P

### 1.4 [ALTO] Senha padrão hardcoded
- **Arquivo:** `src/pages/admin/AdminManage.tsx:145,431,472`
- **Problema:** `'NextControl2026!'` literal no código-fonte (visível no bundle)
- **Ação:** Gerar senha aleatória com `crypto.randomUUID()` ou exigir que o admin defina
- **Complexidade:** P

### 1.5 [ALTO] Register público com roles privilegiadas
- **Arquivo:** `src/pages/auth/Register.tsx`
- **Problema:** Qualquer pessoa pode se cadastrar como `seller`, `closer` ou `cs`
- **Ação:** Remover roles privilegiadas do dropdown público — só `client` se auto-cadastra, resto é criado pelo admin
- **Complexidade:** P

### 1.6 [ALTO] non-null assertion sem proteção
- **Arquivo:** `src/pages/client/AgentPage.tsx:177`
- **Problema:** `supabase!.functions.invoke(...)` — explode se env vars não configuradas
- **Ação:** Adicionar guard `if (!supabase)` antes da chamada
- **Complexidade:** P

---

## FASE 2 — Consistência de Código
> TypeScript sem `any`, código limpo

### 2.1 [ALTO] Regenerar tipos do banco
- **Arquivo:** `src/types/database.types.ts`
- **Problema:** ~120 ocorrências de `(supabase as any)` porque tipos estão desatualizados
- **Ação:** `npx supabase gen types typescript --project-id mldbflihdejmddmapwnz > src/types/database.types.ts`
- **Complexidade:** P (mas desbloqueia muito da fase 2.2)

### 2.2 [ALTO] Eliminar `as any` em massa nos arquivos mais críticos
- **Arquivos prioritários:**
  - `src/pages/client/ClientDashboard.tsx` (15+ ocorrências)
  - `src/pages/admin/AdminDashboard.tsx` (12+ ocorrências)
  - `src/pages/cs/CSInbox.tsx` (10+ ocorrências)
  - `src/components/seller/DailyCheckinWizard.tsx` (8+ ocorrências)
- **Ação:** Após regenerar tipos (2.1), substituir casts por tipos corretos
- **Complexidade:** G

### 2.3 [MÉDIO] Dead code — componentes órfãos
- **Arquivos para deletar:**
  - `src/components/chat/AgentChat.tsx` — nunca importado
  - `src/components/DashboardLayout.tsx` (raiz) — versão antiga
  - `src/components/AppSidebar.tsx` — só usado pelo órfão acima
  - `src/components/NavLink.tsx` — nunca importado
  - `src/pages/Index.tsx` — placeholder sem rota
  - `src/_archive_app/` — arquivos arquivados no src ativo
- **Ação:** Deletar todos
- **Complexidade:** P

### 2.4 [MÉDIO] Dead code — imports e rotas
- **Arquivo:** `src/App.tsx`
- **Problema:** `WeeklyReportPage` importado mas rota redireciona para `/agent`
- **Ação:** Remover import e decidir: manter rota real ou remover
- **Complexidade:** P

### 2.5 [MÉDIO] Dead code em Edge Function
- **Arquivo:** `supabase/functions/transcribe-audio/index.ts:63-71`
- **Problema:** Bloco `else if (openRouterKey)` computa dados e imediatamente lança erro
- **Ação:** Remover bloco
- **Complexidade:** P

### 2.6 [BAIXO] Console.logs de debug
- **Problema:** 56 ocorrências de `console.*` — separar logging legítimo de debug
- **Ação:** Auditar e remover `console.log` de debug; manter `console.error` em catch blocks
- **Complexidade:** M

---

## FASE 3 — UX & Completude
> Painéis incompletos, flows quebrados

### 3.1 [ALTO] Onboarding duplicado e sem rota
- **Arquivos:**
  - `src/pages/client/OnboardingForm.tsx` (841 linhas, sem rota)
  - `src/components/wizard/OnboardingWizard.tsx`
  - Versão inline em `AgentPage.tsx:51`
- **Ação:** Definir UMA versão canônica, rotear corretamente, eliminar duplicatas
- **Complexidade:** G

### 3.2 [ALTO] Painel do cliente incompleto
- **Arquivo:** `src/pages/client/ClientDashboard.tsx` (1032 linhas)
- **Problema:** Upload de materiais, visualização de content_outputs e status de processamento incompletos
- **Ação:** Completar os 3 fluxos; split em sub-componentes
- **Complexidade:** G

### 3.3 [MÉDIO] Pipeline call_uploads — validar end-to-end
- **Fluxo:** upload → `process-upload` → `transcribe-audio` → `analyze-call` → `deliver-report`
- **Ação:** Testar com arquivo real; mapear onde quebra; corrigir
- **Complexidade:** M

---

## FASE 4 — Email & Integrações

### 4.1 [MÉDIO] Email sender de sandbox
- **Arquivo:** `supabase/functions/notify-client/index.ts:92`
- **Problema:** `from: 'onboarding@resend.dev'` e link `nextbase360.com`
- **Ação:** Configurar domínio verificado no Resend; atualizar URL para domínio real
- **Complexidade:** P

### 4.2 [MÉDIO] URLs `nextbase360.com` em 8 Edge Functions
- **Ação:** Atualizar `HTTP-Referer` para domínio real da aplicação
- **Complexidade:** P

---

## FASE 5 — SQLs & Migrations (EXECUÇÃO MANUAL)
> ⚠️ Nunca automatizado — usuário executa manualmente via dashboard Supabase

### 5.1 Confirmar RLS em `client_materials`
- **Migration:** `supabase/migrations/20260311000858_fix_rls_client_materials.sql`
- **Ação:** Verificar se foi aplicada no remote. Se não, aplicar via dashboard.

### 5.2 Reconciliar migrations locais vs remote
- **Problema:** Remote tem 16+ migrations que não estão no repo local
- **Ação:** `supabase db pull` para sincronizar; revisar diff

---

## FASE 6 — Testes E2E no Browser
> Após todas as SQLs executadas — usuário libera o browser

### Roteiro por role:

| Role | Fluxos a testar |
|------|-----------------|
| `admin` | Dashboard, criar user/client, CallsPipeline, RagManager |
| `seller` | SellerDashboard, DailyCheckin, WeeklyEvolution, formulários |
| `closer` | CloserDashboard, CallAnalysis, upload de gravação |
| `client` | ClientDashboard, upload material, visualizar content_output |
| `cs` | CSInbox, aprovação de conteúdo |

### O que validar em cada role:
- Login e redirect correto
- RoleGuard bloqueando outras rotas
- Botões sem erros no console
- Formulários validando e submetendo
- Upload de arquivos funcionando
- Dados carregando corretamente

---

## Ordem de Execução

```
FASE 1 → FASE 2 (2.1 antes de 2.2) → FASE 3 → FASE 4 → [usuário executa FASE 5] → FASE 6
```

## Fora do Escopo (esta sprint)
- Migrar queries para TanStack Query
- Validação Zod nos formulários
- WhatsApp delivery end-to-end
