

# CRM Social Funnels™ — Plano de Implementação (MVP)

## Visão Geral
Sistema CRM com 4 perfis de acesso para gestão de social selling, com workflow de aprovação de relatórios e entregáveis para o cliente via link compartilhável. Visual dark mode premium.

---

## 1. Autenticação & Perfis de Acesso
- **Login** para Admin, Seller e Closer (email/senha via Supabase Auth)
- **Tabela de roles** separada (admin, seller, closer) — sem login para o cliente
- Redirecionamento automático para o painel correto após login
- Admin pode cadastrar sellers, closers e criar clientes no sistema

---

## 2. Painel do Seller (Social Seller)
- **Tela inicial**: lista de clientes atribuídos ao seller
- **Selecionar cliente** → abre o formulário diário
- **Formulário diário do seller** com os campos do funil:
  - Chat Ativo, Boas-vindas, Reaquecimento, Nutrição, Respostas/Conexão, Mapeamentos, Pitchs, Captura de Contato, Follow-up
- Ao preencher, o relatório fica como **"Pendente de aprovação"**
- Seller pode ver histórico de relatórios enviados e status (pendente, aprovado, rejeitado)

---

## 3. Painel do Closer
- **Tela inicial**: lista de clientes/calls atribuídos
- **Formulário diário do closer**:
  - Cola a transcrição da call de venda
  - Dados básicos da call (data, cliente, resultado)
- Envio para aprovação do admin
- Histórico de transcrições enviadas

---

## 4. Painel do Admin
- **Dashboard** com visão geral de todos os sellers e closers
- **Fila de aprovação**: relatórios pendentes de sellers e closers
  - Visualizar relatório → Aprovar ou Rejeitar (com comentário)
- Ao aprovar:
  - Relatório é salvo definitivamente no banco de dados
  - Admin pode gerar o **relatório de ajuste/script** com direcionamentos para o seller melhorar
  - Relatório semanal consolidado é gerado automaticamente para o cliente
- **Gestão de usuários**: cadastrar/editar sellers, closers e clientes
- **Gestão de clientes**: criar clientes, atribuir sellers/closers a clientes

---

## 5. Relatório do Cliente (Link Compartilhável)
- Página pública acessível via **link único** (sem login)
- Visual premium dark mode, estilo Social Funnels™ conforme o exemplo:
  - Header com logo, nome do cliente, período
  - Cards de métricas com emojis (Chat Ativo, Boas-vindas, Mapeamentos, Pitchs, Capturas)
  - Consolidado do funil completo
  - Taxas de conversão entre etapas
  - Gráfico visual do funil de conversão
- Dados consolidados da semana (ou período selecionado)
- Admin gera e compartilha o link com o cliente

---

## 6. Banco de Dados (Supabase — conectar depois)
- **Tabelas principais**: users, user_roles, clients, daily_reports (seller), call_transcripts (closer), weekly_reports, report_links
- **RLS** por role: sellers só veem seus clientes, closers só veem suas calls, admin vê tudo
- Status de aprovação nos relatórios (pendente → aprovado/rejeitado)
- Links compartilháveis com token único para acesso público do cliente

---

## 7. Design & Experiência
- **Dark mode** como padrão
- Cards com ícones/emojis, visual clean e premium
- Layout responsivo (desktop-first)
- Navegação por sidebar com menu contextual por perfil
- Toasts de confirmação para ações importantes (envio, aprovação)

