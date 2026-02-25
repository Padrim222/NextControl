import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
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
    Loader2,
    ClipboardPaste,
    Image as ImageIcon,
    Minus,
    Plus,
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

// Categories for grouping metrics in checklist style
const SELLER_CATEGORIES = [
    {
        name: 'Prospecção',
        emoji: '🎯',
        keys: ['approaches'],
        color: 'from-blue-500/10 to-cyan-500/10 border-blue-500/20',
    },
    {
        name: 'Nutrição',
        emoji: '🔄',
        keys: ['followups'],
        color: 'from-amber-500/10 to-orange-500/10 border-amber-500/20',
    },
    {
        name: 'Conversão',
        emoji: '📋',
        keys: ['proposals', 'sales'],
        color: 'from-emerald-500/10 to-green-500/10 border-emerald-500/20',
    },
];

const CLOSER_CATEGORIES = [
    {
        name: 'Calls',
        emoji: '📞',
        keys: ['calls_made', 'no_shows', 'reschedules'],
        color: 'from-blue-500/10 to-cyan-500/10 border-blue-500/20',
    },
    {
        name: 'Conversão',
        emoji: '🎯',
        keys: ['proposals_sent', 'sales_closed', 'conversion_rate'],
        color: 'from-emerald-500/10 to-green-500/10 border-emerald-500/20',
    },
];

interface DailyCheckinWizardProps {
    sellerType: SellerType;
    onSuccess?: (submissionId: string | null) => void;
}

// Stepper component for checklist-style number input
function MetricStepper({
    value,
    onChange,
    label,
    emoji,
    helpText,
    max = 100,
    isPercentage = false,
}: {
    value: number;
    onChange: (val: number) => void;
    label: string;
    emoji: string;
    helpText: string;
    max?: number;
    isPercentage?: boolean;
}) {
    return (
        <div className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border/50 hover:border-primary/30 transition-all group">
            <div className="text-2xl w-8 text-center shrink-0">{emoji}</div>
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                    <span className="text-sm font-medium truncate">{label}</span>
                    <InstructionBalloon title={label} side="top">
                        {helpText}
                    </InstructionBalloon>
                </div>
                {max <= 10 && !isPercentage && (
                    <div className="mt-1.5">
                        <Slider
                            value={[value]}
                            onValueChange={([v]) => onChange(v)}
                            max={max}
                            step={1}
                            className="w-full"
                        />
                    </div>
                )}
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
                <button
                    type="button"
                    onClick={() => onChange(Math.max(0, value - 1))}
                    className="w-8 h-8 rounded-lg bg-muted hover:bg-muted/80 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                    disabled={value <= 0}
                >
                    <Minus className="w-3.5 h-3.5" />
                </button>
                <div className="w-12 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                    <span className="text-lg font-mono font-bold text-primary">
                        {value}{isPercentage ? '%' : ''}
                    </span>
                </div>
                <button
                    type="button"
                    onClick={() => onChange(Math.min(max, value + 1))}
                    className="w-8 h-8 rounded-lg bg-muted hover:bg-muted/80 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                    disabled={value >= max}
                >
                    <Plus className="w-3.5 h-3.5" />
                </button>
            </div>
        </div>
    );
}

