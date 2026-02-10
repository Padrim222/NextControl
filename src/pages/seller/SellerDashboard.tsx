import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, FileText, Clock, CheckCircle } from 'lucide-react';
import type { Client, DailyReport } from '@/types';

export default function SellerDashboard() {
    const { user } = useAuth();
    const [clients, setClients] = useState<Client[]>([]);
    const [reports, setReports] = useState<DailyReport[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!user) return;

        const fetchData = async () => {
            setIsLoading(true);
            try {
                // Fetch assigned clients
                const { data: clientsData, error: clientsError } = await supabase
                    .from('clients')
                    .select('*')
                    .eq('assigned_seller_id', user.id);

                if (clientsError) throw clientsError;
                setClients(clientsData || []);

                // Fetch my reports
                const { data: reportsData, error: reportsError } = await supabase
                    .from('daily_reports')
                    .select('*')
                    .eq('seller_id', user.id);

                if (reportsError) throw reportsError;
                setReports(reportsData || []);
            } catch (error) {
                console.error('Error fetching seller data:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [user]);

    const pendingReports = reports.filter(r => r.status === 'pending');
    const approvedReports = reports.filter(r => r.status === 'approved');

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
                        Olá, <span className="sf-gradient-text">{user?.name}</span>! 👋
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Seller Dashboard • Next Control
                    </p>
                </div>

                {/* Stats Grid */}
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
                                    <p className="text-sm text-muted-foreground">Relatórios</p>
                                    <p className="text-2xl font-bold">{reports.length}</p>
                                </div>
                                <FileText className="h-8 w-8 text-primary opacity-80" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="sf-card-hover">
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

                {/* Clients Section */}
                <Card className="sf-card-glow">
                    <CardHeader>
                        <CardTitle>Selecione um Cliente</CardTitle>
                        <CardDescription>Escolha o cliente para preencher o relatório diário</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {clients.length === 0 ? (
                            <p className="text-muted-foreground text-center py-8">
                                Nenhum cliente atribuído. Contate o administrador.
                            </p>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {clients.map((client) => (
                                    <Card key={client.id} className="sf-card-hover cursor-pointer hover:border-primary">
                                        <CardContent className="p-4">
                                            <h3 className="font-semibold">{client.name}</h3>
                                            {client.company && (
                                                <p className="text-sm text-muted-foreground">{client.company}</p>
                                            )}
                                            <Link to={`/seller/report/${client.id}`}>
                                                <Button className="w-full mt-4 sf-gradient">
                                                    <FileText className="h-4 w-4 mr-2" />
                                                    Preencher Relatório
                                                </Button>
                                            </Link>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
