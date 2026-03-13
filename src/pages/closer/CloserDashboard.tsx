import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import {
    Phone,
    Target,
    TrendingUp,
    BarChart3,
    MessageSquare,
    CheckCircle,
    Clock,
    ChevronRight,
    Percent,
    AlertTriangle,
} from '@/components/ui/icons';
import { useNavigate } from 'react-router-dom';
import type { DailySubmission, Analysis, CloserMetrics } from '@/types';
import { FormPendingBanner } from '@/components/forms/FormPendingBanner';
import { AgentFeedbackButton } from '@/components/AgentFeedbackButton';

const ds = {
    bg: '#FAFAFA',
    card: '#FFFFFF',
    border: '1px solid #E5E7EB',
    radius: '12px',
    primary: '#1B2B4A',
    accent: '#E6B84D',
    textPrimary: '#1A1A1A',
    textSecondary: '#6B7280',
    textMuted: '#9CA3AF',
    shadow: '0 1px 3px rgba(0,0,0,0.06)',
    fontDisplay: 'Plus Jakarta Sans, system-ui, sans-serif',
    fontBody: 'DM Sans, system-ui, sans-serif',
};

const cardStyle: React.CSSProperties = {
    background: ds.card,
    border: ds.border,
    borderRadius: ds.radius,
    boxShadow: ds.shadow,
    fontFamily: ds.fontBody,
};

const labelStyle: React.CSSProperties = {
    fontSize: '10px',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.1em',
    color: ds.textMuted,
    fontFamily: ds.fontBody,
};

const kpiNumStyle: React.CSSProperties = {
    fontFamily: ds.fontDisplay,
    fontWeight: 700,
    fontSize: '30px',
    color: ds.textPrimary,
    lineHeight: 1,
};

