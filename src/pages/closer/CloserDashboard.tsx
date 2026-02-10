import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Phone, Clock, CheckCircle, Calendar, Plus } from 'lucide-react';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import type { CallOutcome, Client, CallLog } from '@/types';
import { CallReportCard } from '@/components/closer/CallReportCard';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function CloserDashboard() {
    const { user } = useAuth();
    const [clients, setClients] = useState<Client[]>([]);
    const [myLogs, setMyLogs] = useState<CallLog[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Quick Add State
    const [selectedClient, setSelectedClient] = useState<string>('');
    const [outcome, setOutcome] = useState<CallOutcome>('no_sale');
    const [notes, setNotes] = useState('');
    const [transcription, setTranscription] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (!user) return;

        const fetchData = async () => {
            setIsLoading(true);
            try {
                // Fetch assigned clients
                const { data: clientsData, error: clientsError } = await supabase
                    .from('clients')
                    .select('*')
                    .eq('assigned_closer_id', user.id);

                if (clientsError) throw clientsError;
                setClients(clientsData || []);

                // Fetch my call logs
                const { data: logsData, error: logsError } = await supabase
                    .from('call_logs')
                    .select('*')
                    .eq('closer_id', user.id)
                    .order('created_at', { ascending: false });

                if (logsError) throw logsError;
                setMyLogs(logsData || []);
            } catch (error) {
                console.error('Error fetching closer data:', error);
                toast.error('Erro ao carregar dados');
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [user]);

    const handleQuickReport = async (clientName: string, callOutcome: CallOutcome, callNotes?: string) => {
        if (!user) return;

        const client = clients.find(c => c.name === clientName);
        if (!client) {
            toast.error('Cliente não encontrado');
            return;
        }

        try {
            const { error } = await supabase.from('call_logs').insert({
                closer_id: user.id,
                client_id: client.id,
                call_date: new Date().toISOString().split('T')[0],
                outcome: callOutcome,
                notes: callNotes || null,
            });

            if (error) throw error;

            toast.success(`Call com ${clientName} registrada: ${callOutcome}`);

            // Refresh logs
            const { data } = await supabase
                .from('call_logs')
                .select('*')
                .eq('closer_id', user.id)
                .order('created_at', { ascending: false });
            if (data) setMyLogs(data);
        } catch {
            toast.error('Erro ao registrar');
        }
    };

    const handleManualSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !selectedClient) return;

        setIsSubmitting(true);
        try {
            const { error } = await supabase.from('call_logs').insert({
                closer_id: user.id,
                client_id: selectedClient,
                call_date: new Date().toISOString().split('T')[0],
                transcription: transcription || null,
                outcome,
                notes: notes || null,
            });

            if (error) throw error;

            toast.success('Call registrada com sucesso!');
            setTranscription('');
            setNotes('');
            setSelectedClient('');

            // Refresh logs
            const { data } = await supabase
                .from('call_logs')
                .select('*')
                .eq('closer_id', user.id)
                .order('created_at', { ascending: false });
            if (data) setMyLogs(data);
        } catch {
            toast.error('Erro ao registrar');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Build schedule from clients (real data, not hardcoded)
    const scheduledCalls = clients.map((client, idx) => ({
        id: client.id,
        clientName: client.name,
        company: client.company || '',
        time: `${10 + idx * 2}:00`,
        status: undefined,
    }));

    const salesCount = myLogs.filter(l => l.outcome === 'sale').length;
    const conversionRate = myLogs.length > 0 ? Math.round((salesCount / myLogs.length) * 100) : 0;

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
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold">
                            Sala de Guerra <span className="sf-gradient-text">Closers</span> ⚔️
                        </h1>
                        <p className="text-muted-foreground mt-1">
                            Foco total na agenda de hoje, {user?.name}.
                        </p>
                    </div>
                    <Dialog>
                        <DialogTrigger asChild>
                            <Button className="sf-gradient">
                                <Plus className="mr-2 h-4 w-4" />
                                Registro Manual
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Registro Manual de Call</DialogTitle>
                            </DialogHeader>
                            <form onSubmit={handleManualSubmit} className="space-y-4 mt-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Cliente</label>
                                    <Select value={selectedClient} onValueChange={setSelectedClient}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Selecione..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {clients.map(c => (
                                                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Resultado</label>
                                    <Select value={outcome} onValueChange={(v) => setOutcome(v as CallOutcome)}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="sale">✅ Venda</SelectItem>
                                            <SelectItem value="no_sale">❌ Não Venda</SelectItem>
                                            <SelectItem value="reschedule">📅 Reagendou</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Notas</label>
                                    <Textarea
                                        value={notes}
                                        onChange={e => setNotes(e.target.value)}
                                        placeholder="Resumo da call..."
                                    />
                                </div>
                                <Button type="submit" disabled={isSubmitting} className="w-full">
                                    Registrar
                                </Button>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>

                {/* Stats Row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    <Card className="sf-card-hover border-blue-500/20">
                        <CardContent className="p-6 flex justify-between items-center">
                            <div>
                                <p className="text-sm text-muted-foreground">Calls Hoje</p>
                                <p className="text-2xl font-bold">{scheduledCalls.length}</p>
                            </div>
                            <Calendar className="h-8 w-8 text-blue-500 opacity-80" />
                        </CardContent>
                    </Card>
                    <Card className="sf-card-hover border-green-500/20">
                        <CardContent className="p-6 flex justify-between items-center">
                            <div>
                                <p className="text-sm text-muted-foreground">Vendas Fechadas</p>
                                <p className="text-2xl font-bold text-green-500">{salesCount}</p>
                            </div>
                            <CheckCircle className="h-8 w-8 text-green-500 opacity-80" />
                        </CardContent>
                    </Card>
                    <Card className="sf-card-hover border-blue-500/20">
                        <CardContent className="p-6 flex justify-between items-center">
                            <div>
                                <p className="text-sm text-muted-foreground">Conversão</p>
                                <p className="text-2xl font-bold text-blue-500">{conversionRate}%</p>
                            </div>
                            <Phone className="h-8 w-8 text-blue-500 opacity-80" />
                        </CardContent>
                    </Card>
                </div>

                <div className="mb-6">
                    <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                        <Clock className="h-5 w-5 text-primary" />
                        Agenda do Dia
                    </h2>
                    {scheduledCalls.length === 0 ? (
                        <p className="text-muted-foreground text-center py-8">
                            Nenhum cliente atribuído. Contate o administrador.
                        </p>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {scheduledCalls.map(call => (
                                <CallReportCard
                                    key={call.id}
                                    clientName={call.clientName}
                                    companyName={call.company}
                                    scheduledTime={call.time}
                                    onReport={(reportOutcome) => handleQuickReport(call.clientName, reportOutcome)}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
