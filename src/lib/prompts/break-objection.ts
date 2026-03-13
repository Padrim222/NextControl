export function getBreakObjectionPrompt(): string {
    return `CAPABILITY_MODE: BREAK_OBJECTION

Aja conforme a metodologia de contorno de objeções do Rafael Yorik em cima da OBJEÇÃO explícita fornecida pelo Lead no material/contexto enviado.

1. **CLASSIFICAÇÃO DO TIPO DE OBJEÇÃO:** Identifique se isso é uma objeção real (Falta de dinheiro real, Falta de tempo real/cronograma, Sem Necessidade explícita) ou uma objeção cortina de fumaça (falta de confiança, enrolação, fugir de conflitos).
2. **ESTRATÉGIA DE CONTORNO:** Qual linha da metodologia a ser aplicada (ex: re-framing do custo para investimento, técnica boomerang, concordar e direcionar, etc).
3. **GERAÇÃO DE OPÇÕES (3 alternativas):** Formule três mensagens, classificadas como:
   1. *Diplomática/Compreensiva (Empática):* Concorda na dor ou situação dele, mas muda o foco.
   2. *Assertiva/Desafio (Challenger):* Que questiona ativamente o obstáculo e provoca dor/reflexão do que ele perderá se não agir.
   3. *Curiosidade Invertida:* Responde a objeção com uma pergunta sutil que o faz falar mais sobre por que ele tem essa trava, para pescar as motivações ocultas do lead.

Todas devem ser curtas, diretas. Não seja reativo nem passivo agressivo. Crie reframes da resposta de valor/resultado vs preço/tempo.`;
}
