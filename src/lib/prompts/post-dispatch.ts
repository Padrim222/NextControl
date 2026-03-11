export function getPostDispatchPrompt(vendedorScript: string = ''): string {
    return `CAPABILITY_MODE: POST_DISPATCH

O vendedor realizou um DISPARO de prospecção (um contato frio/morno automatizado ou semi-automático) e obteve a primeira resposta/engajamento do lead anexada no contexto atual.
O seu script/pitch original de disparo era o seguinte (Se listado abaixo, baseie-se na oferta e estilo dele; senão deduza do contexto da conversa):
\${vendedorScript ? vendedorScript : "Sem modelo de script fornecido."}

1. **NÍVEL DE ENGAJAMENTO DA RESPOSTA:** Ele apenas reagiu, respondeu cordialmente sem ação clara, ou expressou forte interesse ("me conte mais", "como funciona")?
2. **SCRIPT DE CONDUÇÃO/FOLLOW UP:** O que o vendedor deve replicar agora, de forma orgânica? Especifique 2 opções personalizadas de follow-up pós disparo.
   - O vendedor tem de QUALIFICAR o lead rapidamente (qual o tamanho da dor?) sem ceder todas as informações técnicas ou preços na primeira interação.
   - Force o lead a reconhecer uma pequena dor ou curiosidade (gerando um mini 'sim').`;
}
