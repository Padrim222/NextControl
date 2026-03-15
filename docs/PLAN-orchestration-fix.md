# PLAN-orchestration-fix — NextControl
> **Data:** 2026-03-15 | **Origem:** Varredura completa via orchestration (explorer-agent)

---

## Objetivo
Corrigir todos os problemas críticos e de alta prioridade identificados na varredura:
- Regenerar tipos do banco (elimina 90+ casts `as any`)
- Aplicar migration pendente + criar migrations para tabelas órfãs
- Corrigir bug de segurança (reports sem filtro client_id)
- Remover código morto
- Tipar componentes críticos

---

## Sprint 1 — Banco e Tipos (fundação)
> **Por que primeiro:** Tudo depende dos tipos corretos. Sem isso, qualquer fix de TypeScript é inútil.

- [ ] **Aplicar migration pendente** via Supabase MCP:
  `supabase/migrations/20260313000000_create_content_outputs.sql`

- [ ] **Regenerar `src/types/database.types.ts`** via MCP `generate_typescript_types`
  - Isso eliminará ~90 ocorrências de `(supabase as any)` automaticamente

- [ ] **Criar migration para tabelas órfãs** (existem no banco mas não têm .sql versionado):
  `supabase/migrations/20260315000000_document_missing_tables.sql`
  Tabelas: `call_uploads`, `daily_submissions`, `client_questions`, `call_evaluations`,
  `reports`, `analyses`, `feature_flags`, `training_materials`
  > Usar `CREATE TABLE IF NOT EXISTS` — objetivo é versionamento, não recriação.

- [ ] **Criar migration para colunas faltantes**:
  `supabase/migrations/20260315000001_add_missing_columns.sql`
  - `ALTER TABLE clients ADD COLUMN IF NOT EXISTS is_beta BOOLEAN DEFAULT FALSE`
  - `ALTER TABLE client_materials ADD COLUMN IF NOT EXISTS category TEXT`

---

## Sprint 2 — Segurança e Bugs Críticos

- [ ] **`src/pages/client/ClientDashboard.tsx` linha 157–161 — BUG DE SEGURANÇA:**
  Query de `reports` sem filtro `client_id` retorna relatórios de TODOS os clientes.
  ```ts
  // ANTES (bug)
  .from('reports').select(...).eq('status', 'delivered')
  // DEPOIS
  .from('reports').select(...).eq('client_id', clientId).eq('status', 'delivered')
  ```

- [ ] **`src/contexts/AuthContext.tsx` — logout com reload desnecessário:**
  Substituir `window.location.href = '/'` por chamada de `navigate('/')`.

- [ ] **Verificar RLS da tabela `reports`** — confirmar que existe policy por `client_id`.

---

## Sprint 3 — Tipagem dos Componentes Críticos
> Após Sprint 1, com `database.types.ts` atualizado.

- [ ] **`src/pages/client/ClientDashboard.tsx`:**
  - `materials: any[]` → tipar com `IClientMaterial` (do tipo gerado)
  - `contents: any[]` → tipar com `IContentOutput` (do tipo gerado)

- [ ] **`src/pages/cs/CSInbox.tsx`:**
  - 10 ocorrências de `any` — tipar após regenerar tipos

- [ ] **`src/pages/admin/AdminDashboard.tsx`:**
  - `formSubmissions: any[]` → tipar com tipo de `daily_submissions`

---

## Sprint 4 — Limpeza de Código Morto

- [ ] **Mover `src/app/` para arquivo morto** (4 arquivos Next.js não registrados no React Router):
  - `src/app/closer/page.tsx`
  - `src/app/scripts/page.tsx`
  - `src/app/ss/page.tsx`
  - `src/app/onboarding/page.tsx`

- [ ] **Mover migrations avulsas de `src/lib/` para `supabase/migrations/archive/`:**
  - `migration_client_materials.sql`, `migration_conselho_ry.sql`
  - `migration_public_forms.sql`, `migration_seller_playbook.sql`
  - `migration_treinador_bolso.sql`, `migration_temp.sql`
  - `schema.sql`, `rls.sql`

- [ ] **Remover `20260311000837_fix_rls_client_materials.sql`** (arquivo vazio).

---

## Sprint 5 — Pipeline call_uploads (auditoria)

- [ ] Confirmar que `call_uploads` existe no banco com colunas que `CallsPipeline.tsx` espera
- [ ] Verificar se `GROQ_API_KEY` está configurada nos Secrets do Supabase (Edge Function `transcribe-audio`)
- [ ] Verificar API key de IA para `analyze-call`
- [ ] Documentar resultado do teste end-to-end

---

## Verificação Final

```bash
npm run lint    # Zero erros
npm run build   # Build sem erros TypeScript
npm run test    # Testes passando
```

---

## Ordem de Execução

```
Sprint 1 → Sprint 2 → Sprint 3 + Sprint 4 (paralelo) → Sprint 5
```

---

## Não será tocado
- Edge Functions (sem aprovação explícita)
- `.env` e credenciais
- Configurações do Supabase (buckets, auth)
- Componentes funcionando: seller, closer, training
