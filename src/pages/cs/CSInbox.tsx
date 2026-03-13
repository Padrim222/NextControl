import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Textarea } from '@/components/ui/textarea';
import { motion } from 'framer-motion';
import {
    Users,
    FileText,
    CheckCircle,
    Clock,
    Eye,
    Headphones,
    MessageSquare,
    Calendar,
    Mic,
    Send,
    Loader2,
    HelpCircle,
} from '@/components/ui/icons';
import { AudioRecorder } from '@/components/ui/AudioRecorder';
import type { DailySubmission, User } from '@/types';
import { toast } from 'sonner';
import { InstructionBalloon } from '@/components/ui/instruction-balloon';

interface SellerSummary {
    id: string;
    name: string;
    seller_type: string;
    todaySubmitted: boolean;
    pendingReports: number;
}

type SubmissionWithUser = DailySubmission & { seller_name?: string };

interface ClientQuestion {
    id: string;
    client_id: string;
    asked_by: string;
    question_text: string;
    status: 'pending' | 'answered' | 'escalated';
    response_text: string | null;
    created_at: string;
    responded_at: string | null;
}

type CSTab = 'inbox' | 'perguntas';

const card: React.CSSProperties = {
    background: '#FFFFFF',
    border: '1px solid #E5E7EB',
    borderRadius: '12px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
};

