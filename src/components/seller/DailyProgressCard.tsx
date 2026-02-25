import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Minus, BarChart3, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';
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
    const deltas = useMemo<MetricDelta[]>(() => {
        if (submissions.length < 1) return [];

        const today = submissions[0];
        const yesterday = submissions.length > 1 ? submissions[1] : null;

        const todayMetrics = (today.metrics || {}) as Record<string, number>;
        const yesterdayMetrics = (yesterday?.metrics || {}) as Record<string, number>;

        const fields = sellerType === 'seller'
            ? [
                { key: 'approaches', label: 'Abordagens', emoji: '💬' },
                { key: 'followups', label: 'Follow-ups', emoji: '🔄' },
                { key: 'proposals', label: 'Propostas', emoji: '📋' },
                { key: 'sales', label: 'Vendas', emoji: '🎯' },
            ]
            : [
                { key: 'calls_made', label: 'Calls', emoji: '📞' },
                { key: 'proposals_sent', label: 'Propostas', emoji: '📋' },
                { key: 'sales_closed', label: 'Vendas', emoji: '🎯' },
                { key: 'conversion_rate', label: 'Conversão %', emoji: '📈' },
            ];

        return fields.map(f => {
            const current = Number(todayMetrics[f.key]) || 0;
            const previous = Number(yesterdayMetrics[f.key]) || 0;
            const delta = current - previous;
            // Alert if key metric drops (followups, calls_made, approaches)
            const alertKeys = ['followups', 'calls_made', 'approaches'];
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
            </CardContent>
        </Card>
    );
}
