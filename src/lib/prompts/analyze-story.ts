export function getAnalyzeStoryPrompt(): string {
    return `CAPABILITY_MODE: ANALYZE_STORY

A partir do Story (imagem ou contexto) fornecido:

1. **IDENTIFICAÇÃO DE CONTEXTO:** Descreva qual o tema central do story, o sentimento dele (alegre, trabalho, irritação, humor) e qual o "gancho" que a pessoa deixou para interação.
2. **OPÇÕES DE RESPOSTA:** Escreva 2 ou 3 abordagens curtas (Replies) para esse Story.
   - O objetivo é iniciar uma conversa de forma neutra e orgânica, gerando no lead a vontade de responder à sua reply.
   - Não mencione o seu produto ou faça "pitch" num story, a menos que o story do lead seja explicitamente sobre ter uma dor/problema que seu produto resolve.
   - A resposta deve soar humana e não como um bot.`;
}