export default function CSInbox() {
    const { user } = useAuth();
    const [sellers, setSellers] = useState<SellerSummary[]>([]);
    const [pendingSubmissions, setPendingSubmissions] = useState<SubmissionWithUser[]>([]);
    const [stats, setStats] = useState({ total: 0, submitted: 0, pending: 0, approved: 0 });
    const [recordingForId, setRecordingForId] = useState<string | null>(null);
    const [isTranscribing, setIsTranscribing] = useState(false);
    const [activeTab, setActiveTab] = useState<CSTab>('inbox');
    const [clientQuestions, setClientQuestions] = useState<ClientQuestion[]>([]);
    const [answeringId, setAnsweringId] = useState<string | null>(null);
    const [answerText, setAnswerText] = useState('');
    const [isSendingAnswer, setIsSendingAnswer] = useState(false);

    useEffect(() => {
        fetchDashboardData();
    }, [user]);

    const fetchDashboardData = async () => {
        if (!supabase || !user) return;
        try {
            const today = new Date().toISOString().split('T')[0];

            const { data: usersData } = await (supabase as any)
                .from('users')
                .select('*')
                .in('role', ['seller', 'closer', 'admin']);

            const sellersList = (usersData || []).filter((u: User) =>
                u.role === 'seller' || u.role === 'closer' || u.seller_type
            );

            const { data: todaySubs } = await (supabase as any)
                .from('daily_submissions')
                .select('seller_id')
                .eq('submission_date', today);

            const todaySellerIds = new Set((todaySubs || []).map((s: any) => s.seller_id));

            const { data: pending } = await (supabase as any)
                .from('daily_submissions')
                .select('*')
                .eq('status', 'pending')
                .order('created_at', { ascending: false });

            const { count: approvedCount } = await (supabase as any)
                .from('daily_submissions')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'approved')
                .eq('submission_date', today);

            const summaries: SellerSummary[] = sellersList.map((u: User) => ({
                id: u.id,
                name: u.name,
                seller_type: u.seller_type || 'seller',
                todaySubmitted: todaySellerIds.has(u.id),
                pendingReports: (pending || []).filter((s: DailySubmission) => s.seller_id === u.id).length,
            }));

            setSellers(summaries);
            setPendingSubmissions(
                (pending || []).map((s: DailySubmission) => ({
                    ...s,
                    seller_name: sellersList.find((u: User) => u.id === s.seller_id)?.name || 'Desconhecido',
                }))
            );

            const submittedCount = summaries.filter(s => s.todaySubmitted).length;

            setStats({
                total: summaries.length,
                submitted: submittedCount,
                pending: (pending || []).length,
                approved: approvedCount || 0,
            });

            const { data: questions } = await (supabase as any)
                .from('client_questions')
                .select('*')
                .order('created_at', { ascending: false });

            setClientQuestions(questions || []);
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        }
    };

    const handleAnswerQuestion = async (questionId: string) => {
        if (!answerText.trim() || !supabase || !user) return;
        setIsSendingAnswer(true);
        try {
            const { error } = await (supabase as any)
                .from('client_questions')
                .update({
                    response_text: answerText.trim(),
                    status: 'answered',
                    responded_by: user.id,
                    responded_at: new Date().toISOString(),
                })
                .eq('id', questionId);

            if (error) throw error;
            toast.success('Resposta enviada!');
            setAnsweringId(null);
            setAnswerText('');
            fetchDashboardData();
        } catch (error) {
            toast.error('Erro ao enviar resposta.');
        } finally {
            setIsSendingAnswer(false);
        }
    };

    const handleApprove = async (id: string) => {
        try {
            const { error } = await (supabase as any)
                .from('daily_submissions')
                .update({ status: 'approved' })
                .eq('id', id);

            if (error) throw error;
            toast.success('Relatório aprovado com sucesso!');
            fetchDashboardData();
        } catch (error) {
            console.error('Error approving:', error);
            toast.error('Erro ao aprovar relatório.');
        }
    };

    const handleViewEvidence = (sub: DailySubmission) => {
        if (sub.conversation_prints?.length > 0) {
            window.open(sub.conversation_prints[0], '_blank');
        } else if (sub.call_recording) {
            window.open(sub.call_recording, '_blank');
        } else {
            toast.info('Sem evidências anexadas.');
        }
    };

    const handleAudioFeedback = async (blob: Blob, submissionId: string) => {
        setIsTranscribing(true);
        try {
            const formData = new FormData();
            formData.append('file', blob, 'feedback.webm');

            const { data, error } = await supabase.functions.invoke('transcribe-audio', {
                body: formData,
            });

            if (error) throw error;

            toast.success('Áudio transcrito com sucesso!');
            console.log('Transcription:', data.text);

            setRecordingForId(null);
            toast.info(`Feedback gerado: "${data.text.substring(0, 30)}..."`);
        } catch (error) {
            console.error('Transcription error:', error);
            toast.error('Erro ao transcrever áudio.');
        } finally {
            setIsTranscribing(false);
        }
    };

    const statCards = [
        {
            label: 'Vendedores',
            value: stats.total,
            icon: Users,
            iconBg: '#F0FDF4',
            iconColor: '#059669',
            tooltip: 'Total de membros ativos no time de vendas.',
        },
        {
            label: 'Check-in Hoje',
            value: `${stats.submitted}/${stats.total}`,
            icon: Calendar,
            iconBg: '#EFF6FF',
            iconColor: '#2563EB',
            tooltip: 'Quantos vendedores já enviaram os números de hoje.',
        },
        {
            label: 'Pendentes',
            value: stats.pending,
            icon: Clock,
            iconBg: '#FFFBEB',
            iconColor: '#D97706',
            tooltip: 'Relatórios aguardando sua análise e aprovação.',
        },
        {
            label: 'Aprovados',
            value: stats.approved,
            icon: CheckCircle,
            iconBg: '#F0FDF4',
            iconColor: '#059669',
            tooltip: 'Relatórios validados e já enviados para o cliente.',
        },
    ];

    const pendingQuestionCount = clientQuestions.filter(q => q.status === 'pending').length;

    return (
        <div style={{ background: '#FAFAFA', minHeight: '100vh', padding: '24px' }}>
            <div style={{ maxWidth: '1024px', margin: '0 auto' }}>

                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '28px' }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <h1 style={{
                                fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif',
                                fontSize: '26px',
                                fontWeight: 700,
                                color: '#1A1A1A',
                                margin: 0,
                            }}>
                                CS Dashboard
                            </h1>
                            <InstructionBalloon title="Cockpit do CS" side="bottom">
                                Aqui você gerencia a operação diária. Seu objetivo é garantir que 100% do time reporte e que os dados sejam validados antes de chegar no cliente.
                            </InstructionBalloon>
                        </div>
                        <p style={{
                            fontFamily: 'DM Sans, system-ui, sans-serif',
                            fontSize: '14px',
                            color: '#6B7280',
                            margin: '4px 0 0 0',
                        }}>
                            Visão consolidada da operação e aprovações pendentes.
                        </p>
                    </div>
                    <button
                        onClick={fetchDashboardData}
                        style={{
                            fontFamily: 'DM Sans, system-ui, sans-serif',
                            fontSize: '13px',
                            padding: '8px 16px',
                            background: '#F3F4F6',
                            color: '#1A1A1A',
                            border: '1px solid #E5E7EB',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontWeight: 500,
                        }}
                    >
                        Atualizar
                    </button>
                </div>

                {/* Stats Row */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '24px' }}>
                    {statCards.map((stat, i) => (
                        <motion.div
                            key={stat.label}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.08 }}
                        >
                            <div style={{ ...card, padding: '16px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                                    <div style={{
                                        width: '32px',
                                        height: '32px',
                                        background: stat.iconBg,
                                        borderRadius: '8px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                    }}>
                                        <stat.icon size={16} strokeWidth={1.5} color={stat.iconColor} />
                                    </div>
                                    {stat.tooltip && (
                                        <InstructionBalloon title={stat.label}>
                                            {stat.tooltip}
                                        </InstructionBalloon>
                                    )}
                                </div>
                                <p style={{
                                    fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif',
                                    fontSize: '22px',
                                    fontWeight: 700,
                                    color: '#1A1A1A',
                                    margin: '0 0 2px 0',
                                }}>
                                    {stat.value}
                                </p>
                                <p style={{
                                    fontFamily: 'DM Sans, system-ui, sans-serif',
                                    fontSize: '11px',
                                    color: '#6B7280',
                                    margin: 0,
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.05em',
                                }}>
                                    {stat.label}
                                </p>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Tab Navigation */}
                <div style={{
                    ...card,
                    padding: '4px',
                    display: 'flex',
                    gap: '4px',
                    marginBottom: '24px',
                }}>
                    {[
                        { key: 'inbox' as CSTab, label: 'Inbox', icon: FileText, count: stats.pending },
                        { key: 'perguntas' as CSTab, label: 'Perguntas', icon: HelpCircle, count: pendingQuestionCount },
                    ].map(tab => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            style={{
                                flex: 1,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px',
                                padding: '10px 16px',
                                borderRadius: '8px',
                                border: 'none',
                                cursor: 'pointer',
                                fontFamily: 'DM Sans, system-ui, sans-serif',
                                fontSize: '14px',
                                fontWeight: 500,
                                transition: 'all 0.15s',
                                background: activeTab === tab.key ? '#1B2B4A' : 'transparent',
                                color: activeTab === tab.key ? '#FFFFFF' : '#6B7280',
                            }}
                        >
                            <tab.icon size={15} strokeWidth={1.5} />
                            {tab.label}
                            {tab.count > 0 && (
                                <span style={{
                                    background: activeTab === tab.key ? 'rgba(255,255,255,0.2)' : '#F3F4F6',
                                    color: activeTab === tab.key ? '#FFFFFF' : '#6B7280',
                                    fontSize: '11px',
                                    fontWeight: 600,
                                    padding: '1px 7px',
                                    borderRadius: '999px',
                                    fontFamily: 'DM Sans, system-ui, sans-serif',
                                }}>
                                    {tab.count}
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                {/* Inbox Tab */}
                {activeTab === 'inbox' && (
                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>

                        {/* Pending Approvals */}
                        <div>
                            <h3 style={{
                                fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif',
                                fontSize: '15px',
                                fontWeight: 600,
                                color: '#1A1A1A',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                margin: '0 0 12px 0',
                            }}>
                                <FileText size={16} strokeWidth={1.5} color="#D97706" />
                                Aprovações Pendentes
                            </h3>

                            {pendingSubmissions.length === 0 ? (
                                <div style={{
                                    background: '#FFFFFF',
                                    border: '1px dashed #E5E7EB',
                                    borderRadius: '12px',
                                    padding: '48px 24px',
                                    textAlign: 'center',
                                }}>
                                    <CheckCircle size={36} strokeWidth={1.5} color="#D1D5DB" style={{ margin: '0 auto 12px', display: 'block' }} />
                                    <p style={{ fontFamily: 'DM Sans, system-ui, sans-serif', fontSize: '14px', color: '#9CA3AF', margin: 0 }}>
                                        Tudo limpo! Nenhum relatório pendente.
                                    </p>
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    {pendingSubmissions.map((sub) => {
                                        const hasEvidence = (sub.conversation_prints?.length > 0) || !!sub.call_recording;
                                        const isRecording = recordingForId === sub.id;
                                        return (
                                            <div key={sub.id} style={{ ...card, padding: '16px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: isRecording ? '14px' : '0' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                        <div style={{
                                                            width: '38px',
                                                            height: '38px',
                                                            borderRadius: '50%',
                                                            background: '#F0FDF4',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif',
                                                            fontWeight: 700,
                                                            fontSize: '15px',
                                                            color: '#1B2B4A',
                                                            flexShrink: 0,
                                                        }}>
                                                            {sub.seller_name?.charAt(0)}
                                                        </div>
                                                        <div>
                                                            <p style={{ fontFamily: 'DM Sans, system-ui, sans-serif', fontWeight: 500, fontSize: '14px', color: '#1A1A1A', margin: 0 }}>
                                                                {sub.seller_name}
                                                            </p>
                                                            <p style={{ fontFamily: 'DM Sans, system-ui, sans-serif', fontSize: '12px', color: '#9CA3AF', margin: '2px 0 0 0' }}>
                                                                {new Date(sub.created_at).toLocaleDateString('pt-BR')} &bull; {hasEvidence ? 'Com evidências' : 'Sem anexo'}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                        {hasEvidence && (
                                                            <button
                                                                onClick={() => handleViewEvidence(sub)}
                                                                style={{ background: '#F3F4F6', border: 'none', borderRadius: '8px', padding: '7px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                                                            >
                                                                {sub.call_recording
                                                                    ? <Headphones size={15} strokeWidth={1.5} color="#6B7280" />
                                                                    : <Eye size={15} strokeWidth={1.5} color="#6B7280" />
                                                                }
                                                            </button>
                                                        )}
                                                        {!isRecording && (
                                                            <>
                                                                <button
                                                                    onClick={() => setRecordingForId(sub.id)}
                                                                    style={{
                                                                        background: '#F3F4F6',
                                                                        border: '1px dashed #D1D5DB',
                                                                        borderRadius: '8px',
                                                                        padding: '6px 12px',
                                                                        cursor: 'pointer',
                                                                        display: 'flex',
                                                                        alignItems: 'center',
                                                                        gap: '6px',
                                                                        fontFamily: 'DM Sans, system-ui, sans-serif',
                                                                        fontSize: '13px',
                                                                        color: '#6B7280',
                                                                    }}
                                                                >
                                                                    <Mic size={14} strokeWidth={1.5} />
                                                                    Gravar Feedback
                                                                </button>
                                                                <button
                                                                    onClick={() => handleApprove(sub.id)}
                                                                    style={{
                                                                        background: '#1B2B4A',
                                                                        color: '#FFFFFF',
                                                                        border: 'none',
                                                                        borderRadius: '8px',
                                                                        padding: '7px 14px',
                                                                        cursor: 'pointer',
                                                                        fontFamily: 'DM Sans, system-ui, sans-serif',
                                                                        fontSize: '13px',
                                                                        fontWeight: 500,
                                                                    }}
                                                                >
                                                                    Aprovar
                                                                </button>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>

                                                {isRecording && (
                                                    <div style={{
                                                        background: '#F0FDF4',
                                                        border: '1px dashed #E6B84D',
                                                        borderRadius: '8px',
                                                        padding: '16px',
                                                    }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                                                            <h4 style={{
                                                                fontFamily: 'DM Sans, system-ui, sans-serif',
                                                                fontSize: '13px',
                                                                fontWeight: 500,
                                                                color: '#1B2B4A',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                gap: '6px',
                                                                margin: 0,
                                                            }}>
                                                                <Mic size={13} strokeWidth={1.5} />
                                                                Gravando Feedback para {sub.seller_name}
                                                            </h4>
                                                            <button
                                                                onClick={() => setRecordingForId(null)}
                                                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280', fontSize: '18px', lineHeight: 1, padding: '2px 4px' }}
                                                            >
                                                                &times;
                                                            </button>
                                                        </div>
                                                        <AudioRecorder
                                                            onRecordingComplete={(blob) => handleAudioFeedback(blob, sub.id)}
                                                            onCancel={() => setRecordingForId(null)}
                                                            isUploading={isTranscribing}
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Team Status */}
                        <div>
                            <h3 style={{
                                fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif',
                                fontSize: '15px',
                                fontWeight: 600,
                                color: '#1A1A1A',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                margin: '0 0 12px 0',
                            }}>
                                <Users size={16} strokeWidth={1.5} color="#1B2B4A" />
                                Status do Time
                            </h3>

                            <div style={{ ...card, overflow: 'hidden', padding: 0 }}>
                                {sellers.length === 0 ? (
                                    <div style={{ padding: '24px', textAlign: 'center' }}>
                                        <p style={{ fontFamily: 'DM Sans, system-ui, sans-serif', fontSize: '13px', color: '#9CA3AF', margin: 0 }}>
                                            Nenhum vendedor encontrado
                                        </p>
                                    </div>
                                ) : (
                                    sellers.map((seller, idx) => (
                                        <div key={seller.id} style={{
                                            padding: '11px 14px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            borderTop: idx > 0 ? '1px solid #F3F4F6' : 'none',
                                        }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                <div style={{
                                                    width: '7px',
                                                    height: '7px',
                                                    borderRadius: '50%',
                                                    background: seller.todaySubmitted ? '#E6B84D' : '#E5E7EB',
                                                    flexShrink: 0,
                                                }} />
                                                <div>
                                                    <p style={{ fontFamily: 'DM Sans, system-ui, sans-serif', fontSize: '13px', fontWeight: 500, color: '#1A1A1A', margin: 0 }}>
                                                        {seller.name}
                                                    </p>
                                                    <p style={{ fontFamily: 'DM Sans, system-ui, sans-serif', fontSize: '10px', color: '#9CA3AF', margin: '1px 0 0 0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                                        {seller.seller_type}
                                                    </p>
                                                </div>
                                            </div>
                                            {seller.todaySubmitted ? (
                                                <span style={{
                                                    background: '#ECFDF5',
                                                    color: '#059669',
                                                    fontSize: '11px',
                                                    fontWeight: 500,
                                                    padding: '2px 8px',
                                                    borderRadius: '999px',
                                                    fontFamily: 'DM Sans, system-ui, sans-serif',
                                                }}>
                                                    Enviado
                                                </span>
                                            ) : (
                                                <span style={{
                                                    background: '#FFFBEB',
                                                    color: '#D97706',
                                                    fontSize: '11px',
                                                    fontWeight: 500,
                                                    padding: '2px 8px',
                                                    borderRadius: '999px',
                                                    fontFamily: 'DM Sans, system-ui, sans-serif',
                                                }}>
                                                    Pendente
                                                </span>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Perguntas Tab */}
                {activeTab === 'perguntas' && (
                    <div>
                        <h3 style={{
                            fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif',
                            fontSize: '15px',
                            fontWeight: 600,
                            color: '#1A1A1A',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            margin: '0 0 12px 0',
                        }}>
                            <HelpCircle size={16} strokeWidth={1.5} color="#2563EB" />
                            Perguntas dos Clientes
                        </h3>

                        {clientQuestions.length === 0 ? (
                            <div style={{
                                background: '#FFFFFF',
                                border: '1px dashed #E5E7EB',
                                borderRadius: '12px',
                                padding: '48px 24px',
                                textAlign: 'center',
                            }}>
                                <HelpCircle size={36} strokeWidth={1.5} color="#D1D5DB" style={{ margin: '0 auto 12px', display: 'block' }} />
                                <p style={{ fontFamily: 'DM Sans, system-ui, sans-serif', fontSize: '14px', color: '#9CA3AF', margin: 0 }}>
                                    Nenhuma pergunta de cliente ainda.
                                </p>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                {clientQuestions.map(q => (
                                    <div key={q.id} style={{ ...card, padding: '16px' }}>
                                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', marginBottom: '10px' }}>
                                            <div style={{ flex: 1 }}>
                                                <p style={{ fontFamily: 'DM Sans, system-ui, sans-serif', fontSize: '14px', fontWeight: 500, color: '#1A1A1A', margin: '0 0 4px 0' }}>
                                                    {q.question_text}
                                                </p>
                                                <p style={{ fontFamily: 'DM Sans, system-ui, sans-serif', fontSize: '12px', color: '#9CA3AF', margin: 0 }}>
                                                    Por: {q.asked_by} &bull; {new Date(q.created_at).toLocaleDateString('pt-BR')}
                                                </p>
                                            </div>
                                            <span style={{
                                                fontSize: '11px',
                                                fontWeight: 500,
                                                padding: '3px 10px',
                                                borderRadius: '999px',
                                                fontFamily: 'DM Sans, system-ui, sans-serif',
                                                whiteSpace: 'nowrap',
                                                flexShrink: 0,
                                                background: q.status === 'answered' ? '#ECFDF5' : q.status === 'escalated' ? '#EFF6FF' : '#FFFBEB',
                                                color: q.status === 'answered' ? '#059669' : q.status === 'escalated' ? '#2563EB' : '#D97706',
                                            }}>
                                                {q.status === 'pending' && 'Pendente'}
                                                {q.status === 'answered' && 'Respondida'}
                                                {q.status === 'escalated' && 'Encaminhada'}
                                            </span>
                                        </div>

                                        {q.response_text && (
                                            <div style={{
                                                background: '#F0FDF4',
                                                borderLeft: '3px solid #1B2B4A',
                                                borderRadius: '0 6px 6px 0',
                                                padding: '10px 12px',
                                                marginBottom: '10px',
                                            }}>
                                                <p style={{ fontFamily: 'DM Sans, system-ui, sans-serif', fontSize: '13px', color: '#1A1A1A', margin: 0 }}>
                                                    {q.response_text}
                                                </p>
                                            </div>
                                        )}

                                        {q.status === 'pending' && (
                                            answeringId === q.id ? (
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                    <Textarea
                                                        placeholder="Escreva a resposta..."
                                                        value={answerText}
                                                        onChange={e => setAnswerText(e.target.value)}
                                                        rows={3}
                                                        style={{ resize: 'none', fontFamily: 'DM Sans, system-ui, sans-serif', fontSize: '13px' }}
                                                    />
                                                    <div style={{ display: 'flex', gap: '8px' }}>
                                                        <button
                                                            onClick={() => handleAnswerQuestion(q.id)}
                                                            disabled={!answerText.trim() || isSendingAnswer}
                                                            style={{
                                                                background: '#1B2B4A',
                                                                color: '#FFFFFF',
                                                                border: 'none',
                                                                borderRadius: '8px',
                                                                padding: '7px 14px',
                                                                cursor: (!answerText.trim() || isSendingAnswer) ? 'not-allowed' : 'pointer',
                                                                opacity: (!answerText.trim() || isSendingAnswer) ? 0.6 : 1,
                                                                fontFamily: 'DM Sans, system-ui, sans-serif',
                                                                fontSize: '13px',
                                                                fontWeight: 500,
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                gap: '6px',
                                                            }}
                                                        >
                                                            {isSendingAnswer ? (
                                                                <><Loader2 size={13} strokeWidth={1.5} style={{ animation: 'spin 1s linear infinite' }} /> Enviando...</>
                                                            ) : (
                                                                <><Send size={13} strokeWidth={1.5} /> Enviar Resposta</>
                                                            )}
                                                        </button>
                                                        <button
                                                            onClick={() => { setAnsweringId(null); setAnswerText(''); }}
                                                            style={{
                                                                background: '#F3F4F6',
                                                                color: '#6B7280',
                                                                border: 'none',
                                                                borderRadius: '8px',
                                                                padding: '7px 14px',
                                                                cursor: 'pointer',
                                                                fontFamily: 'DM Sans, system-ui, sans-serif',
                                                                fontSize: '13px',
                                                            }}
                                                        >
                                                            Cancelar
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={() => setAnsweringId(q.id)}
                                                    style={{
                                                        background: '#F3F4F6',
                                                        color: '#1A1A1A',
                                                        border: '1px solid #E5E7EB',
                                                        borderRadius: '8px',
                                                        padding: '6px 12px',
                                                        cursor: 'pointer',
                                                        fontFamily: 'DM Sans, system-ui, sans-serif',
                                                        fontSize: '13px',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '6px',
                                                    }}
                                                >
                                                    <MessageSquare size={13} strokeWidth={1.5} /> Responder
                                                </button>
                                            )
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

            </div>
        </div>
    );
}
