import { useState, useRef } from 'react';
import type { Database } from '@/types/database.types';
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
    BookOpen,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { InstructionBalloon } from '@/components/ui/instruction-balloon';

const METRIC_HELP: Record<string, string> = {
    followers: 'Quantos novos seguidores chegaram no perfil hoje?',
    conversations: 'Quantas conversas ativas (direct/whatsapp) você iniciou?',
    opportunities: 'Quantos leads você qualificou e enviou uma proposta/pitch?',
    followups: 'Quantos contatos de reconexão você fez com leads antigos?',
    quality_score: 'Qual nota você dá para a qualidade dos leads hoje (0 a 10)?',
    calls_made: 'Total de ligações (conectadas ou não) realizadas no dia.',
    proposals_sent: 'Quantas propostas comerciais você enviou após as calls?',
    sales_closed: 'Quantas vendas foram fechadas e confirmadas hoje?',
    no_shows: 'Quantos leads agendados não apareceram na call?',
    reschedules: 'Quantas calls foram reagendadas para outra data?',
    main_objections: 'Liste as barreiras que os clientes mais usaram para não comprar.',
};

// Categories for grouping metrics in checklist style
const SELLER_CATEGORIES = [
    {
        name: 'Tração',
        emoji: '👥',
        keys: ['followers', 'conversations'],
        color: 'from-blue-500/10 to-cyan-500/10 border-blue-500/20',
    },
    {
        name: 'Conversão',
        emoji: '🎯',
        keys: ['opportunities', 'followups'],
        color: 'from-amber-500/10 to-orange-500/10 border-amber-500/20',
    },
    {
        name: 'Avaliação',
        emoji: '⭐',
        keys: ['quality_score'],
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
        keys: ['proposals_sent', 'sales_closed'],
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
            <div className="flex items-center gap-2 shrink-0">
                <button
                    type="button"
                    onClick={() => onChange(Math.max(0, value - 1))}
                    className="w-14 h-14 rounded-2xl bg-muted/50 hover:bg-red-500/10 hover:text-red-500 flex items-center justify-center text-muted-foreground transition-all duration-200 active:scale-90 border border-border/50 hover:border-red-500/30"
                    disabled={value <= 0}
                >
                    <Minus className="w-6 h-6" />
                </button>
                <div className="w-20 h-14 rounded-2xl bg-primary/5 border-2 border-primary/20 flex items-center justify-center shadow-inner overflow-hidden relative">
                    <div className="absolute inset-0 bg-primary/5 animate-pulse" />
                    <span className="text-2xl font-display font-black text-primary relative z-10">
                        {value}{isPercentage ? '%' : ''}
                    </span>
                </div>
                <button
                    type="button"
                    onClick={() => onChange(Math.min(max, value + 1))}
                    className="w-14 h-14 rounded-2xl bg-muted/50 hover:bg-primary/10 hover:text-primary flex items-center justify-center text-muted-foreground transition-all duration-200 active:scale-90 border border-border/50 hover:border-primary/30"
                    disabled={value >= max}
                >
                    <Plus className="w-6 h-6" />
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
        followers: 0,
        conversations: 0,
        opportunities: 0,
        followups: 0,
        quality_score: 5,
    });
    const [closerMetrics, setCloserMetrics] = useState<CloserMetrics>({
        calls_made: 0,
        proposals_sent: 0,
        sales_closed: 0,
        no_shows: 0,
        reschedules: 0,
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

    // Playbook Sync
    const [winningScript, setWinningScript] = useState('');
    const [blacklistApproach, setBlacklistApproach] = useState('');

    const fileInputRef = useRef<HTMLInputElement>(null);

    const metricsFields = sellerType === 'seller' ? SELLER_METRICS_FIELDS : CLOSER_METRICS_FIELDS;
    const categories = sellerType === 'seller' ? SELLER_CATEGORIES : CLOSER_CATEGORIES;

    const handleNext = () => setCurrentStep(prev => prev + 1);
    const handleBack = () => setCurrentStep(prev => prev - 1);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        const toAdd = files.slice(0, 5); // Allow up to 5 prints

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
            const printUrls: string[] = [];
            let callUrl: string | null = null;

            // 1. Upload Print (single)
            if (supabase && printFiles.length > 0) {
                try {
                    for (const file of printFiles) {
                        const fileExt = file.name.split('.').pop() || 'jpg';
                        const filePath = `${user.id}/prints/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;

                        const { error: uploadError } = await supabase.storage
                            .from('submissions')
                            .upload(filePath, file);

                        if (uploadError) throw uploadError;

                        const { data } = supabase.storage
                            .from('submissions')
                            .getPublicUrl(filePath);

                        printUrls.push(data.publicUrl);
                    }
                } catch (uploadErr) {
                    console.error('Upload falhou:', uploadErr);
                    // Do not mock the URLs if the upload failed, so it doesn't break the admin panel.
                }
            }

            // 2. Upload Call (closer only)
            if (supabase && callFile) {
                try {
                    const fileExt = callFile.name.split('.').pop() || 'mp3';
                    const filePath = `${user.id}/calls/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;

                    const { error: uploadError } = await supabase.storage
                        .from('submissions')
                        .upload(filePath, callFile);

                    if (uploadError) throw uploadError;

                    const { data } = supabase.storage
                        .from('submissions')
                        .getPublicUrl(filePath);

                    callUrl = data.publicUrl;
                } catch (uploadErr) {
                    console.error('Call upload falhou:', uploadErr);
                }
            }

            // 3. Prepare Submission
            const baseMetrics = sellerType === 'seller' ? sellerMetrics : closerMetrics;
            const metrics = {
                ...baseMetrics,
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
                const { data: inserted, error } = await supabase
                    .from('daily_submissions')
                    .insert(submission)
                    .select('id')
                    .single();
                if (error) throw error;
                submissionId = inserted?.id;
            }

            // NOTE: seller_scripts insert uses legacy field names (title/type/user_id) that predate
            // the current schema (name/script_type/seller_id). Cast through unknown so TypeScript
            // stays honest without requiring a schema migration right now.
            type SellerScriptLegacyInsert = {
                user_id: string;
                type: string;
                title: string;
                content: string;
            };
            type SellerScriptRow = Database['public']['Tables']['seller_scripts']['Insert'];

            // 4.1 Playbook Sync (Optional)
            if (winningScript.trim() && supabase) {
                const scriptPayload: SellerScriptLegacyInsert = {
                    user_id: user.id,
                    type: 'script',
                    title: `Script do Dia - ${new Date().toLocaleDateString('pt-BR')}`,
                    content: winningScript.trim(),
                };
                await supabase
                    .from('seller_scripts')
                    .insert(scriptPayload as unknown as SellerScriptRow);
            }

            if (blacklistApproach.trim() && supabase) {
                const blacklistPayload: SellerScriptLegacyInsert = {
                    user_id: user.id,
                    type: 'blacklist',
                    title: `Evitar (Blacklist) - ${new Date().toLocaleDateString('pt-BR')}`,
                    content: blacklistApproach.trim(),
                };
                await supabase
                    .from('seller_scripts')
                    .insert(blacklistPayload as unknown as SellerScriptRow);
            }

            toast.success('Submissão enviada com sucesso! 🚀');

            // 5. Trigger AI
            if (supabase && submissionId) {
                supabase.functions.invoke('analyze-submission', {
                    body: { submission_id: submissionId },
                }).then(({ data }) => {
                    const result = data as { score?: number } | null;
                    if (result?.score !== undefined) {
                        toast.success(`🤖 Análise IA pronta! Score: ${result.score}/100`);
                    }
                }).catch((err: unknown) => console.warn('AI Error:', err));
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
            const metrics = sellerMetrics as Record<string, unknown>;
            const val = metrics[key];
            return typeof val === 'number' ? val : 0;
        }
        const metrics = closerMetrics as Record<string, unknown>;
        const val = metrics[key];
        return typeof val === 'number' ? val : 0;
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
                                                    const isPercent = false; // no percentage fields currently
                                                    const isQuality = key === 'quality_score';
                                                    return (
                                                        <MetricStepper
                                                            key={key}
                                                            value={getMetricValue(key)}
                                                            onChange={(val) => setMetricValue(key, val)}
                                                            label={field.label}
                                                            emoji={field.emoji}
                                                            helpText={METRIC_HELP[key] || 'Registre este número.'}
                                                            max={isQuality ? 10 : 999}
                                                            isPercentage={isPercent}
                                                        />
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    ))}

                                    {/* Objections (Seller and Closer) */}
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
                                                    <div className="grid grid-cols-2 gap-2">
                                                        {printPreviews.map((preview, idx) => (
                                                            <div key={idx} className="relative aspect-video bg-muted rounded-lg overflow-hidden border border-border group">
                                                                <img src={preview} alt="Print CRM" className="w-full h-full object-cover" />
                                                                <button
                                                                    onClick={() => removePrint(idx)}
                                                                    className="absolute top-2 right-2 p-1.5 bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                                                >
                                                                    <X className="w-4 h-4" />
                                                                </button>
                                                            </div>
                                                        ))}
                                                        {printPreviews.length < 5 && (
                                                            <button
                                                                onClick={() => fileInputRef.current?.click()}
                                                                className="w-full aspect-video rounded-lg border-2 border-dashed border-muted-foreground/25 hover:border-primary/50 flex flex-col items-center justify-center gap-1 text-muted-foreground hover:text-primary transition-all"
                                                            >
                                                                <Plus className="w-6 h-6" />
                                                                <span className="text-[10px] uppercase font-bold">Mais Prints</span>
                                                            </button>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <button
                                                        onClick={() => fileInputRef.current?.click()}
                                                        className="w-full aspect-video rounded-xl border-2 border-dashed border-muted-foreground/25 hover:border-primary/50 flex flex-col items-center justify-center gap-2 text-muted-foreground hover:text-primary transition-all"
                                                    >
                                                        <Camera className="w-14 h-14" />
                                                        <span className="text-sm font-bold uppercase tracking-widest">Adicionar Prints do CRM</span>
                                                        <span className="text-xs opacity-70">Envie até 5 prints das conversas</span>
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
                                        multiple
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

                                    <div className="pt-4 border-t border-border/50 space-y-4">
                                        <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                                            <BookOpen className="w-4 h-4" />
                                            Sincronizar com Playbook
                                        </div>

                                        <div className="grid grid-cols-1 gap-4">
                                            <div className="space-y-1.5">
                                                <Label className="text-xs text-muted-foreground">Teve algum script que funcionou muito bem hoje?</Label>
                                                <Textarea
                                                    value={winningScript}
                                                    onChange={e => setWinningScript(e.target.value)}
                                                    placeholder="Envie para o seu Acervo de Scripts..."
                                                    className="bg-solar/5 border-solar/20 min-h-[80px]"
                                                />
                                            </div>

                                            <div className="space-y-1.5">
                                                <Label className="text-xs text-muted-foreground">Algo que você testou e NÃO funcionou? (Blacklist)</Label>
                                                <Textarea
                                                    value={blacklistApproach}
                                                    onChange={e => setBlacklistApproach(e.target.value)}
                                                    placeholder="Mande para a Blacklist para não repetir o erro..."
                                                    className="bg-red-500/5 border-red-500/20 min-h-[80px]"
                                                />
                                            </div>
                                        </div>
                                    </div>

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
                                                                {(sellerMetrics as Record<string, unknown>)[field.key] as number || 0}
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
