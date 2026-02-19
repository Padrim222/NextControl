# PLAN-consultoria-de-bolso-roadmap.md 🚀

> **Documento de Visão e Estratégia de Produto**
> *Baseado na transcrição da reunião de alinhamento (Rafael/Ronaldo/Fabricio)*
> *Data: 19/02/2026*

---

## 1. Visão do Produto (The "Why") 🧠

**O Problema**: A Consultoria High-Ticket tradicional é difícil de escalar (depende de horas/humano) e a Mentoria Low-Ticket não gera transformação real (falta implementação).

**A Solução**: **"Consultoria de Bolso" (Pocket Consultant)**.
Um modelo híbrido onde o cliente recebe estratégia de alto nível (humana/IA) e execução facilitada por agentes, sem precisar que o consultor "pegue na mão" todo dia.

**A Proposta de Valor**: 
1.  **Escala Infinita**: Um consultor (Jo/CS) gerencia 10x mais clientes.
2.  **Segurança**: O cliente sente que tem um "Head de Vendas" 24/7 (o App/Agentes).
3.  **Entregáveis Reais**: Não apenas "dicas", mas Scripts, Planos e Análises gerados pela IA com base nos inputs diários.

**O Papel do App (Leadflow Navigator)**:
Não é um SaaS para ser vendido separadamente. **É a "Espinha Dorsal" da entrega.**
*   **Para o Cliente**: É o "Portal da Transparência" e "Canal de Accountability". Ele é obrigado a reportar para receber o valor.
*   **Para a Next Control**: É a "Fábrica de Consultoria". Ingestão de dados -> Processamento IA -> Saída de Relatório.

---

## 2. Auditoria do Estado Atual (The "What") 🔍

| Componente | Estado Atual (Leadflow MVP) | Visão "Consultoria de Bolso" | Gap (O que falta) |
| :--- | :--- | :--- | :--- |
| **Ingestão de Dados** | Formulário Web (Seller/Closer) | Formulário Web + WhatsApp Áudio/Texto | **Integração WhatsApp** (P3) |
| **Processamento IA** | `analyze-submission` (Feedback Reativo) | `Strategist Agent` (Proativo - Gera Planos) | **Agentes Geradores** (P3/P4) |
| **Entrega de Valor** | Dashboard + PDF Relatório | "Treinador de Bolso" (Push Notification/Whats) | **Notificação Ativa** (P3) |
| **Human in the Loop** | CS Inbox (Aprovação Simples) | CS como "Piloto de IA" (Ajuste de Prompt) | **Interface de Estratégia** (P4) |

---

## 3. Roadmap Estratégico (MoSCoW) 🗺️

### Fase P3: "O Treinador Ativo" (Curto Prazo)
*Foco: Levar o valor até o cliente, não esperar ele vir buscar.*

*   **MUST (Obrigatório)**:
    *   **Notificações Ativas**: Quando o CS aprova um relatório, o cliente recebe no WhatsApp/Email: "Seu feedback diário está pronto! 🚀".
    *   **PWA (Progressive Web App)**: Permitir instalar o App no celular para acesso rápido ("ícone na tela").
    *   **IA Melhorada**: Ajustar o prompt para não ser apenas "analítico", mas "diretivo" (Ex: "Faça X amanhã").
*   **SHOULD (Deveria)**:
    *   **Meta de Vendas**: Cliente define meta mensal, App mostra % atingido dia a dia.

### Fase P4: "A Fábrica de Conteúdo" (Médio Prazo)
*Foco: Gerar ativos, não apenas relatórios.*

*   **MUST**:
    *   **Agente "Iori" (Estrategista)**: Novo módulo onde o cliente preenche um "Briefing Semanal" e a IA gera:
        *   3 Roteiros de Reels.
        *   5 Scripts de Abordagem.
    *   **Integração de Áudio (Whisper)**: Cliente manda áudio da call, IA transcreve e analisa (sem upload manual de arquivo).

### Fase P5: "Ecossistema Escalonável" (Longo Prazo/Visão Rony)
*Foco: O "Negócio de Uma Pessoa Só" turbinado.*

*   **COULD (Poderia)**:
    *   **Clone de Voz/Avatar**: IA gera vídeo do "Head" falando o feedback.
    *   **Marketplace de Agentes**: Cliente "contrata" o Agente de Conteúdo extra por R$X/mês.

---

## 4. Recomendações Técnicas (QA & Dev) ⚙️

### 🛡️ Qualidade (QA Perspective)
*   **Risco Crítico**: Se a IA falar besteira (alucinar), a confiança no "Consultor" zera.
    *   *Mitigação*: Manter o **Human in the Loop** (CS Inbox) obrigatório antes de enviar ao cliente.
*   **Estabilidade**: O cliente vai usar isso todo dia. Se o PWA não abrir, ele para de reportar.
    *   *Ação*: Testes E2E rigorosos no fluxo de `Mobile Login -> Submission`.

### 🏗️ Arquitetura (Dev Perspective)
*   **Whatsapp API**: Para a visão "Pocket", precisaremos integrar com WhatsApp Business API (Twilio ou WPPConnect) para receber áudios e enviar relatórios.
*   **Vercel AI SDK**: Migrar para `stream` de resposta para gerar "Scripts" longos sem timeout.

---

## 5. Próximos Passos Imediatos

1.  **Validar PWA**: Transformar o site atual em App instalável (manifest.json).
2.  **Notificação**: Implementar envio de email via Resend/Supabase quando status = 'approved'.
3.  **Refinar Prompt**: Ajustar o `analyze-submission` para adotar a persona "Pocket Trainer" (mais curto, mais direto).

> **Veredito**: O "AI Slop" que temos agora (MVP) é a **fundação sólida**. Ele resolve a parte "chata" (coleta e organização). Agora precisamos construir a parte "sexy" (entrega ativa e geração de estratégia) em cima dele.
