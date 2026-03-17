# PROMPT — Antigravity Sprint Call-Rafa
> Cole isso direto no Antigravity. Contexto completo para executar sem perguntas desnecessárias.

---

## CONTEXTO DO PROJETO

Você está trabalhando no **NextControl** — sistema de gestão de vendas B2B.
- **Stack:** React 18 + TypeScript + Vite + Supabase + shadcn/ui + Tailwind CSS
- **Working dir:** `c:/Users/Fabricio Padrin/OneDrive/Documentos/NEXT CONTROL/NextControl`
- **Supabase project:** `mldbflihdejmddmapwnz`
- **MCP Supabase:** disponível se conectado (use para aplicar migrations)

## O QUE JÁ FOI FEITO (não refazer)

✅ `database.types.ts` regenerado (88k chars, todas as tabelas tipadas)
✅ Tabelas criadas no banco: `client_materials`, `reports`, `content_outputs`, `seller_scripts`, `agent_conversations`
✅ Colunas adicionadas: `clients.is_beta`, `clients.assigned_seller_id`, `users.role`, `users.client_id`
✅ Bug IDOR corrigido em `ClientDashboard.tsx` (reports filtrado por client_id)
✅ Build passando sem erros TypeScript

## SUAS TASKS (da call com o CEO Rafael, 2026-03-15)

---

### TASK 1 — Campo de senha na criação de cliente [CRÍTICO — bloqueando onboarding]

**Arquivo:** `src/pages/admin/AdminManage.tsx`

**Problema:** O admin cria um cliente mas não consegue criar o login com senha. Ellen não conseguiu acessar o sistema.

**O que fazer:**
1. Leia `src/pages/admin/AdminManage.tsx` para entender o modal de criação de cliente
2. Adicione campo `password` (type="password") e `confirmPassword` no formulário
3. Na função de criação, após criar o cliente na tabela `clients`, chame a Edge Function ou use a service role para criar o usuário na auth:

```ts
// No form de criação de cliente, após criar o registro em clients:
const { data: authUser, error: authError } = await supabase.auth.signUp({
  email: formData.email,
  password: formData.password,
  options: {
    data: { name: formData.name, role: 'client' }
  }
})
// Depois vincular o auth.uid ao users table:
await supabase.from('users').upsert({
  id: authUser.user.id,
  email: formData.email,
  name: formData.name,
  role: 'client',
  client_id: clientRecord.id  // o id do client criado
})
```

4. Adicionar validação: senha mínimo 8 chars, confirmação igual
5. Toast de sucesso: "Cliente e login criados! Email: X"

---

### TASK 2 — Botão de editar cliente [ALTO IMPACTO]

**Arquivo:** `src/pages/admin/AdminManage.tsx`

**O que fazer:**
1. Leia o arquivo para ver como o botão "Excluir" está implementado
2. Adicione botão "Editar" ao lado do excluir (ícone `Pencil` do lucide-react)
3. Ao clicar, abre modal com campos preenchidos:
   - `name`, `company`, `email`, `current_phase`, `next_step`, `team_status`, `is_beta`
4. Ao salvar: `supabase.from('clients').update({...}).eq('id', client.id)`
5. Re-fetch da lista após salvar

---

### TASK 3 — Separar upload de materiais por agente [ALTO IMPACTO]

**Contexto:** Cada cliente tem 2 agentes distintos:
- 🤖 **Agente SS** (Social Selling) — sellers/pré-vendas
- 🤖 **Agente Closer** — fechamento de vendas

**Arquivos:** `src/components/admin/ClientMaterialsPanel.tsx`

**O que fazer:**
1. Leia `ClientMaterialsPanel.tsx`
2. No formulário de upload, adicione campo `agent_target`:
```tsx
<Select name="agent_target" defaultValue="both">
  <SelectItem value="ss">Agente SS (Social Selling)</SelectItem>
  <SelectItem value="closer">Agente Closer</SelectItem>
  <SelectItem value="both">Ambos os Agentes</SelectItem>
</Select>
```
3. Criar migration para adicionar coluna:
```sql
ALTER TABLE public.client_materials
  ADD COLUMN IF NOT EXISTS agent_target TEXT DEFAULT 'both'
  CHECK (agent_target IN ('ss', 'closer', 'both'));
```
4. Passar `agent_target` no insert de `client_materials`
5. No painel do cliente, exibir badge indicando para qual agente é o material

