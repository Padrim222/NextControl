import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell,
} from 'recharts';
import {
    TrendingUp,
    ArrowLeft,
    Calendar,
    Target,
    Award,
    BarChart3,
    ArrowUpRight,
    ArrowDownRight,
    CheckCircle,
} from '@/components/ui/icons';
import { useNavigate } from 'react-router-dom';

interface WeekData {
    week: string;
    avgScore: number;
    submissions: number;
    topStrengths: string[];
    topImprovements: string[];
}

interface TooltipProps {
    active?: boolean;
    payload?: { value: number }[];
    label?: string;
}

const CustomTooltip = ({ active, payload, label }: TooltipProps) => {
    if (active && payload?.length) {
        return (
            <div
                className="bg-white rounded-lg px-3 py-2"
                style={{ border: '1px solid #E5E7EB', boxShadow: '0 4px 16px rgba(0,0,0,0.08)', fontFamily: 'DM Sans, sans-serif' }}
            >
                <p className="text-[11px] mb-0.5" style={{ color: '#9CA3AF' }}>{label}</p>
                <p className="text-[14px] font-semibold" style={{ color: '#1B2B4A' }}>
                    {payload[0].value}/100
                </p>
            </div>
        );
    }
    return null;
};

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
            const eightWeeksAgo = new Date();
            eightWeeksAgo.setDate(eightWeeksAgo.getDate() - 56);

            const { data: submissions } = await supabase
                .from('daily_submissions')
                .select('id, submission_date')
                .eq('seller_id', user.id)
                .gte('submission_date', eightWeeksAgo.toISOString().split('T')[0])
                .order('submission_date', { ascending: true });

            if (!submissions?.length) { setIsLoading(false); return; }

            const subIds = submissions.map((s) => s.id);
            const { data: analyses } = await supabase
                .from('analyses')
                .select('submission_id, score, strengths, improvements, created_at')
                .in('submission_id', subIds)
                .order('created_at', { ascending: true });

            const weekMap = new Map<string, { scores: number[]; strengths: string[]; improvements: string[]; count: number }>();

            submissions.forEach((sub) => {
                const date = new Date(sub.submission_date);
                const weekStart = new Date(date);
                weekStart.setDate(date.getDate() - date.getDay());
                const weekKey = weekStart.toISOString().split('T')[0];

                if (!weekMap.has(weekKey)) {
                    weekMap.set(weekKey, { scores: [], strengths: [], improvements: [], count: 0 });
                }
                const week = weekMap.get(weekKey)!;
                week.count++;

                const analysis = analyses?.find((a) => a.submission_id === sub.id);
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
                action: { label: 'Tentar novamente', onClick: () => fetchWeeklyData() },
            });
        } finally {
            setIsLoading(false);
        }
    };

    const trend = weeks.length >= 2
        ? weeks[weeks.length - 1].avgScore - weeks[weeks.length - 2].avgScore
        : 0;

    const lastScore = weeks[weeks.length - 1]?.avgScore ?? 0;

    if (isLoading) {
        return (
            <div className="space-y-5 animate-pulse max-w-4xl mx-auto">
                <div className="h-8 w-48 bg-[#F3F4F6] rounded-lg" />
                <div className="grid grid-cols-3 gap-4">
                    {[1, 2, 3].map((i) => <div key={i} className="h-24 bg-white border border-[#E5E7EB] rounded-xl" />)}
                </div>
                <div className="h-60 bg-white border border-[#E5E7EB] rounded-xl" />
            </div>
        );
    }

    return (
        <div className="space-y-5 max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-3">
                <button
                    onClick={() => navigate('/seller')}
                    className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
                    style={{ color: '#6B7280' }}
                    onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.background = '#F3F4F6')}
                    onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.background = 'transparent')}
                >
                    <ArrowLeft size={16} strokeWidth={1.5} />
                </button>
                <div>
                    <h1
                        className="text-[24px] font-bold leading-tight flex items-center gap-2"
                        style={{ fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif', color: '#1A1A1A' }}
                    >
                        <TrendingUp size={22} strokeWidth={1.5} style={{ color: '#1B2B4A' }} />
                        Evolução Semanal
                    </h1>
                    <p className="text-[13px] mt-0.5" style={{ color: '#6B7280' }}>
                        Acompanhe seu progresso semana a semana
                    </p>
                </div>
            </div>

            {weeks.length === 0 ? (
                <div
                    className="bg-white rounded-xl p-16 text-center"
                    style={{ border: '1px solid #E5E7EB', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}
                >
                    <div className="w-14 h-14 rounded-xl bg-[#F3F4F6] flex items-center justify-center mx-auto mb-4">
                        <Calendar size={22} strokeWidth={1.5} style={{ color: '#9CA3AF' }} />
                    </div>
                    <p className="text-[17px] font-semibold mb-1" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', color: '#1A1A1A' }}>
                        Sem dados ainda
                    </p>
                    <p className="text-[14px]" style={{ color: '#6B7280' }}>
                        Complete seus check-ins diários para ver sua evolução.
                    </p>
                </div>
            ) : (
                <>
                    {/* KPI Row */}
                    <div className="grid grid-cols-3 gap-4">
                        {[
                            {
                                icon: trend >= 0 ? ArrowUpRight : ArrowDownRight,
                                label: 'Tendência',
                                value: `${trend >= 0 ? '+' : ''}${trend}`,
                                color: trend >= 0 ? '#059669' : '#DC2626',
                                bg: trend >= 0 ? '#ECFDF5' : '#FEF2F2',
                            },
                            {
                                icon: Target,
                                label: 'Último Score',
                                value: String(lastScore),
                                color: lastScore >= 70 ? '#059669' : lastScore >= 40 ? '#D97706' : '#DC2626',
                                bg: lastScore >= 70 ? '#ECFDF5' : lastScore >= 40 ? '#FFFBEB' : '#FEF2F2',
                            },
                            {
                                icon: BarChart3,
                                label: 'Semanas',
                                value: String(weeks.length),
                                color: '#1B2B4A',
                                bg: '#FEF9EC',
                            },
                        ].map((stat, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.07 }}
                                className="bg-white rounded-xl p-5 text-center"
                                style={{ border: '1px solid #E5E7EB', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}
                            >
                                <div
                                    className="w-8 h-8 rounded-lg flex items-center justify-center mx-auto mb-2"
                                    style={{ background: stat.bg }}
                                >
                                    <stat.icon size={16} strokeWidth={1.5} style={{ color: stat.color }} />
                                </div>
                                <p className="text-[10px] font-semibold uppercase tracking-widest mb-1" style={{ color: '#9CA3AF' }}>
                                    {stat.label}
                                </p>
                                <p
                                    className="text-[26px] font-bold leading-none"
                                    style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', color: stat.color }}
                                >
                                    {stat.value}
                                </p>
                            </motion.div>
                        ))}
                    </div>

                    {/* Chart */}
                    <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="bg-white rounded-xl p-6"
                        style={{ border: '1px solid #E5E7EB', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}
                    >
                        <h3
                            className="text-[16px] font-semibold mb-1"
                            style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', color: '#1A1A1A' }}
                        >
                            Score por Semana
                        </h3>
                        <p className="text-[12px] mb-5" style={{ color: '#9CA3AF' }}>Média de performance semanal</p>
                        <ResponsiveContainer width="100%" height={200}>
                            <BarChart data={weeks} barSize={32} margin={{ top: 4, right: 0, left: -16, bottom: 0 }}>
                                <CartesianGrid stroke="#F3F4F6" strokeDasharray="0" vertical={false} />
                                <XAxis
                                    dataKey="week"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontFamily: 'DM Sans, sans-serif', fontSize: 11, fill: '#9CA3AF' }}
                                />
                                <YAxis
                                    domain={[0, 100]}
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontFamily: 'DM Sans, sans-serif', fontSize: 11, fill: '#9CA3AF' }}
                                    width={32}
                                />
                                <Tooltip content={<CustomTooltip />} cursor={{ fill: '#F9FAFB', radius: 4 }} />
                                <Bar dataKey="avgScore" radius={[5, 5, 0, 0]} animationDuration={800}>
                                    {weeks.map((week, i) => (
                                        <Cell
                                            key={i}
                                            fill={
                                                i === weeks.length - 1
                                                    ? '#E6B84D'
                                                    : week.avgScore >= 70
                                                    ? '#1B2B4A'
                                                    : week.avgScore >= 40
                                                    ? '#FDE68A'
                                                    : '#E5E7EB'
                                            }
                                        />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </motion.div>

                    {/* Weekly Details */}
                    <div className="space-y-3">
                        {weeks.slice().reverse().map((week, i) => {
                            const scoreBg = week.avgScore >= 70 ? '#ECFDF5' : week.avgScore >= 40 ? '#FFFBEB' : '#FEF2F2';
                            const scoreColor = week.avgScore >= 70 ? '#059669' : week.avgScore >= 40 ? '#D97706' : '#DC2626';

                            return (
                                <motion.div
                                    key={week.week}
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.05 }}
                                    className="bg-white rounded-xl overflow-hidden"
                                    style={{ border: '1px solid #E5E7EB', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}
                                >
                                    <div className="px-5 py-4">
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="flex items-center gap-2">
                                                <Calendar size={14} strokeWidth={1.5} style={{ color: '#9CA3AF' }} />
                                                <span className="text-[14px] font-medium" style={{ color: '#1A1A1A' }}>
                                                    Semana de {week.week}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className="text-[12px]" style={{ color: '#9CA3AF' }}>
                                                    {week.submissions} submissões
                                                </span>
                                                <span
                                                    className="text-[12px] font-bold px-2 py-0.5 rounded-full"
                                                    style={{ background: scoreBg, color: scoreColor, fontFamily: 'Plus Jakarta Sans, sans-serif' }}
                                                >
                                                    {week.avgScore}
                                                </span>
                                            </div>
                                        </div>

                                        {(week.topStrengths.length > 0 || week.topImprovements.length > 0) && (
                                            <div className="grid grid-cols-2 gap-3">
                                                {week.topStrengths.length > 0 && (
                                                    <div
                                                        className="p-3 rounded-lg"
                                                        style={{ background: '#ECFDF5', border: '1px solid #A7F3D0' }}
                                                    >
                                                        <div className="flex items-center gap-1.5 mb-1.5">
                                                            <CheckCircle size={11} strokeWidth={2} style={{ color: '#059669' }} />
                                                            <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: '#059669' }}>
                                                                Forças
                                                            </span>
                                                        </div>
                                                        <p className="text-[12px]" style={{ color: '#065F46' }}>
                                                            {week.topStrengths.join(', ')}
                                                        </p>
                                                    </div>
                                                )}
                                                {week.topImprovements.length > 0 && (
                                                    <div
                                                        className="p-3 rounded-lg"
                                                        style={{ background: '#FFFBEB', border: '1px solid #FDE68A' }}
                                                    >
                                                        <div className="flex items-center gap-1.5 mb-1.5">
                                                            <Target size={11} strokeWidth={2} style={{ color: '#D97706' }} />
                                                            <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: '#D97706' }}>
                                                                Melhorar
                                                            </span>
                                                        </div>
                                                        <p className="text-[12px]" style={{ color: '#92400E' }}>
                                                            {week.topImprovements.join(', ')}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                </>
            )}
        </div>
    );
}
