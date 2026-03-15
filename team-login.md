# Team Login — Cliente adiciona o próprio time

## Goal
Ellen (cliente) cria 1 login compartilhado para o time de vendas dela (SS + Closer). O time acessa os agentes e faz check-in. Ellen não precisa depender do admin para isso.

## Arquitetura
```
Admin → cria Ellen (role: client)
Ellen → cria o Time (role: team_member, mesmo client_id dela)
Time de Vendas → compartilha 1 login, vê apenas dados do client_id
```

## Tasks

- [x] **Task 1 — Migration: adicionar role `team_member`**
  - Arquivo: nova migration `supabase/migrations/20260315000003_add_team_member_role.sql`
  - DROP + ADD CONSTRAINT em `users.role` para incluir `team_member`
  - Aplicar via MCP
  - Verificar: `\d users` mostra `team_member` no CHECK

- [x] **Task 2 — Tipos: adicionar `team_member` ao UserRole**
  - Arquivo: `src/types/index.ts`
  - Adicionar `'team_member'` ao tipo `UserRole`
  - Verificar: sem erro de TS no AuthContext e RoleGuard

- [x] **Task 3 — RoleGuard: rota para team_member**
  - Arquivo: `src/components/layout/RoleGuard.tsx`
  - `team_member` redireciona para `/seller` (acesso a check-in + agente SS/Closer)
  - Verificar: login de team_member cai no SellerDashboard

- [x] **Task 4 — ClientDashboard: aba "Meu Time"**
  - Arquivo: `src/pages/client/ClientDashboard.tsx`
  - Nova tab `'time'` com formulário: email + senha do time
  - Ao criar: `supabase.auth.signUp({ email, password })` + `users.insert({ role: 'team_member', client_id: client.id })`
  - Mostrar as credenciais criadas (copiar com 1 clique)
  - Mostrar se já existe um team_member vinculado ao client
  - Verificar: Ellen cria o time, time consegue logar

- [x] **Task 5 — RLS: team_member acessa dados do próprio client_id**
  - Migration: `20260315000004_rls_team_member.sql`
  - `daily_submissions`: team_member pode INSERT/SELECT onde `client_id = users.client_id`
  - `agent_conversations`: team_member pode ALL onde `user_id = auth.uid()`
  - `client_materials`: team_member pode SELECT onde `client_id = users.client_id`
  - Aplicar via MCP
  - Verificar: team_member não vê dados de outros clientes

- [x] **Task 6 — Sidebar: team_member vê menus SS e Closer**
  - Arquivo: `src/components/layout/DashboardLayout.tsx`
  - Adicionar case `team_member` no mapa de itens do sidebar
  - Menus: Consultoria de Bolso (coach), Check-in Diário, Análise de Call
  - Verificar: sidebar correto ao logar como team_member

## Done When
- [x] Ellen cria login do time a partir do painel dela (sem admin)
- [x] Time consegue logar e acessar agentes + check-in
- [x] Time só vê dados do cliente da Ellen (RLS)
- [x] `npm run build` sem erros

## Notas
- **NÃO** criar login individual por membro — 1 login compartilhado por cliente
- Senha mínimo 8 chars, validação no frontend
- Se já existe team_member para o client_id → mostrar email existente + botão "Redefinir senha"
- Não alterar AdminManage — admin ainda pode criar team_member manualmente se quiser
