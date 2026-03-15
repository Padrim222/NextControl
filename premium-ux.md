# Premium UX Sprint — Consultoria de Bolso + Navigation

## Goal
Entregar uma experiência de produto nível SF startup: chat de IA premium, navegação magnética com wizard contextual, e um agente flutuante que guia o usuário dentro do app.

## Design System (já estabelecido no projeto)
- **Cores:** `solar` (gold #D4A017), `deep-space` (navy #0A0F1E), `graphite`, `platinum`
- **Gradiente:** `nc-gradient` (gold→amber)
- **Classes:** `nc-card-border`, `nc-btn-primary`, `nc-gradient-text`
- **Fonte display:** `font-display` (headers)
- **Motion:** Framer Motion já instalado
- **UI:** shadcn/ui + Tailwind (já instalado)

## Tasks

- [x] **Task 1 — CoachChat Premium Redesign** (`src/pages/training/CoachChat.tsx`)
  - Layout full-screen split: sidebar de contexto (desktop) + área de chat
  - Avatar do agente com nome/persona por role: "Nexus — Agente SS" / "Nexus — Agente Closer"
  - Markdown rendering nas respostas da IA (negrito, listas, código)
  - Mensagens com timestamp formatado + botão copiar
  - Typing indicator premium (3 pulsos gold animados)
  - Quick prompts visuais como cards clicáveis (não chips simples)
  - Canal selector redesenhado: tabs premium com ícones
  - Input com glassmorphism sutil + send animado
  - Verify: visual premium, sem emojis como ícones, build passa

- [x] **Task 2 — AppNavigator: Agente Flutuante** (`src/components/layout/AppNavigator.tsx` — NOVO)
  - Botão flutuante bottom-right com ícone Sparkles + glow gold
  - Ao clicar: painel lateral slide-in com:
    - Campo "O que você quer fazer?" (NLP-style)
    - Atalhos contextuais por role (ex: seller → "Check-in Diário", "Ver Evolução")
    - Navegação por voz/texto: detecta intent e navega
    - 5-6 quick actions visuais com ícones
  - Fechar com Esc ou clique fora
  - Verify: navega corretamente, não bloqueia conteúdo

- [x] **Task 3 — NavigationWizard: Onboarding por Role** (`src/components/wizard/OnboardingWizard.tsx` — NOVO)
  - Exibido na primeira visita (localStorage flag)
  - Steps animados (Framer Motion) por role:
    - seller: "Faça seu primeiro check-in" → "Conheça o Agente SS" → "Veja sua evolução"
    - client: "Veja seu plano" → "Conheça o Agente" → "Crie login do time"
    - team_member: "Acesse o Agente SS" → "Faça seu check-in" → "Analise uma call"
  - Progress bar gold + skip button
  - Verify: aparece 1x por usuário, navega corretamente

- [x] **Task 4 — DashboardLayout: integrar Navigator + Wizard**
  - Adicionar `<AppNavigator />` dentro do DashboardLayout (após `<MobileBottomNav />`)
  - Adicionar `<OnboardingWizard />` condicionalmente
  - Verify: build passa, não quebra layouts existentes

- [x] **Task 5 — Markdown Renderer** (`src/components/ui/MarkdownMessage.tsx` — NOVO)
  - Renderiza **bold**, *italic*, listas, `código inline`, blocos de código
  - Sem dependência nova — usar regex + JSX puro
  - Verify: mensagens do coach renderizam formatação

## Done When
- [x] CoachChat parece produto de startup SF — não parece CRUD
- [x] Usuário nunca fica perdido: wizard guia, navigator aponta o caminho
- [x] Agente flutuante funciona em todas as páginas
- [x] `npm run build` sem erros
- [x] Markdown nas respostas do coach renderiza corretamente

## Notas de Design
- **NÃO** usar emojis como ícones — usar Lucide-react
- **NÃO** usar glassmorphism pesado — apenas sutil (bg-card/80 backdrop-blur-sm)
- Animações: spring physics, não linear
- Prioridade visual: gold (#D4A017) como accent principal
- Tipografia: `font-display` para títulos do agente, `font-mono` para código
- Persona do agente: "Nexus" — tom direto, profissional, sem ser robótico
- Quick prompts: mínimo 6, organizados por intenção (prospecção, objeção, fechamento, rapport)
