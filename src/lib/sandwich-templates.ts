/**
 * Sandwich Analysis Templates
 * Full version (10 pages, 15 conversations) → for call-by-call analysis
 * Concise version (3 pages, aggregated) → for monthly report inclusion
 */

export const FULL_SANDWICH_PROMPT = `Faça uma análise de vendas no formato SANDUÍCHE:

1. 🟢 PONTOS POSITIVOS (o que está funcionando)
   - Mínimo 3, máximo 5 pontos
   - Baseie em evidências reais das conversas

2. 🔴 GAPS CRÍTICOS (o que precisa melhorar)
   - Mínimo 3, máximo 5 gaps
   - Seja específico: cite frases ou momentos da conversa
   - Priorize por impacto em conversão

3. 🎯 AÇÕES RECOMENDADAS (próximos passos)
   - Mínimo 3, máximo 5 ações
   - Cada ação deve ser imediatamente executável
   - Inclua scripts prontos quando possível

Também inclua:
- insights_convertidas: padrões nas conversas que resultaram em venda
- insights_perdidas: padrões nas conversas que não converteram
- score: nota geral de 0-100

Responda em JSON.`;

export const CONCISE_SANDWICH_PROMPT = `Faça uma análise RESUMIDA (formato conciso para relatório mensal) no formato SANDUÍCHE:

REGRAS:
- Máximo 150 palavras por seção
- Foco em padrões recorrentes, não casos individuais
- Tom executivo, direto ao ponto

Seções:
1. ✅ DESTAQUES DO MÊS (3 bullet points máximo)
2. ⚠️ GAPS RECORRENTES (3 bullet points máximo)
3. 🎯 FOCO DO PRÓXIMO MÊS (3 ações priorizadas)

Inclua:
- score_mensal: 0-100
- tendencia: "improving" | "declining" | "stable"
- palavra_chave: uma palavra que resume o mês (ex: "consistência", "irregularidade", "breakthrough")

Responda em JSON.`;

export interface SandwichAnalysis {
    pontos_positivos: string[];
    gaps_criticos: string[];
    acoes_recomendadas: string[];
    insights_convertidas?: string[];
    insights_perdidas?: string[];
    score: number;
}

export interface ConciseSandwich {
    destaques_mes: string[];
    gaps_recorrentes: string[];
    foco_proximo_mes: string[];
    score_mensal: number;
    tendencia: 'improving' | 'declining' | 'stable';
    palavra_chave: string;
}
