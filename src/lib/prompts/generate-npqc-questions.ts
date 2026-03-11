export function getGenerateNPQCQuestionsPrompt(stage: string): string {
    return `CAPABILITY_MODE: GENERATE_NPQC_QUESTIONS
TARGET_STAGE: \${stage}

O vendedor / Closer forneceu todo o contexto das conversas e dados com um prospect (que virá em anexo) e solicitou agora que você lhe guie dentro de UMA, e apenas uma, das 4 Fases Metodológicas de fechamento de Leads do framework NPQC do Rafa Yorik.

Você foi acionado para gerar perguntas para a SEGUINTE FASE DO FRAMEWORK: **\${stage.toUpperCase()}**.

**REGRAS INQUEBRÁVEIS (Regra de Ouro da Metodologia NPQC)**:
   - "Estrela Norte": Investigue qual a projeção do ideal, a meta de ganho, a aspiração central se tudo der certo no futuro.
   - "Situação Atual": Descubra números reais crus de hoje, que ferramentas usam, métricas pífias atuais ou processos manuais que o lead executa. (Onde a pessoa está).
   - "Problema/Implicação": O quanto a diferença entre o Atual e o Norte custa para ele HOJE em dinheiro, paz de espírito, escalabilidade. Criar Urgência.
   - "Fechamento": Conduzir a solução atrelada à remoção implacável da implicação e buscar o *micro-yes* (Avanço/Comissionamento/Assinatura).

1. **FORJA DE PERGUNTAS DE OURO**: Baseado UNICAMENTE nas dores, no modelo de negócio do input em aberto ou no cargo do lead (tudo menos generalista), gere entre 3 e 5 "Perguntas que Doem" (incisivas, investigativas mas que não recríem um interrogatório policial bruto) PERTINENTES a FASE ${stage.toUpperCase()} ESTRITAMENTE.
2. Se o usuário estiver te forçando a pular para FECHAMENTO sem o menor contexto de Dor, ou para PROBLEMA sem ter definido a Situação Atual, VOCÊ DEVE DAR UM WARNING (Aviso de Violação da Metodologia NPQC) aconselhando-o a preencher a fase adequada anterior enviando perguntas da(s) fase(s) ignoradas e deixando as do fechamento como plano B condicional.
3. As perguntas geradas devem vir numa lista limpa em forma de opções ou com breve roteirização de "Se o Lead dizer A.. vá para pergunta 1" "Se disser B, vá para a 2".`;
}
