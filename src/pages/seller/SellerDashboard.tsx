import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import {
    Target,
    TrendingUp,
    Send,
    MessageSquare,
    Calendar,
    CheckCircle,
    Clock,
    ChevronRight,
    ArrowUpRight,
    ArrowDownRight,
    Minus,
} from '@/components/ui/icons';
import { useNavigate } from 'react-router-dom';
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
import { SubmissionTimeline } from '@/components/seller/SubmissionTimeline';
import { FormPendingBanner } from '@/components/forms/FormPendingBanner';
import { formatDistanceToNow, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { DailySubmission, Analysis } from '@/types';

/* ── Score Ring ── */
function ScoreRing({ score }: { score: number | null }) {
    const size = 120;
    const strokeW = 9;
    const r = (size - strokeW) / 2;
    const circ = 2 * Math.PI * r;
    const pct = score != null ? score / 100 : 0;
    const offset = circ * (1 - pct);

    const color =
        score == null ? '#E5E7EB'
        : score >= 80 ? '#1B2B4A'
        : score >= 60 ? '#F59E0B'
        : '#DC2626';

    const label =
        score == null ? 'Sem dados'
        : score >= 80 ? 'Excelente'
        : score >= 60 ? 'Bom'
        : 'Atenção';

    return (
        <div className="flex flex-col items-center gap-2">
            <div className="relative" style={{ width: size, height: size }}>
                <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
                    <circle
                        cx={size / 2} cy={size / 2} r={r}
                        fill="none" stroke="#F3F4F6" strokeWidth={strokeW}
                    />
                    <circle
                        cx={size / 2} cy={size / 2} r={r}
                        fill="none" stroke={color} strokeWidth={strokeW}
                        strokeLinecap="round"
                        strokeDasharray={circ}
                        strokeDashoffset={offset}
                        style={{ transition: 'stroke-dashoffset 0.8s cubic-bezier(0.4,0,0.2,1)' }}
                    />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span
                        className="text-[28px] font-bold leading-none"
                        style={{ fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif', color: '#1A1A1A' }}
                    >
                        {score ?? '—'}
                    </span>
                    <span className="text-[10px] font-medium mt-0.5" style={{ color: '#9CA3AF' }}>/100</span>
                </div>
            </div>
            <span
                className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full"
                style={{
                    background: score == null ? '#F3F4F6' : score >= 80 ? '#ECFDF5' : score >= 60 ? '#FFFBEB' : '#FEF2F2',
                    color: score == null ? '#9CA3AF' : score >= 80 ? '#059669' : score >= 60 ? '#D97706' : '#DC2626',
                }}
            >
                {label}
            </span>
        </div>
    );
}

/* ── KPI Card ── */
function KpiCard({
    label,
    value,
    sub,
    trend,
    icon: Icon,
    delay = 0,
}: {
    label: string;
    value: string | number;
    sub?: string;
    trend?: 'up' | 'down' | 'neutral';
    icon: React.ElementType;
    delay?: number;
}) {
    const TrendIcon = trend === 'up' ? ArrowUpRight : trend === 'down' ? ArrowDownRight : Minus;
    const trendColor = trend === 'up' ? '#059669' : trend === 'down' ? '#DC2626' : '#9CA3AF';
    const trendBg = trend === 'up' ? '#ECFDF5' : trend === 'down' ? '#FEF2F2' : '#F3F4F6';

    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay, duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            className="bg-white border border-[#E5E7EB] rounded-xl p-5 hover:-translate-y-0.5 hover:shadow-md transition-all duration-200 cursor-default"
            style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}
        >
            <div className="flex items-start justify-between mb-3">
                <span
                    className="text-[10px] font-semibold uppercase tracking-widest"
                    style={{ color: '#9CA3AF' }}
                >
                    {label}
                </span>
                <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: '#F3F4F6' }}>
                    <Icon size={14} strokeWidth={1.5} style={{ color: '#6B7280' }} />
                </div>
            </div>
            <div
                className="text-[30px] font-bold leading-none mb-2"
                style={{ fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif', color: '#1A1A1A' }}
            >
                {value}
            </div>
            {sub && (
                <div className="flex items-center gap-1.5">
                    {trend && trend !== 'neutral' ? (
                        <span
                            className="inline-flex items-center gap-0.5 text-[11px] font-semibold px-1.5 py-0.5 rounded-full"
                            style={{ background: trendBg, color: trendColor }}
                        >
                            <TrendIcon size={10} />
                            {sub}
                        </span>
                    ) : (
                        <span className="text-[12px]" style={{ color: '#9CA3AF' }}>{sub}</span>
                    )}
                </div>
            )}
        </motion.div>
    );
}

/* ── Chart Tooltip ── */
const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload?.length) {
        return (
            <div
                className="bg-white rounded-lg px-3 py-2"
                style={{
                    border: '1px solid #E5E7EB',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
                    fontFamily: 'DM Sans, sans-serif',
                }}
            >
                <p className="text-[11px] mb-0.5" style={{ color: '#9CA3AF' }}>{label}</p>
                <p className="text-[14px] font-semibold" style={{ color: '#1B2B4A' }}>
                    {payload[0].value} pts
                </p>
            </div>
        );
    }
    return null;
};

