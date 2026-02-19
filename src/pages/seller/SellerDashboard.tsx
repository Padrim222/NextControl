import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import {
    BarChart3,
    Target,
    TrendingUp,
    Send,
    MessageSquare,
    Calendar,
    CheckCircle,
    Clock,
    ChevronRight,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { DailySubmission, Analysis } from '@/types';

export default function SellerDashboard() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [submissions, setSubmissions] = useState<DailySubmission[]>([]);
    const [latestAnalysis, setLatestAnalysis] = useState<Analysis | null>(null);
    const [todaySubmitted, setTodaySubmitted] = useState(false);

    const sellerType = user?.seller_type || 'seller';

    useEffect(() => {
        if (!user) return;
        fetchData();
    }, [user]);

    const fetchData = async () => {
        if (!supabase || !user) return;
        try {
            const today = new Date().toISOString().split('T')[0];

            // Fetch recent submissions
            const { data: subs } = await (supabase as any)
                .from('daily_submissions')
                .select('*')
                .eq('seller_id', user.id)
                .order('submission_date', { ascending: false })
                .limit(7);

            if (subs) {
                setSubmissions(subs);
                setTodaySubmitted(subs.some((s: DailySubmission) => s.submission_date === today));
            }

            // Fetch latest analysis
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

    // Stats from last 7 submissions
    const totalSubmissions = submissions.length;
    const avgScore = latestAnalysis?.score ?? null;

    const stats = [
        {
            label: 'Submissões (7d)',
            value: totalSubmissions,
            icon: Calendar,
            color: 'text-solar',
        },
        {
            label: 'Status Hoje',
            value: todaySubmitted ? 'Enviado ✓' : 'Pendente',
            icon: todaySubmitted ? CheckCircle : Clock,
            color: todaySubmitted ? 'text-nc-success' : 'text-nc-warning',
        },
        {
            label: 'Último Score',
            value: avgScore ? `${avgScore}/100` : '—',
            icon: Target,
            color: 'text-solar',
        },
        {
            label: 'Coach',
            value: 'Disponível',
            icon: MessageSquare,
            color: 'text-nc-info',
        },
    ];

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
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
                            ? '🎯 Check-in de hoje enviado. Aguardando análise do coach.'
                            : '⏰ Hora de fazer o check-in do dia!'}
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button
                        onClick={() => navigate('/seller/evolution')}
                        variant="outline"
                        className="nc-btn-ghost"
                    >
                        <TrendingUp className="h-4 w-4 mr-2" />
                        Evolução
                    </Button>
                    <Button
                        onClick={() => navigate('/training/coach')}
                        variant="outline"
                        className="nc-btn-ghost"
                    >
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Consultoria
                    </Button>
                </div>
            </motion.div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
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
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                >
                    <Card
                        className="nc-card-border nc-card-hover bg-card cursor-pointer group"
                        onClick={() => navigate('/seller/report')}
                    >
                        <CardContent className="py-8 text-center">
                            <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-solar/10 mb-4 group-hover:bg-solar/20 transition-colors">
                                <Send className="h-7 w-7 text-solar" />
                            </div>
                            <h3 className="text-lg font-semibold mb-1">Check-in do Dia</h3>
                            <p className="text-sm text-muted-foreground">
                                Registre seus números e envie prints de conversas
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
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                >
                    <Card className="nc-card-border bg-card">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base flex items-center gap-2">
                                <TrendingUp className="h-4 w-4 text-solar" />
                                Último Feedback do Coach
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {/* Score */}
                            <div className="flex items-center gap-4">
                                <div className="text-center px-4 py-2 rounded-lg bg-solar/10">
                                    <p className="text-2xl font-mono font-bold text-solar">{latestAnalysis.score}</p>
                                    <p className="text-xs text-muted-foreground">Score</p>
                                </div>
                                <p className="text-sm text-muted-foreground flex-1 line-clamp-3">
                                    {latestAnalysis.content}
                                </p>
                            </div>

                            {/* Strengths & Improvements */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="p-3 rounded-lg bg-nc-success/10 border border-nc-success/20">
                                    <p className="text-xs font-medium text-nc-success mb-2 uppercase">Forças</p>
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
                                                <Target className="h-3 w-3 text-nc-warning mt-0.5 shrink-0" />
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

            {/* Recent Submissions Timeline */}
            {submissions.length > 0 && (
                <Card className="nc-card-border bg-card">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2">
                            <BarChart3 className="h-4 w-4 text-solar" />
                            Últimas Submissões
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {submissions.slice(0, 5).map((sub, i) => {
                                const metrics = sub.metrics as any;
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
                                            <span>{sub.conversation_prints?.length || 0} prints</span>
                                            {metrics?.approaches != null && (
                                                <span className="font-mono">{metrics.approaches} abordagens</span>
                                            )}
                                            {metrics?.calls_made != null && (
                                                <span className="font-mono">{metrics.calls_made} calls</span>
                                            )}
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
