# Tasklist — Call Rafael × Fabrício
> **Data:** 2026-03-15 | **Origem:** Última call com CEO Rafael (Nextbase)
> **Prioridade:** P0 = bloqueante, P1 = alto impacto, P2 = médio, P3 = roadmap

---

## 🔴 P0 — BLOQUEANTE (impede onboarding de novos clientes)

- [ ] **[ADMIN] Campo de senha na criação de cliente**
  - Tela: `AdminManage.tsx` — modal de criação de cliente
  - Problema: Fabrício tentou criar login pra Ellen e ela não conseguiu acessar
  - Solução: Adicionar campo `password` no form + chamar `supabase.auth.admin.createUser({ email, password, role: 'client' })`
  - Criar user na `auth.users` E inserir na tabela `users` com `client_id` linkado

- [ ] **[ADMIN] Botão de editar cliente** (além do excluir que já existe)
  - Tela: `AdminManage.tsx`
  - Campos editáveis: nome, empresa, fase atual, próxima etapa, status ativo/inativo
  - Usar modal de edição similar ao de criação

---

## 🟠 P1 — ALTO IMPACTO

- [ ] **[ADMIN] Separar upload de materiais entre Agente SS e Agente Closer**
  - Tela: `ClientMaterialsPanel.tsx` — adicionar campo `agent_target` no form de upload
  - Valores: `ss` (Social Selling) | `closer` | `both`
  - Adicionar coluna `agent_target TEXT DEFAULT 'both'` na tabela `client_materials`
  - Agente SS lê só materiais com `agent_target IN ('ss', 'both')`
  - Agente Closer lê só materiais com `agent_target IN ('closer', 'both')`
  - Texto: "Materiais para SS: Playbook, prompt, acervo de perguntas SS"
  - Texto: "Materiais para Closer: NPQ, perguntas por ICP, transcrições de boas práticas"

- [ ] **[UX] Menu lateral (sidebar) substituindo menu superior**
  - Similar ao ClickUp — ícones + labels, colapsável
  - Paleta: branco/preto com dourado/amarelo (Nexus)
  - Hierarquia de navegação por role (admin vê tudo, client vê só o seu)
  - Arquivo atual a editar: `src/components/layout/DashboardLayout.tsx`
  - Mobile: bottom nav continua, sidebar só em desktop

- [ ] **[RLS] Atualizar RLS para login separado do time de vendas**
  - Arquitetura definida: Admin → Head de Vendas → Cliente/Expert → Time de Vendas
  - Time de Vendas compartilha UM login (não é individual)
  - Novo role a criar: `team_member` (ou reutilizar `seller`)
  - Criar nova migration: `team_member` acessa submissions, agente, checkin
  - RLS: `team_member` vê apenas dados do `client_id` vinculado ao seu user

---

## 🟡 P2 — MÉDIO PRAZO

- [ ] **[AGENTES] Retroalimentação automática dos agentes**
  - Sellers/Closers podem sugerir alterações no script/abordagem no painel
  - Sugestão vira um "PR" que o admin aprova
  - Quando aprovado: agente atualiza o arquivo MD de contexto e usa dali em diante
  - Análise de calls identifica pontos de melhoria → sugere edits no contexto do agente
  - Tabela necessária: `agent_feedback_suggestions (id, agent_type, suggestion_text, status, approved_by, applied_at)`
  - Objetivo: sistema autodidata, menos intervenção manual

- [ ] **[ONBOARDING] Formulário de onboarding baseado no briefing do cliente**
  - Briefing completo: 29 páginas (mapeamento empresa, funis, ICP, Fórmula X)
  - Dois documentos base: Briefing + Clonagem
  - Cliente preenche formulário ao criar login → entra automaticamente na base do agente
  - Mapear perguntas do briefing em campos do formulário
  - Edge Function: processar respostas e gerar embeddings para o RAG

- [ ] **[UX] Modo escuro**
  - Já existe suporte via Tailwind dark: (verificar se tema dark está configurado)
  - Adicionar toggle no perfil/header
  - Testar contraste com paleta dourado

---

## 🔵 P3 — ROADMAP / RAFAEL

- [ ] **[PRODUTO] Produto educacional (lançar semana que vem)**
  - Público: pessoas sem equipe que precisam de conhecimento técnico
  - Preço: R$ 997 (R$ 1.000-1.500)
  - Estrutura: gravações auto-documentadas + curso auto-atualizado + 1 consultoria individual
  - Rafael define estrutura com Fabrício

- [ ] **[RAFAEL] Marcar call com Jô** (sábado, domingo ou segunda)

---

## ARQUITETURA DE USUÁRIOS (definida na call)

```
Admin (equipe NextControl)
  └── Head de Vendas
        └── Cliente/Expert  ← tem login próprio
              └── Time de Vendas  ← compartilha 1 login por cliente
```

**Dois agentes por cliente:**
- 🤖 **Agente SS** — Sellers/pré-vendas. Base: Playbook SS, prompt, perguntas ICP
- 🤖 **Agente Closer** — Fechamento. Base: NPQ, perguntas por tipo de cliente, transcrições

**Armazenamento:** Priorizar texto > PDF (peso). PDFs ficam no Drive, texto/MD na plataforma.

---

## PROMPT PARA ANTIGRAVITY

> Copie o bloco abaixo e cole no Antigravity para ele executar as tasks P0 e P1

---
