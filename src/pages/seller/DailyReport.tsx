import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { ArrowLeft, FileText } from 'lucide-react';
import DailyCheckinWizard from '@/components/seller/DailyCheckinWizard';
import { AIFeedbackDisplay } from '@/components/seller/AIFeedbackDisplay';
import type { Client, SellerType } from '@/types';

interface AIFeedback {
    operational_analysis: string;
    tactical_analysis: string;
    recommendations: string[];
    score: number;
}

export default function DailyReport() {
    const { clientId } = useParams<{ clientId: string }>();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [client, setClient] = useState<Client | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [aiFeedback, setAiFeedback] = useState<AIFeedback | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    // Determine seller type from user profile
    const [sellerType, setSellerType] = useState<SellerType>('seller');

    useEffect(() => {
        async function init() {
            setIsLoading(true);

            // Fetch seller type
            if (user?.id) {
                const { data: profile } = await (supabase as any)
                    .from('users')
                    .select('seller_type')
                    .eq('id', user.id)
                    .single();
                if (profile?.seller_type) {
                    setSellerType(profile.seller_type as SellerType);
                }
            }

            // Fetch client if clientId is provided
            if (clientId) {
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
            }

            setIsLoading(false);
        }

        init();
    }, [clientId, user?.id]);

    const [submissionId, setSubmissionId] = useState<string | null>(null);

    useEffect(() => {
        let interval: NodeJS.Timeout;

        if (submitted && isAnalyzing && submissionId) {
            // Poll for analysis every 3 seconds
            interval = setInterval(async () => {
                const { data } = await (supabase as any)
                    .from('analyses')
                    .select('*')
                    .eq('submission_id', submissionId)
                    .single();

                if (data) {
                    setAiFeedback(data as unknown as AIFeedback);
                    setIsAnalyzing(false);
                    clearInterval(interval);
                    toast.success('Análise finalizada!');
                }
            }, 3000);
        }

        return () => clearInterval(interval);
    }, [submitted, isAnalyzing, submissionId]);

    const handleSubmissionSuccess = (id: string | null) => {
        if (id) {
            setSubmissionId(id);
            setSubmitted(true);
            setIsAnalyzing(true);
            toast.success('Submissão enviada! A análise IA será gerada em breve.');
        }
    };

    const handleFinish = () => {
        navigate('/seller');
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
                                {client ? (
                                    <>Cliente: <span className="font-medium text-foreground">{client.name}</span>
                                        {client.company && ` • ${client.company}`}</>
                                ) : (
                                    `Registro diário de atividades`
                                )}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Submission Form or Feedback */}
                {!submitted ? (
                    <DailyCheckinWizard
                        sellerType={sellerType}
                        onSuccess={handleSubmissionSuccess}
                    />
                ) : (
                    <div className="space-y-6 fade-in">
                        <AIFeedbackDisplay feedback={aiFeedback} isLoading={isAnalyzing} />
                        {!isAnalyzing && (
                            <div className="flex justify-end">
                                <Button onClick={handleFinish} className="w-full md:w-auto" size="lg">
                                    Concluir e Voltar
                                    <ArrowLeft className="ml-2 h-4 w-4 rotate-180" />
                                </Button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
