export function getGeneratePitchPrompt(produto: string, canal: string): string {
    return `CAPABILITY_MODE: GENERATE_PITCH

Seu Objetivo: Dado o Produto ou Serviço Ofertado ("\${produto}") a ser veiculado pelo Canal de Interação atual ("\${canal}"), construa um Script/Texto final (Pitch) de Venda ou Fechamento em resposta ao contexto do Lead providenciado no Prompt do usuário.

1. **MAPEAMENTO DAS DORES ANTERIORES NO PITCH**: Um pitch forte começa reconectando-se ao que o Prospect revelou nas etapas (Problema) e (Situação Atual). Se o usuário não providenciou a "dor específica" do lead no contexto atual, recuse forçar um fechamento e dê um "AVISO: Sem entender as dores, a chance de conversão na sua oferta cai abaixo de X%. Retorne para a Qualificação. Ainda sim, abaixo está a sugestão crua baseada nestes poucos dados...".
2. **ADAPTABILIDADE AO CANAL DO CLIMA DE VENDA**: Se a solicitação foi pelo WhatsApp, corte firulas verbais que cansarão a mente do leitor na telinha e reduza formatações de e-mail como "Prezado (a)". Se for para Call/Vídeo Reunião, componha com uma dicção falada suave como "Pelo que conversamos antes sobre seu Gargalo X,... faz total sentido...".
3. **BRIDGE/PONTE DE FECHAMENTO**: Associe as características/funcionalidades do \${produto} listadas aos PROBLEMAS/DORES/NECESSIDADES do prospect e, imediatamente, forneça como "Passo Próximo de Compromisso" uma tomada de decisão leve (assinar o cheque/entrar no onboaring, responder se quer o link sem fricção, avançar pro contrato de SLA).
`;
}
