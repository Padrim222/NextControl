import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { ArrowLeft, CheckCircle, Loader2 } from '@/components/ui/icons';
import DailyCheckinWizard from '@/components/seller/DailyCheckinWizard';
import { AIFeedbackDisplay } from '@/components/seller/AIFeedbackDisplay';
import type { Client, SellerType } from '@/types';

// ── Design tokens ──────────────────────────────────────────
const T = {
    bg: '#FAFAFA',
    card: '#FFFFFF',
    border: '#E5E7EB',
    primary: '#1B2B4A',
    accent: '#E6B84D',
    textPrimary: '#1A1A1A',
    textSecondary: '#6B7280',
    textMuted: '#9CA3AF',
};
const fonts = {
    display: "'Plus Jakarta Sans', system-ui, sans-serif",
    body: "'DM Sans', system-ui, sans-serif",
};

interface AIFeedback {
    operational_analysis: string;
    tactical_analysis: string;
    recommendations: string[];
    score: number;
}

// ── Skeleton ───────────────────────────────────────────────
function Skeleton({ w, h, r = 6 }: { w: string | number; h: number; r?: number }) {
    return (
        <div style={{
            width: w,
            height: h,
            borderRadius: r,
            background: 'linear-gradient(90deg, #F3F4F6 25%, #E9EAEC 50%, #F3F4F6 75%)',
            backgroundSize: '200% 100%',
            animation: 'shimmer 1.4s infinite',
        }} />
    );
}

