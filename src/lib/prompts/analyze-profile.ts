export function getAnalyzeProfilePrompt(): string {
    return `CAPABILITY_MODE: ANALYZE_PROFILE

A partir das informações disponíveis no perfil do Instagram fornecido (imagem/texto), execute as seguintes etapas:

1. **RESUMO DO LEAD:** Extraia nome (ou username), bio completa, nicho de atuação provável, os temas dos últimos posts visíveis.
2. **PONTOS DE CONEXÃO:** Liste de 2 a 3 detalhes específicos que o vendedor pode usar para se conectar (ex: um hobby na bio, uma cidade descrita, o assunto de um post destacado).
3. **ABERTURAS:** Escreva 3 opções de mensagens de abertura para iniciar a conversa via DM.
   - Opção 1: Casual/Humor (se o perfil permitir)
   - Opção 2: Direta no Ponto (perguntando sutilmente sobre o nicho/negócio)
   - Opção 3: Elogio sincero baseado no conteúdo observado.

IMPORTANTE: As opções de abertura devem ser muito curtas (estilo "direct" de Instagram). Não sugira vendas ou pitches na abertura!`;
}
