import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Spinner } from '@/components/ui/Spinner';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { Bar, BarChart, XAxis, YAxis, Cell } from 'recharts';
import {
    TrendingUp,
    ArrowLeft,
    Calendar,
    Target,
    Award,
    BarChart3,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface WeekData {
    week: string;
    avgScore: number;
    submissions: number;
    topStrengths: string[];
    topImprovements: string[];
}

export default function WeeklyEvolution() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [weeks, setWeeks] = useState<WeekData[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!user) return;
        fetchWeeklyData();
    }, [user]);

    const fetchWeeklyData = async () => {
        if (!supabase || !user) return;
        setIsLoading(true);

        try {
            // Fetch last 8 weeks of submissions + analyses
            const eightWeeksAgo = new Date();
            eightWeeksAgo.setDate(eightWeeksAgo.getDate() - 56);

            const { data: submissions } = await (supabase as any)
                .from('daily_submissions')
                .select('id, submission_date')
                .eq('seller_id', user.id)
                .gte('submission_date', eightWeeksAgo.toISOString().split('T')[0])
                .order('submission_date', { ascending: true });

            if (!submissions?.length) {
                setIsLoading(false);
                return;
            }

            const subIds = submissions.map((s: any) => s.id);
            const { data: analyses } = await (supabase as any)
                .from('analyses')
                .select('submission_id, score, strengths, improvements, created_at')
                .in('submission_id', subIds)
                .order('created_at', { ascending: true });

            // Group by week
            const weekMap = new Map<string, { scores: number[]; strengths: string[]; improvements: string[]; count: number }>();

            submissions.forEach((sub: any) => {
                const date = new Date(sub.submission_date);
                const weekStart = new Date(date);
                weekStart.setDate(date.getDate() - date.getDay());
                const weekKey = weekStart.toISOString().split('T')[0];

                if (!weekMap.has(weekKey)) {
                    weekMap.set(weekKey, { scores: [], strengths: [], improvements: [], count: 0 });
                }
                const week = weekMap.get(weekKey)!;
                week.count++;

                const analysis = analyses?.find((a: any) => a.submission_id === sub.id);
                if (analysis) {
                    if (analysis.score) week.scores.push(analysis.score);
                    if (analysis.strengths) week.strengths.push(...analysis.strengths);
                    if (analysis.improvements) week.improvements.push(...analysis.improvements);
                }
            });

            const weekData: WeekData[] = Array.from(weekMap.entries()).map(([weekKey, data]) => ({
                week: new Date(weekKey).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }),
                avgScore: data.scores.length ? Math.round(data.scores.reduce((a, b) => a + b, 0) / data.scores.length) : 0,
                submissions: data.count,
                topStrengths: [...new Set(data.strengths)].slice(0, 3),
                topImprovements: [...new Set(data.improvements)].slice(0, 3),
            }));

            setWeeks(weekData);
        } catch (error) {
            console.error('Error fetching weekly data:', error);
            toast.error('Erro ao carregar evolução semanal.', {
                action: {
                    label: 'Tentar novamente',
                    onClick: () => fetchWeeklyData(),
                },
            });
        } finally {
            setIsLoading(false);
        }
    };

    const maxScore = Math.max(...weeks.map(w => w.avgScore), 100);
    const trend = weeks.length >= 2
        ? weeks[weeks.length - 1].avgScore - weeks[weeks.length - 2].avgScore
        : 0;

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Button variant="ghost" size="icon" onClick={() => navigate('/seller')}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <h1 className="font-display text-2xl font-bold flex items-center gap-2">
                            <TrendingUp className="h-6 w-6 text-solar" />
                            Evolução Semanal
                        </h1>
                        <p className="text-sm text-muted-foreground">Acompanhe seu progresso semana a semana</p>
                    </div>
                </div>
            </div>

            {isLoading ? (
                <div className="flex items-center justify-center py-20">
                    <Spinner size="md" />
                </div>
            ) : weeks.length === 0 ? (
                <Card className="nc-card-border bg-card">
                    <CardContent className="py-12 text-center">
                        <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-lg font-medium">Sem dados ainda</p>
                        <p className="text-sm text-muted-foreground mt-1">Complete seus check-ins diários para ver sua evolução.</p>
                    </CardContent>
                </Card>
            ) : (
                <>
                    {/* Trend Summary */}
                    <div className="grid grid-cols-3 gap-3">
                        <Card className="nc-card-border bg-card">
                            <CardContent className="pt-4 pb-4 px-4 text-center">
                                <Award className={`h-5 w-5 mx-auto mb-1 ${trend >= 0 ? 'text-nc-success' : 'text-nc-error'}`} />
                                <p className="text-xs text-muted-foreground">Tendência</p>
                                <p className={`text-lg font-mono font-bold ${trend >= 0 ? 'text-nc-success' : 'text-nc-error'}`}>
                                    {trend >= 0 ? '+' : ''}{trend}
                                </p>
                            </CardContent>
                        </Card>
                        <Card className="nc-card-border bg-card">
                            <CardContent className="pt-4 pb-4 px-4 text-center">
                                <Target className="h-5 w-5 mx-auto mb-1 text-solar" />
                                <p className="text-xs text-muted-foreground">Último Score</p>
                                <p className="text-lg font-mono font-bold text-solar">
                                    {weeks[weeks.length - 1]?.avgScore || 0}
                                </p>
                            </CardContent>
                        </Card>
                        <Card className="nc-card-border bg-card">
                            <CardContent className="pt-4 pb-4 px-4 text-center">
                                <BarChart3 className="h-5 w-5 mx-auto mb-1 text-nc-info" />
                                <p className="text-xs text-muted-foreground">Semanas</p>
                                <p className="text-lg font-mono font-bold text-nc-info">{weeks.length}</p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Score Chart — Recharts */}
                    <Card className="nc-card-border bg-card">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base">Score por Semana</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ChartContainer
                                config={{
                                    score: { label: 'Score', color: 'hsl(var(--nc-success))' },
                                }}
                                className="h-[200px] w-full"
                            >
                                <BarChart data={weeks} margin={{ top: 8, right: 4, left: -20, bottom: 0 }}>
                                    <XAxis
                                        dataKey="week"
                                        tickLine={false}
                                        axisLine={false}
                                        tick={{ fontSize: 10 }}
                                    />
                                    <YAxis
                                        domain={[0, 100]}
                                        tickLine={false}
                                        axisLine={false}
                                        tick={{ fontSize: 10 }}
                                    />
                                    <ChartTooltip
                                        content={
                                            <ChartTooltipContent
                                                formatter={(value) => `${value}/100`}
                                            />
                                        }
                                    />
                                    <Bar
                                        dataKey="avgScore"
                                        radius={[4, 4, 0, 0]}
                                        animationDuration={800}
                                    >
                                        {weeks.map((week) => (
                                            <Cell
                                                key={week.week}
                                                fill={
                                                    week.avgScore >= 70
                                                        ? 'hsl(var(--nc-success))'
                                                        : week.avgScore >= 40
                                                            ? 'hsl(var(--nc-warning))'
                                                            : 'hsl(var(--nc-error))'
                                                }
                                            />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ChartContainer>
                        </CardContent>
                    </Card>

                    {/* Weekly Details */}
                    <div className="space-y-3">
                        {weeks.slice().reverse().map((week, i) => (
                            <motion.div
                                key={week.week}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.05 }}
                            >
                                <Card className="nc-card-border bg-card nc-card-hover">
                                    <CardContent className="py-4 px-4">
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="flex items-center gap-2">
                                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                                <span className="text-sm font-medium">Semana de {week.week}</span>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className="text-xs text-muted-foreground">{week.submissions} submissões</span>
                                                <span className={`text-sm font-mono font-bold px-2 py-0.5 rounded
                                                    ${week.avgScore >= 70 ? 'bg-nc-success/10 text-nc-success' :
                                                        week.avgScore >= 40 ? 'bg-nc-warning/10 text-nc-warning' :
                                                            'bg-nc-error/10 text-nc-error'}`}>
                                                    {week.avgScore}
                                                </span>
                                            </div>
                                        </div>
                                        {(week.topStrengths.length > 0 || week.topImprovements.length > 0) && (
                                            <div className="grid grid-cols-2 gap-2">
                                                {week.topStrengths.length > 0 && (
                                                    <div className="text-xs">
                                                        <span className="text-nc-success font-medium">Forças:</span>{' '}
                                                        <span className="text-muted-foreground">{week.topStrengths.join(', ')}</span>
                                                    </div>
                                                )}
                                                {week.topImprovements.length > 0 && (
                                                    <div className="text-xs">
                                                        <span className="text-nc-warning font-medium">Melhorar:</span>{' '}
                                                        <span className="text-muted-foreground">{week.topImprovements.join(', ')}</span>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}
