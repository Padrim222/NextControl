import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TrendingUp, TrendingDown, Minus, BarChart3, AlertTriangle, MessageSquare } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import type { DailySubmission, SellerMetrics, CloserMetrics } from '@/types';

interface DailyProgressCardProps {
    submissions: DailySubmission[];
    sellerType?: 'seller' | 'closer';
}

interface MetricDelta {
    key: string;
    label: string;
    emoji: string;
    current: number;
    previous: number;
    delta: number;
    isAlert: boolean;
}

export function DailyProgressCard({ submissions, sellerType = 'seller' }: DailyProgressCardProps) {
    const navigate = useNavigate();

    // Proactive Insights Logic
    const insights = useMemo(() => {
        if (submissions.length < 3) return null; // Need some history

        const history = submissions.slice(1);
        const today = submissions[0];
        const todayMetrics = (today.metrics || {}) as Record<string, number>;

        const monitorKeys = sellerType === 'seller'
            ? [
                { key: 'conversations', label: 'Boas-vindas/Conversas' },
                { key: 'opportunities', label: 'Pitchs/Oportunidades' },
                { key: 'followups', label: 'Follow-ups' }
            ]
            : [
                { key: 'calls_made', label: 'Calls' },
                { key: 'proposals_sent', label: 'Propostas' },
                { key: 'sales_closed', label: 'Vendas' }
            ];

        for (const item of monitorKeys) {
            const currentValue = Number(todayMetrics[item.key]) || 0;
            const sum = history.reduce((acc, s) => acc + (Number((s.metrics as any)?.[item.key]) || 0), 0);
            const avg = sum / history.length;

            if (avg > 1 && currentValue < avg * 0.5) { // Drop of 50%+ and has some benchmark
                return {
                    severity: 'warning' as const,
                    title: `Baixo volume de ${item.label}`,
                    message: `Esta semana está com um baixo volume de ${item.label.toLowerCase()} hoje (${currentValue}) comparado à sua média (${avg.toFixed(1)}). consulte o coach!`
                };
            }
        }

        return null;
    }, [submissions, sellerType]);

    const deltas = useMemo<MetricDelta[]>(() => {
        if (submissions.length < 1) return [];

        const today = submissions[0];
        const yesterday = submissions.length > 1 ? submissions[1] : null;

        const todayMetrics = (today.metrics || {}) as Record<string, number>;
        const yesterdayMetrics = (yesterday?.metrics || {}) as Record<string, number>;

        const fields = sellerType === 'seller'
            ? [
                { key: 'followers', label: 'Seguidores', emoji: '👥' },
                { key: 'conversations', label: 'Conversas', emoji: '💬' },
                { key: 'opportunities', label: 'Oportunidades', emoji: '🎯' },
                { key: 'followups', label: 'Follow-ups', emoji: '🔄' },
            ]
            : [
                { key: 'calls_made', label: 'Calls', emoji: '📞' },
                { key: 'proposals_sent', label: 'Propostas', emoji: '📋' },
                { key: 'sales_closed', label: 'Vendas', emoji: '🎯' },
                { key: 'no_shows', label: 'No-Shows', emoji: '👻' },
            ];

        return fields.map(f => {
            const current = Number(todayMetrics[f.key]) || 0;
            const previous = Number(yesterdayMetrics[f.key]) || 0;
            const delta = current - previous;
            const alertKeys = ['followups', 'calls_made', 'conversations', 'opportunities'];
            const isAlert = alertKeys.includes(f.key) && delta < 0;

            return { ...f, current, previous, delta, isAlert };
        });
    }, [submissions, sellerType]);

    if (deltas.length === 0) return null;

    return (
        <Card className="nc-card-border bg-card overflow-hidden">
            <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-solar" />
                    Progresso vs. Ontem
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {deltas.map((metric, i) => (
                        <motion.div
                            key={metric.key}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.08 }}
                            className={`relative p-3 rounded-xl border transition-all ${metric.isAlert
                                ? 'border-red-500/30 bg-red-500/5'
                                : metric.delta > 0
                                    ? 'border-emerald-500/20 bg-emerald-500/5'
                                    : 'border-border/50 bg-card'
                                }`}
                        >
                            {/* Alert badge */}
                            {metric.isAlert && (
                                <div className="absolute -top-1.5 -right-1.5">
                                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white">
                                        <AlertTriangle className="h-3 w-3" />
                                    </span>
                                </div>
                            )}

                            <div className="flex items-center gap-1.5 mb-1">
                                <span className="text-lg">{metric.emoji}</span>
                                <span className="text-xs text-muted-foreground truncate">{metric.label}</span>
                            </div>

                            <div className="flex items-end justify-between">
                                <span className="text-2xl font-mono font-bold">{metric.current}</span>
                                {metric.delta !== 0 ? (
                                    <span className={`flex items-center gap-0.5 text-xs font-semibold ${metric.delta > 0 ? 'text-emerald-400' : 'text-red-400'
                                        }`}>
                                        {metric.delta > 0 ? (
                                            <TrendingUp className="h-3 w-3" />
                                        ) : (
                                            <TrendingDown className="h-3 w-3" />
                                        )}
                                        {metric.delta > 0 ? '+' : ''}{metric.delta}
                                    </span>
                                ) : (
                                    <span className="flex items-center gap-0.5 text-xs text-muted-foreground">
                                        <Minus className="h-3 w-3" /> 0
                                    </span>
                                )}
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Proactive Insights Banner */}
                {insights && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="mt-4 p-4 rounded-xl border border-solar/20 bg-solar/5 flex flex-col sm:flex-row gap-4 items-center sm:justify-between"
                    >
                        <div className="flex gap-3 items-center">
                            <div className="p-2 rounded-lg bg-solar/10 text-solar">
                                <AlertTriangle className="h-5 w-5" />
                            </div>
                            <div>
                                <h4 className="text-sm font-bold text-solar">{insights.title}</h4>
                                <p className="text-xs text-muted-foreground">{insights.message}</p>
                            </div>
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            className="nc-btn-ghost border-solar/30 text-solar h-9 flex-shrink-0"
                            onClick={() => navigate('/training/coach')}
                        >
                            <MessageSquare className="h-4 w-4 mr-2" />
                            Consultar Coach Yorik
                        </Button>
                    </motion.div>
                )}
            </CardContent>
        </Card>
    );
}
