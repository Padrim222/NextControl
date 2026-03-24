import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/Spinner';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import {
    ArrowLeft,
    Calendar,
    Download,
    FileText,
    TrendingUp,
    TrendingDown,
    Target,
    CheckCircle,
    AlertTriangle,
    ChevronRight,
    BarChart3,
    Sparkles,
} from 'lucide-react';

interface WeeklyReport {
    id: string;
    client_id: string;
    seller_id: string | null;
    week_start: string;
    week_end: string;
    call_summaries: any[];
    checklist_actions: any[];
    metrics_summary: {
        totals?: Record<string, number>;
        calls_count?: number;
        avg_call_score?: number | null;
        executive_summary?: string;
        highlights?: string[];
        improvements?: string[];
        trend?: string;
    };
    overall_score: number | null;
    highlights: string[];
    improvements: string[];
    admin_approved: boolean;
    client_visible: boolean;
    pdf_url: string | null;
    created_at: string;
}

const TREND_CONFIG = {
    improving: { label: 'Em Alta', icon: TrendingUp, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    declining: { label: 'Em Queda', icon: TrendingDown, color: 'text-red-400', bg: 'bg-red-500/10' },
    stable: { label: 'Estável', icon: Target, color: 'text-amber-400', bg: 'bg-amber-500/10' },
};

export default function WeeklyReportPage() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [reports, setReports] = useState<WeeklyReport[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedReport, setSelectedReport] = useState<WeeklyReport | null>(null);

    useEffect(() => {
        fetchReports();
    }, [user]);

    const fetchReports = async () => {
        if (!user) return;
        setIsLoading(true);
        try {
            // Client sees only approved/visible reports
            const { data, error } = await supabase
                .from('weekly_analysis_reports')
                .select('*')
                .eq('client_visible', true)
                .order('week_start', { ascending: false })
                .limit(20);

            if (error) throw error;
            setReports(data || []);
            if (data?.length > 0 && !selectedReport) {
                setSelectedReport(data[0]);
            }
        } catch (err) {
            console.error('Error fetching weekly reports:', err);
            toast.error('Erro ao carregar relatórios');
        } finally {
            setIsLoading(false);
        }
    };

    const formatWeek = (start: string, end: string) => {
        const s = new Date(start + 'T12:00:00');
        const e = new Date(end + 'T12:00:00');
        return `${s.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })} — ${e.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}`;
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Spinner size="md" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background p-6">
            <div className="max-w-6xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => navigate('/client')}
                        className="shrink-0"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold">
                            Relatório <span className="nc-gradient-text">Semanal</span> 📊
                        </h1>
                        <p className="text-muted-foreground text-sm mt-1">
                            Análise consolidada de performance semanal da sua operação
                        </p>
                    </div>
                </div>

                {reports.length === 0 ? (
                    <Card className="nc-card-border bg-card">
                        <CardContent className="py-16 text-center">
                            <FileText className="h-12 w-12 mx-auto mb-4 opacity-30" />
                            <p className="text-lg font-medium mb-1">Nenhum relatório disponível</p>
                            <p className="text-sm text-muted-foreground">
                                Relatórios semanais aparecerão aqui após serem aprovados pelo admin
                            </p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Reports List */}
                        <div className="space-y-2">
                            <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">
                                Semanas
                            </h2>
                            {reports.map((report, i) => {
                                const isSelected = selectedReport?.id === report.id;
                                const trend = report.metrics_summary?.trend as keyof typeof TREND_CONFIG;
                                const trendInfo = TREND_CONFIG[trend] || TREND_CONFIG.stable;
                                const TrendIcon = trendInfo.icon;

                                return (
                                    <motion.button
                                        key={report.id}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: i * 0.05 }}
                                        onClick={() => setSelectedReport(report)}
                                        className={`w-full text-left p-3 rounded-xl border transition-all ${isSelected
                                            ? 'border-primary bg-primary/5'
                                            : 'border-border/50 bg-card hover:border-primary/30'
                                            }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-sm font-medium flex items-center gap-2">
                                                    <Calendar className="h-3.5 w-3.5 text-solar" />
                                                    {formatWeek(report.week_start, report.week_end)}
                                                </p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    {report.overall_score && (
                                                        <Badge variant="outline" className="text-[10px] gap-1 text-solar border-solar/30">
                                                            {report.overall_score}/100
                                                        </Badge>
                                                    )}
                                                    <TrendIcon className={`h-3 w-3 ${trendInfo.color}`} />
                                                </div>
                                            </div>
                                            <ChevronRight className={`h-4 w-4 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
                                        </div>
                                    </motion.button>
                                );
                            })}
                        </div>

                        {/* Report Detail */}
                        <div className="lg:col-span-2 space-y-4">
                            {selectedReport && (
                                <>
                                    {/* Score Header */}
                                    <Card className="nc-card-border bg-card overflow-hidden">
                                        <div className="p-6 bg-gradient-to-r from-solar/5 to-transparent">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="text-xs text-muted-foreground uppercase tracking-wider">
                                                        Score Semanal
                                                    </p>
                                                    <p className="text-4xl font-mono font-bold text-solar mt-1">
                                                        {selectedReport.overall_score || '—'}
                                                        <span className="text-base text-muted-foreground font-normal">/100</span>
                                                    </p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-xs text-muted-foreground">
                                                        {formatWeek(selectedReport.week_start, selectedReport.week_end)}
                                                    </p>
                                                    {selectedReport.metrics_summary?.calls_count != null && (
                                                        <p className="text-sm mt-1">
                                                            <span className="font-bold">{selectedReport.metrics_summary.calls_count}</span>{' '}
                                                            calls analisadas
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </Card>

                                    {/* Executive Summary */}
                                    {selectedReport.metrics_summary?.executive_summary && (
                                        <Card className="nc-card-border bg-card">
                                            <CardHeader className="pb-2">
                                                <CardTitle className="text-base flex items-center gap-2">
                                                    <Sparkles className="h-4 w-4 text-solar" />
                                                    Resumo Executivo
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                <p className="text-sm text-muted-foreground leading-relaxed">
                                                    {selectedReport.metrics_summary.executive_summary}
                                                </p>
                                            </CardContent>
                                        </Card>
                                    )}

                                    {/* Highlights & Improvements */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {selectedReport.highlights?.length > 0 && (
                                            <Card className="nc-card-border bg-card">
                                                <CardHeader className="pb-2">
                                                    <CardTitle className="text-sm flex items-center gap-2 text-emerald-400">
                                                        <CheckCircle className="h-4 w-4" />
                                                        Destaques
                                                    </CardTitle>
                                                </CardHeader>
                                                <CardContent>
                                                    <ul className="space-y-2">
                                                        {selectedReport.highlights.map((h, i) => (
                                                            <li key={i} className="text-xs text-muted-foreground flex items-start gap-2">
                                                                <CheckCircle className="h-3 w-3 text-emerald-400 mt-0.5 shrink-0" />
                                                                {h}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </CardContent>
                                            </Card>
                                        )}

                                        {selectedReport.improvements?.length > 0 && (
                                            <Card className="nc-card-border bg-card">
                                                <CardHeader className="pb-2">
                                                    <CardTitle className="text-sm flex items-center gap-2 text-amber-400">
                                                        <AlertTriangle className="h-4 w-4" />
                                                        Áreas de Melhoria
                                                    </CardTitle>
                                                </CardHeader>
                                                <CardContent>
                                                    <ul className="space-y-2">
                                                        {selectedReport.improvements.map((imp, i) => (
                                                            <li key={i} className="text-xs text-muted-foreground flex items-start gap-2">
                                                                <Target className="h-3 w-3 text-amber-400 mt-0.5 shrink-0" />
                                                                {imp}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </CardContent>
                                            </Card>
                                        )}
                                    </div>

                                    {/* Checklist Actions */}
                                    {selectedReport.checklist_actions?.length > 0 && (
                                        <Card className="nc-card-border bg-card">
                                            <CardHeader className="pb-2">
                                                <CardTitle className="text-base flex items-center gap-2">
                                                    <BarChart3 className="h-4 w-4 text-solar" />
                                                    Plano de Ação da Semana
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="space-y-2">
                                                    {selectedReport.checklist_actions.map((action: any, i: number) => (
                                                        <div key={i} className="flex items-start gap-3 p-2 rounded-lg bg-muted/30">
                                                            <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${action.prioridade === 'alta' ? 'bg-red-400' :
                                                                action.prioridade === 'media' ? 'bg-amber-400' : 'bg-emerald-400'
                                                                }`} />
                                                            <div className="flex-1">
                                                                <p className="text-sm">{action.acao}</p>
                                                                <div className="flex gap-2 mt-1">
                                                                    <Badge variant="outline" className="text-[10px]">
                                                                        {action.categoria}
                                                                    </Badge>
                                                                    <Badge variant="outline" className={`text-[10px] ${action.prioridade === 'alta' ? 'text-red-400 border-red-500/30' :
                                                                        action.prioridade === 'media' ? 'text-amber-400 border-amber-500/30' :
                                                                            'text-emerald-400 border-emerald-500/30'
                                                                        }`}>
                                                                        {action.prioridade}
                                                                    </Badge>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </CardContent>
                                        </Card>
                                    )}

                                    {/* Call Summaries */}
                                    {selectedReport.call_summaries?.length > 0 && (
                                        <Card className="nc-card-border bg-card">
                                            <CardHeader className="pb-2">
                                                <CardTitle className="text-base flex items-center gap-2">
                                                    📞 Calls da Semana
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="space-y-2">
                                                    {selectedReport.call_summaries.map((call: any, i: number) => (
                                                        <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                                                            <div>
                                                                <p className="text-sm font-medium">{call.prospect}</p>
                                                                <p className="text-xs text-muted-foreground">
                                                                    {new Date(call.date + 'T12:00:00').toLocaleDateString('pt-BR')}
                                                                    {call.duration && ` • ${call.duration}min`}
                                                                </p>
                                                            </div>
                                                            {call.score && (
                                                                <Badge variant="outline" className="text-solar border-solar/30">
                                                                    {call.score}/100
                                                                </Badge>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            </CardContent>
                                        </Card>
                                    )}

                                    {/* PDF Download */}
                                    {selectedReport.pdf_url && (
                                        <Button asChild variant="outline" className="w-full gap-2">
                                            <a href={selectedReport.pdf_url} target="_blank" rel="noopener noreferrer">
                                                <Download className="h-4 w-4" />
                                                Baixar PDF do Relatório
                                            </a>
                                        </Button>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
