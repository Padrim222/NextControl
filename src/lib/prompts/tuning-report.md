# Tuning de Prompts RAG (Com Rafa Yorik) - Pendência

**Executivo Comercial (Rafa Yorik) não disponível para calibração manual síncrona neste script.**

## O que deve ser feito (Relatório)
Conforme a task 11 (Sprint 7), após rodarmos os 5 prints oficiais de contatos frios + Objeções base, a IA respondeu com Concordância teórica baseada no prompt.

- **Check 1:** O "Gold Standard" de perguntas fortes da Etapa (Estrela Norte). As LLMs GPT-4o e Gemini-Pro tenderam a ser longas ou "polidas demais". 
- **Otimizações no Prompt:**
  1. No \`analyze-story.ts\` inserido trava de 3 linhas máximas.
  2. No \`closer-system-prompt.ts\`, o "Chicote" mental (*Cadeia de Pensamento Obrigatória NPQC*) já freia o viés assistencialista da IA, forçando perguntas instigadoras que ataquem a dor real.

**Ação Pendente:** Fazer painel Beta de homologação onde Rafa Yorik avalia com Thumbs Up / Thumbs Down diretamente a saída do componente \`AgentChat.tsx\`. Se THUMB DOWN, salvar numa tabela \`rag_fine_tuning\` de feedbacks para refinamento periódico.
