import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
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
    LayoutDashboard,
    Users,
    Sparkles,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { SubmissionTimeline } from '@/components/seller/SubmissionTimeline';
import { DailyProgressCard } from '@/components/seller/DailyProgressCard';
import { FormPendingBanner } from '@/components/forms/FormPendingBanner';
import { SellerPlaybook } from '@/components/seller/SellerPlaybook';
import { StrategyAnalytics } from '@/components/seller/StrategyAnalytics';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { DailySubmission, Analysis, SellerMetrics } from '@/types';
import { AgentFeedbackButton } from '@/components/AgentFeedbackButton';

export default function SellerDashboard() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [submissions, setSubmissions] = useState<DailySubmission[]>([]);
    const [analyses, setAnalyses] = useState<Analysis[]>([]);
    const [latestAnalysis, setLatestAnalysis] = useState<Analysis | null>(null);
    const [todaySubmitted, setTodaySubmitted] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!user) return;
        fetchData();
    }, [user]);

    const fetchData = async () => {
        if (!supabase || !user) return;
        setIsLoading(true);
        try {
            const today = new Date().toISOString().split('T')[0];

            // Fetch recent submissions
            const { data: subs, error: subsError } = await supabase
                .from('daily_submissions')
                .select('*')
                .eq('seller_id', user.id)
                .order('submission_date', { ascending: false })
                .limit(7);

            if (subsError) throw subsError;

            if (subs) {
                setSubmissions(subs);
                setTodaySubmitted(subs.some((s: DailySubmission) => s.submission_date === today));
            }

            // Fetch analyses for all recent submissions
            if (subs?.length) {
                const { data: analysesData, error: analysesError } = await supabase
                    .from('analyses')
                    .select('*')
                    .in('submission_id', subs.map((s: DailySubmission) => s.id))
                    .order('created_at', { ascending: false });

                if (analysesError) throw analysesError;

                if (analysesData) {
                    setAnalyses(analysesData);
                    setLatestAnalysis(analysesData[0] || null);
                }
            }
        } catch (error) {
            console.error('Error fetching data:', error);
            toast.error('Erro ao carregar dados. Tente novamente.', {
                action: {
                    label: 'Tentar novamente',
                    onClick: () => fetchData(),
                },
            });
        } finally {
            setIsLoading(false);
        }
    };

    // Build score map for timeline
    const scoreMap = new Map(analyses.map((a) => [a.submission_id, a.score]));

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

    // Loading skeleton
    if (isLoading) {
        return (
            <div className="space-y-6 max-w-4xl mx-auto">
                {/* Header skeleton */}
                <div className="flex items-center justify-between">
                    <div>
                        <Skeleton className="h-7 w-48 mb-2" />
                        <Skeleton className="h-4 w-64" />
                    </div>
                    <div className="hidden sm:flex gap-2">
                        <Skeleton className="h-9 w-28" />
                        <Skeleton className="h-9 w-28" />
                    </div>
                </div>
                {/* Stats skeleton */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[1, 2, 3, 4].map((i) => (
                        <Card key={i} className="nc-card-border bg-card">
                            <CardContent className="p-4">
                                <Skeleton className="h-4 w-20 mb-3" />
                                <Skeleton className="h-6 w-16" />
                            </CardContent>
                        </Card>
                    ))}
                </div>
                {/* CTA skeleton */}
                <Card className="nc-card-border bg-card">
                    <CardContent className="py-8 flex flex-col items-center">
                        <Skeleton className="h-14 w-14 rounded-xl mb-4" />
                        <Skeleton className="h-5 w-40 mb-2" />
                        <Skeleton className="h-4 w-56 mb-4" />
                        <Skeleton className="h-10 w-32" />
                    </CardContent>
                </Card>
                {/* Timeline skeleton */}
                <Card className="nc-card-border bg-card">
                    <CardContent className="p-4 space-y-3">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="flex items-center justify-between py-2">
                                <div className="flex items-center gap-3">
                                    <Skeleton className="h-2 w-2 rounded-full" />
                                    <Skeleton className="h-4 w-24" />
                                </div>
                                <Skeleton className="h-4 w-16" />
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
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
                <div className="hidden sm:flex gap-2">
                    <Button
                        variant="ghost"
                        className="nc-btn-ghost"
                        onClick={() => navigate('/seller/evolution')}
                    >
                        <TrendingUp className="h-4 w-4 mr-2" />
                        Evolução
                    </Button>
                    <Button
                        variant="ghost"
                        className="nc-btn-ghost"
                        onClick={() => navigate('/training/coach')}
                    >
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Consultoria
                    </Button>
                </div>
            </motion.div>

            {/* Pending Form Banner */}
            <FormPendingBanner formType="seller_daily" />

            {/* Agent Feedback */}
            <div className="flex justify-end">
                <AgentFeedbackButton defaultAgentType="ss" />
            </div>

            {/* Tabs: Dashboard vs CRM */}
            <Tabs defaultValue="dashboard" className="space-y-6">
                <TabsList className="grid w-full grid-cols-2 max-w-xs">
                    <TabsTrigger value="dashboard" className="gap-2">
                        <LayoutDashboard className="h-3.5 w-3.5" />
                        Dashboard
                    </TabsTrigger>
                    <TabsTrigger value="crm" className="gap-2">
                        <Users className="h-3.5 w-3.5" />
                        CRM
                    </TabsTrigger>
                </TabsList>

                {/* TAB: Dashboard — metrics, progress, check-in, feedback */}
                <TabsContent value="dashboard" className="space-y-6 mt-0">

                    {/* AI Insights Banner */}
                    {submissions.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.3 }}
                        >
                            {(() => {
                                const weeklyConversations = submissions.reduce((acc, s) => acc + ((s.metrics as SellerMetrics)?.conversations_started || 0), 0);
                                const weeklyFollowups = submissions.reduce((acc, s) => acc + ((s.metrics as SellerMetrics)?.followups_done || 0), 0);
                                const weeklyOpps = submissions.reduce((acc, s) => acc + ((s.metrics as SellerMetrics)?.conversations_to_opportunity || 0), 0);

                                let insightTitle = "Insight da IA";
                                let insightMessage = "Seu ritmo está bom! Mantenha a consistência nos follow-ups para garantir o fechamento da semana.";
                                let isWarning = false;

                                if (weeklyConversations < 15) {
                                    insightTitle = "⚠️ Volume de Conversas Baixo";
                                    insightMessage = `Apenas ${weeklyConversations} conversas iniciadas esta semana. Aumente o volume de abordagens para manter o funil saudável!`;
                                    isWarning = true;
                                } else if (weeklyFollowups < 10) {
                                    insightTitle = "⚠️ Follow-ups Insuficientes";
                                    insightMessage = `Somente ${weeklyFollowups} follow-ups feitos. Leads esfriam rápido — consulte o Coach para técnicas de reaquecimento!`;
                                    isWarning = true;
                                } else if (weeklyOpps < 5) {
                                    insightTitle = "⚠️ Poucas Oportunidades Geradas";
                                    insightMessage = `Apenas ${weeklyOpps} conversas converteram em oportunidade. Vamos ajustar seu pitch no Consultoria de Bolso?`;
                                    isWarning = true;
                                }

                                return (
                                    <Card className={`nc-card-border overflow-hidden ${isWarning ? 'border-nc-warning/30 bg-nc-warning/5' : 'border-solar/30 bg-solar/5'}`}>
                                        <CardContent className="p-4 flex items-center gap-4">
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${isWarning ? 'bg-nc-warning/20' : 'bg-solar/20'}`}>
                                                <Sparkles className={`h-5 w-5 ${isWarning ? 'text-nc-warning' : 'text-solar'} animate-pulse`} />
                                            </div>
                                            <div className="flex-1">
                                                <h4 className={`text-sm font-semibold ${isWarning ? 'text-nc-warning' : 'text-solar'}`}>{insightTitle}</h4>
                                                <p className="text-xs text-muted-foreground leading-relaxed">
                                                    {insightMessage}
                                                </p>
                                            </div>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className={`text-xs ${isWarning ? 'border-nc-warning/30 hover:bg-nc-warning/10' : 'border-solar/30 hover:bg-solar/10'}`}
                                                onClick={() => navigate('/training/coach')}
                                            >
                                                Consultar Coach
                                            </Button>
                                        </CardContent>
                                    </Card>
                                );
                            })()}
                        </motion.div>
                    )}

                    {/* Strategy A vs B Analytics */}
                    <StrategyAnalytics />

                    {/* Daily Progress vs. Yesterday */}
                    {submissions.length >= 2 && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.35 }}
                        >
                            <DailyProgressCard submissions={submissions} />
                        </motion.div>
                    )}

                    {/* Playbook: Scripts & Blacklist */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.38 }}
                    >
                        <SellerPlaybook />
                    </motion.div>

                    {/* Daily Submission CTA */}
                    {!todaySubmitted && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.4 }}
                        >
                            <Card className="nc-card-border nc-card-hover bg-card">
                                <CardContent className="py-8 text-center">
                                    <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-solar/10 mb-4">
                                        <Send className="h-7 w-7 text-solar" />
                                    </div>
                                    <h3 className="text-lg font-semibold mb-1">Check-in do Dia</h3>
                                    <p className="text-sm text-muted-foreground">
                                        Registre seus números e envie prints de conversas
                                    </p>
                                    <Button
                                        className="mt-4 nc-btn-primary"
                                        onClick={() => navigate('/seller/report')}
                                    >
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
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="text-base flex items-center gap-2">
                                            <TrendingUp className="h-4 w-4 text-solar" />
                                            Último Feedback do Coach
                                        </CardTitle>
                                        {latestAnalysis.created_at && (
                                            <span className="text-xs text-muted-foreground">
                                                {formatDistanceToNow(new Date(latestAnalysis.created_at), { addSuffix: true, locale: ptBR })}
                                            </span>
                                        )}
                                    </div>
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
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                </TabsContent>

                {/* TAB: CRM — submissions timeline */}
                <TabsContent value="crm" className="space-y-6 mt-0">
                    {/* Daily Submission CTA in CRM tab too */}
                    {!todaySubmitted && (
                        <Card className="nc-card-border nc-card-hover bg-card">
                            <CardContent className="py-6 text-center">
                                <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-solar/10 mb-3">
                                    <Send className="h-6 w-6 text-solar" />
                                </div>
                                <h3 className="text-base font-semibold mb-1">Check-in Pendente</h3>
                                <Button
                                    className="mt-3 nc-btn-primary"
                                    size="sm"
                                    onClick={() => navigate('/seller/report')}
                                >
                                    Fazer Check-in <ChevronRight className="h-4 w-4 ml-1" />
                                </Button>
                            </CardContent>
                        </Card>
                    )}

                    {/* Submissions Timeline */}
                    {submissions.length > 0 && (
                        <Card className="nc-card-border bg-card">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base flex items-center gap-2">
                                    <BarChart3 className="h-4 w-4 text-solar" />
                                    Histórico de Submissões
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <SubmissionTimeline
                                    submissions={submissions}
                                    scoreMap={scoreMap}
                                    onItemClick={(sub) => navigate(`/seller/report/${sub.id}`)}
                                />
                            </CardContent>
                        </Card>
                    )}

                    {submissions.length === 0 && (
                        <div className="text-center py-12 text-muted-foreground">
                            <BarChart3 className="h-10 w-10 mx-auto mb-3 opacity-30" />
                            <p>Nenhuma submissão encontrada</p>
                            <p className="text-xs mt-1">Faça seu primeiro check-in para começar!</p>
                        </div>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
}
