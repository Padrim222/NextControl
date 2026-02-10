import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { ArrowLeft, FileText } from 'lucide-react';
import { DailyCheckinWizard } from '@/components/seller/DailyCheckinWizard';
import type { Client } from '@/types';

export default function DailyReport() {
    const { clientId } = useParams<{ clientId: string }>();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [client, setClient] = useState<Client | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!clientId) return;

        const fetchClient = async () => {
            setIsLoading(true);
            const { data, error } = await supabase
                .from('clients')
                .select('*')
                .eq('id', clientId)
                .single();

            if (error) {
                console.error('Error fetching client:', error);
            } else {
                setClient(data);
            }
            setIsLoading(false);
        };

        fetchClient();
    }, [clientId]);

    const handleSubmit = async (data: Record<string, number | string>) => {
        if (!user || !clientId) return;

        setIsSubmitting(true);

        try {
            const { error } = await supabase.from('daily_reports').insert({
                seller_id: user.id,
                client_id: clientId,
                report_date: new Date().toISOString().split('T')[0],
                chat_ativo: Number(data.chat_ativo),
                boas_vindas: Number(data.boas_vindas),
                reaquecimento: Number(data.reaquecimento),
                nutricao: Number(data.nutricao),
                conexoes: Number(data.conexoes),
                mapeamentos: Number(data.mapeamentos),
                pitchs: Number(data.pitchs),
                capturas: Number(data.capturas),
                followups: Number(data.followups),
                notes: String(data.notes || ''),
            });

            if (error) throw error;

            toast.success('Relatório enviado para aprovação!');
            navigate('/seller');
        } catch (error) {
            console.error(error);
            toast.error('Erro ao enviar relatório');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
        );
    }

    if (!client) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <Card className="w-full max-w-md">
                    <CardContent className="p-6 text-center">
                        <p className="text-muted-foreground">Cliente não encontrado</p>
                        <Button onClick={() => navigate('/seller')} className="mt-4">
                            Voltar
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background p-6">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="mb-6">
                    <Button variant="ghost" onClick={() => navigate('/seller')} className="mb-4">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Voltar
                    </Button>
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-primary/10 rounded-full">
                            <FileText className="h-8 w-8 text-primary" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold">Check-in Diário</h1>
                            <p className="text-muted-foreground">
                                Cliente: <span className="font-medium text-foreground">{client.name}</span>
                                {client.company && ` • ${client.company}`}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Wizard Component */}
                <DailyCheckinWizard onSubmit={handleSubmit} isSubmitting={isSubmitting} />
            </div>
        </div>
    );
}
