export function getAnalyzeLeadCardPrompt(): string {
    return `CAPABILITY_MODE: ANALYZE_LEAD_CARD

Um Closer lhe forneceu dados de um Lead advindos do CRM.

1. **ASSIMILAÇÃO DO PERFIL DO CLIENTE (LEAD CARD):** Analise o descritivo de quem é o prospect, o cargo dele (decisor, analista, etc), histórico do funil, tamanho da empresa ou da conta corrente e eventuais dores de negócio já previamente colhidas pelo SDR (Pré-vendas).
2. **ANÁLISE DE GAPS DE INFORMAÇÃO:** Como todo "Agente Closer de Elite", o que está explicitamente faltando de informação no Card (orçamento claro, dores reais dos gargalos de operação dele, processo de tomada de decisão, etc). Mapeie o que o Closer fatalmente NÃO sabe ainda sobre este prospect para não queimar cartucho cedo demais.
3. **PRÓXIMOS PASSOS IMEDIATOS:** Quais os 3 próximos grandes passos que o Gestor Comercial deve focar antes e durante o pitch, baseado unicamente em fechar a vulnerabilidade desse Lead.
Sugira ganchos e pontes precisas (Ice-breakers qualificados baseados no card do CRM) para o Closer usar na call/follow-up de fechamento.`;
}
