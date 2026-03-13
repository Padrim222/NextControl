export function getAnalyzeConversationPrompt(contextExtracted: string = ''): string {
    return `CAPABILITY_MODE: ANALYZE_CONVERSATION

Com base na conversa atual de chat (texto provido ou extraído do print da imagem):
\${contextExtracted}

1. **DIAGNÓSTICO DA CONVERSA:** Em qual fase da prospecção/abordagem o cliente aparenta estar (frio/ocupado, morno/curioso, quente/dores latentes)? Identifique possíveis objeções silenciosas. O cliente parece engajado?
2. **PRÓXIMOS PASSOS ESTÁTICOS:** Qual a atitude recomendada na próxima mensagem para não perder/esfriar o lead?
3. **MÍNI-SUGESTÃO DE MENSAGENS (2 OPÇÕES):** Escreva duas (2) abordagens que empurrem o lead levemente para se comprometer a uma call/etapa posterior da metodologia, sendo 1 mais branda (se ele for resistente/frio) e 1 um pouco mais assertiva (se ele já demonstrou pequena dor).`;
}