---

### TASK 4 — Menu lateral (sidebar) substituindo menu superior [UX]

**Arquivo:** `src/components/layout/DashboardLayout.tsx`

**Contexto:** Menu superior atual está confuso. Rafael quer sidebar estilo ClickUp.

**O que fazer:**
1. Leia `DashboardLayout.tsx` e `MobileBottomNav.tsx`
2. Crie sidebar fixo à esquerda em desktop (w-64 colapsável para w-16)
3. Em mobile: mantém o `MobileBottomNav` existente (não alterar)
4. Paleta: fundo `bg-deep-space` ou `bg-card`, texto branco, item ativo com dourado (`text-solar`)
5. Itens do menu por role:

```ts
// Admin
[Dashboard, Clientes, Pipeline de Calls, Formulários, RAG, Beta]
// Seller
[Dashboard, Relatório Diário, Evolução Semanal, Consultoria de Bolso]
// Closer
[Dashboard, Análise de Call, Insights]
// Client
[Meu Plano, Conteúdos IA, Calls, Relatórios, Perguntas]
// CS
[Inbox]
```

6. Ícones do lucide-react (já instalado)
7. O conteúdo principal deve ter `ml-64` (ou `ml-16` quando colapsado) em desktop

---

### TASK 5 — Migration para agent_target em client_materials

Se MCP Supabase disponível, aplique:
```sql
ALTER TABLE public.client_materials
  ADD COLUMN IF NOT EXISTS agent_target TEXT DEFAULT 'both'
  CHECK (agent_target IN ('ss', 'closer', 'both'));
```

Se não, crie o arquivo `supabase/migrations/20260315000002_add_agent_target.sql` com o SQL acima.

---

## REGRAS DO PROJETO

1. **NUNCA** alterar migrations já aplicadas — criar nova sempre
2. **NUNCA** expor service_role key no frontend
3. Ao criar tabelas, **SEMPRE** incluir RLS
4. Usar `CREATE TABLE IF NOT EXISTS` e `ADD COLUMN IF NOT EXISTS`
5. **NÃO** instalar dependências sem confirmar
6. **NÃO** fazer deploy de Edge Functions
7. `.env` é SOMENTE LEITURA
8. Leia os arquivos antes de editar — nunca reescreva um arquivo inteiro desnecessariamente
9. Um componente por arquivo, hooks em `/hooks`, pages em `/pages`
10. TypeScript estrito — NUNCA usar `any` quando há tipo disponível

## ESTRUTURA DE ARQUIVOS RELEVANTES

```
src/
├── pages/admin/
│   ├── AdminManage.tsx        ← TASKS 1 e 2
│   ├── AdminDashboard.tsx
│   └── CallsPipeline.tsx
├── components/
│   ├── admin/
│   │   └── ClientMaterialsPanel.tsx  ← TASK 3
│   └── layout/
│       ├── DashboardLayout.tsx       ← TASK 4
│       └── MobileBottomNav.tsx       ← não alterar mobile
├── contexts/
│   └── AuthContext.tsx        ← roles: admin|seller|closer|client|cs
└── types/
    └── database.types.ts      ← atualizado, use os tipos daqui

supabase/migrations/           ← criar novas migrations aqui
```

## VERIFICAÇÃO FINAL

Após implementar, rode mentalmente:
- [ ] Admin consegue criar cliente COM senha → Ellen consegue logar
- [ ] Admin consegue editar dados do cliente
- [ ] Upload de material tem campo para selecionar SS / Closer / Ambos
- [ ] Sidebar aparece em desktop, bottom nav permanece em mobile
- [ ] Build sem erros: `npm run build`

---

**Boa sorte! O projeto está ~75% completo. Essas tasks são o que falta para o primeiro cliente real.**
