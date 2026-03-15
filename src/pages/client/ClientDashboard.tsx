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
    FolderGit2,
    Users,
    Copy,
    Eye,
    EyeOff,
    Shield,
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

type Tab = 'plano' | 'conteudos' | 'relatorios' | 'perguntas' | 'calls' | 'time';

interface TeamMemberInfo {
    id: string;
    email: string;
    name: string;
    status: string;
    created_at: string;
}

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
    const [contents, setContents] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<Tab>('plano');
    const [newQuestion, setNewQuestion] = useState('');
    const [isSending, setIsSending] = useState(false);

    // Team member state
    const [teamMember, setTeamMember] = useState<TeamMemberInfo | null>(null);
    const [teamForm, setTeamForm] = useState({ email: '', password: '', confirmPassword: '' });
    const [isCreatingTeam, setIsCreatingTeam] = useState(false);
    const [showTeamPassword, setShowTeamPassword] = useState(false);
    const [teamCredentials, setTeamCredentials] = useState<{ email: string; password: string } | null>(null);
    const [teamLoading, setTeamLoading] = useState(false);

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
            const [clientRes, questionsRes, reportsRes, callsRes, materialsRes, contentsRes] = await Promise.all([
                (supabase as any).from('clients').select('*').eq('id', clientId).single(),
                (supabase as any)
                    .from('client_questions')
                    .select('id, question_text, status, response_text, created_at, responded_at')
                    .eq('client_id', clientId)
                    .order('created_at', { ascending: false }),
                (supabase as any)
                    .from('reports')
                    .select('id, status, pdf_url, created_at, review_notes')
                    .eq('client_id', clientId)
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
                (supabase as any)
                    .from('content_outputs')
                    .select('*')
                    .eq('client_id', clientId)
                    .order('created_at', { ascending: false }),
            ]);

            if (clientRes.data) {
                setClient(clientRes.data);
                fetchTeamMember(clientRes.data.id);
            }
            if (questionsRes.data) setQuestions(questionsRes.data);
            if (reportsRes.data) setReports(reportsRes.data);
            if (materialsRes?.data) setMaterials(materialsRes.data);
            if (contentsRes?.data) setContents(contentsRes.data);

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

    const fetchTeamMember = async (clientId: string) => {
        setTeamLoading(true);
        try {
            const { data: teamData } = await (supabase as any)
                .from('users')
                .select('id, email, name, status, created_at')
                .eq('client_id', clientId)
                .eq('role', 'team_member')
                .limit(1)
                .maybeSingle();
            if (teamData) setTeamMember(teamData);
        } catch (err) {
            console.error('Error fetching team member:', err);
        } finally {
            setTeamLoading(false);
        }
    };

    const handleCreateTeamMember = async () => {
        if (!client || !user) return;
        if (!teamForm.email.trim()) {
            toast.error('Email é obrigatório');
            return;
        }
        if (!teamForm.password.trim() || teamForm.password.length < 8) {
            toast.error('Senha deve ter no mínimo 8 caracteres');
            return;
        }
        if (teamForm.password !== teamForm.confirmPassword) {
            toast.error('Senhas não coincidem');
            return;
        }

        setIsCreatingTeam(true);
        try {
            // 1. Create auth user
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email: teamForm.email.trim().toLowerCase(),
                password: teamForm.password,
                options: {
                    data: { name: `Time ${client.name}`, role: 'team_member' },
                },
            });
            if (authError) throw authError;
            if (!authData.user) throw new Error('Falha ao criar usuário');

            // 2. Link to users table
            await (supabase as any).from('users').upsert([{
                id: authData.user.id,
                email: teamForm.email.trim().toLowerCase(),
                name: `Time ${client.name}`,
                role: 'team_member',
                client_id: client.id,
                status: 'active',
            }], { onConflict: 'id' });

            setTeamCredentials({
                email: teamForm.email.trim().toLowerCase(),
                password: teamForm.password,
            });
            setTeamForm({ email: '', password: '', confirmPassword: '' });
            toast.success('Login do time criado com sucesso!');

            // Refresh team member info
            await fetchTeamMember(client.id);
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Erro ao criar login do time';
            toast.error(message);
        } finally {
            setIsCreatingTeam(false);
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
                                <h3 className="font-semibold mb-1">Consultoria de Bolso</h3>
                                <p className="text-sm text-muted-foreground">
                                    Tire dúvidas estratégicas com IA enquanto seu projeto é configurado
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
        { key: 'conteudos', label: 'Conteúdos IA', icon: FolderGit2, count: contents.length },
        { key: 'calls', label: 'Calls', icon: Phone, count: approvedCalls.length },
        { key: 'relatorios', label: 'Relatórios', icon: FileText, count: reports.length },
        { key: 'perguntas', label: 'Perguntas', icon: MessageSquare, count: questions.length },
        { key: 'time', label: 'Meu Time', icon: Users },
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
                                <h3 className="font-semibold">Consultoria de Bolso</h3>
                                <p className="text-sm text-muted-foreground">Tire dúvidas estratégicas com IA</p>
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
                                            accept=".txt,.pdf,.docx,.mp4,.mp3,.wav,.csv"
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

                {activeTab === 'conteudos' && (
                    <Card className="nc-card-border">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <FolderGit2 className="h-5 w-5 text-primary" />
                                Conteúdos IA Gerados
                            </CardTitle>
                            <CardDescription>
                                Estratégias, scripts e materiais criados pela nossa Inteligência Artificial para o seu negócio
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {contents.length === 0 ? (
                                <div className="text-center py-12">
                                    <FolderGit2 className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                                    <h3 className="font-medium text-muted-foreground mb-1">Nenhum conteúdo gerado ainda</h3>
                                    <p className="text-sm text-muted-foreground">
                                        Assim que a IA produzir materiais específicos para seu projeto, eles aparecerão aqui.
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {contents.map(content => (
                                        <div key={content.id} className="border border-border rounded-xl p-5 bg-card/50 hover:border-primary/30 transition-all">
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                                                <div>
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <h4 className="font-bold text-lg">{content.title}</h4>
                                                        <Badge variant="outline" className="text-xs uppercase bg-primary/5 text-primary border-primary/20">
                                                            {content.type}
                                                        </Badge>
                                                    </div>
                                                    <p className="text-xs text-muted-foreground">
                                                        Criado em {new Date(content.created_at).toLocaleDateString('pt-BR')} 
                                                        {content.status && ` • Status: ${content.status.toUpperCase()}`}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="bg-background rounded-lg p-4 border border-border/50 max-h-60 overflow-y-auto whitespace-pre-wrap text-sm text-foreground/90">
                                                {content.content}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
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
                                    Calls de vendas aprovadas pela equipe com análise IA
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

                {activeTab === 'time' && (
                    <div className="space-y-6">
                        {/* Team Credentials Card */}
                        {teamCredentials && (
                            <Card className="nc-card-border border-emerald-500/30 bg-emerald-500/5">
                                <CardContent className="p-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-emerald-500">✅ Login do time criado!</p>
                                            <p className="text-sm font-mono mt-1">
                                                Login: <strong>{teamCredentials.email}</strong> • Senha: <strong>{teamCredentials.password}</strong>
                                            </p>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button size="sm" variant="outline" onClick={() => {
                                                navigator.clipboard.writeText(`Login: ${teamCredentials.email}\nSenha: ${teamCredentials.password}`);
                                                toast.success('Credenciais copiadas!');
                                            }}>
                                                <Copy className="h-3 w-3 mr-1" /> Copiar
                                            </Button>
                                            <Button size="sm" variant="ghost" onClick={() => setTeamCredentials(null)}>✕</Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        <Card className="nc-card-border">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Users className="h-5 w-5 text-primary" />
                                    Login do Time de Vendas
                                </CardTitle>
                                <CardDescription>
                                    Crie um login compartilhado para seu time de vendas acessar os agentes SS e Closer, fazer check-in diário e análise de calls.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {teamLoading ? (
                                    <div className="flex items-center justify-center py-12">
                                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                                    </div>
                                ) : teamMember ? (
                                    /* Existing team member info */
                                    <div className="space-y-4">
                                        <div className="p-5 rounded-xl bg-gradient-to-br from-emerald-500/5 to-green-500/5 border border-emerald-500/20">
                                            <div className="flex items-center gap-3 mb-3">
                                                <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center">
                                                    <Shield className="h-5 w-5 text-emerald-500" />
                                                </div>
                                                <div>
                                                    <p className="font-semibold">Login do Time Ativo</p>
                                                    <p className="text-xs text-muted-foreground">
                                                        Criado em {new Date(teamMember.created_at).toLocaleDateString('pt-BR')}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                <div className="p-3 rounded-lg bg-background/50 border border-border">
                                                    <p className="text-xs font-bold text-muted-foreground uppercase mb-1">Email de Acesso</p>
                                                    <p className="text-sm font-mono">{teamMember.email}</p>
                                                </div>
                                                <div className="p-3 rounded-lg bg-background/50 border border-border">
                                                    <p className="text-xs font-bold text-muted-foreground uppercase mb-1">Status</p>
                                                    <p className="text-sm">
                                                        {teamMember.status === 'active' ? '✅ Ativo' : '⚠️ ' + teamMember.status}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="p-4 rounded-lg bg-muted/30 border border-border">
                                            <h4 className="text-sm font-semibold mb-2">O que seu time pode fazer:</h4>
                                            <ul className="space-y-1.5 text-sm text-muted-foreground">
                                                <li className="flex items-center gap-2"><CheckCircle className="h-3.5 w-3.5 text-emerald-500" /> Consultoria de Bolso (Agente SS e Closer)</li>
                                                <li className="flex items-center gap-2"><CheckCircle className="h-3.5 w-3.5 text-emerald-500" /> Check-in Diário de Métricas</li>
                                                <li className="flex items-center gap-2"><CheckCircle className="h-3.5 w-3.5 text-emerald-500" /> Análise de Calls com IA</li>
                                            </ul>
                                        </div>
                                    </div>
                                ) : (
                                    /* Create team member form */
                                    <div className="space-y-4">
                                        <div className="p-4 rounded-lg bg-muted/30 border border-border">
                                            <p className="text-sm text-muted-foreground">
                                                💡 <strong>1 login compartilhado</strong> para todo o time. Seus sellers e closers usam o mesmo acesso para interagir com os agentes de IA.
                                            </p>
                                        </div>

                                        <div className="space-y-3">
                                            <div>
                                                <label className="text-sm font-medium mb-1.5 block">Email do time *</label>
                                                <Input
                                                    type="email"
                                                    placeholder="time@suaempresa.com"
                                                    value={teamForm.email}
                                                    onChange={e => setTeamForm(prev => ({ ...prev, email: e.target.value }))}
                                                />
                                            </div>
                                            <div className="grid grid-cols-2 gap-3">
                                                <div>
                                                    <label className="text-sm font-medium mb-1.5 block">Senha *</label>
                                                    <div className="relative">
                                                        <Input
                                                            type={showTeamPassword ? 'text' : 'password'}
                                                            placeholder="Mín. 8 caracteres"
                                                            value={teamForm.password}
                                                            onChange={e => setTeamForm(prev => ({ ...prev, password: e.target.value }))}
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={() => setShowTeamPassword(v => !v)}
                                                            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                                        >
                                                            {showTeamPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                                        </button>
                                                    </div>
                                                    {teamForm.password.length > 0 && teamForm.password.length < 8 && (
                                                        <p className="text-xs text-destructive mt-1">Mínimo 8 caracteres</p>
                                                    )}
                                                </div>
                                                <div>
                                                    <label className="text-sm font-medium mb-1.5 block">Confirmar senha *</label>
                                                    <Input
                                                        type={showTeamPassword ? 'text' : 'password'}
                                                        placeholder="Repita a senha"
                                                        value={teamForm.confirmPassword}
                                                        onChange={e => setTeamForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                                                    />
                                                    {teamForm.confirmPassword.length > 0 && teamForm.password !== teamForm.confirmPassword && (
                                                        <p className="text-xs text-destructive mt-1">Senhas não coincidem</p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <Button
                                            onClick={handleCreateTeamMember}
                                            disabled={isCreatingTeam}
                                            className="w-full sm:w-auto"
                                        >
                                            {isCreatingTeam ? (
                                                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Criando...</>
                                            ) : (
                                                <><Users className="h-4 w-4 mr-2" /> Criar Login do Time</>
                                            )}
                                        </Button>
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