// Boolean toggle for 0-1 metrics
function MetricToggle({
    checked,
    onChange,
    label,
    emoji,
}: {
    checked: boolean;
    onChange: (val: boolean) => void;
    label: string;
    emoji: string;
}) {
    return (
        <div className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border/50 hover:border-primary/30 transition-all">
            <div className="text-2xl w-8 text-center shrink-0">{emoji}</div>
            <span className="text-sm font-medium flex-1">{label}</span>
            <Switch checked={checked} onCheckedChange={onChange} />
        </div>
    );
}

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

    // Evidence: print + pasted messages
    const [printPreviews, setPrintPreviews] = useState<string[]>([]);
    const [printFiles, setPrintFiles] = useState<File[]>([]);
    const [pastedMessages, setPastedMessages] = useState('');
    const [callFile, setCallFile] = useState<File | null>(null);
    const [evidenceTab, setEvidenceTab] = useState<string>('paste');

    const fileInputRef = useRef<HTMLInputElement>(null);

    const metricsFields = sellerType === 'seller' ? SELLER_METRICS_FIELDS : CLOSER_METRICS_FIELDS;
    const categories = sellerType === 'seller' ? SELLER_CATEGORIES : CLOSER_CATEGORIES;

    const handleNext = () => setCurrentStep(prev => prev + 1);
    const handleBack = () => setCurrentStep(prev => prev - 1);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        // Only 1 main print now
        const toAdd = files.slice(0, 1);

        toAdd.forEach(file => {
            const reader = new FileReader();
            reader.onload = (ev) => {
                setPrintPreviews([ev.target?.result as string]);
            };
            reader.readAsDataURL(file);
        });
        setPrintFiles(toAdd);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const removePrint = () => {
        setPrintPreviews([]);
        setPrintFiles([]);
    };

    const handleSubmit = async () => {
        if (!user) return;
        setIsSubmitting(true);

        try {
            let printUrls: string[] = [];
            let callUrl: string | null = null;

            // 1. Upload Print (single)
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

            // 2. Upload Call (closer only)
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
                pasted_messages: pastedMessages || null,
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
            title: 'Checklist do Dia',
            description: 'Marque seus números — estilo lista de mercado',
            icon: Target,
        },
        {
            id: 'evidence',
            title: sellerType === 'seller' ? 'CRM & Conversas' : 'Gravação de Call',
            description: sellerType === 'seller' ? 'Print ou cole mensagens' : 'Upload da melhor call',
            icon: MessageSquare,
        },
        {
            id: 'notes',
            title: 'Resumo & Envio',
            description: 'Observações finais e submissão',
            icon: CheckCircle,
        }
    ];

    const getMetricValue = (key: string): number => {
        if (sellerType === 'seller') {
            return (sellerMetrics as any)[key] || 0;
        }
        return (closerMetrics as any)[key] || 0;
    };

    const setMetricValue = (key: string, val: number) => {
        if (sellerType === 'seller') {
            setSellerMetrics((prev: SellerMetrics) => ({ ...prev, [key]: val }));
        } else {
            setCloserMetrics((prev: CloserMetrics) => ({ ...prev, [key]: val }));
        }
    };

    const getFieldMeta = (key: string) => {
        return metricsFields.find(f => f.key === key);
    };

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
                            {/* STEP 1: METRICS — Checklist "Lista de Mercado" */}
                            {currentStep === 0 && (
                                <div className="space-y-5">
                                    {categories.map((cat) => (
                                        <div key={cat.name}>
                                            <div className="flex items-center gap-2 mb-3">
                                                <span className="text-lg">{cat.emoji}</span>
                                                <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                                                    {cat.name}
                                                </h3>
                                                <div className="flex-1 h-px bg-border" />
                                            </div>
                                            <div className="space-y-2">
                                                {cat.keys.map((key) => {
                                                    const field = getFieldMeta(key);
                                                    if (!field) return null;
                                                    const isPercent = key === 'conversion_rate';
                                                    return (
                                                        <MetricStepper
                                                            key={key}
                                                            value={getMetricValue(key)}
                                                            onChange={(val) => setMetricValue(key, val)}
                                                            label={field.label}
                                                            emoji={field.emoji}
                                                            helpText={METRIC_HELP[key] || 'Registre este número.'}
                                                            max={isPercent ? 100 : 999}
                                                            isPercentage={isPercent}
                                                        />
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    ))}

                                    {/* Closer Objections */}
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

                            {/* STEP 2: EVIDENCE — Print único + Copiar/Colar */}
                            {currentStep === 1 && (
                                <div className="space-y-4">
                                    {sellerType === 'seller' ? (
                                        <Tabs value={evidenceTab} onValueChange={setEvidenceTab} className="w-full">
                                            <TabsList className="grid w-full grid-cols-2">
                                                <TabsTrigger value="paste" className="gap-2">
                                                    <ClipboardPaste className="w-4 h-4" />
                                                    Colar Mensagens
                                                </TabsTrigger>
                                                <TabsTrigger value="print" className="gap-2">
                                                    <ImageIcon className="w-4 h-4" />
                                                    Print CRM
                                                </TabsTrigger>
                                            </TabsList>

                                            <TabsContent value="paste" className="mt-4 space-y-3">
                                                <div className="space-y-1.5">
                                                    <Label className="text-sm text-muted-foreground">
                                                        Cole as mensagens diretamente do CRM/WhatsApp
                                                    </Label>
                                                    <Textarea
                                                        value={pastedMessages}
                                                        onChange={(e) => setPastedMessages(e.target.value)}
                                                        placeholder={"Cole aqui as conversas do dia...\n\nExemplo:\n[14:30] Você: Oi Maria, tudo bem?\n[14:31] Maria: Oi! Tudo sim\n[14:32] Você: Vi que você se interessou pelo nosso serviço..."}
                                                        className="min-h-[200px] resize-none font-mono text-sm nc-input-glow"
                                                    />
                                                    <p className="text-xs text-muted-foreground">
                                                        {pastedMessages.length} caracteres
                                                        {pastedMessages.length > 0 && (
                                                            <span className="text-primary ml-2">
                                                                ✓ A IA vai analisar sua técnica de abordagem
                                                            </span>
                                                        )}
                                                    </p>
                                                </div>
                                            </TabsContent>

                                            <TabsContent value="print" className="mt-4 space-y-3">
                                                <Label className="text-sm text-muted-foreground">
                                                    Tire 1 print principal da tela do CRM
                                                </Label>
                                                {printPreviews.length > 0 ? (
                                                    <div className="relative aspect-video bg-muted rounded-lg overflow-hidden border border-border group">
                                                        <img src={printPreviews[0]} alt="Print CRM" className="w-full h-full object-cover" />
                                                        <button
                                                            onClick={() => removePrint()}
                                                            className="absolute top-2 right-2 p-1.5 bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                                        >
                                                            <X className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <button
                                                        onClick={() => fileInputRef.current?.click()}
                                                        className="w-full aspect-video rounded-xl border-2 border-dashed border-muted-foreground/25 hover:border-primary/50 flex flex-col items-center justify-center gap-2 text-muted-foreground hover:text-primary transition-all"
                                                    >
                                                        <Camera className="w-10 h-10" />
                                                        <span className="text-sm font-bold uppercase">Adicionar Print</span>
                                                        <span className="text-xs opacity-70">1 print principal do CRM</span>
                                                    </button>
                                                )}
                                            </TabsContent>
                                        </Tabs>
                                    ) : (
                                        /* Closer: Call upload */
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between mb-2">
                                                <h3 className="text-sm font-medium">Gravação da Call</h3>
                                                <InstructionBalloon title="Evidências" side="left">
                                                    Suba o áudio da sua melhor (ou pior) call. A IA vai analisar seu SPIN Selling.
                                                </InstructionBalloon>
                                            </div>
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
                                        </div>
                                    )}
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={handleFileSelect}
                                    />
                                    <p className="text-xs text-muted-foreground text-center mt-4">
                                        {sellerType === 'seller'
                                            ? 'Cole mensagens OU envie print. A IA analisa ambos.'
                                            : 'Sua gravação será transcrita e analisada.'}
                                    </p>
                                </div>
                            )}

                            {/* STEP 3: NOTES & SUMMARY */}
                            {currentStep === 2 && (
                                <div className="space-y-4">
                                    <Label>Observações Gerais</Label>
                                    <Textarea
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                        placeholder="Destaques do dia, dificuldades, insights..."
                                        className="min-h-[120px] resize-none nc-input-glow"
                                    />

                                    {/* Summary Card */}
                                    <div className="bg-muted/30 p-4 rounded-xl text-sm space-y-3 border border-border/50">
                                        <p className="font-semibold text-foreground flex items-center gap-2">
                                            <CheckCircle className="w-4 h-4 text-primary" />
                                            Resumo do envio
                                        </p>

                                        {/* Metrics summary */}
                                        <div className="grid grid-cols-2 gap-2">
                                            {sellerType === 'seller' ? (
                                                <>
                                                    {SELLER_METRICS_FIELDS.map(field => (
                                                        <div key={field.key} className="flex items-center gap-2 text-muted-foreground">
                                                            <span>{field.emoji}</span>
                                                            <span>{field.label}:</span>
                                                            <span className="font-mono font-bold text-foreground">
                                                                {(sellerMetrics as any)[field.key] || 0}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </>
                                            ) : (
                                                <>
                                                    <div className="flex items-center gap-2 text-muted-foreground">
                                                        <span>📞</span> Calls: <span className="font-mono font-bold text-foreground">{closerMetrics.calls_made}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-muted-foreground">
                                                        <span>📋</span> Propostas: <span className="font-mono font-bold text-foreground">{closerMetrics.proposals_sent}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-muted-foreground">
                                                        <span>🎯</span> Vendas: <span className="font-mono font-bold text-foreground">{closerMetrics.sales_closed}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-muted-foreground">
                                                        <span>📈</span> Conversão: <span className="font-mono font-bold text-foreground">{closerMetrics.conversion_rate}%</span>
                                                    </div>
                                                </>
                                            )}
                                        </div>

                                        {/* Evidence summary */}
                                        <div className="pt-2 border-t border-border/50 text-muted-foreground">
                                            {printFiles.length > 0 && (
                                                <p className="flex items-center gap-2">
                                                    <ImageIcon className="w-3.5 h-3.5" /> 1 print do CRM anexado
                                                </p>
                                            )}
                                            {pastedMessages.length > 0 && (
                                                <p className="flex items-center gap-2">
                                                    <ClipboardPaste className="w-3.5 h-3.5" /> {pastedMessages.length} caracteres de mensagens
                                                </p>
                                            )}
                                            {callFile && (
                                                <p className="flex items-center gap-2">
                                                    <Upload className="w-3.5 h-3.5" /> Gravação: {callFile.name}
                                                </p>
                                            )}
                                            {printFiles.length === 0 && pastedMessages.length === 0 && !callFile && (
                                                <p className="text-xs italic">Nenhuma evidência anexada (opcional)</p>
                                            )}
                                        </div>
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
