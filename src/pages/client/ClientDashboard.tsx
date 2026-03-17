import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/Spinner';
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
    Phone,
    BarChart3,
    Plus,
    X,
} from 'lucide-react';
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

type Tab = 'plano' | 'relatorios' | 'perguntas' | 'calls';

interface ApprovedCall {
    id: string;
    prospect_name: string;
    call_date: string;
    duration_minutes: number | null;
    approved_at: string;
    evaluation?: {
        score_geral: number;
        nivel: string;
        pontos_positivos: string[];
    };
}

export default function ClientDashboard() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [client, setClient] = useState<Client | null>(null);
    const [questions, setQuestions] = useState<ClientQuestion[]>([]);
    const [reports, setReports] = useState<ClientReport[]>([]);
    const [approvedCalls, setApprovedCalls] = useState<ApprovedCall[]>([]);
    const [materials, setMaterials] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<Tab>('plano');
    const [newQuestion, setNewQuestion] = useState('');
    const [isSending, setIsSending] = useState(false);

    const handleUploadMaterial = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !client || !user) return;

        setIsSending(true);
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${client.id}/${Math.random()}.${fileExt}`;
            const filePath = `client-materials/${fileName}`;

            // 1. Upload to Storage
            const { error: uploadError } = await (supabase as any).storage
                .from('materials')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            // 2. Get Public URL
            const { data: { publicUrl } } = (supabase as any).storage
                .from('materials')
                .getPublicUrl(filePath);

            // 3. Insert into Database
            const { error: dbError } = await (supabase as any)
                .from('client_materials')
                .insert({
                    client_id: client.id,
                    title: file.name,
                    description: 'Enviado pelo cliente',
                    file_url: publicUrl,
                    file_type: file.type,
                    is_rag_active: false, // Wait for admin to activate
                    sent_to_client: true, // Visible to client
                    created_by: user.id
                });

            if (dbError) throw dbError;

            toast.success('Material enviado com sucesso!');
            fetchData();
        } catch (error: any) {
            console.error('Upload error:', error);
            toast.error('Erro ao enviar material: ' + (error.message || 'Erro desconhecido'));
        } finally {
            setIsSending(false);
        }
    };

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

            // Fetch client, questions, reports, and approved calls in parallel
            const [clientRes, questionsRes, reportsRes, callsRes, materialsRes] = await Promise.all([
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
                (supabase as any)
                    .from('call_uploads')
                    .select('id, prospect_name, call_date, duration_minutes, approved_at, evaluation_id')
                    .eq('client_id', clientId)
                    .eq('status', 'approved')
                    .order('approved_at', { ascending: false })
                    .limit(20),
                (supabase as any)
                    .from('client_materials')
                    .select('*')
                    .eq('client_id', clientId)
                    .eq('sent_to_client', true)
                    .order('created_at', { ascending: false }),
            ]);

            if (clientRes.data) setClient(clientRes.data);
            if (questionsRes.data) setQuestions(questionsRes.data);
            if (reportsRes.data) setReports(reportsRes.data);
            if (materialsRes?.data) setMaterials(materialsRes.data);

            // Fetch evaluations for approved calls
            const calls = callsRes.data || [];
            if (calls.length > 0) {
                const evalIds = calls.map((c: any) => c.evaluation_id).filter(Boolean);
                let evals: any[] = [];
                if (evalIds.length > 0) {
                    const { data: evalData } = await (supabase as any)
                        .from('call_evaluations')
                        .select('id, score_geral, nivel, pontos_positivos')
                        .in('id', evalIds);
                    evals = evalData || [];
                }
                setApprovedCalls(calls.map((c: any) => ({
                    ...c,
                    evaluation: evals.find((e: any) => e.id === c.evaluation_id),
                })));
            }
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

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center fade-in">
                <div className="flex flex-col items-center gap-4">
                    <Spinner size="md" />
                    <p className="text-muted-foreground">Carregando seu painel...</p>
                </div>
            </div>
        );
    }

    if (!client) {
        return (
            <div className="min-h-screen p-6 fade-in">
                <div className="max-w-3xl mx-auto space-y-6">
                    <div className="text-center py-8">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/20 mb-4">
                            <Clock className="h-8 w-8 text-blue-500" />
                        </div>
                        <h1 className="text-2xl font-bold mb-2">
                            Bem-vindo ao <span className="nc-gradient-text">Next Control</span>!
                        </h1>
                        <p className="text-muted-foreground max-w-md mx-auto">
                            Sua conta está ativa. O time de CS está configurando seu projeto — em breve você terá acesso completo ao painel.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Card
                            className="nc-card-border hover:border-primary/30 transition-all cursor-pointer group"
                            onClick={() => navigate('/training/coach')}
                        >
                            <CardContent className="p-6 text-center">
                                <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/20 mb-3 group-hover:scale-105 transition-transform">
                                    <Brain className="h-6 w-6 text-blue-500" />
                                </div>
                                <h3 className="font-semibold mb-1">Materiais Consultoria</h3>
                                <p className="text-sm text-muted-foreground">
                                    Fale com seu consultor enquanto seu projeto é configurado
                                </p>
                            </CardContent>
                        </Card>
                        <Card
                            className="nc-card-border hover:border-primary/30 transition-all cursor-pointer group"
                            onClick={() => navigate('/training')}
                        >
                            <CardContent className="p-6 text-center">
                                <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/20 mb-3 group-hover:scale-105 transition-transform">
                                    <BookOpen className="h-6 w-6 text-amber-500" />
                                </div>
                                <h3 className="font-semibold mb-1">Base de Conhecimento</h3>
                                <p className="text-sm text-muted-foreground">
                                    Explore materiais e treinamentos disponíveis
                                </p>
                            </CardContent>
                        </Card>
                    </div>

                    <p className="text-xs text-center text-muted-foreground">
                        Dúvidas? Fale com o time: <span className="text-primary">suporte@nextcontrol.com</span>
                    </p>
                </div>
            </div>
        );
    }

    const tabs: { key: Tab; label: string; icon: typeof FileText; count?: number }[] = [
        { key: 'plano', label: 'Meu Plano', icon: ClipboardList },
        { key: 'calls', label: 'Calls', icon: Phone, count: approvedCalls.length },
        { key: 'relatorios', label: 'Relatórios', icon: FileText, count: reports.length },
        { key: 'perguntas', label: 'Perguntas', icon: MessageSquare, count: questions.length },
    ];

    const pendingQuestions = questions.filter(q => q.status === 'pending').length;

    return (
        <div className="min-h-screen p-6 fade-in pb-20 md:pb-6">
            <div className="max-w-5xl mx-auto space-y-6">
                {/* Header */}
                <div>
                    <h1 className="text-3xl font-bold">
                        Bem-vindo, <span className="nc-gradient-text">{client.name}</span>!
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        {client.company ? `Projeto: ${client.company}` : 'Acompanhe seu projeto em tempo real.'}
                    </p>
                </div>

                {/* Pending Form Banner */}
                <FormPendingBanner formType="expert_weekly" />

                {/* Quick Actions */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Card
                        className="nc-card-border hover:border-primary/30 transition-all cursor-pointer group"
                        onClick={() => navigate('/training/coach')}
                    >
                        <CardContent className="p-5 flex items-center gap-4">
                            <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/20 group-hover:scale-105 transition-transform">
                                <Brain className="h-6 w-6 text-blue-500" />
                            </div>
                            <div>
                                <h3 className="font-semibold">Materiais Consultoria</h3>
                                <p className="text-sm text-muted-foreground">Fale com seu consultor</p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card
                        className="nc-card-border hover:border-primary/30 transition-all cursor-pointer group"
                        onClick={() => navigate('/training')}
                    >
                        <CardContent className="p-5 flex items-center gap-4">
                            <div className="p-3 rounded-xl bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/20 group-hover:scale-105 transition-transform">
                                <BookOpen className="h-6 w-6 text-amber-500" />
                            </div>
                            <div>
                                <h3 className="font-semibold">Base de Conhecimento</h3>
                                <p className="text-sm text-muted-foreground">Materiais e treinamentos</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Tab Navigation */}
                <div className="flex gap-1 bg-card border border-border rounded-lg p-1">
                    {tabs.map(tab => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-md text-sm font-medium transition-all
                                ${activeTab === tab.key
                                    ? 'bg-primary text-primary-foreground shadow-sm'
                                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                                }`}
                        >
                            <tab.icon className="h-4 w-4" />
                            {tab.label}
                            {tab.count !== undefined && tab.count > 0 && (
                                <Badge variant="secondary" className="ml-1 text-xs px-1.5 py-0">
                                    {tab.count}
                                </Badge>
                            )}
                        </button>
                    ))}
                </div>

                {/* Tab Content */}
                {activeTab === 'plano' && (
                    <Card className="nc-card-border">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <ClipboardList className="h-5 w-5 text-primary" />
                                Meu Plano Personalizado
                            </CardTitle>
                            <CardDescription>
                                Estratégia desenhada para o seu negócio
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="p-4 rounded-lg bg-muted/30 border border-border">
                                <h4 className="font-semibold mb-2 flex items-center gap-2">
                                    <ClipboardList className="h-4 w-4 text-primary" />
                                    Resumo do Projeto
                                </h4>
                                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                                    {client.project_summary || (client.company
                                        ? `Projeto focado em escalar as vendas e otimizar a operação de "${client.company}". Nosso foco é a aquisição perpétua.`
                                        : 'Seu plano personalizado está sendo preparado pelo time estratégico.')
                                    }
                                </p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="p-4 rounded-lg bg-gradient-to-br from-green-500/5 to-emerald-500/5 border border-green-500/20">
                                    <div className="flex items-center gap-2 mb-2">
                                        <CheckCircle className="h-4 w-4 text-green-500" />
                                        <span className="text-sm font-medium">Fase Atual</span>
                                    </div>
                                    <p className="text-sm text-muted-foreground">{client.current_phase || 'Diagnóstico Inicial'}</p>
                                </div>
                                <div className="p-4 rounded-lg bg-gradient-to-br from-blue-500/5 to-cyan-500/5 border border-blue-500/20">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Clock className="h-4 w-4 text-blue-500" />
                                        <span className="text-sm font-medium">Próxima Etapa</span>
                                    </div>
                                    <p className="text-sm text-muted-foreground">{client.next_step || 'Aguardando definição'}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="p-4 rounded-lg bg-card border border-border">
                                    <h5 className="text-xs font-bold text-muted-foreground uppercase mb-2">Status do Time</h5>
                                    <p className="text-sm">{client.team_status || 'Equipe em fase de alinhamento.'}</p>
                                </div>
                                <div className="p-4 rounded-lg bg-card border border-border">
                                    <h5 className="text-xs font-bold text-muted-foreground uppercase mb-2">Processos Operacionais</h5>
                                    <p className="text-sm">{client.operational_processes || 'Processos sendo mapeados.'}</p>
                                </div>
                            </div>

                            {/* MATERIAIS ENVIADOS PELO ADMIN / CLIENTE */}
                            <div className="mt-8 pt-6 border-t border-border/50">
                                <div className="flex justify-between items-center mb-4">
                                    <h4 className="font-semibold flex items-center gap-2">
                                        <BookOpen className="h-5 w-5 text-nc-info" />
                                        Base de Conhecimento do Projeto
                                    </h4>
                                    <div className="relative">
                                        <input
                                            type="file"
                                            id="material-upload"
                                            className="hidden"
                                            onChange={handleUploadMaterial}
                                            disabled={isSending}
                                        />
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="h-8 text-xs border-dashed border-solar/40 text-solar hover:bg-solar/5"
                                            asChild
                                        >
                                            <label htmlFor="material-upload" className="cursor-pointer">
                                                {isSending ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Plus className="h-3 w-3 mr-1" />}
                                                Novo Material
                                            </label>
                                        </Button>
                                    </div>
                                </div>

                                {materials.length > 0 ? (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {materials.map((mat) => (
                                            <div key={mat.id} className="p-4 rounded-xl bg-card border border-border group hover:border-solar/30 transition-all flex flex-col">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <div className="p-2 rounded-lg bg-primary/10 text-primary">
                                                        <FileText className="h-5 w-5" />
                                                    </div>
                                                    <h5 className="font-medium text-sm leading-tight flex-1">{mat.title}</h5>
                                                </div>
                                                <p className="text-xs text-muted-foreground mb-4 flex-1 line-clamp-3">
                                                    {mat.description || 'Nenhuma descrição fornecida.'}
                                                </p>
                                                <div className="flex items-center gap-2">
                                                    <Button
                                                        variant="secondary"
                                                        size="sm"
                                                        className="flex-1 text-xs"
                                                        onClick={() => window.open(mat.file_url, '_blank')}
                                                    >
                                                        Acessar
                                                    </Button>
                                                    {!mat.is_rag_active && (
                                                        <Badge variant="outline" className="text-[10px] text-muted-foreground">
                                                            Analizando...
                                                        </Badge>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="py-12 text-center border-2 border-dashed border-border rounded-xl">
                                        <p className="text-sm text-muted-foreground">Nenhum material adicionado ainda.</p>
                                        <p className="text-xs text-muted-foreground/60 mt-1">Envie manuais, scripts ou detalhes do seu produto.</p>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {activeTab === 'calls' && (
                    <div className="space-y-4">
                        {/* Weekly Report Shortcut */}
                        <Card
                            className="nc-card-border hover:border-primary/30 transition-all cursor-pointer group"
                            onClick={() => navigate('/client/weekly-report')}
                        >
                            <CardContent className="p-5 flex items-center gap-4">
                                <div className="p-3 rounded-xl bg-gradient-to-br from-solar/10 to-amber-500/10 border border-solar/20 group-hover:scale-105 transition-transform">
                                    <BarChart3 className="h-6 w-6 text-solar" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-semibold">Relatório Semanal</h3>
                                    <p className="text-sm text-muted-foreground">Ver análise consolidada da semana</p>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Approved Calls */}
                        <Card className="nc-card-border">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Phone className="h-5 w-5 text-primary" />
                                    Calls Analisadas
                                </CardTitle>
                                <CardDescription>
                                    Calls de vendas aprovadas pela equipe com análise especializada
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {approvedCalls.length === 0 ? (
                                    <div className="text-center py-12">
                                        <Phone className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                                        <h3 className="font-medium text-muted-foreground mb-1">Nenhuma call aprovada ainda</h3>
                                        <p className="text-sm text-muted-foreground">
                                            Análises de calls aparecerão aqui após aprovação do admin.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {approvedCalls.map(call => (
                                            <div key={call.id} className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-muted/30 transition-colors">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 rounded-lg bg-emerald-500/10">
                                                        <CheckCircle className="h-4 w-4 text-emerald-500" />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-medium">{call.prospect_name || 'Call'}</p>
                                                        <p className="text-xs text-muted-foreground">
                                                            {call.call_date && new Date(call.call_date + 'T12:00:00').toLocaleDateString('pt-BR')}
                                                            {call.duration_minutes && ` • ${call.duration_minutes}min`}
                                                        </p>
                                                    </div>
                                                </div>
                                                {call.evaluation && (
                                                    <div className="text-right">
                                                        <Badge variant="outline" className="text-solar border-solar/30">
                                                            {call.evaluation.score_geral}/100
                                                        </Badge>
                                                        <p className="text-[10px] text-muted-foreground mt-0.5">
                                                            {call.evaluation.nivel}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                )}

                {activeTab === 'relatorios' && (
                    <Card className="nc-card-border">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <FileText className="h-5 w-5 text-primary" />
                                Relatórios
                            </CardTitle>
                            <CardDescription>
                                Relatórios de performance gerados pela equipe
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {reports.length === 0 ? (
                                <div className="text-center py-12">
                                    <FileText className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                                    <h3 className="font-medium text-muted-foreground mb-1">Nenhum relatório ainda</h3>
                                    <p className="text-sm text-muted-foreground">
                                        Quando o time gerar e entregar relatórios, eles aparecerão aqui.
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {reports.map(report => (
                                        <div key={report.id} className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-muted/30 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 rounded-lg bg-green-500/10">
                                                    <FileText className="h-4 w-4 text-green-500" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium">
                                                        Relatório — {new Date(report.created_at).toLocaleDateString('pt-BR')}
                                                    </p>
                                                    {report.review_notes && (
                                                        <p className="text-xs text-muted-foreground mt-0.5">{report.review_notes}</p>
                                                    )}
                                                </div>
                                            </div>
                                            {report.pdf_url && (
                                                <Button size="sm" variant="outline" asChild>
                                                    <a href={report.pdf_url} target="_blank" rel="noopener noreferrer">
                                                        Baixar PDF
                                                    </a>
                                                </Button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}

                {activeTab === 'perguntas' && (
                    <div className="space-y-6">
                        {/* Ask a Question */}
                        <Card className="nc-card-border">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Send className="h-5 w-5 text-primary" />
                                    Enviar Pergunta
                                </CardTitle>
                                <CardDescription>
                                    Tire suas dúvidas diretamente com a equipe
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <Textarea
                                    placeholder="Escreva sua pergunta aqui... (ex: Como está a performance de tráfego dessa semana?)"
                                    value={newQuestion}
                                    onChange={e => setNewQuestion(e.target.value)}
                                    rows={3}
                                    className="resize-none"
                                />
                                <Button
                                    onClick={handleSendQuestion}
                                    disabled={!newQuestion.trim() || isSending}
                                    className="w-full sm:w-auto"
                                >
                                    {isSending ? (
                                        <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Enviando...</>
                                    ) : (
                                        <><Send className="h-4 w-4 mr-2" /> Enviar Pergunta</>
                                    )}
                                </Button>
                            </CardContent>
                        </Card>

                        {/* Question History */}
                        <Card className="nc-card-border">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <MessageSquare className="h-5 w-5 text-primary" />
                                    Histórico
                                    {pendingQuestions > 0 && (
                                        <Badge variant="outline" className="ml-2 text-xs">
                                            {pendingQuestions} pendente{pendingQuestions > 1 ? 's' : ''}
                                        </Badge>
                                    )}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {questions.length === 0 ? (
                                    <div className="text-center py-8">
                                        <MessageSquare className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                                        <p className="text-sm text-muted-foreground">Nenhuma pergunta enviada ainda.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {questions.map(q => (
                                            <div key={q.id} className="p-4 rounded-lg border border-border space-y-2">
                                                <div className="flex items-start justify-between gap-2">
                                                    <p className="text-sm font-medium flex-1">{q.question_text}</p>
                                                    <Badge
                                                        variant={q.status === 'answered' ? 'default' : 'secondary'}
                                                        className="text-xs shrink-0"
                                                    >
                                                        {q.status === 'pending' && '⏳ Pendente'}
                                                        {q.status === 'answered' && '✅ Respondida'}
                                                        {q.status === 'escalated' && '🔄 Encaminhada'}
                                                    </Badge>
                                                </div>
                                                <p className="text-xs text-muted-foreground">
                                                    {new Date(q.created_at).toLocaleDateString('pt-BR', {
                                                        day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                                                    })}
                                                </p>
                                                {q.response_text && (
                                                    <div className="mt-2 p-3 rounded-md bg-muted/50 border-l-2 border-primary">
                                                        <p className="text-sm">{q.response_text}</p>
                                                        {q.responded_at && (
                                                            <p className="text-xs text-muted-foreground mt-1">
                                                                Respondida em {new Date(q.responded_at).toLocaleDateString('pt-BR')}
                                                            </p>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                )}
            </div>
        </div>
    );
}
