# 🧠 Brainstorm: Fluxo de Consultoria 4-Tiers (LeadFlow Navigator)

### Contexto
O objetivo é transformar um fluxo de trabalho manual (WhatsApp/Planilhas) em uma plataforma SaaS "enxuta e lisa" para uma consultoria.
**Atores:**
1.  **Sellers:** SDRs/Pré-vendas (Instagram/X1).
2.  **Closers:** Vendedores/Fechadores (Calls).
3.  **Admins:** Gestores que validam dados e geram inteligência.
4.  **Clientes:** O "produto" final, que consome os relatórios e trackeia o projeto.

**Princípios de Design (Solicitados):**
*   **Fadiga de Decisão:** Interfaces minimalistas, "Chunking" (quebra de tarefas).
*   **Heurística do Afeto:** Design emocional, gamificação leve, feedback visual positivo.
*   **Status Quo:** Padrões claros, pré-seleção inteligente (defaults).

---

### 1. Tier Seller (O "Opener")
**Foco:** Agendamentos e Qualificação (Instagram/X1).
**Problema:** Rotina repetitiva, preenchimento de métricas chato.

#### Opção A: "O Fluxo Guiado" (Recomendado)
Uma interface estilo "Wizard" ou "Story" diário, onde o seller preenche as etapas em blocos para evitar ver um formulário gigante.
*   **Feature:** "Daily Check-in" – Um formulário passo-a-passo (Chats -> Boas Vindas -> Agendamentos).
*   **UX Psychology:** *Chunking* (divide o input em 3 telas simples). *Afeto* (animação de confete ao bater a meta do dia).
*   **Status Quo:** Replicar a ordem exata que eles já fazem no CRM/Planilha atual.

#### Opção B: "O Dashboard Gamificado"
Foco total em metas visuais (barras de progresso). Input rápido via "One-Click Increment".
*   **Feature:** Botões de `+` grandes para incrementar métricas em tempo real durante o dia, em vez de preencher tudo no final.
*   **Prós:** Dados mais precisos em tempo real.
*   **Contras:** Exige que a aba fique aberta o dia todo (pode não ser a realidade do seller mobile).

---

### 2. Tier Closer (O "Fechador")
**Foco:** Calls realizadas e Conversão.

#### Opção A: "A Sala de Guerra" (Recomendado)
Foco na agenda e no resultado da call.
*   **Feature:** Integração visual de "Agenda do Dia" (integração ou lista manual).
*   **Feature:** "Call Report Cards" – Cards simples para cada call agendada onde ele marca apenas: *Realizada?* -> *Venda/Não Venda* -> *Motivo*.
*   **Feature:** Upload de gravação (link) para auditoria do Admin.

---

### 3. Tier Admin (O "Maestro")
**Foco:** Validação, Qualidade e Relatórios.

#### Opção A: "O Validador com IA" (Recomendado)
O Admin não deve apenas "olhar", ele deve ter superpoderes.
*   **Feature:** "Inbox de Validação" – Uma lista única de reports pendentes (Sellers e Closers misturados ou separados).
*   **Feature:** **AI Quality Check** – Ao clicar em aprovar, a IA analisa os números (ex: taxa de conversão suspeita) e sugere o texto do relatório.
*   **Feature:** **PDF Generator Engine** – Botão "Exportar Relatório Semanal" que compila os dados aprovados em um PDF com branding da consultoria.
*   **Feature:** Gestão de Acessos – Admin precisa liberar o cadastro de novos Sellers/Closers (segurança).

---

### 4. Tier Cliente (O "Espectador Ativo")
**Foco:** Transparência e Educação.

#### Opção A: "O Portal do Projeto" (Recomendado)
Não apenas números, mas "Onde estamos".
*   **Feature:** Timeline do Projeto – Onde o cliente vê em qual fase da consultoria ele está.
*   **Feature:** "Sua Semana em Números" – Dashboard simplificado (apenas as métricas norte: Vendas, Leads Qualificados).
*   **Feature:** Área de Materiais/Onboarding – Cliente faz upload de infos do projeto dele para o time consultar.

---

## 💡 Fluxo de Trabalho Integrado & Features Técnicas

Para garantir um fluxo "liso", sugerimos a seguinte arquitetura de features:

### Core Features (MVP)
1.  **Auth Hierárquico:**
    *   Gate de Aprovação: Novos cadastros ficam "Pendente" até Admin aprovar.
    *   Redirecionamento inteligente pós-login (Seller -> SellerDashboard, etc).
2.  **Input Engine (Sellers/Closers):**
    *   Formulários com validação Zod.
    *   **Chunking:** Quebrar formulários longos em etapas.
3.  **Reporting Engine (Admin/Client):**
    *   **PDF Generation:** `react-pdf/renderer` para gerar relatórios bonitos no client-side.
    *   **AI Insights:** Integração (mockada ou real) para gerar "Pontos Fortes" e "Melhorias" automaticamente.

### UX/UI "Anti-Fadiga"
*   **Defaults Inteligentes:** O formulário já vem preenchido com "0".
*   **Feedback Imediato:** Toast notifications (Sonner) para sucesso/erro.
*   **Clean UI:** Remover o que não é essencial. O Seller só vê o input do dia. O Client só vê o report pronto.

## Próximos Passos (Orchestration Plan)
1.  **Planning:** Confirmar este brainstorm.
2.  **Agents:**
    *   `frontend-specialist`: Refatorar dashboards com "Chunking" e implementar PDF Generator.
    *   `backend-specialist`: Ajustar schema do Supabase para suportar "Call Logs" e "User Approvals".
    *   `testing-engineer`: Criar testes para o fluxo de aprovação.
