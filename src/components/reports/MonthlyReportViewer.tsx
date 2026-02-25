import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Building,
    Phone,
    Target,
    TrendingUp,
    TrendingDown,
    CheckCircle,
    AlertTriangle,
    Zap,
} from 'lucide-react';

interface PerspectiveData {
    resumo: string;
    destaques: string[];
    gaps: string[];
    score: number;
}

interface MonthlyMetrics {
    type: 'monthly';
    month: number;
    year: number;
    empresa: PerspectiveData;
    closer: PerspectiveData;
    seller: PerspectiveData;
    tendencia: string;
    palavra_chave: string;
    calls_count: number;
    avg_call_score: number | null;
    seller_checkins: number;
    weekly_scores: { week: string; score: number }[];
}

interface MonthlyReportViewerProps {
    metrics: MonthlyMetrics;
    overallScore: number | null;
    actions: { acao: string; prioridade: string }[];
}

const MONTH_NAMES = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

function PerspectiveCard({ data, icon: Icon, label, color }: {
    data: PerspectiveData;
    icon: typeof Building;
    label: string;
    color: string;
}) {
    return (
        <div className="space-y-4">
            {/* Score */}
            <div className={`p-4 rounded-xl bg-gradient-to-r ${color} border border-border/50`}>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Icon className="h-5 w-5" />
                        <span className="font-semibold">{label}</span>
                    </div>
                    <span className="text-2xl font-mono font-bold">{data.score}<span className="text-sm text-muted-foreground">/100</span></span>
                </div>
                <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{data.resumo}</p>
            </div>

            {/* Highlights & Gaps */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {data.destaques?.length > 0 && (
                    <div className="p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/20">
                        <p className="text-xs font-medium text-emerald-400 uppercase tracking-wider mb-2">Destaques</p>
                        <ul className="space-y-1.5">
                            {data.destaques.map((d, i) => (
                                <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                                    <CheckCircle className="h-3 w-3 text-emerald-400 mt-0.5 shrink-0" />
                                    {d}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
                {data.gaps?.length > 0 && (
                    <div className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/20">
                        <p className="text-xs font-medium text-amber-400 uppercase tracking-wider mb-2">Gaps</p>
                        <ul className="space-y-1.5">
                            {data.gaps.map((g, i) => (
                                <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                                    <AlertTriangle className="h-3 w-3 text-amber-400 mt-0.5 shrink-0" />
                                    {g}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
        </div>
    );
}

export function MonthlyReportViewer({ metrics, overallScore, actions }: MonthlyReportViewerProps) {
    const TrendIcon = metrics.tendencia === 'improving' ? TrendingUp :
        metrics.tendencia === 'declining' ? TrendingDown : Target;

    const trendLabel = metrics.tendencia === 'improving' ? 'Em Alta' :
        metrics.tendencia === 'declining' ? 'Em Queda' : 'Estável';

    const trendColor = metrics.tendencia === 'improving' ? 'text-emerald-400' :
        metrics.tendencia === 'declining' ? 'text-red-400' : 'text-amber-400';

    return (
        <div className="space-y-4">
            {/* Header */}
            <Card className="nc-card-border bg-card overflow-hidden">
                <div className="p-6 bg-gradient-to-r from-solar/5 to-transparent">
                    <div className="flex items-center justify-between flex-wrap gap-4">
                        <div>
                            <p className="text-xs text-muted-foreground uppercase tracking-wider">Relatório Mensal</p>
                            <p className="text-2xl font-bold mt-1">
                                {MONTH_NAMES[metrics.month - 1]} {metrics.year}
                            </p>
                            <div className="flex items-center gap-3 mt-2">
                                <Badge variant="outline" className="gap-1">
                                    <TrendIcon className={`h-3 w-3 ${trendColor}`} />
                                    {trendLabel}
                                </Badge>
                                <Badge variant="outline" className="text-solar border-solar/30">
                                    #{metrics.palavra_chave}
                                </Badge>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-4xl font-mono font-bold text-solar">
                                {overallScore || '—'}
                                <span className="text-base text-muted-foreground font-normal">/100</span>
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                                {metrics.calls_count} calls • {metrics.seller_checkins} check-ins
                            </p>
                        </div>
                    </div>
                </div>
            </Card>

            {/* 3 Tabs */}
            <Tabs defaultValue="empresa" className="space-y-4">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="empresa" className="gap-2 text-xs sm:text-sm">
                        <Building className="h-3.5 w-3.5" />
                        Empresa
                    </TabsTrigger>
                    <TabsTrigger value="closer" className="gap-2 text-xs sm:text-sm">
                        <Phone className="h-3.5 w-3.5" />
                        Closer
                    </TabsTrigger>
                    <TabsTrigger value="seller" className="gap-2 text-xs sm:text-sm">
                        <Target className="h-3.5 w-3.5" />
                        Seller
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="empresa">
                    <PerspectiveCard
                        data={metrics.empresa}
                        icon={Building}
                        label="Empresa"
                        color="from-blue-500/10 to-cyan-500/10"
                    />
                </TabsContent>

                <TabsContent value="closer">
                    <PerspectiveCard
                        data={metrics.closer}
                        icon={Phone}
                        label="Closer"
                        color="from-emerald-500/10 to-green-500/10"
                    />
                </TabsContent>

                <TabsContent value="seller">
                    <PerspectiveCard
                        data={metrics.seller}
                        icon={Target}
                        label="Seller"
                        color="from-amber-500/10 to-orange-500/10"
                    />
                </TabsContent>
            </Tabs>

            {/* Actions for Next Month */}
            {actions?.length > 0 && (
                <Card className="nc-card-border bg-card">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base flex items-center gap-2">
                            <Zap className="h-4 w-4 text-solar" />
                            Ações para o Próximo Mês
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {actions.map((action, i) => (
                                <div key={i} className="flex items-start gap-3 p-2 rounded-lg bg-muted/30">
                                    <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${action.prioridade === 'alta' ? 'bg-red-400' : 'bg-amber-400'
                                        }`} />
                                    <p className="text-sm">{action.acao}</p>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
