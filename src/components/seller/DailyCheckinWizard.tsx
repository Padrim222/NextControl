import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
    SELLER_METRICS_FIELDS,
    CLOSER_METRICS_FIELDS,
    type SellerType,
    type SellerMetrics,
    type CloserMetrics
} from '@/types';
import {
    MessageSquare,
    Target,
    CheckCircle,
    ArrowRight,
    ArrowLeft,
    Send,
    Upload,
    X,
    Camera,
    Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { InstructionBalloon } from '@/components/ui/instruction-balloon';

const METRIC_HELP: Record<string, string> = {
    approaches: 'Quantas pessoas novas você abordou hoje? (Outbound ou Inbound)',
    followups: 'Quantos contatos de reconexão você fez com leads antigos?',
    proposals: 'Quantas propostas de valor ou orçamento você enviou?',
    sales: 'Quantas vendas foram efetivamente fechadas e pagas hoje?',
    calls_made: 'Total de ligações (conectadas ou não) realizadas no dia.',
    proposals_sent: 'Quantas propostas comerciais você enviou após as calls?',
    sales_closed: 'Quantas vendas foram fechadas e confirmadas hoje?',
    no_shows: 'Quantos leads agendados não apareceram na call?',
    reschedules: 'Quantas calls foram reagendadas para outra data?',
    conversion_rate: 'Qual a porcentagem de fechamento sobre as calls realizadas? (Ex: 2 vendas em 10 calls = 20%)',
    main_objections: 'Liste as barreiras que os clientes mais usaram para não comprar.',
};

interface DailyCheckinWizardProps {
    sellerType: SellerType;
    onSuccess?: (submissionId: string | null) => void;
}

const MAX_PRINTS = 5;

export default function DailyCheckinWizard({ sellerType, onSuccess }: DailyCheckinWizardProps) {
    const { user } = useAuth();
    const [currentStep, setCurrentStep] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form Data
    const [sellerMetrics, setSellerMetrics] = useState<SellerMetrics>({
        approaches: 0,
        followups: 0,
        proposals: 0,
        sales: 0,
    });
    const [closerMetrics, setCloserMetrics] = useState<CloserMetrics>({
        calls_made: 0,
        proposals_sent: 0,
        sales_closed: 0,
        no_shows: 0,
        reschedules: 0,
        conversion_rate: 0,
        main_objections: [],
    });
    const [notes, setNotes] = useState('');
    const [objectionsText, setObjectionsText] = useState('');

    // Files
    const [printPreviews, setPrintPreviews] = useState<string[]>([]);
    const [printFiles, setPrintFiles] = useState<File[]>([]);
    const [callFile, setCallFile] = useState<File | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);

    // Helper to get current metrics fields
    const metricsFields = sellerType === 'seller' ? SELLER_METRICS_FIELDS : CLOSER_METRICS_FIELDS;

    const handleNext = () => setCurrentStep(prev => prev + 1);
    const handleBack = () => setCurrentStep(prev => prev - 1);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        const remaining = MAX_PRINTS - printPreviews.length;
        const toAdd = files.slice(0, remaining);

        toAdd.forEach(file => {
            const reader = new FileReader();
            reader.onload = (ev) => {
                setPrintPreviews(prev => [...prev, ev.target?.result as string]);
            };
            reader.readAsDataURL(file);
        });
        setPrintFiles(prev => [...prev, ...toAdd]);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const removePrint = (index: number) => {
        setPrintPreviews(prev => prev.filter((_, i) => i !== index));
        setPrintFiles(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async () => {
        if (!user) return;
        setIsSubmitting(true);

        try {
            let printUrls: string[] = [];
            let callUrl: string | null = null;

            // 1. Upload Prints
            if (supabase && printFiles.length > 0) {
                try {
                    const formData = new FormData();
                    formData.append('type', 'print');
                    printFiles.forEach(f => formData.append('files', f));

                    const { data: uploadResult, error: uploadError } = await (supabase as any).functions.invoke('process-upload', {
                        body: formData,
                    });
                    if (uploadError) throw uploadError;
                    printUrls = uploadResult?.urls || [];
                } catch (uploadErr) {
                    console.warn('Upload fallback (mock):', uploadErr);
                    printUrls = printPreviews.map((_, i) => `print_mock_${i}.jpg`);
                }
            }

            // 2. Upload Call
            if (supabase && callFile) {
                try {
                    const formData = new FormData();
                    formData.append('type', 'call');
                    formData.append('files', callFile);

                    const { data: uploadResult, error: uploadError } = await (supabase as any).functions.invoke('process-upload', {
                        body: formData,
                    });
                    if (uploadError) throw uploadError;
                    callUrl = uploadResult?.urls?.[0] || null;
                } catch (uploadErr) {
                    console.warn('Call upload fallback:', uploadErr);
                    callUrl = `call_mock_${Date.now()}.mp3`;
                }
            }

            // 3. Prepare Submission
            const metrics = sellerType === 'seller' ? sellerMetrics : {
                ...closerMetrics,
                main_objections: objectionsText.split('\n').filter(Boolean),
            };

            const submission = {
                seller_id: user.id,
                submission_date: new Date().toISOString().split('T')[0],
                metrics,
                conversation_prints: printUrls,
                call_recording: callUrl,
                notes: notes || null,
            };

            // 4. Insert
            let submissionId: string | null = null;
            if (supabase) {
                const { data: inserted, error } = await (supabase as any).from('daily_submissions').insert(submission).select('id').single();
                if (error) throw error;
                submissionId = inserted?.id;
            }

            toast.success('Submissão enviada com sucesso! 🚀');

            // 5. Trigger AI
            if (supabase && submissionId) {
                (supabase as any).functions.invoke('analyze-submission', {
                    body: { submission_id: submissionId },
                }).then(({ data }: any) => {
                    if (data?.score !== undefined) {
                        toast.success(`🤖 Análise IA pronta! Score: ${data.score}/100`);
                    }
                }).catch((err: any) => console.warn('AI Error:', err));
            }

            onSuccess?.(submissionId);

        } catch (error) {
            console.error('Submit error:', error);
            toast.error('Erro ao enviar check-in.');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Steps Configuration
    const steps = [
        {
            id: 'metrics',
            title: 'Métricas do Dia',
            description: 'Registre seus números principais',
            icon: Target,
        },
        {
            id: 'evidence',
            title: sellerType === 'seller' ? 'Evidências (Prints)' : 'Gravação de Call',
            description: sellerType === 'seller' ? 'Upload de até 5 prints' : 'Upload da melhor call',
            icon: Upload,
        },
        {
            id: 'notes',
            title: 'Resumo & Envio',
            description: 'Observações finais e submissão',
            icon: CheckCircle,
        }
    ];

    return (
        <div className="max-w-xl mx-auto">
            {/* Progress Bar */}
            <div className="mb-8">
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <motion.div
                        className="h-full nc-gradient"
                        initial={{ width: 0 }}
                        animate={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
                        transition={{ duration: 0.3 }}
                    />
                </div>
                <div className="flex justify-between mt-2 text-xs text-muted-foreground uppercase tracking-widest">
                    {steps.map((s, i) => (
                        <span key={s.id} className={i <= currentStep ? 'text-primary' : ''}>
                            {s.title}
                        </span>
                    ))}
                </div>
            </div>

            <AnimatePresence mode="wait">
                <motion.div
                    key={currentStep}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.2 }}
                >
                    <Card className="sf-card-glow min-h-[400px] flex flex-col">
                        <CardHeader>
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                                    {(() => {
                                        const Icon = steps[currentStep].icon;
                                        return <Icon className="h-5 w-5" />;
                                    })()}
                                </div>
                                <div>
                                    <CardTitle>{steps[currentStep].title}</CardTitle>
                                    <CardDescription>{steps[currentStep].description}</CardDescription>
                                </div>
                            </div>
                        </CardHeader>

                        <CardContent className="flex-1 space-y-6">
                            {/* STEP 1: METRICS */}
                            {currentStep === 0 && (
                                <div className="space-y-4">
                                    {metricsFields.map((field) => (
                                        <div key={field.key} className="space-y-1.5">
                                            <div className="flex items-center justify-between">
                                                <Label className="flex items-center gap-2">
                                                    <span className="text-xl">{field.emoji}</span>
                                                    {field.label}
                                                </Label>
                                                <InstructionBalloon title={field.label} side="left">
                                                    {METRIC_HELP[field.key] || 'Registre este número com atenção.'}
                                                </InstructionBalloon>
                                            </div>
                                            <Input
                                                type="number"
                                                min={0}
                                                className="h-12 text-lg font-mono nc-input-glow"
                                                value={
                                                    sellerType === 'seller'
                                                        ? (sellerMetrics[field.key as keyof SellerMetrics] || '')
                                                        : (closerMetrics[field.key as keyof CloserMetrics] || '')
                                                }
                                                onChange={(e) => {
                                                    const val = parseInt(e.target.value) || 0;
                                                    if (sellerType === 'seller') {
                                                        setSellerMetrics((prev: SellerMetrics) => ({ ...prev, [field.key]: val }));
                                                    } else {
                                                        setCloserMetrics((prev: CloserMetrics) => ({ ...prev, [field.key]: val }));
                                                    }
                                                }}
                                            />
                                        </div>
                                    ))}

                                    {/* Closer Objections included in Step 1 or 3? Let's put in 3 or 1. Puts in 1 for now if closer */}
                                    {sellerType === 'closer' && (
                                        <div className="space-y-2 mt-4">
                                            <div className="flex items-center justify-between">
                                                <Label>Principais Objeções</Label>
                                                <InstructionBalloon title="Objeções" side="left">
                                                    Liste os motivos de "Não" mais comuns hoje. A IA vai usar isso para sugerir contornos.
                                                </InstructionBalloon>
                                            </div>
                                            <Textarea
                                                value={objectionsText}
                                                onChange={e => setObjectionsText(e.target.value)}
                                                placeholder="Liste as principais objeções (uma por linha)"
                                                rows={4}
                                            />
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* STEP 2: EVIDENCE */}
                            {currentStep === 1 && (
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <h3 className="text-sm font-medium">
                                            {sellerType === 'seller' ? 'Prints de Conversa' : 'Gravação da Call'}
                                        </h3>
                                        <InstructionBalloon title="Evidências" side="left">
                                            {sellerType === 'seller'
                                                ? 'Anexe prints de boas abordagens ou objeções difíceis. A IA vai analisar sua técnica.'
                                                : 'Suba o áudio da sua melhor (ou pior) call. A IA vai analisar seu SPIN Selling.'}
                                        </InstructionBalloon>
                                    </div>
                                    {sellerType === 'seller' ? (
                                        <div className="grid grid-cols-2 gap-4">
                                            {printPreviews.map((preview, i) => (
                                                <div key={i} className="relative aspect-[9/16] bg-gray-900 rounded-lg overflow-hidden border border-border group">
                                                    <img src={preview} alt="Print" className="w-full h-full object-cover" />
                                                    <button onClick={() => removePrint(i)} className="absolute top-2 right-2 p-1.5 bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            ))}
                                            {printPreviews.length < MAX_PRINTS && (
                                                <button
                                                    onClick={() => fileInputRef.current?.click()}
                                                    className="aspect-[9/16] rounded-lg border-2 border-dashed border-muted-foreground/25 hover:border-primary/50 flex flex-col items-center justify-center gap-2 text-muted-foreground hover:text-primary transition-all"
                                                >
                                                    <Camera className="w-8 h-8" />
                                                    <span className="text-xs font-bold uppercase">Adicionar Print</span>
                                                </button>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center h-48 border-2 border-dashed border-muted-foreground/25 rounded-xl hover:bg-muted/5 transition-all">
                                            <Upload className="w-10 h-10 text-muted-foreground mb-3" />
                                            {callFile ? (
                                                <div className="text-center">
                                                    <p className="font-medium text-primary">{callFile.name}</p>
                                                    <Button variant="ghost" size="sm" onClick={() => setCallFile(null)} className="mt-2 text-red-400">
                                                        Remover Arquivo
                                                    </Button>
                                                </div>
                                            ) : (
                                                <>
                                                    <p className="font-medium">Arraste ou clique para enviar</p>
                                                    <p className="text-xs text-muted-foreground text-center px-4 mt-1">
                                                        Gravação da call (MP3, MP4, WAV)
                                                    </p>
                                                    <Button variant="outline" className="mt-4" onClick={() => {
                                                        const input = document.createElement('input');
                                                        input.type = 'file';
                                                        input.accept = 'audio/*,video/*';
                                                        input.onchange = (e) => {
                                                            const f = (e.target as HTMLInputElement).files?.[0];
                                                            if (f) setCallFile(f);
                                                        };
                                                        input.click();
                                                    }}>
                                                        Selecionar Arquivo
                                                    </Button>
                                                </>
                                            )}
                                        </div>
                                    )}
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/*"
                                        multiple
                                        className="hidden"
                                        onChange={handleFileSelect}
                                    />
                                    <p className="text-xs text-muted-foreground text-center mt-4">
                                        {sellerType === 'seller' ? 'Envie conversas reais para análise da IA.' : 'Sua gravação será transcrita e analisada.'}
                                    </p>
                                </div>
                            )}

                            {/* STEP 3: NOTES */}
                            {currentStep === 2 && (
                                <div className="space-y-4">
                                    <Label>Observações Gerais</Label>
                                    <Textarea
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                        placeholder="Destaques do dia, dificuldades, insights..."
                                        className="min-h-[150px] resize-none nc-input-glow"
                                    />

                                    <div className="bg-muted/30 p-4 rounded-lg text-sm space-y-2">
                                        <p className="font-medium text-muted-foreground">Resumo do envio:</p>
                                        <ul className="list-disc pl-4 space-y-1 text-muted-foreground">
                                            {sellerType === 'seller' ? (
                                                <>
                                                    <li>Abordagens: {sellerMetrics.approaches}</li>
                                                    <li>Vendas: {sellerMetrics.sales}</li>
                                                    <li>Prints: {printFiles.length}</li>
                                                </>
                                            ) : (
                                                <>
                                                    <li>Calls: {closerMetrics.calls_made}</li>
                                                    <li>Propostas: {closerMetrics.proposals_sent}</li>
                                                    <li>Vendas: {closerMetrics.sales_closed}</li>
                                                    <li>Conversão: {closerMetrics.conversion_rate}%</li>
                                                </>
                                            )}
                                        </ul>
                                    </div>
                                </div>
                            )}
                        </CardContent>

                        {/* FOOTER ACTIONS */}
                        <div className="p-6 pt-0 flex justify-between">
                            <Button
                                variant="ghost"
                                onClick={handleBack}
                                disabled={currentStep === 0 || isSubmitting}
                                className={currentStep === 0 ? 'invisible' : ''}
                            >
                                <ArrowLeft className="w-4 h-4 mr-2" /> Voltar
                            </Button>

                            {currentStep < steps.length - 1 ? (
                                <Button onClick={handleNext} className="nc-btn-primary">
                                    Próximo <ArrowRight className="w-4 h-4 ml-2" />
                                </Button>
                            ) : (
                                <Button onClick={handleSubmit} disabled={isSubmitting} className="sf-gradient text-white">
                                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Send className="w-4 h-4 mr-2" /> Finalizar</>}
                                </Button>
                            )}
                        </div>
                    </Card>
                </motion.div>
            </AnimatePresence>
        </div>
    );
}
