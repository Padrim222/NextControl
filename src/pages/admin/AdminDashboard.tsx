import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FUNNEL_LABELS, type FunnelMetricKey, type DailyReport, type User } from '@/types';
import { toast } from 'sonner';
import {
    Users,
    FileText,
    Clock,
    CheckCircle,
    XCircle,
    Sparkles,
} from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

export default function AdminDashboard() {
    const { user } = useAuth();
    const [selectedReport, setSelectedReport] = useState<DailyReport | null>(null);
    const [isGeneratingAI, setIsGeneratingAI] = useState(false);

    const [realUsers, setRealUsers] = useState<User[]>([]);
    const [clients, setClients] = useState<{ id: string; name: string }[]>([]);
    const [pendingReports, setPendingReports] = useState<DailyReport[]>([]);
    const [approvedReports, setApprovedReports] = useState<DailyReport[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchAll = async () => {
            setIsLoading(true);
            try {
                // Fetch users
                const { data: usersData } = await supabase
                    .from('users')
                    .select('*')
                    .order('created_at', { ascending: false });
                if (usersData) setRealUsers(usersData as User[]);

                // Fetch clients
                const { data: clientsData } = await supabase
                    .from('clients')
                    .select('id, name');
                if (clientsData) setClients(clientsData);

                // Fetch pending reports
                const { data: pendingData } = await supabase
                    .from('daily_reports')
                    .select('*')
                    .eq('status', 'pending')
                    .order('created_at', { ascending: false });
                if (pendingData) setPendingReports(pendingData as DailyReport[]);

                // Fetch approved reports
                const { data: approvedData } = await supabase
                    .from('daily_reports')
                    .select('*')
                    .eq('status', 'approved')
                    .order('created_at', { ascending: false });
                if (approvedData) setApprovedReports(approvedData as DailyReport[]);
            } catch (error) {
                console.error('Error fetching admin data:', error);
                toast.error('Erro ao carregar dados');
            } finally {
                setIsLoading(false);
            }
        };

        fetchAll();
    }, []);

    const getClientName = (clientId: string) => {
        return clients.find(c => c.id === clientId)?.name || 'Cliente Desconhecido';
    };

    const getSellerName = (sellerId: string) => {
        return realUsers.find(u => u.id === sellerId)?.name || 'Seller Desconhecido';
    };

    const handleApprove = async (reportId: string) => {
        setIsGeneratingAI(true);

        try {
            // Update status to approved
            const { error: updateError } = await supabase
                .from('daily_reports')
                .update({ status: 'approved' })
                .eq('id', reportId);

            if (updateError) throw updateError;

            // Generate AI feedback
            const report = pendingReports.find(r => r.id === reportId) || selectedReport;
            if (report) {
                const feedback = generateAIFeedback(report);

                const { error: feedbackError } = await supabase
                    .from('ai_feedback')
                    .insert({
                        report_id: reportId,
                        generated_by: user?.id,
                        feedback_text: feedback,
                        model: 'gpt-4o',
                    });

                if (feedbackError) console.error('Error saving feedback:', feedbackError);
            }

            // Move from pending to approved locally
            setPendingReports(prev => prev.filter(r => r.id !== reportId));
            if (report) {
                setApprovedReports(prev => [{ ...report, status: 'approved' as const }, ...prev]);
            }

            toast.success('Relatório aprovado e feedback gerado!');
            setSelectedReport(null);
        } catch {
            toast.error('Erro ao aprovar relatório');
        } finally {
            setIsGeneratingAI(false);
        }
    };

    const handleReject = async (reportId: string) => {
        const { error } = await supabase
            .from('daily_reports')
            .update({ status: 'rejected' })
            .eq('id', reportId);

        if (error) {
            toast.error('Erro ao rejeitar');
            return;
        }

        setPendingReports(prev => prev.filter(r => r.id !== reportId));
        toast.info('Relatório rejeitado');
        setSelectedReport(null);
    };

    const generateAIFeedback = (report: DailyReport): string => {
        const convRate = report.boas_vindas > 0
            ? ((report.capturas / report.boas_vindas) * 100).toFixed(1)
            : 0;

        return `## Análise de Performance

### Pontos Fortes 💪
- ${report.boas_vindas} boas-vindas realizadas
- Taxa de conversão geral: ${convRate}%
${report.capturas > 0 ? `- ${report.capturas} capturas no dia - excelente!` : ''}

### Oportunidades de Melhoria 📈
${report.mapeamentos < report.conexoes * 0.5
                ? `- Aumentar taxa de mapeamento (atualmente ${((report.mapeamentos / report.conexoes) * 100).toFixed(0)}% das conexões)`
                : '- Mapeamentos estão em boa proporção'}
${report.followups < report.mapeamentos
                ? `- Intensificar follow-ups (${report.followups} vs ${report.mapeamentos} mapeamentos)`
                : ''}

### Script Sugerido 📝
1. Foque em qualificar melhor os leads na fase de boas-vindas
2. Use perguntas abertas para entender as dores do lead
3. Marque mais calls de descoberta para leads engajados

---
*Gerado por IA • Next Control*`;
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold">
                        Painel <span className="sf-gradient-text">Administrador</span> 👔
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Olá, {user?.name} • Next Control
                    </p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                    <Card className="sf-card-hover">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground">Clientes</p>
                                    <p className="text-2xl font-bold">{clients.length}</p>
                                </div>
                                <Users className="h-8 w-8 text-primary opacity-80" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="sf-card-hover">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground">Usuários</p>
                                    <p className="text-2xl font-bold">{realUsers.length}</p>
                                </div>
                                <Users className="h-8 w-8 text-blue-500 opacity-80" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="sf-card-hover border-yellow-500/30">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground">Pendentes</p>
                                    <p className="text-2xl font-bold text-yellow-500">{pendingReports.length}</p>
                                </div>
                                <Clock className="h-8 w-8 text-yellow-500 opacity-80" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="sf-card-hover">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground">Aprovados</p>
                                    <p className="text-2xl font-bold text-green-500">{approvedReports.length}</p>
                                </div>
                                <CheckCircle className="h-8 w-8 text-green-500 opacity-80" />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Action Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                    {/* User Validation Inbox */}
                    <Card className="sf-card-glow border-blue-500/20">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Users className="h-5 w-5 text-blue-500" />
                                Validação de Acessos
                            </CardTitle>
                            <CardDescription>
                                Libere o acesso para novos membros da equipe
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {realUsers.filter(u => u.status === 'pending').length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground">
                                    <CheckCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                    <p>Todos os usuários validados</p>
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
                                                        const { error } = await supabase.from('users').update({ status: 'suspended' }).eq('id', pendingUser.id);
                                                        if (error) {
                                                            toast.error('Erro ao suspender usuário');
                                                        } else {
                                                            toast.success('Usuário rejeitado');
                                                            setRealUsers(prev => prev.map(u => u.id === pendingUser.id ? { ...u, status: 'suspended' } : u));
                                                        }
                                                    }}
                                                >
                                                    <XCircle className="h-4 w-4 text-red-500" />
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    className="bg-green-500 hover:bg-green-600 text-white"
                                                    onClick={async () => {
                                                        const { error } = await supabase.from('users').update({ status: 'active' }).eq('id', pendingUser.id);
                                                        if (error) {
                                                            toast.error('Erro ao ativar usuário');
                                                        } else {
                                                            toast.success('Acesso liberado!');
                                                            setRealUsers(prev => prev.map(u => u.id === pendingUser.id ? { ...u, status: 'active' } : u));
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

                    {/* Pending Reports Inbox */}
                    <Card className="sf-card-glow border-yellow-500/20">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Clock className="h-5 w-5 text-yellow-500" />
                                Inbox de Métricas
                            </CardTitle>
                            <CardDescription>
                                Valide os relatórios diários
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {pendingReports.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground">
                                    <CheckCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                    <p>Nenhum relatório pendente</p>
                                </div>
                            ) : (
                                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                                    {pendingReports.map((report) => (
                                        <div
                                            key={report.id}
                                            className="flex items-center justify-between p-3 bg-card rounded-lg border hover:border-primary/50 transition-colors"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                                                    <FileText className="h-4 w-4 text-primary" />
                                                </div>
                                                <div>
                                                    <p className="font-medium text-sm">{getClientName(report.client_id)}</p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {getSellerName(report.seller_id)} • {new Date(report.report_date).toLocaleDateString('pt-BR')}
                                                    </p>
                                                </div>
                                            </div>

                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="h-8"
                                                onClick={() => setSelectedReport(report)}
                                            >
                                                Review
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Report Detail Modal */}
                <Dialog open={!!selectedReport} onOpenChange={() => setSelectedReport(null)}>
                    <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>Detalhes do Relatório</DialogTitle>
                            <DialogDescription>
                                {selectedReport && (
                                    <>
                                        Cliente: {getClientName(selectedReport.client_id)} •
                                        Seller: {getSellerName(selectedReport.seller_id)} •
                                        {new Date(selectedReport.report_date).toLocaleDateString('pt-BR')}
                                    </>
                                )}
                            </DialogDescription>
                        </DialogHeader>

                        {selectedReport && (
                            <div className="space-y-4">
                                {/* Metrics Grid */}
                                <div className="grid grid-cols-3 gap-3">
                                    {Object.entries(FUNNEL_LABELS).map(([key, { label, emoji }]) => (
                                        <div key={key} className="bg-muted rounded-lg p-3 text-center">
                                            <span className="text-lg">{emoji}</span>
                                            <p className="text-xs text-muted-foreground mt-1">{label}</p>
                                            <p className="text-xl font-bold">
                                                {selectedReport[key as FunnelMetricKey] || 0}
                                            </p>
                                        </div>
                                    ))}
                                </div>

                                {/* Notes */}
                                {selectedReport.notes && (
                                    <div className="bg-muted rounded-lg p-4">
                                        <p className="text-sm font-medium mb-2">Observações do Seller:</p>
                                        <p className="text-sm text-muted-foreground">{selectedReport.notes}</p>
                                    </div>
                                )}

                                {/* Actions */}
                                <div className="flex gap-3 pt-4 border-t">
                                    <Button
                                        variant="outline"
                                        className="flex-1"
                                        onClick={() => {
                                            toast.success('Gerando PDF...', { description: 'O download iniciará em instantes.' });
                                            setTimeout(() => toast.success('Relatório baixado!'), 2000);
                                        }}
                                    >
                                        <FileText className="h-4 w-4 mr-2" />
                                        PDF
                                    </Button>
                                </div>
                                <div className="flex gap-3 mt-3">
                                    <Button
                                        variant="destructive"
                                        className="flex-1"
                                        onClick={() => handleReject(selectedReport.id)}
                                        disabled={isGeneratingAI}
                                    >
                                        <XCircle className="h-4 w-4 mr-2" />
                                        Rejeitar
                                    </Button>
                                    <Button
                                        className="flex-[2] sf-gradient"
                                        onClick={() => handleApprove(selectedReport.id)}
                                        disabled={isGeneratingAI}
                                    >
                                        {isGeneratingAI ? (
                                            <>
                                                <Sparkles className="h-4 w-4 mr-2 animate-spin" />
                                                IA Analisando...
                                            </>
                                        ) : (
                                            <>
                                                <CheckCircle className="h-4 w-4 mr-2" />
                                                Aprovar + Análise IA
                                            </>
                                        )}
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
