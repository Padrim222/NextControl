import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Textarea } from '@/components/ui/textarea';
import {
    FileText,
    MessageSquare,
    Send,
    Loader2,
    ClipboardList,
    CheckCircle,
    Clock,
    HelpCircle,
    BookOpen,
    Brain,
} from '@/components/ui/icons';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import type { Client } from '@/types';
import { FormPendingBanner } from '@/components/forms/FormPendingBanner';

interface ClientQuestion {
    id: string;
    question_text: string;
    status: 'pending' | 'answered' | 'escalated';
    response_text: string | null;
    created_at: string;
    responded_at: string | null;
}

interface ClientReport {
    id: string;
    status: string;
    pdf_url: string | null;
    created_at: string;
    review_notes: string | null;
}

type Tab = 'plano' | 'relatorios' | 'perguntas';

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

export default function ClientDashboard() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [client, setClient] = useState<Client | null>(null);
    const [questions, setQuestions] = useState<ClientQuestion[]>([]);
    const [reports, setReports] = useState<ClientReport[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<Tab>('plano');
    const [newQuestion, setNewQuestion] = useState('');
    const [isSending, setIsSending] = useState(false);

    useEffect(() => {
        if (!user) return;
        fetchData();
    }, [user]);

    const fetchData = async () => {
        if (!supabase || !user) { setIsLoading(false); return; }
        setIsLoading(true);
        try {
            const { data: userData } = await (supabase as any)
                .from('users')
                .select('client_id')
                .eq('id', user.id)
                .single();

            if (!userData?.client_id) {
                setIsLoading(false);
                return;
            }

            const clientId = userData.client_id;

            const [clientRes, questionsRes, reportsRes] = await Promise.all([
                (supabase as any).from('clients').select('*').eq('id', clientId).single(),
                (supabase as any)
                    .from('client_questions')
                    .select('id, question_text, status, response_text, created_at, responded_at')
                    .eq('client_id', clientId)
                    .order('created_at', { ascending: false }),
                (supabase as any)
                    .from('reports')
                    .select('id, status, pdf_url, created_at, review_notes')
                    .eq('status', 'delivered')
                    .order('created_at', { ascending: false })
                    .limit(20),
            ]);

            if (clientRes.data) setClient(clientRes.data);
            if (questionsRes.data) setQuestions(questionsRes.data);
            if (reportsRes.data) setReports(reportsRes.data);
        } catch (error) {
            console.error('Error fetching client data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSendQuestion = async () => {
        if (!newQuestion.trim() || !client || !supabase) return;
        setIsSending(true);
        try {
            const { error } = await (supabase as any)
                .from('client_questions')
                .insert({
                    client_id: client.id,
                    asked_by: user?.name || user?.email || 'Client',
                    question_text: newQuestion.trim(),
                    status: 'pending',
                });

            if (error) throw error;

            toast.success('Pergunta enviada! Responderemos em breve.');
            setNewQuestion('');
            fetchData();
        } catch (error) {
            toast.error('Erro ao enviar pergunta. Tente novamente.');
        } finally {
            setIsSending(false);
        }
    };

    // ── Loading skeleton ──────────────────────────────────────────────────────
    if (isLoading) {
        return (
            <div style={{ maxWidth: '900px', margin: '0 auto', padding: '0 0 32px', fontFamily: ds.fontBody }}>
                <div style={{ marginBottom: '24px' }}>
                    <div style={{ height: '32px', width: '260px', borderRadius: '8px', background: '#E5E7EB', animation: 'pulse 1.5s ease-in-out infinite', marginBottom: '8px' }} />
                    <div style={{ height: '16px', width: '180px', borderRadius: '8px', background: '#F3F4F6', animation: 'pulse 1.5s ease-in-out infinite' }} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px' }}>
                    {[0, 1].map(i => (
                        <div key={i} style={{ ...cardStyle, height: '80px', animation: 'pulse 1.5s ease-in-out infinite' }} />
                    ))}
                </div>
                <div style={{ ...cardStyle, height: '300px', animation: 'pulse 1.5s ease-in-out infinite' }} />
                <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.5} }`}</style>
            </div>
        );
    }

    // ── No client yet ─────────────────────────────────────────────────────────
    if (!client) {
        return (
            <div style={{ maxWidth: '700px', margin: '0 auto', padding: '0 0 32px', fontFamily: ds.fontBody }}>
                <div style={{ textAlign: 'center', padding: '48px 0 32px' }}>
                    <div style={{
                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                        width: '64px', height: '64px', borderRadius: '16px',
                        background: '#FEF9EC', marginBottom: '16px'
                    }}>
                        <Clock size={28} strokeWidth={1.5} style={{ color: ds.primary }} />
                    </div>
                    <h1 style={{ fontFamily: ds.fontDisplay, fontSize: '26px', fontWeight: 700, color: ds.textPrimary, margin: '0 0 8px' }}>
                        Bem-vindo ao <span style={{ color: ds.primary }}>Next Control</span>!
                    </h1>
                    <p style={{ fontSize: '14px', color: ds.textSecondary, maxWidth: '440px', margin: '0 auto 32px', lineHeight: 1.6 }}>
                        Sua conta está ativa. O time de CS está configurando seu projeto — em breve você terá acesso completo ao painel.
                    </p>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px' }}>
                    <div
                        style={{ ...cardStyle, padding: '24px', textAlign: 'center', cursor: 'pointer', transition: 'all 0.15s' }}
                        onClick={() => navigate('/training/coach')}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 12px rgba(0,0,0,0.10)'; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLElement).style.boxShadow = ds.shadow; }}
                    >
                        <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '48px', height: '48px', borderRadius: '12px', background: '#EFF6FF', marginBottom: '12px' }}>
                            <Brain size={22} strokeWidth={1.5} style={{ color: '#3B82F6' }} />
                        </div>
                        <h3 style={{ fontFamily: ds.fontDisplay, fontSize: '15px', fontWeight: 700, color: ds.textPrimary, margin: '0 0 4px' }}>Consultoria de Bolso</h3>
                        <p style={{ fontSize: '13px', color: ds.textSecondary, margin: 0 }}>Tire dúvidas estratégicas com IA enquanto seu projeto é configurado</p>
                    </div>
                    <div
                        style={{ ...cardStyle, padding: '24px', textAlign: 'center', cursor: 'pointer', transition: 'all 0.15s' }}
                        onClick={() => navigate('/training')}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 12px rgba(0,0,0,0.10)'; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLElement).style.boxShadow = ds.shadow; }}
                    >
                        <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '48px', height: '48px', borderRadius: '12px', background: '#FFFBEB', marginBottom: '12px' }}>
                            <BookOpen size={22} strokeWidth={1.5} style={{ color: '#D97706' }} />
                        </div>
                        <h3 style={{ fontFamily: ds.fontDisplay, fontSize: '15px', fontWeight: 700, color: ds.textPrimary, margin: '0 0 4px' }}>Base de Conhecimento</h3>
                        <p style={{ fontSize: '13px', color: ds.textSecondary, margin: 0 }}>Explore materiais e treinamentos disponíveis</p>
                    </div>
                </div>
                <p style={{ fontSize: '12px', color: ds.textMuted, textAlign: 'center' }}>
                    Dúvidas? Fale com o time:{' '}
                    <span style={{ color: ds.primary, fontWeight: 600 }}>suporte@nextcontrol.com</span>
                </p>
            </div>
        );
    }

    const tabs: { key: Tab; label: string; icon: any; count?: number }[] = [
        { key: 'plano', label: 'Meu Plano', icon: ClipboardList },
        { key: 'relatorios', label: 'Relatórios', icon: FileText, count: reports.length },
        { key: 'perguntas', label: 'Perguntas', icon: MessageSquare, count: questions.length },
    ];

    const pendingQuestions = questions.filter(q => q.status === 'pending').length;

    const primaryBtnStyle: React.CSSProperties = {
        display: 'inline-flex', alignItems: 'center', gap: '6px',
        padding: '8px 20px', borderRadius: '8px', border: 'none',
        background: ds.primary, color: '#FFFFFF', fontSize: '14px',
        fontWeight: 600, fontFamily: ds.fontBody, cursor: 'pointer', transition: 'all 0.15s',
    };

    const primaryBtnDisabledStyle: React.CSSProperties = {
        ...primaryBtnStyle, opacity: 0.5, cursor: 'not-allowed',
    };

    return (
        <div style={{ maxWidth: '900px', margin: '0 auto', padding: '0 0 48px', fontFamily: ds.fontBody }}>

            {/* Header */}
            <div style={{ marginBottom: '24px' }}>
                <h1 style={{ fontFamily: ds.fontDisplay, fontSize: '26px', fontWeight: 700, color: ds.textPrimary, margin: '0 0 4px' }}>
                    Bem-vindo, <span style={{ color: ds.primary }}>{client.name}</span>
                </h1>
                <p style={{ fontSize: '14px', color: ds.textSecondary, margin: 0 }}>
                    {client.company ? `Projeto: ${client.company}` : 'Acompanhe seu projeto em tempo real.'}
                </p>
            </div>

            {/* Pending Form Banner */}
            <FormPendingBanner formType="expert_weekly" />

            {/* Quick Action Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px' }}>
                <div
                    style={{ ...cardStyle, padding: '20px', display: 'flex', alignItems: 'center', gap: '16px', cursor: 'pointer', transition: 'all 0.15s' }}
                    onClick={() => navigate('/training/coach')}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 12px rgba(0,0,0,0.10)'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLElement).style.boxShadow = ds.shadow; }}
                >
                    <div style={{ padding: '12px', borderRadius: '12px', background: '#EFF6FF', flexShrink: 0 }}>
                        <Brain size={22} strokeWidth={1.5} style={{ color: '#3B82F6', display: 'block' }} />
                    </div>
                    <div>
                        <div style={{ fontFamily: ds.fontDisplay, fontSize: '15px', fontWeight: 700, color: ds.textPrimary, marginBottom: '2px' }}>Consultoria de Bolso</div>
                        <div style={{ fontSize: '13px', color: ds.textSecondary }}>Tire dúvidas estratégicas com IA</div>
                    </div>
                </div>
                <div
                    style={{ ...cardStyle, padding: '20px', display: 'flex', alignItems: 'center', gap: '16px', cursor: 'pointer', transition: 'all 0.15s' }}
                    onClick={() => navigate('/training')}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 12px rgba(0,0,0,0.10)'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLElement).style.boxShadow = ds.shadow; }}
                >
                    <div style={{ padding: '12px', borderRadius: '12px', background: '#FFFBEB', flexShrink: 0 }}>
                        <BookOpen size={22} strokeWidth={1.5} style={{ color: '#D97706', display: 'block' }} />
                    </div>
                    <div>
                        <div style={{ fontFamily: ds.fontDisplay, fontSize: '15px', fontWeight: 700, color: ds.textPrimary, marginBottom: '2px' }}>Base de Conhecimento</div>
                        <div style={{ fontSize: '13px', color: ds.textSecondary }}>Materiais e treinamentos</div>
                    </div>
                </div>
            </div>

            {/* Pill Tab Navigation */}
            <div style={{
                ...cardStyle,
                display: 'flex', gap: '4px', padding: '4px',
                marginBottom: '16px',
            }}>
                {tabs.map(tab => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        style={{
                            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                            padding: '9px 16px', borderRadius: '9px', border: 'none', cursor: 'pointer',
                            fontSize: '13px', fontWeight: 600, fontFamily: ds.fontBody,
                            transition: 'all 0.15s',
                            background: activeTab === tab.key ? ds.primary : 'transparent',
                            color: activeTab === tab.key ? '#FFFFFF' : ds.textSecondary,
                        }}
                    >
                        <tab.icon size={15} strokeWidth={1.5} />
                        {tab.label}
                        {tab.count !== undefined && tab.count > 0 && (
                            <span style={{
                                background: activeTab === tab.key ? 'rgba(255,255,255,0.25)' : '#F3F4F6',
                                color: activeTab === tab.key ? '#FFFFFF' : ds.textMuted,
                                borderRadius: '999px', fontSize: '11px', fontWeight: 700,
                                padding: '1px 7px', marginLeft: '2px',
                            }}>
                                {tab.count}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* ── Tab: Meu Plano ── */}
            {activeTab === 'plano' && (
                <div style={cardStyle}>
                    <div style={{ padding: '20px 20px 12px', borderBottom: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <ClipboardList size={17} strokeWidth={1.5} style={{ color: ds.primary }} />
                        <div>
                            <div style={{ fontFamily: ds.fontDisplay, fontSize: '16px', fontWeight: 700, color: ds.textPrimary }}>Meu Plano Personalizado</div>
                            <div style={{ fontSize: '13px', color: ds.textSecondary }}>Estratégia desenhada para o seu negócio</div>
                        </div>
                    </div>
                    <div style={{ padding: '20px' }}>
                        <div style={{ padding: '16px', borderRadius: '10px', background: '#F9FAFB', border: '1px solid #E5E7EB', marginBottom: '16px' }}>
                            <div style={{ fontFamily: ds.fontDisplay, fontSize: '14px', fontWeight: 700, color: ds.textPrimary, marginBottom: '8px' }}>Resumo do Projeto</div>
                            <p style={{ fontSize: '14px', color: ds.textSecondary, lineHeight: 1.7, margin: 0 }}>
                                {client.company
                                    ? `Projeto focado em escalar as vendas e otimizar a operação de "${client.company}". Trabalhamos com aquisição perpétua — um modelo que cresce semana a semana, sem depender de campanhas pontuais.`
                                    : 'Seu plano personalizado está sendo preparado. Em breve, você terá acesso completo à estratégia desenhada para o seu negócio.'
                                }
                            </p>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                            <div style={{ padding: '14px', borderRadius: '10px', background: '#ECFDF5', border: '1px solid #A7F3D0' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                                    <CheckCircle size={15} strokeWidth={1.5} style={{ color: '#059669' }} />
                                    <span style={{ fontSize: '13px', fontWeight: 600, color: ds.textPrimary }}>Fase Atual</span>
                                </div>
                                <p style={{ fontSize: '13px', color: ds.textSecondary, margin: 0 }}>Diagnóstico e Configuração</p>
                            </div>
                            <div style={{ padding: '14px', borderRadius: '10px', background: '#EFF6FF', border: '1px solid #BFDBFE' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                                    <Clock size={15} strokeWidth={1.5} style={{ color: '#3B82F6' }} />
                                    <span style={{ fontSize: '13px', fontWeight: 600, color: ds.textPrimary }}>Próxima Etapa</span>
                                </div>
                                <p style={{ fontSize: '13px', color: ds.textSecondary, margin: 0 }}>Implementação da Máquina de Vendas</p>
                            </div>
                            <div style={{ padding: '14px', borderRadius: '10px', background: '#FFFBEB', border: '1px solid #FDE68A' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                                    <HelpCircle size={15} strokeWidth={1.5} style={{ color: '#D97706' }} />
                                    <span style={{ fontSize: '13px', fontWeight: 600, color: ds.textPrimary }}>Dúvidas?</span>
                                </div>
                                <button
                                    onClick={() => setActiveTab('perguntas')}
                                    style={{ background: 'none', border: 'none', padding: 0, fontSize: '13px', color: ds.primary, fontWeight: 600, cursor: 'pointer', fontFamily: ds.fontBody }}
                                >
                                    Envie uma pergunta →
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Tab: Relatórios ── */}
            {activeTab === 'relatorios' && (
                <div style={cardStyle}>
                    <div style={{ padding: '20px 20px 12px', borderBottom: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <FileText size={17} strokeWidth={1.5} style={{ color: ds.primary }} />
                        <div>
                            <div style={{ fontFamily: ds.fontDisplay, fontSize: '16px', fontWeight: 700, color: ds.textPrimary }}>Relatórios</div>
                            <div style={{ fontSize: '13px', color: ds.textSecondary }}>Relatórios de performance gerados pela equipe</div>
                        </div>
                    </div>
                    <div style={{ padding: '20px' }}>
                        {reports.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '48px 0' }}>
                                <FileText size={44} strokeWidth={1} style={{ color: '#D1D5DB', margin: '0 auto 12px', display: 'block' }} />
                                <div style={{ fontFamily: ds.fontDisplay, fontSize: '15px', fontWeight: 600, color: ds.textSecondary, marginBottom: '4px' }}>Nenhum relatório ainda</div>
                                <p style={{ fontSize: '13px', color: ds.textMuted, margin: 0 }}>Quando o time gerar e entregar relatórios, eles aparecerão aqui.</p>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                {reports.map(report => (
                                    <div key={report.id} style={{
                                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                        padding: '14px 16px', borderRadius: '10px',
                                        border: '1px solid #E5E7EB', transition: 'background 0.12s',
                                    }}
                                        onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#F9FAFB'}
                                        onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <div style={{ padding: '8px', borderRadius: '8px', background: '#ECFDF5' }}>
                                                <FileText size={16} strokeWidth={1.5} style={{ color: '#059669', display: 'block' }} />
                                            </div>
                                            <div>
                                                <div style={{ fontSize: '14px', fontWeight: 600, color: ds.textPrimary }}>
                                                    Relatório — {new Date(report.created_at).toLocaleDateString('pt-BR')}
                                                </div>
                                                {report.review_notes && (
                                                    <div style={{ fontSize: '12px', color: ds.textSecondary, marginTop: '2px' }}>{report.review_notes}</div>
                                                )}
                                            </div>
                                        </div>
                                        {report.pdf_url && (
                                            <a
                                                href={report.pdf_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                style={{
                                                    display: 'inline-flex', alignItems: 'center', gap: '6px',
                                                    padding: '6px 14px', borderRadius: '8px',
                                                    border: '1px solid #E5E7EB', background: '#FFFFFF',
                                                    color: ds.textPrimary, fontSize: '13px', fontWeight: 500,
                                                    fontFamily: ds.fontBody, textDecoration: 'none', cursor: 'pointer',
                                                    transition: 'all 0.15s',
                                                }}
                                            >
                                                Baixar PDF
                                            </a>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ── Tab: Perguntas ── */}
            {activeTab === 'perguntas' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {/* Ask a Question */}
                    <div style={cardStyle}>
                        <div style={{ padding: '20px 20px 12px', borderBottom: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Send size={17} strokeWidth={1.5} style={{ color: ds.primary }} />
                            <div>
                                <div style={{ fontFamily: ds.fontDisplay, fontSize: '16px', fontWeight: 700, color: ds.textPrimary }}>Enviar Pergunta</div>
                                <div style={{ fontSize: '13px', color: ds.textSecondary }}>Tire suas dúvidas diretamente com a equipe</div>
                            </div>
                        </div>
                        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <Textarea
                                placeholder="Escreva sua pergunta aqui... (ex: Como está a performance de tráfego dessa semana?)"
                                value={newQuestion}
                                onChange={e => setNewQuestion(e.target.value)}
                                rows={3}
                                style={{
                                    resize: 'none', fontFamily: ds.fontBody, fontSize: '14px',
                                    border: '1px solid #E5E7EB', borderRadius: '10px', padding: '12px 14px',
                                    color: ds.textPrimary, outline: 'none', width: '100%', boxSizing: 'border-box' as const,
                                }}
                            />
                            <div>
                                <button
                                    onClick={handleSendQuestion}
                                    disabled={!newQuestion.trim() || isSending}
                                    style={!newQuestion.trim() || isSending ? primaryBtnDisabledStyle : primaryBtnStyle}
                                >
                                    {isSending ? (
                                        <><Loader2 size={15} strokeWidth={1.5} style={{ animation: 'spin 1s linear infinite' }} /> Enviando...</>
                                    ) : (
                                        <><Send size={15} strokeWidth={1.5} /> Enviar Pergunta</>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Question History */}
                    <div style={cardStyle}>
                        <div style={{ padding: '20px 20px 12px', borderBottom: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <MessageSquare size={17} strokeWidth={1.5} style={{ color: ds.primary }} />
                            <div style={{ fontFamily: ds.fontDisplay, fontSize: '16px', fontWeight: 700, color: ds.textPrimary }}>
                                Histórico
                            </div>
                            {pendingQuestions > 0 && (
                                <span style={{
                                    background: '#FFFBEB', color: '#D97706',
                                    borderRadius: '999px', fontSize: '11px', fontWeight: 700,
                                    padding: '2px 8px', marginLeft: '4px'
                                }}>
                                    {pendingQuestions} pendente{pendingQuestions > 1 ? 's' : ''}
                                </span>
                            )}
                        </div>
                        <div style={{ padding: '20px' }}>
                            {questions.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '32px 0' }}>
                                    <MessageSquare size={36} strokeWidth={1} style={{ color: '#D1D5DB', margin: '0 auto 10px', display: 'block' }} />
                                    <p style={{ fontSize: '13px', color: ds.textMuted, margin: 0 }}>Nenhuma pergunta enviada ainda.</p>
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    {questions.map(q => (
                                        <div key={q.id} style={{ padding: '14px 16px', borderRadius: '10px', border: '1px solid #E5E7EB' }}>
                                            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', marginBottom: '6px' }}>
                                                <p style={{ fontSize: '14px', fontWeight: 500, color: ds.textPrimary, margin: 0, flex: 1, lineHeight: 1.5 }}>
                                                    {q.question_text}
                                                </p>
                                                <span style={
                                                    q.status === 'answered'
                                                        ? { background: '#ECFDF5', color: '#059669', borderRadius: '999px', fontSize: '11px', fontWeight: 700, padding: '3px 10px', whiteSpace: 'nowrap' as const, flexShrink: 0 }
                                                        : q.status === 'pending'
                                                            ? { background: '#FFFBEB', color: '#D97706', borderRadius: '999px', fontSize: '11px', fontWeight: 700, padding: '3px 10px', whiteSpace: 'nowrap' as const, flexShrink: 0 }
                                                            : { background: '#F3F4F6', color: '#9CA3AF', borderRadius: '999px', fontSize: '11px', fontWeight: 700, padding: '3px 10px', whiteSpace: 'nowrap' as const, flexShrink: 0 }
                                                }>
                                                    {q.status === 'pending' && 'Pendente'}
                                                    {q.status === 'answered' && 'Respondida'}
                                                    {q.status === 'escalated' && 'Encaminhada'}
                                                </span>
                                            </div>
                                            <p style={{ fontSize: '12px', color: ds.textMuted, margin: '0 0 0' }}>
                                                {new Date(q.created_at).toLocaleDateString('pt-BR', {
                                                    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                                                })}
                                            </p>
                                            {q.response_text && (
                                                <div style={{
                                                    marginTop: '12px', padding: '12px 14px',
                                                    borderRadius: '8px', background: '#F9FAFB',
                                                    borderLeft: `3px solid ${ds.primary}`,
                                                }}>
                                                    <p style={{ fontSize: '13px', color: ds.textPrimary, margin: 0, lineHeight: 1.6 }}>{q.response_text}</p>
                                                    {q.responded_at && (
                                                        <p style={{ fontSize: '11px', color: ds.textMuted, margin: '6px 0 0' }}>
                                                            Respondida em {new Date(q.responded_at).toLocaleDateString('pt-BR')}
                                                        </p>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
