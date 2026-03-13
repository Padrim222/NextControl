import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
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

    const runAnalysis = async () => {
        if (reports.length === 0) {
            toast.error('Nenhum relatório disponível para análise.');
            return;
        }

        setIsAnalyzing(true);
        try {
            const latestReportId = reports[0].id; // Assuming reports are sorted descending

            const { data, error } = await supabase.functions.invoke('head-agent', {
                body: { report_id: latestReportId }
            });

            if (error) throw error;

            const aiAnalysis: Partial<HeadAgentAnalysis> = {
                operational_notes: data.operational_analysis,
                tactical_notes: data.tactical_analysis,
                errors_identified: data.errors_identified,
                new_strategies: data.new_strategies,
                suggested_scripts: data.suggested_scripts,
                response_time_score: data.score, // Map score to multiple if needed, but for now 
                script_adherence_score: data.score,
                organization_score: data.score,
                status: 'draft'
            };

            setAnalysis(aiAnalysis);
            onAnalysisGenerated?.(aiAnalysis);
            toast.success('Análise do Head Agent concluída!');
        } catch (err: any) {
            console.error('Head Agent Error:', err);
            toast.error(`Falha na análise: ${err.message || 'Erro de conexão'}`);
        } finally {
            setIsAnalyzing(false);
        }
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
                        {/* Summary Scores */}
                        <div className="flex items-center gap-6 p-4 rounded-xl bg-purple-500/5 border border-purple-500/10">
                            <div className="text-center">
                                <p className="text-3xl font-mono font-bold text-purple-500">{analysis.response_time_score || 0}</p>
                                <p className="text-[10px] text-muted-foreground uppercase">Score Final</p>
                            </div>
                            <div className="flex-1 space-y-2">
                                <h4 className="text-sm font-semibold">Resumo do Head</h4>
                                <p className="text-xs text-muted-foreground leading-relaxed italic">
                                    "{analysis.operational_notes?.substring(0, 150)}..."
                                </p>
                            </div>
                        </div>

                        {/* Operational Analysis */}
                        <div>
                            <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                                <Clock className="h-4 w-4 text-blue-500" />
                                1. Análise Operacional
                            </h4>
                            <div className="bg-blue-500/5 border border-blue-500/20 rounded-lg p-3 text-sm text-muted-foreground leading-relaxed">
                                {analysis.operational_notes}
                            </div>
                        </div>

                        {/* Tactical Analysis */}
                        <div>
                            <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                                <Target className="h-4 w-4 text-orange-500" />
                                2. Análise Tática
                            </h4>
                            <div className="bg-orange-500/5 border border-orange-500/20 rounded-lg p-3 text-sm text-muted-foreground leading-relaxed">
                                {analysis.tactical_notes}
                            </div>
                        </div>

                        {/* Errors */}
                        {analysis.errors_identified && (
                            <div>
                                <h4 className="text-sm font-semibold mb-2 flex items-center gap-2 text-red-500">
                                    <AlertTriangle className="h-4 w-4" />
                                    Erros & Desvios (RAG)
                                </h4>
                                <div className="bg-red-500/5 border border-red-500/20 rounded-lg p-3 text-xs text-muted-foreground whitespace-pre-wrap">
                                    {analysis.errors_identified}
                                </div>
                            </div>
                        )}

                        {/* Strategies */}
                        {analysis.new_strategies && (
                            <div>
                                <h4 className="text-sm font-semibold mb-2 flex items-center gap-2 text-green-500">
                                    <TrendingUp className="h-4 w-4" />
                                    Novas Estratégias Sugeridas
                                </h4>
                                <div className="bg-green-500/5 border border-green-500/20 rounded-lg p-3 text-xs text-muted-foreground whitespace-pre-wrap">
                                    {analysis.new_strategies}
                                </div>
                            </div>
                        )}

                        {/* Scripts */}
                        {analysis.suggested_scripts && (
                            <div>
                                <h4 className="text-sm font-semibold mb-2 flex items-center gap-2 text-blue-500">
                                    <FileText className="h-4 w-4" />
                                    Scripts para Aplicação
                                </h4>
                                <div className="bg-blue-500/5 border border-blue-500/20 rounded-lg p-3 text-xs text-muted-foreground font-mono">
                                    {analysis.suggested_scripts}
                                </div>
                            </div>
                        )}

                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => { setAnalysis(null); }}
                            className="w-full border-purple-500/20 hover:bg-purple-500/10"
                        >
                            Refazer Análise
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
