# PLAN-ui-ux-onboarding.md 🎨

> **Foco**: Interface Premium, Instruções Claras ("Balloon OBS") e Dados Reais.
> **Squad**: Frontend Specialist, Product Owner, QA.

---

## 1. O Problema (Auditoria Visual & UX) 🧐

O usuário relatou:
- "Botões sem função": Precisamos verificar todos os `onClick`.
- "Layout bugado/torto": Alinhamentos, espaçamentos (Shadcn/Tailwind).
- "Dados mocados": Tabelas com `const data = [...]` hardcoded.
- "Falta de instrução": O usuário não sabe o que fazer na tela (precisamos de "Balões Explicativos").

---

## 2. A Solução: "Instructional Layer" (Balões OBS) 🎈

Criaremos um componente global `InstructionBalloon` (Popover/Tooltip) que o usuário pode ativar/desativar ou que aparece no primeiro acesso.

**Componente: `src/components/ui/instruction-balloon.tsx`**
- **Props**: `targetId`, `message`, `position` (top, bottom, left, right), `step` (para tours).
- **Comportamento**: Pulsar suavemente para chamar atenção. Ao clicar, expande o texto explicativo.

---

## 3. Plano de Execução (Task List) ✅

### Fase 1: Componente de Instrução (P0)
- [ ] Criar `InstructionBalloon.tsx` (baseado no Popover do Shadcn).
- [ ] Criar Contexto `InstructionContext` para ligar/desligar "Modo Ajuda".
- [ ] Adicionar botão "Ajuda" (?) no Header global.

### Fase 2: Aplicação nos Fluxos Principais (P1)
- [ ] **Seller Dashboard / Check-in**:
    - "Para que serve este campo?" em cada input do Wizard.
    - "Como tirar o print?" no upload.
- [ ] **CS Inbox**:
    - "O que eu analiso aqui?" na lista de pendentes.
    - "Quando devo aprovar?" no botão de ação.
- [ ] **Client Dashboard**:
    - "Como ler este gráfico?" no Funil.
    - "O que é taxa de conversão?" nos cards.

### Fase 3: Auditoria & Remoção de Mocks (P2)
- [ ] **SellerDashboard**: Verificar se lista de histórico é real.
- [ ] **AdminDashboard**: Garantir que TODAS as tabelas venham do Supabase.
- [ ] **Botões Soltos**: Remover ou implementar botões "Fictícios" (ex: Exportar Excel que não funciona).

### Fase 4: Polish Visual (P3)
- [ ] **Alinhamento**: Revisar margens (padding/margin) em Mobile.
- [ ] **Empty States**: Telas vazias bonitas (não apenas "Sem dados").
- [ ] **Feedback Visual**: Loading states em todos os fetchs.

---

## 4. Definição de Done (QA Checklist)
- [ ] Todos os botões clicáveis fazem algo (ou estão desabilitados com tooltip "Em breve").
- [ ] Não existe `const data = [...]` com dados falsos nas telas principais.
- [ ] O "Modo Ajuda" explica a tela inteira para um usuário leigo.
- [ ] Layout não quebra em Mobile (iPhone SE/Pixel 5).
