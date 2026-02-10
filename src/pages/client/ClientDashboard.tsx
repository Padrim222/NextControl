import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FunnelChart } from '@/components/charts/FunnelChart';
import { ProjectTimeline } from '@/components/client/ProjectTimeline';
import { TrendingUp, Users, DollarSign, Calendar } from 'lucide-react';
import type { Client, DailyReport } from '@/types';

export default function ClientDashboard() {
    const { user } = useAuth();

    const [client, setClient] = useState<Client | null>(null);
    const [reports, setReports] = useState<DailyReport[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!user || !user.email) return;

        const fetchData = async () => {
            setIsLoading(true);
            try {
                // Fetch client record by email (linked to user account)
                const { data: clientData, error: clientError } = await supabase
                    .from('clients')
                    .select('*')
                    .eq('email', user.email)
                    .single();

                if (clientError || !clientData) {
                    console.warn('No client record found for user:', user.email);
                    setIsLoading(false);
                    return;
                }

                setClient(clientData);

                // Fetch approved reports for this client
                const { data: reportsData, error: reportsError } = await supabase
                    .from('daily_reports')
                    .select('*')
                    .eq('client_id', clientData.id)
                    .eq('status', 'approved');

                if (reportsError) {
                    console.error('Error fetching reports:', reportsError);
                } else {
                    setReports(reportsData || []);
                }
            } catch (error) {
                console.error('Error in client dashboard data fetch:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [user]);

    if (isLoading) {
        return <div className="min-h-screen flex items-center justify-center">Carregando dados do projeto...</div>;
    }

    // Aggregate Data
    const totalLeads = reports.reduce((acc, curr) => acc + curr.chat_ativo + curr.boas_vindas, 0);
    const totalCalls = reports.reduce((acc, curr) => acc + curr.pitchs, 0);
    const totalSales = reports.reduce((acc, curr) => acc + curr.capturas, 0);

    // Mock metric for conversion
    const conversionRate = totalLeads > 0 ? Math.round((totalSales / totalLeads) * 100) : 0;

    // Latest Funnel Data (from last 7 reports or aggregated)
    const funnelData = [
        { name: 'Oportunidades', value: totalLeads, fill: '#8b5cf6' },
        { name: 'Qualificados', value: reports.reduce((acc, r) => acc + r.nutricao, 0), fill: '#ec4899' },
        { name: 'Agendamentos', value: totalCalls, fill: '#f59e0b' },
        { name: 'Vendas', value: totalSales, fill: '#10b981' },
    ];

    return (
        <div className="min-h-screen bg-background p-6">
            <div className="max-w-7xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold">
                        Bem-vindo, <span className="sf-gradient-text">{client?.name || 'Cliente'}</span>!
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Acompanhe o progresso do seu projeto em tempo real.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    <Card className="sf-card-hover border-primary/20">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                Leads Totais
                            </CardTitle>
                            <Users className="h-4 w-4 text-primary" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold">{totalLeads}</div>
                            <p className="text-xs text-muted-foreground">+12% essa semana</p>
                        </CardContent>
                    </Card>
                    <Card className="sf-card-hover border-pink-500/20">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                Taxa de Conversão
                            </CardTitle>
                            <TrendingUp className="h-4 w-4 text-pink-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-pink-500">{conversionRate}%</div>
                            <p className="text-xs text-muted-foreground">Média do setor: 15%</p>
                        </CardContent>
                    </Card>
                    <Card className="sf-card-hover border-yellow-500/20">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                Reuniões Realizadas
                            </CardTitle>
                            <Calendar className="h-4 w-4 text-yellow-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-yellow-500">{totalCalls}</div>
                        </CardContent>
                    </Card>
                    <Card className="sf-card-hover border-green-500/20">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                Novos Clientes
                            </CardTitle>
                            <DollarSign className="h-4 w-4 text-green-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-green-500">{totalSales}</div>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <Card className="lg:col-span-2 sf-card-glow">
                        <CardHeader>
                            <CardTitle>Funil de Vendas</CardTitle>
                            <CardDescription>Visualização acumulada do período</CardDescription>
                        </CardHeader>
                        <CardContent className="h-[400px]">
                            <FunnelChart data={funnelData} />
                        </CardContent>
                    </Card>

                    <div className="lg:col-span-1">
                        <ProjectTimeline reports={reports} />
                    </div>
                </div>
            </div>
        </div>
    );
}
