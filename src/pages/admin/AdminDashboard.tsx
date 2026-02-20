import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
} from 'lucide-react';
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
            // Fetch users
            const { data: usersData } = await (supabase as any)
                .from('users')
                .select('*')
                .order('created_at', { ascending: false });
            if (usersData) setRealUsers(usersData as User[]);

            // Fetch clients
            const { data: clientsData } = await supabase
                .from('clients')
                .select('id, name');
            if (clientsData) setClients(clientsData);

            // Fetch daily submissions with seller info
            const { data: subsData } = await (supabase as any)
                .from('daily_submissions')
                .select('*, seller:users!seller_id(name, email, seller_type)')
                .order('created_at', { ascending: false })
                .limit(50);
            if (subsData) setSubmissions(subsData);

            // Fetch analyses
            const { data: analysesData } = await (supabase as any)
                .from('analyses')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(50);
            if (analysesData) setAnalyses(analysesData);

            // Fetch reports
            const { data: reportsData } = await (supabase as any)
                .from('reports')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(50);
            if (reportsData) setReports(reportsData);

            // Fetch call logs
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

    // Submissions that have no analysis yet (pending review)
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

            // Download PDF from HTML content
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

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Spinner size="md" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold">
                        Painel <span className="nc-gradient-text">Administrador</span> 👔
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Olá, {user?.name} • Next Control
                    </p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                    <Card className="nc-card-hover nc-card-border">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground">Equipe</p>
                                    <p className="text-2xl font-bold">{realUsers.filter(u => u.role !== 'admin' && u.role !== 'client').length}</p>
                                </div>
                                <Users className="h-8 w-8 text-solar opacity-80" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="nc-card-hover nc-card-border">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground">Clientes</p>
                                    <p className="text-2xl font-bold">{clients.length}</p>
                                </div>
                                <Users className="h-8 w-8 text-nc-info opacity-80" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="nc-card-hover nc-card-border border-nc-warning/30">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground">Aguardando Análise</p>
                                    <p className="text-2xl font-bold text-nc-warning">{pendingSubmissions.length}</p>
                                </div>
                                <Clock className="h-8 w-8 text-nc-warning opacity-80" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="nc-card-hover nc-card-border">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground">Analisados</p>
                                    <p className="text-2xl font-bold text-nc-success">{analyzedSubmissions.length}</p>
                                </div>
                                <CheckCircle className="h-8 w-8 text-nc-success opacity-80" />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Action Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                    {/* User Validation */}
                    <Card className="nc-card-border">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Users className="h-5 w-5 text-nc-info" />
                                Validação de Acessos
                            </CardTitle>
                            <CardDescription>
                                Libere acesso para novos membros
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {realUsers.filter(u => u.status === 'pending').length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground">
                                    <CheckCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                    <p>Todos validados</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {realUsers.filter(u => u.status === 'pending').map(pendingUser => (
                                        <div key={pendingUser.id} className="flex items-center justify-between p-3 bg-card border rounded-lg">
                                            <div>
                                                <p className="font-medium">{pendingUser.name}</p>
                                                <p className="text-xs text-muted-foreground">{pendingUser.email} • {pendingUser.role}</p>
                                            </div>
                                            <div className="flex gap-2">
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={async () => {
                                                        const { error } = await (supabase as any).from('users').update({ status: 'suspended' }).eq('id', pendingUser.id);
                                                        if (error) { toast.error('Erro'); } else {
                                                            toast.success('Rejeitado');
                                                            setRealUsers(prev => prev.map(u => u.id === pendingUser.id ? { ...u, status: 'suspended' as const } : u));
                                                        }
                                                    }}
                                                >
                                                    <XCircle className="h-4 w-4 text-nc-error" />
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    className="bg-nc-success hover:bg-nc-success/90 text-white"
                                                    onClick={async () => {
                                                        const { error } = await (supabase as any).from('users').update({ status: 'active' }).eq('id', pendingUser.id);
                                                        if (error) { toast.error('Erro'); } else {
                                                            toast.success('Acesso liberado!');
                                                            setRealUsers(prev => prev.map(u => u.id === pendingUser.id ? { ...u, status: 'active' as const } : u));
                                                        }
                                                    }}
                                                >
                                                    <CheckCircle className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Pending Submissions */}
                    <Card className="nc-card-border border-nc-warning/20">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Clock className="h-5 w-5 text-nc-warning" />
                                Submissões Pendentes
                            </CardTitle>
                            <CardDescription>Submissões aguardando análise IA</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {pendingSubmissions.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground">
                                    <CheckCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                    <p>Nenhuma submissão pendente</p>
                                </div>
                            ) : (
                                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                                    {pendingSubmissions.map((sub) => (
                                        <div
                                            key={sub.id}
                                            className="flex items-center justify-between p-3 bg-card rounded-lg border hover:border-solar/50 transition-colors"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="h-8 w-8 rounded-full bg-solar/10 flex items-center justify-center">
                                                    <FileText className="h-4 w-4 text-solar" />
                                                </div>
                                                <div>
                                                    <p className="font-medium text-sm">{sub.seller?.name || getSellerName(sub.seller_id)}</p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {new Date(sub.submission_date).toLocaleDateString('pt-BR')} • {sub.conversation_prints?.length || 0} prints
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="h-8"
                                                    onClick={() => setSelectedSubmission(sub)}
                                                >
                                                    <Eye className="h-3 w-3 mr-1" />
                                                    Ver
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    className="h-8 bg-solar hover:bg-solar/90 text-deep-space"
                                                    onClick={() => handleAnalyze(sub)}
                                                >
                                                    <Sparkles className="h-3 w-3 mr-1" />
                                                    Analisar
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Conselho RY: Head Agent + Strategist */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
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

                {/* Public Forms Panel */}
                <div className="mb-8">
                    <AdminFormPanel />
                </div>

                {/* Analyzed Submissions */}
                {analyzedSubmissions.length > 0 && (
                    <Card className="nc-card-border border-nc-success/20 mb-8">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <CheckCircle className="h-5 w-5 text-nc-success" />
                                Submissões Analisadas
                            </CardTitle>
                            <CardDescription>
                                Resultados das análises IA — gere PDFs ou envie via WhatsApp
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                                {analyzedSubmissions.slice(0, 20).map((sub) => {
                                    const analysis = getAnalysisForSubmission(sub.id);
                                    const report = getReportForSubmission(sub.id);
                                    return (
                                        <div
                                            key={sub.id}
                                            className="flex items-center justify-between p-3 bg-card rounded-lg border"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="h-8 w-8 rounded-full bg-nc-success/10 flex items-center justify-center">
                                                    <CheckCircle className="h-4 w-4 text-nc-success" />
                                                </div>
                                                <div>
                                                    <p className="font-medium text-sm">{sub.seller?.name || getSellerName(sub.seller_id)}</p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {new Date(sub.submission_date).toLocaleDateString('pt-BR')} • Score: <span className="font-mono font-bold">{analysis?.score || '—'}</span>
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="h-8"
                                                    onClick={() => handleGenerateReport(sub)}
                                                    disabled={isGeneratingPDF}
                                                >
                                                    <Download className="h-3 w-3 mr-1" />
                                                    PDF
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    className="h-8 bg-nc-success hover:bg-nc-success/90 text-white gap-1"
                                                    onClick={() => handleDeliverWhatsApp(sub)}
                                                >
                                                    <MessageCircle className="h-3 w-3" />
                                                    WhatsApp
                                                </Button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Submission Detail Modal */}
                <Dialog open={!!selectedSubmission} onOpenChange={() => setSelectedSubmission(null)}>
                    <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>Detalhes da Submissão</DialogTitle>
                            <DialogDescription>
                                {selectedSubmission && (
                                    <>
                                        {selectedSubmission.seller?.name || getSellerName(selectedSubmission.seller_id)} •{' '}
                                        {new Date(selectedSubmission.submission_date).toLocaleDateString('pt-BR')}
                                    </>
                                )}
                            </DialogDescription>
                        </DialogHeader>

                        {selectedSubmission && (
                            <div className="space-y-4">
                                {/* Metrics */}
                                <div>
                                    <h3 className="text-sm font-medium text-muted-foreground mb-2 uppercase tracking-wider">Métricas</h3>
                                    <div className="grid grid-cols-2 gap-3">
                                        {Object.entries(selectedSubmission.metrics as Record<string, any>).map(([key, value]) => (
                                            <div key={key} className="bg-muted rounded-lg p-3">
                                                <p className="text-xs text-muted-foreground capitalize">{key.replace(/_/g, ' ')}</p>
                                                <p className="text-lg font-mono font-bold">{typeof value === 'object' ? JSON.stringify(value) : String(value)}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Prints */}
                                {selectedSubmission.conversation_prints?.length > 0 && (
                                    <div>
                                        <h3 className="text-sm font-medium text-muted-foreground mb-2 uppercase tracking-wider">
                                            Prints ({selectedSubmission.conversation_prints.length})
                                        </h3>
                                        <div className="grid grid-cols-3 gap-2">
                                            {selectedSubmission.conversation_prints.map((url, i) => (
                                                <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="aspect-square bg-muted rounded-lg overflow-hidden border hover:border-solar transition-colors">
                                                    <img src={url} alt={`Print ${i + 1}`} className="w-full h-full object-cover" />
                                                </a>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Notes */}
                                {selectedSubmission.notes && (
                                    <div className="bg-muted rounded-lg p-4">
                                        <p className="text-sm font-medium mb-1">Observações:</p>
                                        <p className="text-sm text-muted-foreground">{selectedSubmission.notes}</p>
                                    </div>
                                )}

                                {/* Actions */}
                                <div className="flex gap-3 pt-4 border-t">
                                    <Button
                                        className="flex-1 bg-solar hover:bg-solar/90 text-deep-space"
                                        onClick={() => handleAnalyze(selectedSubmission)}
                                        disabled={isGeneratingAI}
                                    >
                                        {isGeneratingAI ? (
                                            <><Sparkles className="h-4 w-4 mr-2 animate-spin" /> Analisando...</>
                                        ) : (
                                            <><Sparkles className="h-4 w-4 mr-2" /> Analisar com IA</>
                                        )}
                                    </Button>
                                    <Button
                                        variant="outline"
                                        onClick={() => handleGenerateReport(selectedSubmission)}
                                        disabled={isGeneratingPDF || !getAnalysisForSubmission(selectedSubmission.id)}
                                    >
                                        <Download className="h-4 w-4 mr-2" />
                                        PDF
                                    </Button>
                                </div>
                            </div>
                        )}
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    );
}
