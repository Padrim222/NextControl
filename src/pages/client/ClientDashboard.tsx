import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FunnelChart } from '@/components/charts/FunnelChart';
import { ProjectTimeline } from '@/components/client/ProjectTimeline';
import { TrendingUp, Users, DollarSign, Calendar, Target, FileText } from 'lucide-react';
import { InstructionBalloon } from '@/components/ui/instruction-balloon';
import type { Client, DailySubmission, SellerMetrics, CloserMetrics } from '@/types';

export default function ClientDashboard() {
    const { user } = useAuth();
    const [client, setClient] = useState<Client | null>(null);
    const [submissions, setSubmissions] = useState<DailySubmission[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!user) return;

        const fetchData = async () => {
            setIsLoading(true);
            try {
                // 1. Get Client ID from User
                const { data: userData, error: userError } = await (supabase as any)
                    .from('users')
                    .select('client_id')
                    .eq('id', user.id)
                    .single();

                if (userError || !userData?.client_id) {
                    console.warn('User has no client_id linked');
                    setIsLoading(false);
                    return;
                }

                // 2. Fetch Client Details
                const { data: clientData } = await (supabase as any)
                    .from('clients')
                    .select('*')
                    .eq('id', userData.client_id)
                    .single();

                if (clientData) setClient(clientData);

                // 3. Fetch Team Members first
                const { data: teamMembers } = await supabase
                    .from('users')
                    .select('id')
                    .eq('client_id', userData.client_id);

                const teamIds = teamMembers?.map(u => u.id) || [];

                if (teamIds.length === 0) {
                    setSubmissions([]);
                } else {
                    const { data: subData, error: subError } = await (supabase as any)
                        .from('daily_submissions')
                        .select('*')
                        .in('seller_id', teamIds)
                        .order('submission_date', { ascending: false });

                    if (subError) throw subError;
                    setSubmissions(subData || []);
                }

            } catch (error) {
                console.error('Error fetching client data:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [user]);

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center fade-in">
                <div className="flex flex-col items-center gap-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    <p className="text-muted-foreground">Carregando dados do projeto...</p>
                </div>
            </div>
        );
    }

    if (!client) {
        return (
            <div className="min-h-screen flex items-center justify-center p-6 text-center">
                <div>
                    <h1 className="text-2xl font-bold mb-2">Ops! Acesso não configurado.</h1>
                    <p className="text-muted-foreground">Seu usuário não está vinculado a nenhum projeto (Cliente).</p>
                    <p className="text-sm mt-4 text-muted-foreground">Entre em contato com o suporte: suporte@nextcontrol.com</p>
                </div>
            </div>
        );
    }

    // --- AGGREGATION LOGIC ---
    let totalApproaches = 0;
    let totalCalls = 0;
    let totalSales = 0;
    let totalProposals = 0;

    submissions.forEach(sub => {
        const m = sub.metrics as any;
        if (m.approaches !== undefined) {
            // Seller
            totalApproaches += (m.approaches || 0);
            totalProposals += (m.proposals || 0);
            totalSales += (m.sales || 0);
        } else if (m.calls_made !== undefined) {
            // Closer
            totalCalls += (m.calls_made || 0);
            // Estimate closer sales from CR? Or assume reported elsewhere?
            // For now, let's purely aggregate.
            // If closer has sales field? No, just rate.
            // We'll rely on Sellers reporting 'sales' usually.
        }
    });

    const conversionRate = totalApproaches > 0 ? Math.round((totalSales / totalApproaches) * 100) : 0;

    // Funnel Data
    const funnelData = [
        { name: 'Abordagens', value: totalApproaches, fill: '#8b5cf6' }, // Violet
        { name: 'Propostas', value: totalProposals, fill: '#f59e0b' },   // Amber
        { name: 'Calls', value: totalCalls, fill: '#3b82f6' },           // Blue
        { name: 'Vendas', value: totalSales, fill: '#10b981' },          // Green
    ];

    const stats = [
        {
            label: 'Abordagens',
            value: totalApproaches,
            icon: Users,
            color: 'text-blue-500',
            tooltip: 'Total de pessoas que seu time contatou (Outbound) ou que chegaram organicamente (Inbound).'
        },
        {
            label: 'Propostas',
            value: totalProposals,
            icon: FileText,
            color: 'text-yellow-500',
            tooltip: 'Orçamentos ou propostas formais enviadas para leads qualificados.'
        },
        {
            label: 'Vendas',
            value: totalSales,
            icon: DollarSign,
            color: 'text-green-500',
            tooltip: 'Vendas fechadas e pagas. O dinheiro no bolso.'
        },
        {
            label: 'Conversão',
            value: totalProposals > 0 ? `${((totalSales / totalProposals) * 100).toFixed(1)}%` : '0%',
            icon: Target,
            color: 'text-purple-500',
            tooltip: 'De cada 100 propostas, quantas viram venda. Acima de 20% é saudável.'
        }
    ];

    return (
        <div className="min-h-screen p-6 fade-in pb-20 md:pb-6">
            <div className="max-w-7xl mx-auto space-y-8 fade-in">
                {/* Header */}
                <div>
                    <h1 className="text-3xl font-bold">
                        Bem-vindo, <span className="nc-gradient-text">{client.name}</span>!
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Acompanhe o progresso do seu projeto em tempo real.
                    </p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    {stats.map((stat, i) => (
                        <Card key={i} className="nc-card-border hover:border-primary/20 transition-colors">
                            <CardContent className="p-6 flex items-center justify-between">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                                        <InstructionBalloon title={stat.label}>
                                            {stat.tooltip}
                                        </InstructionBalloon>
                                    </div>
                                    <h3 className={`text-2xl font-bold ${stat.color}`}>{stat.value}</h3>
                                </div>
                                <div className={`p-3 rounded-full bg-card border border-border`}>
                                    <stat.icon className={`h-5 w-5 ${stat.color}`} />
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Funnel Chart */}
                    <Card className="lg:col-span-2 nc-card-border">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <TrendingUp className="h-5 w-5 text-solar" />
                                Funil de Vendas
                            </CardTitle>
                            <CardDescription>Performance acumulada de todos os canais</CardDescription>
                        </CardHeader>
                        <CardContent className="h-[400px]">
                            <FunnelChart data={funnelData} />
                        </CardContent>
                    </Card>

                    {/* Timeline */}
                    <div className="lg:col-span-1">
                        <ProjectTimeline reports={submissions} />
                    </div>
                </div>
            </div>
        </div>
    );
}
