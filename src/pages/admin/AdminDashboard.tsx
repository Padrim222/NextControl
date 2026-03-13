import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import type { User, DailySubmission, Analysis, CallLog, Report } from '@/types';
import { Spinner } from '@/components/ui/Spinner';
import { toast } from 'sonner';
import {
    Users,
    FileText,
    Clock,
    CheckCircle,
    XCircle,
    Sparkles,
    MessageCircle,
    Download,
    Eye,
    RefreshCw,
} from '@/components/ui/icons';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { HeadAgentPanel } from '@/components/admin/HeadAgentPanel';
import { StrategistPanel } from '@/components/admin/StrategistPanel';
import { ImprovementChecklist } from '@/components/admin/ImprovementChecklist';
import { downloadReportAsPDF } from '@/lib/pdf-export';
import { AdminFormPanel } from '@/components/admin/AdminFormPanel';
import { AgentSuggestionsPanel } from '@/components/admin/AgentSuggestionsPanel';

/* ─── Design tokens ─────────────────────────────────────────────── */
const t = {
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
    badgePositive: { background: '#ECFDF5', color: '#059669' } as React.CSSProperties,
    badgeWarning:  { background: '#FFFBEB', color: '#D97706' } as React.CSSProperties,
    badgeError:    { background: '#FEF2F2', color: '#DC2626' } as React.CSSProperties,
    avatarBg: '#FEF9EC',
    avatarColor: '#1B2B4A',
};

/* ─── Shared styles ─────────────────────────────────────────────── */
const cardStyle: React.CSSProperties = {
    background: t.card,
    border: t.border,
    borderRadius: t.radius,
    boxShadow: t.shadow,
};

const btnPrimary: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    background: t.primary,
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '8px',
    padding: '7px 14px',
    fontSize: '13px',
    fontFamily: 'DM Sans, system-ui, sans-serif',
    fontWeight: 500,
    cursor: 'pointer',
};

const btnGhost: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    background: 'transparent',
    color: '#1A1A1A',
    border: '1px solid #E5E7EB',
    borderRadius: '8px',
    padding: '7px 14px',
    fontSize: '13px',
    fontFamily: 'DM Sans, system-ui, sans-serif',
    fontWeight: 500,
    cursor: 'pointer',
};

const btnDanger: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    background: 'transparent',
    color: '#DC2626',
    border: 'none',
    borderRadius: '8px',
    padding: '6px',
    cursor: 'pointer',
};

interface SubmissionWithSeller extends DailySubmission {
    seller?: { name: string; email: string; seller_type: string };
}