export default function CloserDashboard() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [submissions, setSubmissions] = useState<DailySubmission[]>([]);
    const [latestAnalysis, setLatestAnalysis] = useState<Analysis | null>(null);
    const [todaySubmitted, setTodaySubmitted] = useState(false);

    useEffect(() => {
        if (!user) return;
        fetchData();
    }, [user]);

    const fetchData = async () => {
        if (!supabase || !user) return;
        try {
            const today = new Date().toISOString().split('T')[0];
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

    const avgConversion = submissions.length > 0
        ? (submissions.reduce((acc, s) => {
            const m = s.metrics as CloserMetrics;
            return acc + (m?.conversion_rate || 0);
        }, 0) / submissions.length).toFixed(1)
        : '—';

    const greeting = (() => {
        const h = new Date().getHours();
        if (h < 12) return 'Bom dia';
        if (h < 18) return 'Boa tarde';
        return 'Boa noite';
    })();

    const firstName = user?.name?.split(' ')[0] || 'Closer';

    const kpis = [
        {
            label: 'Calls (7d)',
            value: String(totalCalls),
            icon: Phone,
            badge: null,
        },
        {
            label: 'Propostas (7d)',
            value: String(totalProposals),
            icon: Target,
            badge: null,
        },
        {
            label: 'Vendas (7d)',
            value: String(totalSales),
            icon: CheckCircle,
            badge: totalSales > 0 ? 'positive' : 'neutral',
        },
        {
            label: 'Conversão Média',
            value: `${avgConversion}%`,
            icon: Percent,
            badge: null,
        },
        {
            label: 'Último Score',
            value: latestAnalysis?.score ? `${latestAnalysis.score}/100` : '—',
            icon: Target,
            badge: latestAnalysis?.score
                ? latestAnalysis.score >= 70 ? 'positive' : latestAnalysis.score >= 50 ? 'neutral' : 'negative'
                : null,
        },
        {
            label: 'Status Hoje',
            value: todaySubmitted ? 'Enviado' : 'Pendente',
            icon: todaySubmitted ? CheckCircle : Clock,
            badge: todaySubmitted ? 'positive' : 'negative',
        },
    ];

    const getBadgeStyle = (type: string | null): React.CSSProperties => {
        if (type === 'positive') return { background: '#ECFDF5', color: '#059669', padding: '2px 8px', borderRadius: '999px', fontSize: '11px', fontWeight: 600 };
        if (type === 'negative') return { background: '#FEF2F2', color: '#DC2626', padding: '2px 8px', borderRadius: '999px', fontSize: '11px', fontWeight: 600 };
        return { background: '#F3F4F6', color: '#9CA3AF', padding: '2px 8px', borderRadius: '999px', fontSize: '11px', fontWeight: 600 };
    };

    const ghostBtnStyle: React.CSSProperties = {
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '8px 16px',
        borderRadius: '8px',
        border: '1px solid #E5E7EB',
        background: '#FFFFFF',
        color: ds.textPrimary,
        fontSize: '14px',
        fontWeight: 500,
        fontFamily: ds.fontBody,
        cursor: 'pointer',
        transition: 'all 0.15s',
    };

    const primaryBtnStyle: React.CSSProperties = {
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '8px 16px',
        borderRadius: '8px',
        border: 'none',
        background: ds.primary,
        color: '#FFFFFF',
        fontSize: '14px',
        fontWeight: 600,
        fontFamily: ds.fontBody,
        cursor: 'pointer',
        transition: 'all 0.15s',
    };

    return (
        <div style={{ maxWidth: '900px', margin: '0 auto', padding: '0 0 32px', fontFamily: ds.fontBody }}>

            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}
            >
                <div>
                    <h1 style={{ fontFamily: ds.fontDisplay, fontSize: '26px', fontWeight: 700, color: ds.textPrimary, margin: 0 }}>
                        {greeting},{' '}
                        <span style={{ color: ds.primary }}>{firstName}</span>
                    </h1>
                    <p style={{ fontSize: '14px', color: ds.textSecondary, marginTop: '4px' }}>
                        {todaySubmitted
                            ? 'Check-in de hoje enviado — análise de call em andamento.'
                            : 'Registre suas calls do dia para manter o histórico atualizado.'}
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <button style={ghostBtnStyle} onClick={() => navigate('/seller/evolution')}>
                        <TrendingUp size={16} strokeWidth={1.5} />
                        Evolução
                    </button>
                    <button style={ghostBtnStyle} onClick={() => navigate('/training/coach')}>
                        <MessageSquare size={16} strokeWidth={1.5} />
                        Consultoria
                    </button>
                    <AgentFeedbackButton defaultAgentType="closer" />
                    {!todaySubmitted && (
                        <button style={primaryBtnStyle} onClick={() => navigate('/seller/report')}>
                            <CheckCircle size={16} strokeWidth={1.5} />
                            Check-in
                        </button>
                    )}
                </div>
            </motion.div>

            {/* Pending Form Banner */}
            <FormPendingBanner formType="closer_daily" />

            {/* Priority CTA — shown FIRST when check-in not done */}
            {!todaySubmitted && (
                <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    onClick={() => navigate('/closer/report')}
                    style={{
                        background: 'linear-gradient(135deg, #1B2B4A 0%, #2D4A7A 100%)',
                        borderRadius: '14px',
                        padding: '20px 24px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '20px',
                        cursor: 'pointer',
                        boxShadow: '0 4px 20px rgba(27,43,74,0.25)',
                        marginBottom: '8px',
                    }}
                >
                    <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(230,184,77,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Phone size={22} strokeWidth={1.5} style={{ color: '#E6B84D' }} />
                    </div>
                    <div style={{ flex: 1 }}>
                        <p style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#E6B84D', marginBottom: '2px', fontFamily: ds.fontBody }}>
                            Ação do Dia
                        </p>
                        <h3 style={{ fontFamily: ds.fontDisplay, fontSize: '17px', fontWeight: 700, color: '#FFFFFF', margin: '0 0 2px', lineHeight: 1.2 }}>
                            Fazer o Check-in de Hoje
                        </h3>
                        <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)', margin: 0, fontFamily: ds.fontBody }}>
                            Registre calls, conversão e upload de gravação
                        </p>
                    </div>
                    <ChevronRight size={20} strokeWidth={1.5} style={{ color: 'rgba(255,255,255,0.4)', flexShrink: 0 }} />
                </motion.div>
            )}

            {/* KPI Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '24px' }}>
                {kpis.map((kpi, i) => (
                    <motion.div
                        key={kpi.label}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.07 }}
                        style={cardStyle}
                        className="kpi-card"
                        onMouseEnter={e => {
                            (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
                            (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 12px rgba(0,0,0,0.10)';
                        }}
                        onMouseLeave={e => {
                            (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
                            (e.currentTarget as HTMLElement).style.boxShadow = ds.shadow;
                        }}
                    >
                        <div style={{ padding: '16px 20px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                                <span style={labelStyle}>{kpi.label}</span>
                                <kpi.icon size={16} strokeWidth={1.5} style={{ color: ds.textMuted }} />
                            </div>
                            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '8px' }}>
                                <span style={kpiNumStyle}>{kpi.value}</span>
                                {kpi.badge && (
                                    <span style={getBadgeStyle(kpi.badge)}>
                                        {kpi.badge === 'positive' ? '↑' : kpi.badge === 'negative' ? '↓' : '—'}
                                    </span>
                                )}
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Latest Analysis Card */}
            {latestAnalysis && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    style={{ ...cardStyle, marginBottom: '24px' }}
                >
                    <div style={{ padding: '20px 20px 8px', borderBottom: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <TrendingUp size={17} strokeWidth={1.5} style={{ color: ds.primary }} />
                        <span style={{ fontFamily: ds.fontDisplay, fontSize: '15px', fontWeight: 700, color: ds.textPrimary }}>
                            Última Análise de Call
                        </span>
                    </div>
                    <div style={{ padding: '20px' }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', marginBottom: '16px' }}>
                            <div style={{
                                textAlign: 'center', padding: '12px 20px', borderRadius: '10px',
                                background: '#FEF9EC', flexShrink: 0
                            }}>
                                <div style={{ fontFamily: ds.fontDisplay, fontSize: '28px', fontWeight: 700, color: ds.primary, lineHeight: 1 }}>
                                    {latestAnalysis.score}
                                </div>
                                <div style={{ fontSize: '10px', textTransform: 'uppercase' as const, letterSpacing: '0.08em', color: ds.textMuted, marginTop: '4px' }}>
                                    Score
                                </div>
                            </div>
                            <p style={{ fontSize: '14px', color: ds.textSecondary, lineHeight: 1.6, flex: 1, margin: 0, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' as any, overflow: 'hidden' }}>
                                {latestAnalysis.content}
                            </p>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                            <div style={{ padding: '14px', borderRadius: '10px', background: '#ECFDF5', border: '1px solid #A7F3D0' }}>
                                <div style={{ fontSize: '10px', fontWeight: 700, color: '#059669', textTransform: 'uppercase' as const, letterSpacing: '0.08em', marginBottom: '10px' }}>
                                    Pontos Fortes
                                </div>
                                <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                    {latestAnalysis.strengths?.slice(0, 3).map((s, i) => (
                                        <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', fontSize: '12px', color: ds.textSecondary }}>
                                            <CheckCircle size={12} strokeWidth={1.5} style={{ color: '#059669', marginTop: '2px', flexShrink: 0 }} />
                                            {s}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <div style={{ padding: '14px', borderRadius: '10px', background: '#FFFBEB', border: '1px solid #FDE68A' }}>
                                <div style={{ fontSize: '10px', fontWeight: 700, color: '#D97706', textTransform: 'uppercase' as const, letterSpacing: '0.08em', marginBottom: '10px' }}>
                                    Melhorar
                                </div>
                                <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                    {latestAnalysis.improvements?.slice(0, 3).map((s, i) => (
                                        <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', fontSize: '12px', color: ds.textSecondary }}>
                                            <AlertTriangle size={12} strokeWidth={1.5} style={{ color: '#D97706', marginTop: '2px', flexShrink: 0 }} />
                                            {s}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}

            {/* Recent Submissions */}
            {submissions.length > 0 && (
                <div style={cardStyle}>
                    <div style={{ padding: '20px 20px 12px', borderBottom: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <BarChart3 size={17} strokeWidth={1.5} style={{ color: ds.primary }} />
                        <span style={{ fontFamily: ds.fontDisplay, fontSize: '15px', fontWeight: 700, color: ds.textPrimary }}>
                            Últimos Check-ins
                        </span>
                    </div>
                    <div style={{ padding: '12px 20px' }}>
                        {submissions.slice(0, 5).map((sub) => {
                            const metrics = sub.metrics as CloserMetrics;
                            return (
                                <div
                                    key={sub.id}
                                    style={{
                                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                        padding: '10px 12px', borderRadius: '8px', transition: 'background 0.12s',
                                    }}
                                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#F9FAFB'}
                                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: ds.accent, border: `2px solid ${ds.primary}` }} />
                                        <span style={{ fontSize: '13px', fontFamily: 'monospace', color: ds.textPrimary }}>{sub.submission_date}</span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                        <span style={{ fontSize: '12px', color: ds.textSecondary, fontFamily: 'monospace' }}>
                                            {metrics?.calls_made || 0} calls
                                        </span>
                                        <span style={{ fontSize: '12px', color: ds.textSecondary, fontFamily: 'monospace' }}>
                                            {metrics?.conversion_rate || 0}% conv.
                                        </span>
                                        {sub.call_recording && (
                                            <Phone size={13} strokeWidth={1.5} style={{ color: '#3B82F6' }} />
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