/* ── Main ── */
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
            const { data: subs, error: subsError } = await (supabase as any)
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

            if (subs?.length) {
                const { data: analysesData, error: analysesError } = await (supabase as any)
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
            toast.error('Erro ao carregar dados.', {
                action: { label: 'Tentar novamente', onClick: () => fetchData() },
            });
        } finally {
            setIsLoading(false);
        }
    };

    const scoreMap = new Map(analyses.map((a) => [a.submission_id, a.score]));
    const totalSubmissions = submissions.length;
    const avgScore = latestAnalysis?.score ?? null;

    const chartData = submissions
        .slice()
        .reverse()
        .map((sub) => ({
            date: format(new Date(sub.submission_date + 'T12:00:00'), 'EEE', { locale: ptBR }),
            score: scoreMap.get(sub.id) ?? 0,
        }));

    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite';
    const firstName = user?.name?.split(' ')[0] ?? '';

    if (isLoading) {
        return (
            <div className="space-y-5 animate-pulse">
                <div className="h-8 w-52 bg-[#F3F4F6] rounded-lg" />
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
                    <div className="h-52 bg-white border border-[#E5E7EB] rounded-xl" />
                    <div className="lg:col-span-4 grid grid-cols-2 xl:grid-cols-4 gap-4">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="h-28 bg-white border border-[#E5E7EB] rounded-xl" />
                        ))}
                    </div>
                </div>
                <div className="h-60 bg-white border border-[#E5E7EB] rounded-xl" />
            </div>
        );
    }

    return (
        <div className="space-y-5">
            {/* Page Header */}
            <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-1"
            >
                <div>
                    <h1
                        className="text-[26px] font-bold leading-tight"
                        style={{ fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif', color: '#1A1A1A' }}
                    >
                        {greeting},{' '}
                        <span style={{ color: '#1B2B4A' }}>{firstName}</span>
                    </h1>
                    <p className="text-[14px] mt-1 flex items-center gap-1.5" style={{ color: '#6B7280' }}>
                        {todaySubmitted ? (
                            <>
                                <CheckCircle size={14} style={{ color: '#059669' }} strokeWidth={2} />
                                Check-in enviado · aguardando análise
                            </>
                        ) : (
                            <>
                                <Clock size={14} style={{ color: '#F59E0B' }} strokeWidth={2} />
                                Hora de fazer o check-in do dia
                            </>
                        )}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => navigate('/seller/evolution')}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-all duration-150"
                        style={{ color: '#6B7280' }}
                        onMouseEnter={(e) => {
                            (e.currentTarget as HTMLButtonElement).style.background = '#F3F4F6';
                            (e.currentTarget as HTMLButtonElement).style.color = '#1A1A1A';
                        }}
                        onMouseLeave={(e) => {
                            (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                            (e.currentTarget as HTMLButtonElement).style.color = '#6B7280';
                        }}
                    >
                        <TrendingUp size={14} strokeWidth={1.5} />
                        Evolução
                    </button>
                    <button
                        onClick={() => navigate('/training/coach')}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-all duration-150"
                        style={{ color: '#6B7280' }}
                        onMouseEnter={(e) => {
                            (e.currentTarget as HTMLButtonElement).style.background = '#F3F4F6';
                            (e.currentTarget as HTMLButtonElement).style.color = '#1A1A1A';
                        }}
                        onMouseLeave={(e) => {
                            (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                            (e.currentTarget as HTMLButtonElement).style.color = '#6B7280';
                        }}
                    >
                        <MessageSquare size={14} strokeWidth={1.5} />
                        Consultoria
                    </button>
                    {!todaySubmitted && (
                        <button
                            onClick={() => navigate('/seller/report')}
                            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-[13px] font-semibold text-white transition-all hover:opacity-90"
                            style={{ background: '#1B2B4A' }}
                        >
                            <Send size={13} strokeWidth={2} />
                            Check-in
                        </button>
                    )}
                </div>
            </motion.div>

            <FormPendingBanner formType="seller_daily" />

            {/* Priority CTA — shown FIRST when check-in not done */}
            {!todaySubmitted && (
                <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    onClick={() => navigate('/seller/report')}
                    className="rounded-xl p-5 flex items-center gap-5 cursor-pointer hover:opacity-95 transition-opacity"
                    style={{
                        background: 'linear-gradient(135deg, #1B2B4A 0%, #2D4A7A 100%)',
                        boxShadow: '0 4px 20px rgba(27,43,74,0.25)',
                    }}
                >
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(230,184,77,0.15)' }}>
                        <Send size={22} strokeWidth={1.5} style={{ color: '#E6B84D' }} />
                    </div>
                    <div className="flex-1">
                        <p className="text-[11px] font-semibold uppercase tracking-widest mb-0.5" style={{ color: '#E6B84D' }}>
                            Ação do Dia
                        </p>
                        <h3 className="text-[17px] font-bold text-white leading-tight" style={{ fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif' }}>
                            Fazer o Check-in de Hoje
                        </h3>
                        <p className="text-[13px] mt-0.5" style={{ color: 'rgba(255,255,255,0.6)' }}>
                            Registre seus números e receba feedback personalizado da IA
                        </p>
                    </div>
                    <ChevronRight size={20} style={{ color: 'rgba(255,255,255,0.4)', flexShrink: 0 }} />
                </motion.div>
            )}

            {/* Score Ring + KPIs */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35 }}
                    className="bg-white border border-[#E5E7EB] rounded-xl p-6 flex flex-col items-center justify-center gap-3"
                    style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}
                >
                    <span
                        className="text-[10px] font-semibold uppercase tracking-widest"
                        style={{ color: '#9CA3AF' }}
                    >
                        Score de Performance
                    </span>
                    <ScoreRing score={avgScore} />
                    {latestAnalysis?.created_at && (
                        <p className="text-[11px] text-center" style={{ color: '#9CA3AF' }}>
                            {formatDistanceToNow(new Date(latestAnalysis.created_at), {
                                addSuffix: true,
                                locale: ptBR,
                            })}
                        </p>
                    )}
                </motion.div>

                <div className="lg:col-span-4 grid grid-cols-2 xl:grid-cols-4 gap-4">
                    <KpiCard
                        label="Submissões"
                        value={totalSubmissions}
                        sub="últimos 7 dias"
                        icon={Calendar}
                        delay={0.05}
                    />
                    <KpiCard
                        label="Hoje"
                        value={todaySubmitted ? 'Enviado' : 'Pendente'}
                        sub={todaySubmitted ? 'completo' : 'faça agora'}
                        trend={todaySubmitted ? 'up' : 'neutral'}
                        icon={todaySubmitted ? CheckCircle : Clock}
                        delay={0.1}
                    />
                    <KpiCard
                        label="Coach"
                        value="Online"
                        sub="disponível agora"
                        trend="up"
                        icon={MessageSquare}
                        delay={0.15}
                    />
                    <KpiCard
                        label="Sequência"
                        value={`${totalSubmissions}d`}
                        sub="consecutivos"
                        trend={totalSubmissions >= 5 ? 'up' : 'neutral'}
                        icon={Target}
                        delay={0.2}
                    />
                </div>
            </div>

            {/* Performance Chart */}
            {chartData.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25, duration: 0.35 }}
                    className="bg-white border border-[#E5E7EB] rounded-xl p-6"
                    style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}
                >
                    <div className="flex items-center justify-between mb-5">
                        <div>
                            <h3
                                className="text-[16px] font-semibold"
                                style={{ fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif', color: '#1A1A1A' }}
                            >
                                Performance — últimos {chartData.length} dias
                            </h3>
                            <p className="text-[12px] mt-0.5" style={{ color: '#9CA3AF' }}>
                                Score por check-in diário
                            </p>
                        </div>
                        {avgScore != null && (
                            <div className="text-right">
                                <div
                                    className="text-[22px] font-bold leading-none"
                                    style={{
                                        fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif',
                                        color: '#1B2B4A',
                                    }}
                                >
                                    {avgScore}
                                </div>
                                <div className="text-[11px] mt-0.5" style={{ color: '#9CA3AF' }}>
                                    último score
                                </div>
                            </div>
                        )}
                    </div>
                    <ResponsiveContainer width="100%" height={180}>
                        <BarChart
                            data={chartData}
                            barSize={32}
                            margin={{ top: 4, right: 0, left: -16, bottom: 0 }}
                        >
                            <CartesianGrid
                                stroke="#F3F4F6"
                                strokeDasharray="0"
                                vertical={false}
                            />
                            <XAxis
                                dataKey="date"
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
                            <Bar dataKey="score" radius={[5, 5, 0, 0]}>
                                {chartData.map((entry, index) => (
                                    <Cell
                                        key={index}
                                        fill={
                                            index === chartData.length - 1
                                                ? '#E6B84D'
                                                : entry.score >= 80
                                                ? '#1B2B4A'
                                                : entry.score >= 60
                                                ? '#FDE68A'
                                                : '#E5E7EB'
                                        }
                                    />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </motion.div>
            )}

            {/* Coach Feedback */}
            {latestAnalysis && (
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.35, duration: 0.35 }}
                    className="bg-white border border-[#E5E7EB] rounded-xl overflow-hidden"
                    style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}
                >
                    <div
                        className="px-6 py-4 flex items-center justify-between"
                        style={{ borderBottom: '1px solid #E5E7EB' }}
                    >
                        <div className="flex items-center gap-2">
                            <TrendingUp size={15} strokeWidth={1.5} style={{ color: '#1B2B4A' }} />
                            <h3
                                className="text-[15px] font-semibold"
                                style={{ fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif', color: '#1A1A1A' }}
                            >
                                Último Feedback do Coach
                            </h3>
                        </div>
                        {latestAnalysis.created_at && (
                            <span className="text-[12px]" style={{ color: '#9CA3AF' }}>
                                {formatDistanceToNow(new Date(latestAnalysis.created_at), {
                                    addSuffix: true,
                                    locale: ptBR,
                                })}
                            </span>
                        )}
                    </div>
                    <div className="p-6 space-y-4">
                        <p className="text-[14px] leading-relaxed line-clamp-3" style={{ color: '#6B7280' }}>
                            {latestAnalysis.content}
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {latestAnalysis.strengths?.length > 0 && (
                                <div
                                    className="p-4 rounded-xl"
                                    style={{ background: '#ECFDF5', border: '1px solid #A7F3D0' }}
                                >
                                    <p
                                        className="text-[10px] font-semibold uppercase tracking-widest mb-2.5"
                                        style={{ color: '#059669' }}
                                    >
                                        Forças
                                    </p>
                                    <ul className="space-y-1.5">
                                        {latestAnalysis.strengths.slice(0, 3).map((s: string, i: number) => (
                                            <li
                                                key={i}
                                                className="flex items-start gap-2 text-[13px]"
                                                style={{ color: '#065F46' }}
                                            >
                                                <CheckCircle
                                                    size={13}
                                                    className="mt-0.5 flex-shrink-0"
                                                    style={{ color: '#059669' }}
                                                    strokeWidth={2}
                                                />
                                                {s}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                            {latestAnalysis.improvements?.length > 0 && (
                                <div
                                    className="p-4 rounded-xl"
                                    style={{ background: '#FFFBEB', border: '1px solid #FDE68A' }}
                                >
                                    <p
                                        className="text-[10px] font-semibold uppercase tracking-widest mb-2.5"
                                        style={{ color: '#D97706' }}
                                    >
                                        Melhorar
                                    </p>
                                    <ul className="space-y-1.5">
                                        {latestAnalysis.improvements.slice(0, 3).map((s: string, i: number) => (
                                            <li
                                                key={i}
                                                className="flex items-start gap-2 text-[13px]"
                                                style={{ color: '#92400E' }}
                                            >
                                                <Target
                                                    size={13}
                                                    className="mt-0.5 flex-shrink-0"
                                                    style={{ color: '#D97706' }}
                                                    strokeWidth={2}
                                                />
                                                {s}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    </div>
                </motion.div>
            )}

            {/* Timeline */}
            {submissions.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4, duration: 0.35 }}
                    className="bg-white border border-[#E5E7EB] rounded-xl overflow-hidden"
                    style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}
                >
                    <div
                        className="px-6 py-4 flex items-center gap-2"
                        style={{ borderBottom: '1px solid #E5E7EB' }}
                    >
                        <Calendar size={15} strokeWidth={1.5} style={{ color: '#1B2B4A' }} />
                        <h3
                            className="text-[15px] font-semibold"
                            style={{ fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif', color: '#1A1A1A' }}
                        >
                            Histórico de Check-ins
                        </h3>
                    </div>
                    <div className="p-6">
                        <SubmissionTimeline
                            submissions={submissions}
                            scoreMap={scoreMap}
                            onItemClick={(sub) => navigate(`/seller/report/${sub.id}`)}
                        />
                    </div>
                </motion.div>
            )}
        </div>
    );
}
