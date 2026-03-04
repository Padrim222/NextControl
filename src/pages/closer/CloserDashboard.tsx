import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import {
    Phone,
    Target,
    TrendingUp,
    BarChart3,
    MessageSquare,
    Calendar,
    CheckCircle,
    Clock,
    ChevronRight,
    Percent,
    AlertTriangle,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { DailySubmission, Analysis, CloserMetrics } from '@/types';
import { FormPendingBanner } from '@/components/forms/FormPendingBanner';
import { CloserInsightsWidget } from '@/components/closer/CloserInsightsWidget';

export default function CloserDashboard() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [submissions, setSubmissions] = useState<DailySubmission[]>([]);
    const [latestAnalysis, setLatestAnalysis] = useState<Analysis | null>(null);
    const [todaySubmitted, setTodaySubmitted] = useState(false);
    const [showConversion, setShowConversion] = useState(false);
    const [timeFilter, setTimeFilter] = useState<'week' | 'month' | 'quarter'>('week');

    useEffect(() => {
        if (!user) return;
        fetchData();
    }, [user, timeFilter]);

    const fetchData = async () => {
        if (!supabase || !user) return;
        try {
            const today = new Date().toISOString().split('T')[0];
            const dateLimit = new Date();
            if (timeFilter === 'week') {
                dateLimit.setDate(dateLimit.getDate() - 7);
            } else if (timeFilter === 'month') {
                dateLimit.setDate(dateLimit.getDate() - 30);
            } else {
                dateLimit.setDate(dateLimit.getDate() - 90);
            }
            const isoLimit = dateLimit.toISOString();

            const { data: subs } = await (supabase as any)
                .from('daily_submissions')
                .select('*')
                .eq('seller_id', user.id)
                .gte('created_at', isoLimit)
                .order('submission_date', { ascending: false });

            if (subs) {
                setSubmissions(subs);
                setTodaySubmitted(subs.some((s: DailySubmission) => s.submission_date === today));
            }

            const { data: analyses } = await (supabase as any)
                .from('analyses')
                .select('*')
                .in('submission_id', (subs || []).map((s: DailySubmission) => s.id))
                .order('created_at', { ascending: false })
                .limit(1);

            if (analyses?.[0]) setLatestAnalysis(analyses[0]);
        } catch (error) {
            console.error('Error fetching data:', error);
        }
    };

    const totalCalls = submissions.reduce((acc, s) => {
        const m = s.metrics as CloserMetrics;
        return acc + (m?.calls_made || 0);
    }, 0);

    const totalProposals = submissions.reduce((acc, s) => {
        const m = s.metrics as CloserMetrics;
        return acc + (m?.proposals_sent || 0);
    }, 0);

    const totalSales = submissions.reduce((acc, s) => {
        const m = s.metrics as CloserMetrics;
        return acc + (m?.sales_closed || 0);
    }, 0);

    const conversionRate = totalCalls > 0 ? ((totalSales / totalCalls) * 100).toFixed(1) : '0';

    const stats = [
        {
            label: `Calls (${timeFilter === 'week' ? '7d' : timeFilter === 'month' ? '30d' : '90d'})`,
            value: totalCalls,
            icon: Phone,
            color: 'text-solar',
        },
        {
            label: `Propostas (${timeFilter === 'week' ? '7d' : timeFilter === 'month' ? '30d' : '90d'})`,
            value: totalProposals,
            icon: Target,
            color: 'text-nc-info',
        },
        {
            label: `Vendas (${timeFilter === 'week' ? '7d' : timeFilter === 'month' ? '30d' : '90d'})`,
            value: totalSales,
            icon: CheckCircle,
            color: 'text-nc-success',
        },
        {
            label: 'Taxa Conv.',
            value: showConversion ? `${conversionRate}%` : '***',
            icon: Percent,
            color: 'text-nc-accent',
            onClick: () => setShowConversion(!showConversion),
            isToggle: true,
        },
        {
            label: 'Status Hoje',
            value: todaySubmitted ? 'Enviado ✓' : 'Pendente',
            icon: todaySubmitted ? CheckCircle : Clock,
            color: todaySubmitted ? 'text-nc-success' : 'text-nc-warning',
        },
        {
            label: 'Último Score',
            value: latestAnalysis?.score ? `${latestAnalysis.score}/100` : '—',
            icon: Target,
            color: 'text-solar',
        },
    ];

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            {/* AI Volume Insight */}
            {submissions.length > 0 && timeFilter === 'week' && (totalCalls < 5 || totalProposals < 2) && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                >
                    <Card className="nc-card-border border-nc-warning/30 bg-nc-warning/5 overflow-hidden">
                        <CardContent className="p-4 flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-nc-warning/20 flex items-center justify-center shrink-0 text-nc-warning">
                                <AlertTriangle className="h-5 w-5" />
                            </div>
                            <div className="flex-1">
                                <h4 className="text-sm font-semibold text-nc-warning">Atenção ao Volume Semanal</h4>
                                <p className="text-xs text-muted-foreground leading-relaxed">
                                    {totalCalls < 5
                                        ? `Abaixo da meta de volume: apenas ${totalCalls} calls realizadas.`
                                        : `Baixa conversão em propostas: apenas ${totalProposals} enviadas.`}
                                    Consulte o Coach para ajustar sua abordagem e aumentar o pipe!
                                </p>
                            </div>
                            <Button
                                size="sm"
                                variant="outline"
                                className="border-nc-warning/30 hover:bg-nc-warning/10 text-xs"
                                onClick={() => navigate('/training/coach')}
                            >
                                Consultar Coach
                            </Button>
                        </CardContent>
                    </Card>
                </motion.div>
            )}
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between"
            >
                <div>
                    <h1 className="font-display text-2xl font-bold">
                        Olá, <span className="nc-gradient-text">{user?.name?.split(' ')[0]}</span>
                    </h1>
                    <p className="text-muted-foreground text-sm mt-1">
                        {todaySubmitted
                            ? '📞 Check-in de hoje enviado. Análise da call em andamento.'
                            : '⏰ Registre suas calls do dia!'}
                    </p>
                </div>

                <div className="flex flex-col items-end gap-2">
                    {/* Time filter UI */}
                    <div className="flex bg-muted p-1 rounded-lg border border-border scale-90 sm:scale-100 transform origin-right">
                        <Button
                            variant={timeFilter === 'week' ? 'default' : 'ghost'}
                            size="sm"
                            onClick={() => setTimeFilter('week')}
                            className="text-[10px] sm:text-xs h-7 sm:h-8 px-2 sm:px-3"
                        >
                            Semana
                        </Button>
                        <Button
                            variant={timeFilter === 'month' ? 'default' : 'ghost'}
                            size="sm"
                            onClick={() => setTimeFilter('month')}
                            className="text-[10px] sm:text-xs h-7 sm:h-8 px-2 sm:px-3"
                        >
                            Mês
                        </Button>
                        <Button
                            variant={timeFilter === 'quarter' ? 'default' : 'ghost'}
                            size="sm"
                            onClick={() => setTimeFilter('quarter')}
                            className="text-[10px] sm:text-xs h-7 sm:h-8 px-2 sm:px-3"
                        >
                            Trimestre
                        </Button>
                    </div>

                    <div className="flex gap-2">
                        <Button onClick={() => navigate('/seller/evolution')} variant="outline" className="nc-btn-ghost h-8 sm:h-10 text-xs sm:text-sm">
                            <TrendingUp className="h-4 w-4 mr-2" />
                            Evolução
                        </Button>
                        <Button onClick={() => navigate('/training/coach')} variant="outline" className="nc-btn-ghost h-8 sm:h-10 text-xs sm:text-sm">
                            <MessageSquare className="h-4 w-4 mr-2" />
                            Consultoria
                        </Button>
                    </div>
                </div>
            </motion.div>

            {/* Pending Form Banner */}
            <FormPendingBanner formType="closer_daily" />

            {/* FUP Insights Widget */}
            <CloserInsightsWidget />

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                {stats.map((stat, i) => (
                    <motion.div
                        key={stat.label}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                    >
                        <Card className="nc-card-border nc-card-hover bg-card">
                            <CardContent className="pt-4 pb-4 px-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <stat.icon className={`h-4 w-4 ${stat.color}`} />
                                    <span className="text-xs text-muted-foreground uppercase tracking-wider">{stat.label}</span>
                                </div>
                                <p className={`text-xl font-mono font-semibold ${stat.color}`}>
                                    {stat.value}
                                </p>
                            </CardContent>
                        </Card>
                    </motion.div>
                ))}
            </div>

            {/* Daily Submission Entry */}
            {!todaySubmitted && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
                    <Card
                        className="nc-card-border nc-card-hover bg-card cursor-pointer group"
                        onClick={() => navigate('/seller/report')}
                    >
                        <CardContent className="py-8 text-center">
                            <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-solar/10 mb-4 group-hover:bg-solar/20 transition-colors">
                                <Phone className="h-7 w-7 text-solar" />
                            </div>
                            <h3 className="text-lg font-semibold mb-1">Check-in de Closer</h3>
                            <p className="text-sm text-muted-foreground">
                                Registre calls, feedbacks e upload de gravação
                            </p>
                            <Button className="mt-4 nc-btn-primary">
                                Começar <ChevronRight className="h-4 w-4 ml-1" />
                            </Button>
                        </CardContent>
                    </Card>
                </motion.div>
            )}

            {/* Latest Coach Feedback */}
            {latestAnalysis && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
                    <Card className="nc-card-border bg-card">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base flex items-center gap-2">
                                <TrendingUp className="h-4 w-4 text-solar" />
                                Última Análise de Call
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="flex items-center gap-4">
                                <div className="text-center px-4 py-2 rounded-lg bg-solar/10">
                                    <p className="text-2xl font-mono font-bold text-solar">{latestAnalysis.score}</p>
                                    <p className="text-xs text-muted-foreground">Score</p>
                                </div>
                                <p className="text-sm text-muted-foreground flex-1 line-clamp-3">
                                    {latestAnalysis.content}
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="p-3 rounded-lg bg-nc-success/10 border border-nc-success/20">
                                    <p className="text-xs font-medium text-nc-success mb-2 uppercase">Pontos Fortes</p>
                                    <ul className="text-xs text-muted-foreground space-y-1">
                                        {latestAnalysis.strengths?.slice(0, 3).map((s, i) => (
                                            <li key={i} className="flex items-start gap-1.5">
                                                <CheckCircle className="h-3 w-3 text-nc-success mt-0.5 shrink-0" />
                                                {s}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                                <div className="p-3 rounded-lg bg-nc-warning/10 border border-nc-warning/20">
                                    <p className="text-xs font-medium text-nc-warning mb-2 uppercase">Melhorar</p>
                                    <ul className="text-xs text-muted-foreground space-y-1">
                                        {latestAnalysis.improvements?.slice(0, 3).map((s, i) => (
                                            <li key={i} className="flex items-start gap-1.5">
                                                <AlertTriangle className="h-3 w-3 text-nc-warning mt-0.5 shrink-0" />
                                                {s}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            )}

            {/* Recent Submissions */}
            {submissions.length > 0 && (
                <Card className="nc-card-border bg-card">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2">
                            <BarChart3 className="h-4 w-4 text-solar" />
                            Últimos Check-ins
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {submissions.slice(0, 5).map((sub) => {
                                const metrics = sub.metrics as CloserMetrics;
                                const convRate = metrics?.calls_made ? ((metrics.sales_closed || 0) / metrics.calls_made * 100).toFixed(1) : 0;
                                return (
                                    <div
                                        key={sub.id}
                                        className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-secondary/50 transition-colors"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-2 h-2 rounded-full bg-solar" />
                                            <span className="text-sm font-mono">{sub.submission_date}</span>
                                        </div>
                                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                            <span className="font-mono">{metrics?.calls_made || 0} calls</span>
                                            <span className="font-mono">{metrics?.sales_closed || 0} vendas</span>
                                            {sub.call_recording && <Phone className="h-3 w-3 text-nc-info" />}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