export default function AdminDashboard() {
    const { user } = useAuth();
    const [selectedSubmission, setSelectedSubmission] = useState<SubmissionWithSeller | null>(null);
    const [isGeneratingAI, setIsGeneratingAI] = useState(false);
    const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

    const [realUsers, setRealUsers] = useState<User[]>([]);
    const [clients, setClients] = useState<{ id: string; name: string }[]>([]);
    const [submissions, setSubmissions] = useState<SubmissionWithSeller[]>([]);
    const [analyses, setAnalyses] = useState<Analysis[]>([]);
    const [reports, setReports] = useState<Report[]>([]);
    const [callLogs, setCallLogs] = useState<CallLog[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchAll();
    }, []);

    const fetchAll = async () => {
        setIsLoading(true);
        try {
            const { data: usersData } = await (supabase as any)
                .from('users')
                .select('*')
                .order('created_at', { ascending: false });
            if (usersData) setRealUsers(usersData as User[]);

            const { data: clientsData } = await supabase
                .from('clients')
                .select('id, name');
            if (clientsData) setClients(clientsData);

            const { data: subsData } = await (supabase as any)
                .from('daily_submissions')
                .select('*, seller:users!seller_id(name, email, seller_type)')
                .order('created_at', { ascending: false })
                .limit(50);
            if (subsData) setSubmissions(subsData);

            const { data: analysesData } = await (supabase as any)
                .from('analyses')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(50);
            if (analysesData) setAnalyses(analysesData);

            const { data: reportsData } = await (supabase as any)
                .from('reports')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(50);
            if (reportsData) setReports(reportsData);

            const { data: callData } = await supabase
                .from('call_logs')
                .select('*')
                .order('created_at', { ascending: false });
            if (callData) setCallLogs(callData as CallLog[]);
        } catch (error) {
            console.error('Error fetching admin data:', error);
            toast.error('Erro ao carregar dados');
        } finally {
            setIsLoading(false);
        }
    };

    const getSellerName = (sellerId: string) => {
        return realUsers.find(u => u.id === sellerId)?.name || 'Vendedor';
    };

    const getAnalysisForSubmission = (submissionId: string) => {
        return analyses.find(a => a.submission_id === submissionId);
    };

    const getReportForSubmission = (submissionId: string) => {
        return reports.find(r => r.submission_id === submissionId);
    };

    const pendingSubmissions = submissions.filter(s => !getAnalysisForSubmission(s.id));
    const analyzedSubmissions = submissions.filter(s => !!getAnalysisForSubmission(s.id));

    const handleAnalyze = async (submission: SubmissionWithSeller) => {
        setIsGeneratingAI(true);
        try {
            const { data: analysis, error } = await (supabase as any).functions.invoke('analyze-submission', {
                body: { submission_id: submission.id },
            });
            if (error) throw error;
            toast.success(`🤖 Análise concluída! Score: ${analysis?.score || '—'}/100`);
            fetchAll();
            setSelectedSubmission(null);
        } catch (err) {
            console.error('Analysis error:', err);
            toast.error('Erro na análise IA');
        } finally {
            setIsGeneratingAI(false);
        }
    };

    const handleGenerateReport = async (submission: SubmissionWithSeller) => {
        const analysis = getAnalysisForSubmission(submission.id);
        if (!analysis) {
            toast.error('Primeiro analise a submissão antes de gerar o relatório');
            return;
        }
        setIsGeneratingPDF(true);
        try {
            const { data: reportData, error } = await (supabase as any).functions.invoke('generate-report', {
                body: { submission_id: submission.id, analysis_id: analysis.id },
            });
            if (error) throw error;
            if (reportData?.html_content) {
                const sellerName = submission.seller?.name || 'vendedor';
                const date = submission.submission_date;
                await downloadReportAsPDF(reportData.html_content, `relatorio_${sellerName}_${date}.pdf`);
                toast.success('📄 PDF gerado e baixado!');
            } else {
                toast.success('Relatório criado!');
            }
            fetchAll();
            setSelectedSubmission(null);
        } catch (err) {
            console.error('Report generation error:', err);
            toast.error('Erro ao gerar relatório');
        } finally {
            setIsGeneratingPDF(false);
        }
    };

    const handleDeliverWhatsApp = async (submission: SubmissionWithSeller) => {
        const analysis = getAnalysisForSubmission(submission.id);
        const sellerName = submission.seller?.name || 'Vendedor';
        const date = new Date(submission.submission_date).toLocaleDateString('pt-BR');
        const metrics = submission.metrics as any;

        let metricsText = '';
        if (metrics.approaches != null) {
            metricsText = `💬 Abordagens: ${metrics.approaches}\n🔄 Follow-ups: ${metrics.followups}\n📋 Propostas: ${metrics.proposals}\n🎯 Vendas: ${metrics.sales}`;
        } else if (metrics.calls_made != null) {
            metricsText = `📞 Calls: ${metrics.calls_made}\n📈 Conversão: ${metrics.conversion_rate}%`;
        }

        const text = `📊 *Relatório Diário — ${sellerName}*\nData: ${date}\n\n${metricsText}${analysis ? `\n\n🤖 Score IA: ${analysis.score}/100\n\n✅ Forças: ${(analysis.strengths || []).join(', ')}\n⚠️ Melhorar: ${(analysis.improvements || []).join(', ')}` : ''}\n\n_Next Control · Consultoria de Bolso_`;

        const encoded = encodeURIComponent(text);
        window.open(`https://wa.me/?text=${encoded}`, '_blank');
        toast.success('WhatsApp aberto!');
    };

    /* ─── Loading state ──────────────────────────────────────────── */
    if (isLoading) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#FAFAFA' }}>
                <Spinner size="md" />
            </div>
        );
    }

    const teamCount = realUsers.filter(u => u.role !== 'admin' && u.role !== 'client').length;

    return (
        <div style={{ minHeight: '100vh', background: '#FAFAFA', fontFamily: 'DM Sans, system-ui, sans-serif', padding: '32px 24px' }}>
            <div style={{ maxWidth: '1200px', margin: '0 auto' }}>

                {/* ── Page Header ──────────────────────────────────── */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '32px' }}>
                    <div>
                        <h1 style={{
                            fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif',
                            fontSize: '26px',
                            fontWeight: 700,
                            color: '#1A1A1A',
                            margin: 0,
                            lineHeight: 1.2,
                        }}>
                            Painel Admin
                        </h1>
                        <p style={{ fontSize: '14px', color: '#6B7280', margin: '4px 0 0' }}>
                            Olá, {user?.name} · Next Control
                        </p>
                    </div>
                    <button
                        style={{ ...btnGhost, color: '#6B7280' }}
                        onClick={fetchAll}
                    >
                        <RefreshCw size={14} strokeWidth={1.5} />
                        Atualizar
                    </button>
                </div>

                {/* ── KPI Row ──────────────────────────────────────── */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '32px' }}>

                    {/* Equipe */}
                    <div style={cardStyle}>
                        <div style={{ padding: '20px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                            <div>
                                <p style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#9CA3AF', margin: '0 0 8px' }}>
                                    Equipe
                                </p>
                                <p style={{ fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif', fontSize: '32px', fontWeight: 700, color: '#1A1A1A', margin: 0, lineHeight: 1 }}>
                                    {teamCount}
                                </p>
                            </div>
                            <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#FEF9EC', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                <Users size={18} strokeWidth={1.5} color="#1B2B4A" />
                            </div>
                        </div>
                    </div>

                    {/* Clientes */}
                    <div style={cardStyle}>
                        <div style={{ padding: '20px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                            <div>
                                <p style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#9CA3AF', margin: '0 0 8px' }}>
                                    Clientes
                                </p>
                                <p style={{ fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif', fontSize: '32px', fontWeight: 700, color: '#1A1A1A', margin: 0, lineHeight: 1 }}>
                                    {clients.length}
                                </p>
                            </div>
                            <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                <Users size={18} strokeWidth={1.5} color="#4F46E5" />
                            </div>
                        </div>
                    </div>

                    {/* Aguardando Análise */}
                    <div style={{ ...cardStyle, borderColor: pendingSubmissions.length > 0 ? '#FCD34D' : '#E5E7EB' }}>
                        <div style={{ padding: '20px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                            <div>
                                <p style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#9CA3AF', margin: '0 0 8px' }}>
                                    Aguardando Análise
                                </p>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <p style={{ fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif', fontSize: '32px', fontWeight: 700, color: pendingSubmissions.length > 0 ? '#D97706' : '#1A1A1A', margin: 0, lineHeight: 1 }}>
                                        {pendingSubmissions.length}
                                    </p>
                                    {pendingSubmissions.length > 0 && (
                                        <span style={{ background: '#FFFBEB', color: '#D97706', fontSize: '11px', fontWeight: 600, padding: '2px 8px', borderRadius: '999px' }}>
                                            pendente
                                        </span>
                                    )}
                                </div>
                            </div>
                            <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#FFFBEB', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                <Clock size={18} strokeWidth={1.5} color="#D97706" />
                            </div>
                        </div>
                    </div>

                    {/* Analisados */}
                    <div style={cardStyle}>
                        <div style={{ padding: '20px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                            <div>
                                <p style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#9CA3AF', margin: '0 0 8px' }}>
                                    Analisados
                                </p>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <p style={{ fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif', fontSize: '32px', fontWeight: 700, color: analyzedSubmissions.length > 0 ? '#059669' : '#1A1A1A', margin: 0, lineHeight: 1 }}>
                                        {analyzedSubmissions.length}
                                    </p>
                                    {analyzedSubmissions.length > 0 && (
                                        <span style={{ background: '#ECFDF5', color: '#059669', fontSize: '11px', fontWeight: 600, padding: '2px 8px', borderRadius: '999px' }}>
                                            ok
                                        </span>
                                    )}
                                </div>
                            </div>
                            <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#ECFDF5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                <CheckCircle size={18} strokeWidth={1.5} color="#059669" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── Action Grid ──────────────────────────────────── */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>

                    {/* Validação de Acessos */}
                    <div style={cardStyle}>
                        <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid #E5E7EB' }}>
                            <p style={{ fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif', fontSize: '16px', fontWeight: 600, color: '#1A1A1A', margin: '0 0 2px' }}>
                                Validação de Acessos
                            </p>
                            <p style={{ fontSize: '13px', color: '#6B7280', margin: 0 }}>
                                Libere acesso para novos membros
                            </p>
                        </div>
                        <div style={{ padding: '16px 20px' }}>
                            {realUsers.filter(u => u.status === 'pending').length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '32px 0', color: '#9CA3AF' }}>
                                    <CheckCircle size={28} strokeWidth={1.5} style={{ margin: '0 auto 8px', display: 'block', opacity: 0.4 }} />
                                    <p style={{ fontSize: '14px', margin: 0 }}>Todos validados</p>
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    {realUsers.filter(u => u.status === 'pending').map(pendingUser => (
                                        <div key={pendingUser.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: '#FAFAFA', border: '1px solid #E5E7EB', borderRadius: '10px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#FEF9EC', color: '#1B2B4A', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif', fontWeight: 700, fontSize: '14px', flexShrink: 0 }}>
                                                    {pendingUser.name?.charAt(0).toUpperCase() || '?'}
                                                </div>
                                                <div>
                                                    <p style={{ fontSize: '14px', fontWeight: 600, color: '#1A1A1A', margin: '0 0 1px' }}>
                                                        {pendingUser.name}
                                                    </p>
                                                    <p style={{ fontSize: '12px', color: '#9CA3AF', margin: 0 }}>
                                                        {pendingUser.email} · <span style={{ textTransform: 'capitalize' }}>{pendingUser.role}</span>
                                                    </p>
                                                </div>
                                            </div>
                                            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                                                <button
                                                    style={btnDanger}
                                                    title="Rejeitar"
                                                    onClick={async () => {
                                                        const { error } = await (supabase as any).from('users').update({ status: 'suspended' }).eq('id', pendingUser.id);
                                                        if (error) { toast.error('Erro'); } else {
                                                            toast.success('Rejeitado');
                                                            setRealUsers(prev => prev.map(u => u.id === pendingUser.id ? { ...u, status: 'suspended' as const } : u));
                                                        }
                                                    }}
                                                >
                                                    <XCircle size={18} strokeWidth={1.5} />
                                                </button>
                                                <button
                                                    style={{ ...btnPrimary, padding: '6px 12px', fontSize: '12px' }}
                                                    onClick={async () => {
                                                        const { error } = await (supabase as any).from('users').update({ status: 'active' }).eq('id', pendingUser.id);
                                                        if (error) { toast.error('Erro'); } else {
                                                            toast.success('Acesso liberado!');
                                                            setRealUsers(prev => prev.map(u => u.id === pendingUser.id ? { ...u, status: 'active' as const } : u));
                                                        }
                                                    }}
                                                >
                                                    <CheckCircle size={13} strokeWidth={1.5} />
                                                    Aprovar
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Submissões Pendentes */}
                    <div style={cardStyle}>
                        <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid #E5E7EB' }}>
                            <p style={{ fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif', fontSize: '16px', fontWeight: 600, color: '#1A1A1A', margin: '0 0 2px' }}>
                                Submissões Pendentes
                            </p>
                            <p style={{ fontSize: '13px', color: '#6B7280', margin: 0 }}>
                                Submissões aguardando análise IA
                            </p>
                        </div>
                        <div style={{ padding: '16px 20px' }}>
                            {pendingSubmissions.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '32px 0', color: '#9CA3AF' }}>
                                    <CheckCircle size={28} strokeWidth={1.5} style={{ margin: '0 auto 8px', display: 'block', opacity: 0.4 }} />
                                    <p style={{ fontSize: '14px', margin: 0 }}>Nenhuma submissão pendente</p>
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '300px', overflowY: 'auto', paddingRight: '4px' }}>
                                    {pendingSubmissions.map((sub) => (
                                        <div key={sub.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: '#FAFAFA', border: '1px solid #E5E7EB', borderRadius: '10px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#FEF9EC', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                    <FileText size={16} strokeWidth={1.5} color="#1B2B4A" />
                                                </div>
                                                <div>
                                                    <p style={{ fontSize: '14px', fontWeight: 600, color: '#1A1A1A', margin: '0 0 1px' }}>
                                                        {sub.seller?.name || getSellerName(sub.seller_id)}
                                                    </p>
                                                    <p style={{ fontSize: '12px', color: '#9CA3AF', margin: 0 }}>
                                                        {new Date(sub.submission_date).toLocaleDateString('pt-BR')} · {sub.conversation_prints?.length || 0} prints
                                                    </p>
                                                </div>
                                            </div>
                                            <div style={{ display: 'flex', gap: '6px' }}>
                                                <button
                                                    style={{ ...btnGhost, padding: '5px 10px', fontSize: '12px' }}
                                                    onClick={() => setSelectedSubmission(sub)}
                                                >
                                                    <Eye size={13} strokeWidth={1.5} />
                                                    Ver
                                                </button>
                                                <button
                                                    style={{ ...btnPrimary, padding: '5px 10px', fontSize: '12px' }}
                                                    onClick={() => handleAnalyze(sub)}
                                                >
                                                    <Sparkles size={13} strokeWidth={1.5} />
                                                    Analisar IA
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* ── HeadAgentPanel + StrategistPanel ─────────────── */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
                    <HeadAgentPanel
                        reports={[]}
                        callLogs={callLogs}
                        sellerName={realUsers.find(u => u.role === 'seller')?.name || 'Equipe'}
                        clientName={clients[0]?.name || 'Cliente'}
                    />
                    <StrategistPanel
                        clientName={clients[0]?.name || 'Cliente'}
                        onStrategySent={(strategy) => {
                            toast.success('Estratégia enviada!', { description: strategy.substring(0, 80) + '...' });
                        }}
                    />
                </div>

                {/* ── AdminFormPanel ────────────────────────────────── */}
                <div style={{ marginBottom: '24px' }}>
                    <AdminFormPanel />
                </div>

                {/* ── AgentSuggestionsPanel ─────────────────────────── */}
                <div style={{ marginBottom: '24px' }}>
                    <AgentSuggestionsPanel />
                </div>

                {/* ── Analyzed Submissions ──────────────────────────── */}
                {analyzedSubmissions.length > 0 && (
                    <div style={{ ...cardStyle, marginBottom: '24px' }}>
                        <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid #E5E7EB' }}>
                            <p style={{ fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif', fontSize: '16px', fontWeight: 600, color: '#1A1A1A', margin: '0 0 2px' }}>
                                Submissões Analisadas
                            </p>
                            <p style={{ fontSize: '13px', color: '#6B7280', margin: 0 }}>
                                Resultados das análises IA — gere PDFs ou envie via WhatsApp
                            </p>
                        </div>
                        <div style={{ padding: '16px 20px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '400px', overflowY: 'auto', paddingRight: '4px' }}>
                                {analyzedSubmissions.slice(0, 20).map((sub) => {
                                    const analysis = getAnalysisForSubmission(sub.id);
                                    const _report = getReportForSubmission(sub.id);
                                    return (
                                        <div key={sub.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: '#FAFAFA', border: '1px solid #E5E7EB', borderRadius: '10px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#ECFDF5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                    <CheckCircle size={16} strokeWidth={1.5} color="#059669" />
                                                </div>
                                                <div>
                                                    <p style={{ fontSize: '14px', fontWeight: 600, color: '#1A1A1A', margin: '0 0 1px' }}>
                                                        {sub.seller?.name || getSellerName(sub.seller_id)}
                                                    </p>
                                                    <p style={{ fontSize: '12px', color: '#9CA3AF', margin: 0 }}>
                                                        {new Date(sub.submission_date).toLocaleDateString('pt-BR')} · Score:{' '}
                                                        <span style={{ fontWeight: 700, fontFamily: 'monospace', color: '#059669' }}>
                                                            {analysis?.score || '—'}
                                                        </span>
                                                    </p>
                                                </div>
                                            </div>
                                            <div style={{ display: 'flex', gap: '6px' }}>
                                                <button
                                                    style={{ ...btnGhost, padding: '5px 10px', fontSize: '12px', opacity: isGeneratingPDF ? 0.5 : 1 }}
                                                    onClick={() => handleGenerateReport(sub)}
                                                    disabled={isGeneratingPDF}
                                                >
                                                    <Download size={13} strokeWidth={1.5} />
                                                    PDF
                                                </button>
                                                <button
                                                    style={{ ...btnPrimary, padding: '5px 10px', fontSize: '12px', background: '#059669' }}
                                                    onClick={() => handleDeliverWhatsApp(sub)}
                                                >
                                                    <MessageCircle size={13} strokeWidth={1.5} />
                                                    WhatsApp
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                )}

            </div>

            {/* ── Submission Detail Modal ───────────────────────────── */}
            <Dialog open={!!selectedSubmission} onOpenChange={() => setSelectedSubmission(null)}>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Detalhes da Submissão</DialogTitle>
                        <DialogDescription>
                            {selectedSubmission && (
                                <>
                                    {selectedSubmission.seller?.name || getSellerName(selectedSubmission.seller_id)} ·{' '}
                                    {new Date(selectedSubmission.submission_date).toLocaleDateString('pt-BR')}
                                </>
                            )}
                        </DialogDescription>
                    </DialogHeader>

                    {selectedSubmission && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

                            {/* Metrics */}
                            <div>
                                <p style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#9CA3AF', marginBottom: '10px' }}>
                                    Métricas
                                </p>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                    {Object.entries(selectedSubmission.metrics as Record<string, any>).map(([key, value]) => (
                                        <div key={key} style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: '8px', padding: '12px' }}>
                                            <p style={{ fontSize: '11px', color: '#9CA3AF', textTransform: 'capitalize', margin: '0 0 4px' }}>
                                                {key.replace(/_/g, ' ')}
                                            </p>
                                            <p style={{ fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif', fontSize: '20px', fontWeight: 700, color: '#1A1A1A', margin: 0 }}>
                                                {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Prints */}
                            {selectedSubmission.conversation_prints?.length > 0 && (
                                <div>
                                    <p style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#9CA3AF', marginBottom: '10px' }}>
                                        Prints ({selectedSubmission.conversation_prints.length})
                                    </p>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                                        {selectedSubmission.conversation_prints.map((url, i) => (
                                            <a key={i} href={url} target="_blank" rel="noopener noreferrer" style={{ aspectRatio: '1', background: '#F3F4F6', borderRadius: '8px', overflow: 'hidden', border: '1px solid #E5E7EB', display: 'block' }}>
                                                <img src={url} alt={`Print ${i + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Notes */}
                            {selectedSubmission.notes && (
                                <div style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: '8px', padding: '14px' }}>
                                    <p style={{ fontSize: '13px', fontWeight: 600, color: '#1A1A1A', margin: '0 0 4px' }}>Observações:</p>
                                    <p style={{ fontSize: '13px', color: '#6B7280', margin: 0 }}>{selectedSubmission.notes}</p>
                                </div>
                            )}

                            {/* Actions */}
                            <div style={{ display: 'flex', gap: '10px', paddingTop: '16px', borderTop: '1px solid #E5E7EB' }}>
                                <button
                                    style={{ ...btnPrimary, flex: 1, justifyContent: 'center', padding: '10px 16px', fontSize: '14px', opacity: isGeneratingAI ? 0.7 : 1 }}
                                    onClick={() => handleAnalyze(selectedSubmission)}
                                    disabled={isGeneratingAI}
                                >
                                    <Sparkles size={16} strokeWidth={1.5} />
                                    {isGeneratingAI ? 'Analisando...' : 'Analisar com IA'}
                                </button>
                                <button
                                    style={{ ...btnGhost, padding: '10px 16px', fontSize: '14px', opacity: (!getAnalysisForSubmission(selectedSubmission.id) || isGeneratingPDF) ? 0.5 : 1 }}
                                    onClick={() => handleGenerateReport(selectedSubmission)}
                                    disabled={isGeneratingPDF || !getAnalysisForSubmission(selectedSubmission.id)}
                                >
                                    <Download size={16} strokeWidth={1.5} />
                                    PDF
                                </button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
