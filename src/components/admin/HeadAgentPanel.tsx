import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
    Brain,
    Clock,
    Target,
    FileText,
    AlertTriangle,
    CheckCircle,
    TrendingUp,
} from '@/components/ui/icons';
import type { DailyReport, CallLog, HeadAgentAnalysis } from '@/types';

interface HeadAgentPanelProps {
    reports: DailyReport[];
    callLogs: CallLog[];
    sellerName: string;
    clientName: string;
    onAnalysisGenerated?: (analysis: Partial<HeadAgentAnalysis>) => void;
}

export function HeadAgentPanel({
    reports,
    callLogs,
    sellerName,
    clientName,
    onAnalysisGenerated,
}: HeadAgentPanelProps) {
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysis, setAnalysis] = useState<Partial<HeadAgentAnalysis> | null>(null);

    const runAnalysis = () => {
        setIsAnalyzing(true);

        // Simulate analysis delay for UX
        setTimeout(() => {
            const generated = generateHeadAnalysis(reports, callLogs);
            setAnalysis(generated);
            onAnalysisGenerated?.(generated);
            setIsAnalyzing(false);
        }, 1500);
    };

    const generateHeadAnalysis = (
        reps: DailyReport[],
        logs: CallLog[]
    ): Partial<HeadAgentAnalysis> => {
        // Operational Analysis
        const avgFollowups = reps.length > 0
            ? reps.reduce((acc, r) => acc + r.followups, 0) / reps.length
            : 0;
        const avgCapturas = reps.length > 0
            ? reps.reduce((acc, r) => acc + r.capturas, 0) / reps.length
            : 0;
        const avgConexoes = reps.length > 0
            ? reps.reduce((acc, r) => acc + r.conexoes, 0) / reps.length
            : 0;

        const responseTimeScore = Math.min(10, Math.max(1, Math.round(avgFollowups / 2)));
        const scriptAdherenceScore = Math.min(10, Math.max(1, Math.round(avgCapturas > 0 ? 7 : 4)));
        const organizationScore = Math.min(10, Math.max(1, Math.round(
            reps.length >= 5 ? 8 : reps.length >= 3 ? 6 : 3
        )));

        // Tactical Analysis
        const totalSales = logs.filter(l => l.outcome === 'sale').length;
        const totalCalls = logs.length;
        const conversionRate = totalCalls > 0 ? (totalSales / totalCalls) * 100 : 0;
        const correctProductOffered = conversionRate > 20;
        const methodologyFollowed = avgConexoes > 3 && avgFollowups > 2;

        // Generate recommendations
        const errors: string[] = [];
        const strategies: string[] = [];
        const scripts: string[] = [];

        if (avgFollowups < 3) {
            errors.push('Baixa frequência de follow-ups — leads podem estar esfriando');
            strategies.push('Implementar cadência de follow-up: 24h → 48h → 72h');
            scripts.push('Olá [Nome], vi que você demonstrou interesse em [Produto]. Gostaria de agendar uma conversa rápida?');
        }

        if (conversionRate < 15) {
            errors.push(`Taxa de conversão baixa (${conversionRate.toFixed(1)}%) — revisar pitch`);
            strategies.push('Focar em qualificação antes da call: BANT (Budget, Authority, Need, Timeline)');
        }

        if (avgConexoes < avgCapturas * 2) {
            strategies.push('Aumentar volume de conexões para melhorar pipeline');
        }

        if (!methodologyFollowed) {
            errors.push('Metodologia não seguida consistentemente');
            scripts.push('Usar template de descoberta: 1) Situação Atual → 2) Dores → 3) Impacto → 4) Solução');
        }

        scripts.push('Script de reaquecimento: "[Nome], notei que faz X dias desde nosso último contato. Como está o cenário de [dor levantada]?"');
        strategies.push('Criar micro-conteúdo de nutrição (2-3 posts/semana) para manter leads aquecidos');

        return {
            response_time_score: responseTimeScore,
            script_adherence_score: scriptAdherenceScore,
            organization_score: organizationScore,
            operational_notes: `Seller: ${sellerName} | Cliente: ${clientName} | ${reps.length} relatórios analisados | ${logs.length} calls analisadas`,
            correct_product_offered: correctProductOffered,
            methodology_followed: methodologyFollowed,
            tactical_notes: `Conv. rate: ${conversionRate.toFixed(1)}% | Avg follow-ups: ${avgFollowups.toFixed(1)} | Avg conexões: ${avgConexoes.toFixed(1)}`,
            suggested_scripts: scripts.join('\n\n---\n\n'),
            new_strategies: strategies.join('\n'),
            errors_identified: errors.join('\n'),
            status: 'draft',
            sent_via_whatsapp: false,
        };
    };

    const ScoreBar = ({ score, label, icon: Icon }: { score: number; label: string; icon: typeof Clock }) => (
        <div className="flex items-center gap-3">
            <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
            <div className="flex-1">
                <div className="flex justify-between text-xs mb-1">
                    <span>{label}</span>
                    <span className="font-bold">{score}/10</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                        className={`h-full rounded-full transition-all duration-700 ${score >= 7 ? 'bg-green-500' : score >= 4 ? 'bg-yellow-500' : 'bg-red-500'
                            }`}
                        style={{ width: `${score * 10}%` }}
                    />
                </div>
            </div>
        </div>
    );

    return (
        <Card className="sf-card-glow border-purple-500/20">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Brain className="h-5 w-5 text-purple-500" />
                    Agente Head Automatizado
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                    Análise operacional + tática dos relatórios e calls
                </p>
            </CardHeader>
            <CardContent>
                {!analysis ? (
                    <div className="text-center py-8">
                        <Brain className="h-12 w-12 mx-auto mb-3 text-purple-500/30" />
                        <p className="text-sm text-muted-foreground mb-4">
                            Clique para rodar a análise automatizada
                        </p>
                        <Button
                            onClick={runAnalysis}
                            disabled={isAnalyzing}
                            className="bg-purple-600 hover:bg-purple-700"
                        >
                            {isAnalyzing ? (
                                <>
                                    <Brain className="h-4 w-4 mr-2 animate-pulse" />
                                    Analisando...
                                </>
                            ) : (
                                <>
                                    <Brain className="h-4 w-4 mr-2" />
                                    Rodar Análise IA
                                </>
                            )}
                        </Button>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {/* Operational Analysis */}
                        <div>
                            <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                                <Clock className="h-4 w-4 text-blue-500" />
                                1. Análise Operacional
                            </h4>
                            <div className="space-y-3">
                                <ScoreBar score={analysis.response_time_score!} label="Tempo de Resposta" icon={Clock} />
                                <ScoreBar score={analysis.script_adherence_score!} label="Aderência ao Script" icon={FileText} />
                                <ScoreBar score={analysis.organization_score!} label="Organização" icon={Target} />
                            </div>
                        </div>

                        {/* Tactical Analysis */}
                        <div>
                            <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                                <Target className="h-4 w-4 text-orange-500" />
                                2. Análise Tática
                            </h4>
                            <div className="grid grid-cols-2 gap-3">
                                <div className={`p-3 rounded-lg border ${analysis.correct_product_offered ? 'bg-green-500/5 border-green-500/20' : 'bg-red-500/5 border-red-500/20'}`}>
                                    <div className="flex items-center gap-2 mb-1">
                                        {analysis.correct_product_offered ? (
                                            <CheckCircle className="h-4 w-4 text-green-500" />
                                        ) : (
                                            <AlertTriangle className="h-4 w-4 text-red-500" />
                                        )}
                                        <span className="text-xs font-medium">Produto Certo?</span>
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        {analysis.correct_product_offered ? 'Sim — boa assertividade' : 'Não — revisar oferta'}
                                    </p>
                                </div>
                                <div className={`p-3 rounded-lg border ${analysis.methodology_followed ? 'bg-green-500/5 border-green-500/20' : 'bg-red-500/5 border-red-500/20'}`}>
                                    <div className="flex items-center gap-2 mb-1">
                                        {analysis.methodology_followed ? (
                                            <CheckCircle className="h-4 w-4 text-green-500" />
                                        ) : (
                                            <AlertTriangle className="h-4 w-4 text-red-500" />
                                        )}
                                        <span className="text-xs font-medium">Metodologia?</span>
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        {analysis.methodology_followed ? 'Seguiu corretamente' : 'Desvio identificado'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Errors */}
                        {analysis.errors_identified && (
                            <div>
                                <h4 className="text-sm font-semibold mb-2 flex items-center gap-2 text-red-500">
                                    <AlertTriangle className="h-4 w-4" />
                                    Erros Identificados
                                </h4>
                                <div className="bg-red-500/5 border border-red-500/20 rounded-lg p-3">
                                    {analysis.errors_identified.split('\n').map((err, i) => (
                                        <p key={i} className="text-xs text-muted-foreground mb-1">• {err}</p>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Strategies */}
                        {analysis.new_strategies && (
                            <div>
                                <h4 className="text-sm font-semibold mb-2 flex items-center gap-2 text-green-500">
                                    <TrendingUp className="h-4 w-4" />
                                    Estratégias Novas
                                </h4>
                                <div className="bg-green-500/5 border border-green-500/20 rounded-lg p-3">
                                    {analysis.new_strategies.split('\n').map((strat, i) => (
                                        <p key={i} className="text-xs text-muted-foreground mb-1">✨ {strat}</p>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Scripts */}
                        {analysis.suggested_scripts && (
                            <div>
                                <h4 className="text-sm font-semibold mb-2 flex items-center gap-2 text-blue-500">
                                    <FileText className="h-4 w-4" />
                                    Scripts Sugeridos
                                </h4>
                                <div className="bg-blue-500/5 border border-blue-500/20 rounded-lg p-3">
                                    {analysis.suggested_scripts.split('\n\n---\n\n').map((script, i) => (
                                        <div key={i} className="mb-2 pb-2 border-b border-blue-500/10 last:border-0 last:mb-0 last:pb-0">
                                            <p className="text-xs text-muted-foreground italic">"{script}"</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => { setAnalysis(null); }}
                            className="w-full"
                        >
                            Refazer Análise
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