export default function DailyReport() {
    const { clientId } = useParams<{ clientId: string }>();
    const { user } = useAuth();
    const navigate = useNavigate();

    const [client, setClient] = useState<Client | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [aiFeedback, setAiFeedback] = useState<AIFeedback | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [submissionId, setSubmissionId] = useState<string | null>(null);
    const [sellerType, setSellerType] = useState<SellerType>('seller');

    useEffect(() => {
        async function init() {
            setIsLoading(true);

            // Fetch seller type
            if (user?.id) {
                const { data: profile } = await (supabase as any)
                    .from('users')
                    .select('seller_type')
                    .eq('id', user.id)
                    .single();
                if (profile?.seller_type) {
                    setSellerType(profile.seller_type as SellerType);
                }
            }

            // Fetch client if clientId provided
            if (clientId) {
                const { data, error } = await supabase
                    .from('clients')
                    .select('*')
                    .eq('id', clientId)
                    .single();
                if (error) {
                    console.error('Error fetching client:', error);
                } else {
                    setClient(data);
                }
            }

            setIsLoading(false);
        }
        init();
    }, [clientId, user?.id]);

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (submitted && isAnalyzing && submissionId) {
            interval = setInterval(async () => {
                const { data } = await (supabase as any)
                    .from('analyses')
                    .select('*')
                    .eq('submission_id', submissionId)
                    .single();
                if (data) {
                    setAiFeedback(data as unknown as AIFeedback);
                    setIsAnalyzing(false);
                    clearInterval(interval);
                    toast.success('Análise finalizada!');
                }
            }, 3000);
        }
        return () => clearInterval(interval);
    }, [submitted, isAnalyzing, submissionId]);

    const handleSubmissionSuccess = (id: string | null) => {
        if (id) {
            setSubmissionId(id);
            setSubmitted(true);
            setIsAnalyzing(true);
            toast.success('Submissão enviada! A análise IA será gerada em breve.');
        }
    };

    const handleFinish = () => navigate('/seller');

    const today = new Date().toLocaleDateString('pt-BR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
    });
    const todayDisplay = today.charAt(0).toUpperCase() + today.slice(1);

    // ── Loading skeleton ───────────────────────────────────
    if (isLoading) {
        return (
            <div style={{ minHeight: '100vh', background: T.bg, padding: '32px 24px', fontFamily: fonts.body }}>
                <style>{`
                    @keyframes shimmer {
                        0%   { background-position: -200% 0; }
                        100% { background-position:  200% 0; }
                    }
                `}</style>
                <div style={{ maxWidth: 640, margin: '0 auto' }}>
                    <Skeleton w={80} h={34} r={8} />
                    <div style={{ marginTop: 24, display: 'flex', alignItems: 'center', gap: 12 }}>
                        <Skeleton w={48} h={48} r={10} />
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            <Skeleton w={200} h={22} />
                            <Skeleton w={140} h={14} />
                        </div>
                    </div>
                    <div style={{ marginTop: 32 }}>
                        <Skeleton w="100%" h={420} r={12} />
                    </div>
                </div>
            </div>
        );
    }

    // ── Page ───────────────────────────────────────────────
    return (
        <div style={{ minHeight: '100vh', background: T.bg, padding: '32px 24px', fontFamily: fonts.body }}>
            <style>{`
                @keyframes shimmer {
                    0%   { background-position: -200% 0; }
                    100% { background-position:  200% 0; }
                }
                @keyframes fadeInUp {
                    from { opacity: 0; transform: translateY(10px); }
                    to   { opacity: 1; transform: translateY(0);    }
                }
            `}</style>

            <div style={{ maxWidth: 640, margin: '0 auto' }}>

                {/* ── Page header ───────────────────────── */}
                <div style={{ marginBottom: 28 }}>
                    <button
                        onClick={() => navigate('/seller')}
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 6,
                            background: 'transparent',
                            border: `1px solid ${T.border}`,
                            borderRadius: 8,
                            padding: '6px 14px',
                            fontFamily: fonts.body,
                            fontSize: 13,
                            color: T.textSecondary,
                            cursor: 'pointer',
                            marginBottom: 20,
                            transition: 'background 0.15s',
                        }}
                        onMouseEnter={e => (e.currentTarget.style.background = '#F3F4F6')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                        <ArrowLeft size={14} strokeWidth={1.5} />
                        Voltar
                    </button>

                    <h1 style={{
                        fontFamily: fonts.display,
                        fontSize: 24,
                        fontWeight: 700,
                        color: T.textPrimary,
                        margin: 0,
                        lineHeight: 1.2,
                    }}>
                        Check-in Diário
                    </h1>
                    <p style={{ fontFamily: fonts.body, fontSize: 14, color: T.textSecondary, marginTop: 4 }}>
                        {client
                            ? <>Cliente: <span style={{ fontWeight: 500, color: T.textPrimary }}>{client.name}</span>{client.company && ` • ${client.company}`}</>
                            : todayDisplay
                        }
                    </p>
                </div>

                {/* ── Wizard or Post-submit state ────────── */}
                {!submitted ? (
                    <DailyCheckinWizard
                        sellerType={sellerType}
                        onSuccess={handleSubmissionSuccess}
                    />
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, animation: 'fadeInUp 0.35s ease' }}>

                        {/* Success banner */}
                        <div style={{
                            background: T.card,
                            border: `1px solid ${T.border}`,
                            borderRadius: 12,
                            padding: '18px 22px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 14,
                            boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                        }}>
                            <div style={{
                                width: 42,
                                height: 42,
                                borderRadius: '50%',
                                background: 'rgba(159,232,112,0.18)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0,
                            }}>
                                <CheckCircle size={20} color={T.primary} strokeWidth={1.5} />
                            </div>
                            <div style={{ flex: 1 }}>
                                <p style={{ fontFamily: fonts.display, fontSize: 15, fontWeight: 600, color: T.textPrimary, margin: 0 }}>
                                    Check-in enviado com sucesso!
                                </p>
                                <p style={{ fontFamily: fonts.body, fontSize: 13, color: T.textSecondary, marginTop: 2 }}>
                                    {isAnalyzing ? 'Aguardando análise da IA...' : 'Análise concluída.'}
                                </p>
                            </div>
                            {isAnalyzing && (
                                <Loader2 size={18} color={T.textMuted} strokeWidth={1.5} style={{ animation: 'spin 1s linear infinite', flexShrink: 0 }} />
                            )}
                            {aiFeedback && !isAnalyzing && (
                                <div style={{
                                    flexShrink: 0,
                                    background: T.primary,
                                    color: '#fff',
                                    borderRadius: 20,
                                    padding: '4px 14px',
                                    fontFamily: fonts.display,
                                    fontSize: 14,
                                    fontWeight: 700,
                                }}>
                                    {aiFeedback.score}/100
                                </div>
                            )}
                        </div>

                        {/* AI Feedback component */}
                        <AIFeedbackDisplay feedback={aiFeedback} isLoading={isAnalyzing} />

                        {/* Navigation */}
                        {!isAnalyzing && (
                            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                <button
                                    onClick={handleFinish}
                                    style={{
                                        background: T.primary,
                                        color: '#fff',
                                        border: 'none',
                                        borderRadius: 8,
                                        padding: '0 24px',
                                        height: 44,
                                        fontFamily: fonts.body,
                                        fontSize: 14,
                                        fontWeight: 500,
                                        cursor: 'pointer',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: 8,
                                        transition: 'opacity 0.15s',
                                    }}
                                    onMouseEnter={e => (e.currentTarget.style.opacity = '0.9')}
                                    onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
                                >
                                    Concluir e Voltar
                                    <ArrowLeft size={15} strokeWidth={1.5} style={{ transform: 'rotate(180deg)' }} />
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
