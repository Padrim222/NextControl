import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import { Textarea } from '@/components/ui/textarea';
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
} from 'lucide-react';
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

            // 1. Fetch all sellers
            const { data: usersData } = await (supabase as any)
                .from('users')
                .select('*')
                .in('role', ['seller', 'closer', 'admin']);
            // Admin might be a seller too? Usually roles are distinct. 
            // But let's stick to seller/closer.

            const sellersList = (usersData || []).filter((u: User) =>
                u.role === 'seller' || u.role === 'closer' || u.seller_type
            );

            // 2. Fetch today's submissions (for status)
            const { data: todaySubs } = await (supabase as any)
                .from('daily_submissions')
                .select('seller_id')
                .eq('submission_date', today);

            const todaySellerIds = new Set((todaySubs || []).map((s: any) => s.seller_id));

            // 3. Fetch PENDING submissions
            const { data: pending } = await (supabase as any)
                .from('daily_submissions')
                .select('*')
                .eq('status', 'pending')
                .order('created_at', { ascending: false });

            // 4. Fetch APPROVED today (for stats)
            const { count: approvedCount } = await (supabase as any)
                .from('daily_submissions')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'approved')
                .eq('submission_date', today);

            // Build summaries
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

            // Fetch client questions
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
            const url = sub.conversation_prints[0];
            if (url.startsWith('http')) {
                window.open(url, '_blank');
            } else {
                toast.warning('Print disponível apenas como referência (URL local).');
            }
        } else if (sub.call_recording) {
            if (sub.call_recording.startsWith('http')) {
                window.open(sub.call_recording, '_blank');
            } else {
                toast.warning('Gravação disponível apenas como referência (URL local).');
            }
        } else {
            toast.info('Sem evidências anexadas.');
        }
    };

    const handleAudioFeedback = async (blob: Blob, submissionId: string) => {
        setIsTranscribing(true);
        try {
            const formData = new FormData();
            formData.append('file', blob, 'feedback.webm');

            // Use direct fetch instead of supabase.functions.invoke to ensure
            // multipart/form-data Content-Type is set correctly by the browser
            const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://mldbflihdejmddmapwnz.supabase.co';
            const session = (await supabase.auth.getSession()).data.session;
            const token = session?.access_token;

            const response = await fetch(`${supabaseUrl}/functions/v1/transcribe-audio`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
                body: formData,
            });

            const data = await response.json();

            if (!response.ok || data?.error) {
                throw new Error(data?.error || `HTTP ${response.status}`);
            }

            const transcription = data.text;
            toast.success('Áudio transcrito com sucesso!');

            // 1. Get current notes to avoid overwriting
            const { data: sub } = await (supabase as any)
                .from('daily_submissions')
                .select('notes')
                .eq('id', submissionId)
                .single();

            const existingNote = sub?.notes || '';
            const newNote = `${existingNote}\n\n--- FEEDBACK CS ---\n${transcription}`.trim();

            // 2. Update submission with the feedback
            const { error: updateError } = await (supabase as any)
                .from('daily_submissions')
                .update({ notes: newNote })
                .eq('id', submissionId);

            if (updateError) throw updateError;

            setRecordingForId(null);
            toast.success('Feedback salvo!');
            fetchDashboardData();

        } catch (error: any) {
            console.error('Transcription error:', error);
            const msg = error?.message || '';
            if (msg.includes('GROQ_API_KEY') || msg.includes('not configured')) {
                toast.error('⚠️ A transcrição de áudio requer a GROQ_API_KEY. Peça ao admin para configurar nos Secrets do Supabase.', { duration: 8000 });
            } else {
                toast.error(`Erro ao transcrever áudio: ${msg || 'tente novamente.'}`);
            }
        } finally {
            setIsTranscribing(false);
        }
    };


    const statCards = [
        {
            label: 'Vendedores',
            value: stats.total,
            icon: Users,
            color: 'text-solar',
            tooltip: 'Total de membros ativos no time de vendas.'
        },
        {
            label: 'Check-in Hoje',
            value: `${stats.submitted}/${stats.total}`,
            icon: Calendar,
            color: 'text-nc-info',
            tooltip: 'Quantos vendedores já enviaram os números de hoje.'
        },
        {
            label: 'Pendentes',
            value: stats.pending,
            icon: Clock,
            color: 'text-nc-warning',
            tooltip: 'Relatórios aguardando sua análise e aprovação.'
        },
        {
            label: 'Aprovados',
            value: stats.approved,
            icon: CheckCircle,
            color: 'text-nc-success',
            tooltip: 'Relatórios validados e já enviados para o cliente.'
        },
    ];

    return (
        <div className="space-y-6 max-w-5xl mx-auto fade-in">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <div className="flex items-center gap-2">
                        <h1 className="font-display text-2xl font-bold">
                            Dashboard <span className="nc-gradient-text">Time de Vendas</span>
                        </h1>
                        <InstructionBalloon title="Cockpit do CS" side="bottom">
                            Aqui você gerencia a operação diária. Seu objetivo é garantir que 100% do time reporte e que os dados sejam validados antes de chegar no cliente.
                        </InstructionBalloon>
                    </div>
                // ... rest of header ...
                    <p className="text-muted-foreground text-sm mt-1">
                        Visão consolidada da operação e aprovações pendentes.
                    </p>
                </div>
                <Button onClick={fetchDashboardData} variant="outline" size="sm">
                    Atualizar
                </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {statCards.map((stat, i) => (
                    <motion.div
                        key={stat.label}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                    >
                        <Card className="nc-card-border nc-card-hover bg-card">
                            <CardContent className="pt-4 pb-4 px-4">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        <stat.icon className={`h-4 w-4 ${stat.color}`} />
                                        <span className="text-xs text-muted-foreground uppercase tracking-wider">{stat.label}</span>
                                    </div>
                                    {stat.tooltip && ( // Render InstructionBalloon only if tooltip exists
                                        <InstructionBalloon title={stat.label}>
                                            {stat.tooltip}
                                        </InstructionBalloon>
                                    )}
                                </div>
                                <p className={`text-2xl font-mono font-semibold ${stat.color}`}>
                                    {stat.value}
                                </p>
                            </CardContent>
                        </Card>
                    </motion.div>
                ))}
            </div>

            {/* Tab Navigation */}
            <div className="flex gap-1 bg-card border border-border rounded-lg p-1">
                <button
                    onClick={() => setActiveTab('inbox')}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-md text-sm font-medium transition-all
                        ${activeTab === 'inbox'
                            ? 'bg-primary text-primary-foreground shadow-sm'
                            : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                        }`}
                >
                    <FileText className="h-4 w-4" />
                    Inbox
                    {stats.pending > 0 && (
                        <Badge variant="secondary" className="ml-1 text-xs px-1.5 py-0">{stats.pending}</Badge>
                    )}
                </button>
                <button
                    onClick={() => setActiveTab('perguntas')}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-md text-sm font-medium transition-all
                        ${activeTab === 'perguntas'
                            ? 'bg-primary text-primary-foreground shadow-sm'
                            : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                        }`}
                >
                    <HelpCircle className="h-4 w-4" />
                    Perguntas
                    {clientQuestions.filter(q => q.status === 'pending').length > 0 && (
                        <Badge variant="secondary" className="ml-1 text-xs px-1.5 py-0">
                            {clientQuestions.filter(q => q.status === 'pending').length}
                        </Badge>
                    )}
                </button>
            </div>

            {/* Main Content Grid */}
            {activeTab === 'inbox' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* Pending Approvals (Left Col - Wider) */}
                    <div className="lg:col-span-2 space-y-4">
                        <h3 className="text-lg font-semibold flex items-center gap-2">
                            <FileText className="h-5 w-5 text-nc-warning" />
                            Aprovações Pendentes
                        </h3>

                        {pendingSubmissions.length === 0 ? (
                            <Card className="nc-card-border bg-card/50 border-dashed">
                                <CardContent className="py-12 text-center text-muted-foreground">
                                    <CheckCircle className="h-10 w-10 mx-auto mb-3 opacity-20" />
                                    <p>Tudo limpo! Nenhum relatório pendente.</p>
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="space-y-3">
                                {pendingSubmissions.map((sub) => {
                                    const hasEvidence = (sub.conversation_prints?.length > 0) || !!sub.call_recording;
                                    const isRecording = recordingForId === sub.id;
                                    return (
                                        <Card key={sub.id} className="nc-card-border bg-card hover:border-solar/30 transition-colors">
                                            <CardContent className="p-4">
                                                <div className="flex items-center justify-between mb-4">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-10 h-10 rounded-full bg-solar/10 flex items-center justify-center text-solar font-bold">
                                                            {sub.seller_name?.charAt(0)}
                                                        </div>
                                                        <div>
                                                            <p className="font-medium text-sm">{sub.seller_name}</p>
                                                            <p className="text-xs text-muted-foreground">
                                                                {new Date(sub.created_at).toLocaleDateString('pt-BR')} • {hasEvidence ? 'Com evidências' : 'Sem anexo'}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-2">
                                                        {hasEvidence && (
                                                            <Button variant="ghost" size="sm" onClick={() => handleViewEvidence(sub)}>
                                                                {sub.call_recording ? <Headphones className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                                            </Button>
                                                        )}

                                                        {!isRecording && (
                                                            <>
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    onClick={() => setRecordingForId(sub.id)}
                                                                    className="text-muted-foreground hover:text-primary border-dashed"
                                                                >
                                                                    <Mic className="h-4 w-4 mr-2" />
                                                                    Gravar Feedback
                                                                </Button>
                                                                <Button size="sm" onClick={() => handleApprove(sub.id)} className="nc-btn-primary">
                                                                    Aprovar
                                                                </Button>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Audio Recorder Drawer */}
                                                {isRecording && (
                                                    <div className="bg-muted/30 p-4 rounded-lg border border-dashed border-primary/20 animate-in slide-in-from-top-2">
                                                        <div className="flex items-center justify-between mb-2">
                                                            <h4 className="text-sm font-medium text-primary flex items-center gap-2">
                                                                <Mic className="h-4 w-4" />
                                                                Gravando Feedback para {sub.seller_name}
                                                            </h4>
                                                            <Button variant="ghost" size="sm" onClick={() => setRecordingForId(null)} className="h-6 w-6 p-0">
                                                                ×
                                                            </Button>
                                                        </div>
                                                        <AudioRecorder
                                                            onRecordingComplete={(blob) => handleAudioFeedback(blob, sub.id)}
                                                            onCancel={() => setRecordingForId(null)}
                                                            isUploading={isTranscribing}
                                                        />
                                                    </div>
                                                )}
                                            </CardContent>
                                        </Card>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Team Status (Right Col) */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold flex items-center gap-2">
                            <Users className="h-5 w-5 text-solar" />
                            Status do Time
                        </h3>

                        <Card className="nc-card-border bg-card">
                            <CardContent className="p-0">
                                <div className="divide-y divide-border">
                                    {sellers.map((seller) => (
                                        <div key={seller.id} className="p-3 flex items-center justify-between hover:bg-muted/50 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <div className="w-2 h-2 rounded-full bg-solar" />
                                                <div>
                                                    <p className="text-sm font-medium">{seller.name}</p>
                                                    <p className="text-[10px] text-muted-foreground uppercase">{seller.seller_type}</p>
                                                </div>
                                            </div>
                                            {seller.todaySubmitted ? (
                                                <Badge variant="outline" className="text-[10px] bg-nc-success/10 text-nc-success border-nc-success/20">
                                                    Enviado
                                                </Badge>
                                            ) : (
                                                <Badge variant="outline" className="text-[10px] bg-muted text-muted-foreground">
                                                    Pendente
                                                </Badge>
                                            )}
                                        </div>
                                    ))}
                                    {sellers.length === 0 && (
                                        <div className="p-4 text-center text-xs text-muted-foreground">
                                            Nenhum vendedor encontrado
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                </div>
            )}

            {/* Client Questions Tab */}
            {activeTab === 'perguntas' && (
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                        <HelpCircle className="h-5 w-5 text-nc-info" />
                        Perguntas dos Clientes
                    </h3>

                    {clientQuestions.length === 0 ? (
                        <Card className="nc-card-border bg-card/50 border-dashed">
                            <CardContent className="py-12 text-center text-muted-foreground">
                                <HelpCircle className="h-10 w-10 mx-auto mb-3 opacity-20" />
                                <p>Nenhuma pergunta de cliente ainda.</p>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="space-y-3">
                            {clientQuestions.map(q => (
                                <Card key={q.id} className="nc-card-border bg-card">
                                    <CardContent className="p-4 space-y-3">
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex-1">
                                                <p className="text-sm font-medium">{q.question_text}</p>
                                                <p className="text-xs text-muted-foreground mt-1">
                                                    Por: {q.asked_by} • {new Date(q.created_at).toLocaleDateString('pt-BR')}
                                                </p>
                                            </div>
                                            <Badge
                                                variant={q.status === 'answered' ? 'default' : 'secondary'}
                                                className="text-xs shrink-0"
                                            >
                                                {q.status === 'pending' && '⏳ Pendente'}
                                                {q.status === 'answered' && '✅ Respondida'}
                                                {q.status === 'escalated' && '🔄 Encaminhada'}
                                            </Badge>
                                        </div>

                                        {q.response_text && (
                                            <div className="p-3 rounded-md bg-muted/50 border-l-2 border-primary">
                                                <p className="text-sm">{q.response_text}</p>
                                            </div>
                                        )}

                                        {q.status === 'pending' && (
                                            answeringId === q.id ? (
                                                <div className="space-y-2">
                                                    <Textarea
                                                        placeholder="Escreva a resposta..."
                                                        value={answerText}
                                                        onChange={e => setAnswerText(e.target.value)}
                                                        rows={3}
                                                        className="resize-none"
                                                    />
                                                    <div className="flex gap-2">
                                                        <Button
                                                            size="sm"
                                                            onClick={() => handleAnswerQuestion(q.id)}
                                                            disabled={!answerText.trim() || isSendingAnswer}
                                                        >
                                                            {isSendingAnswer ? (
                                                                <><Loader2 className="h-3 w-3 mr-1 animate-spin" /> Enviando...</>
                                                            ) : (
                                                                <><Send className="h-3 w-3 mr-1" /> Enviar Resposta</>
                                                            )}
                                                        </Button>
                                                        <Button size="sm" variant="ghost" onClick={() => { setAnsweringId(null); setAnswerText(''); }}>
                                                            Cancelar
                                                        </Button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <Button size="sm" variant="outline" onClick={() => setAnsweringId(q.id)}>
                                                    <MessageSquare className="h-3 w-3 mr-1" /> Responder
                                                </Button>
                                            )
                                        )}
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
