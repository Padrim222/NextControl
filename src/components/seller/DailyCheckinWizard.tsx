import { useState, useRef } from 'react';
import { Input } from '@/components/ui/input';
import {
    SELLER_METRICS_FIELDS,
    CLOSER_METRICS_FIELDS,
    type SellerType,
    type SellerMetrics,
    type CloserMetrics
} from '@/types';
import {
    Target,
    CheckCircle,
    ArrowRight,
    ArrowLeft,
    Send,
    Upload,
    X,
    Camera,
    Loader2,
    Plus,
    Minus
} from '@/components/ui/icons';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { InstructionBalloon } from '@/components/ui/instruction-balloon';

// ── Design tokens ──────────────────────────────────────────
const T = {
    bg: '#FAFAFA',
    card: '#FFFFFF',
    border: '#E5E7EB',
    primary: '#1B2B4A',
    accent: '#E6B84D',
    textPrimary: '#1A1A1A',
    textSecondary: '#6B7280',
    textMuted: '#9CA3AF',
    inputFocusShadow: '0 0 0 3px rgba(27,43,74,0.08)',
};

const fonts = {
    display: "'Plus Jakarta Sans', system-ui, sans-serif",
    body: "'DM Sans', system-ui, sans-serif",
};

// ── Inline styles ──────────────────────────────────────────
const s = {
    card: {
        background: T.card,
        border: `1px solid ${T.border}`,
        borderRadius: 12,
        boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
        minHeight: 420,
        display: 'flex',
        flexDirection: 'column' as const,
    },
    cardHeader: {
        padding: '24px 24px 0',
    },
    cardContent: {
        padding: '20px 24px',
        flex: 1,
    },
    cardFooter: {
        padding: '0 24px 24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    stepTitle: {
        fontFamily: fonts.display,
        fontSize: 18,
        fontWeight: 600,
        color: T.textPrimary,
        margin: 0,
    },
    stepSubtitle: {
        fontFamily: fonts.body,
        fontSize: 13,
        color: T.textSecondary,
        marginTop: 2,
    },
    label: {
        fontFamily: fonts.body,
        fontSize: 13,
        fontWeight: 500,
        color: T.textPrimary,
        display: 'block',
        marginBottom: 6,
    },
    helpText: {
        fontFamily: fonts.body,
        fontSize: 12,
        color: T.textMuted,
        marginTop: 4,
    },
    inputWrap: {
        display: 'flex',
        alignItems: 'center',
        border: `1px solid ${T.border}`,
        borderRadius: 8,
        background: T.card,
        overflow: 'hidden',
    },
    numericInput: {
        border: 'none',
        outline: 'none',
        background: 'transparent',
        height: 44,
        flex: 1,
        textAlign: 'center' as const,
        fontFamily: fonts.body,
        fontSize: 16,
        fontWeight: 600,
        color: T.textPrimary,
    },
    stepBtn: {
        width: 36,
        height: 44,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#F9FAFB',
        border: 'none',
        cursor: 'pointer',
        color: T.textSecondary,
        transition: 'background 0.15s',
        flexShrink: 0,
    },
    textarea: {
        width: '100%',
        border: `1px solid ${T.border}`,
        borderRadius: 8,
        background: T.card,
        padding: '10px 12px',
        fontFamily: fonts.body,
        fontSize: 14,
        color: T.textPrimary,
        resize: 'vertical' as const,
        outline: 'none',
        boxSizing: 'border-box' as const,
        minHeight: 120,
        transition: 'border-color 0.15s, box-shadow 0.15s',
    },
    btnPrimary: {
        background: T.primary,
        color: '#fff',
        border: 'none',
        borderRadius: 8,
        padding: '0 20px',
        height: 40,
        fontFamily: fonts.body,
        fontSize: 14,
        fontWeight: 500,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        transition: 'opacity 0.15s',
    },
    btnGhost: {
        background: 'transparent',
        color: T.textSecondary,
        border: 'none',
        borderRadius: 8,
        padding: '0 16px',
        height: 40,
        fontFamily: fonts.body,
        fontSize: 14,
        fontWeight: 500,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        transition: 'background 0.15s',
    },
    summaryBox: {
        background: '#F9FAFB',
        border: `1px solid ${T.border}`,
        borderRadius: 10,
        padding: '14px 16px',
    },
    iconWrap: {
        width: 36,
        height: 36,
        borderRadius: 8,
        background: 'rgba(27,43,74,0.08)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
    },
};

// ── METRIC_HELP ────────────────────────────────────────────
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

// ── Step indicator ─────────────────────────────────────────
function StepIndicator({ steps, current }: { steps: { title: string }[]; current: number }) {
    return (
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 24 }}>
            {steps.map((step, i) => {
                const done = i < current;
                const active = i === current;
                const future = i > current;
                return (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', flex: i < steps.length - 1 ? 1 : undefined }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                            <div style={{
                                width: 28,
                                height: 28,
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontFamily: fonts.display,
                                fontSize: 12,
                                fontWeight: 700,
                                background: done ? T.accent : active ? T.primary : 'transparent',
                                border: future ? `2px solid ${T.border}` : 'none',
                                color: done ? T.primary : active ? '#fff' : T.textMuted,
                                transition: 'all 0.2s',
                                flexShrink: 0,
                            }}>
                                {done ? '✓' : i + 1}
                            </div>
                            <span style={{
                                fontFamily: fonts.body,
                                fontSize: 10,
                                fontWeight: active ? 600 : 400,
                                color: active ? T.primary : done ? T.textSecondary : T.textMuted,
                                whiteSpace: 'nowrap',
                            }}>
                                {step.title}
                            </span>
                        </div>
                        {i < steps.length - 1 && (
                            <div style={{
                                flex: 1,
                                height: 2,
                                margin: '0 6px',
                                marginBottom: 16,
                                background: done ? T.accent : T.border,
                                borderRadius: 2,
                                transition: 'background 0.3s',
                            }} />
                        )}
                    </div>
                );
            })}
        </div>
    );
}

// ── NumericInput ───────────────────────────────────────────
function NumericInput({
    value,
    onChange,
    min = 0,
    max = 9999,
}: {
    value: number;
    onChange: (v: number) => void;
    min?: number;
    max?: number;
}) {
    const [focused, setFocused] = useState(false);
    return (
        <div style={{
            ...s.inputWrap,
            borderColor: focused ? T.primary : T.border,
            boxShadow: focused ? T.inputFocusShadow : 'none',
            transition: 'border-color 0.15s, box-shadow 0.15s',
        }}>
            <button
                type="button"
                style={s.stepBtn}
                onMouseEnter={e => (e.currentTarget.style.background = '#F3F4F6')}
                onMouseLeave={e => (e.currentTarget.style.background = '#F9FAFB')}
                onClick={() => onChange(Math.max(min, value - 1))}
            >
                <Minus size={14} strokeWidth={1.5} />
            </button>
            <input
                type="number"
                style={s.numericInput}
                value={value}
                min={min}
                max={max}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                onChange={e => onChange(parseInt(e.target.value) || 0)}
            />
            <button
                type="button"
                style={s.stepBtn}
                onMouseEnter={e => (e.currentTarget.style.background = '#F3F4F6')}
                onMouseLeave={e => (e.currentTarget.style.background = '#F9FAFB')}
                onClick={() => onChange(Math.min(max, value + 1))}
            >
                <Plus size={14} strokeWidth={1.5} />
            </button>
        </div>
    );
}

// ── Summary row helper ─────────────────────────────────────
function SummaryRow({ label, value }: { label: string; value: string | number }) {
    return (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontFamily: fonts.body, fontSize: 13, color: T.textSecondary }}>{label}</span>
            <span style={{ fontFamily: fonts.body, fontSize: 13, fontWeight: 600, color: T.textPrimary }}>{value}</span>
        </div>
    );
}

// ── Main component ─────────────────────────────────────────
export default function DailyCheckinWizard({ sellerType, onSuccess }: DailyCheckinWizardProps) {
    const { user } = useAuth();
    const [currentStep, setCurrentStep] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [uploadHover, setUploadHover] = useState(false);

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
                    const { data: uploadResult, error: uploadError } = await (supabase as any).functions.invoke('process-upload', { body: formData });
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
                    const { data: uploadResult, error: uploadError } = await (supabase as any).functions.invoke('process-upload', { body: formData });
                    if (uploadError) throw uploadError;
                    callUrl = uploadResult?.urls?.[0] || null;
                } catch (uploadErr) {
                    console.warn('Call upload fallback:', uploadErr);
                    callUrl = `call_mock_${Date.now()}.mp3`;
                }
            }

            // 3. Prepare submission
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

            toast.success('Submissão enviada com sucesso!');

            // 5. Trigger AI
            if (supabase && submissionId) {
                (supabase as any).functions.invoke('analyze-submission', {
                    body: { submission_id: submissionId },
                }).then(({ data }: any) => {
                    if (data?.score !== undefined) {
                        toast.success(`Análise IA pronta! Score: ${data.score}/100`);
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

    const steps = [
        { id: 'metrics', title: 'Métricas', description: 'Registre seus números do dia', icon: Target },
        {
            id: 'evidence',
            title: sellerType === 'seller' ? 'Evidências' : 'Gravação',
            description: sellerType === 'seller' ? 'Upload de até 5 prints' : 'Upload da melhor call',
            icon: Upload,
        },
        { id: 'notes', title: 'Resumo', description: 'Observações finais e envio', icon: CheckCircle },
    ];

    const CurrentIcon = steps[currentStep].icon;

    return (
        <div style={{ maxWidth: 580, margin: '0 auto', fontFamily: fonts.body }}>
            {/* Step indicator */}
            <StepIndicator steps={steps} current={currentStep} />

            <AnimatePresence mode="wait">
                <motion.div
                    key={currentStep}
                    initial={{ opacity: 0, x: 12 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -12 }}
                    transition={{ duration: 0.18 }}
                >
                    <div style={s.card}>

                        {/* Card Header */}
                        <div style={s.cardHeader}>
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 12,
                                paddingBottom: 20,
                                borderBottom: `1px solid ${T.border}`,
                            }}>
                                <div style={s.iconWrap}>
                                    <CurrentIcon size={18} color={T.primary} strokeWidth={1.5} />
                                </div>
                                <div>
                                    <h2 style={s.stepTitle}>{steps[currentStep].title}</h2>
                                    <p style={s.stepSubtitle}>{steps[currentStep].description}</p>
                                </div>
                            </div>
                        </div>

                        {/* Card Body */}
                        <div style={s.cardContent}>

                            {/* ── STEP 1: METRICS ─────────────────────── */}
                            {currentStep === 0 && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                                    {metricsFields.map((field) => {
                                        const rawVal = sellerType === 'seller'
                                            ? (sellerMetrics[field.key as keyof SellerMetrics] as number)
                                            : (closerMetrics[field.key as keyof CloserMetrics] as number);
                                        const numVal = typeof rawVal === 'number' ? rawVal : 0;
                                        return (
                                            <div key={field.key}>
                                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                                                    <label style={s.label}>
                                                        <span style={{ marginRight: 6 }}>{field.emoji}</span>
                                                        {field.label}
                                                    </label>
                                                    <InstructionBalloon title={field.label} side="left">
                                                        {METRIC_HELP[field.key] || 'Registre este número com atenção.'}
                                                    </InstructionBalloon>
                                                </div>
                                                <NumericInput
                                                    value={numVal}
                                                    onChange={(val) => {
                                                        if (sellerType === 'seller') {
                                                            setSellerMetrics((prev: SellerMetrics) => ({ ...prev, [field.key]: val }));
                                                        } else {
                                                            setCloserMetrics((prev: CloserMetrics) => ({ ...prev, [field.key]: val }));
                                                        }
                                                    }}
                                                />
                                                {METRIC_HELP[field.key] && (
                                                    <p style={s.helpText}>{METRIC_HELP[field.key]}</p>
                                                )}
                                            </div>
                                        );
                                    })}

                                    {sellerType === 'closer' && (
                                        <div>
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                                                <label style={s.label}>Principais Objeções</label>
                                                <InstructionBalloon title="Objeções" side="left">
                                                    Liste os motivos de "Não" mais comuns hoje. A IA vai usar isso para sugerir contornos.
                                                </InstructionBalloon>
                                            </div>
                                            <textarea
                                                style={s.textarea}
                                                value={objectionsText}
                                                onChange={e => setObjectionsText(e.target.value)}
                                                placeholder="Liste as principais objeções (uma por linha)"
                                                rows={4}
                                                onFocus={e => {
                                                    e.currentTarget.style.borderColor = T.primary;
                                                    e.currentTarget.style.boxShadow = T.inputFocusShadow;
                                                }}
                                                onBlur={e => {
                                                    e.currentTarget.style.borderColor = T.border;
                                                    e.currentTarget.style.boxShadow = 'none';
                                                }}
                                            />
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* ── STEP 2: EVIDENCE ────────────────────── */}
                            {currentStep === 1 && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <span style={{ ...s.label, marginBottom: 0 }}>
                                            {sellerType === 'seller' ? 'Prints de Conversa' : 'Gravação da Call'}
                                        </span>
                                        <InstructionBalloon title="Evidências" side="left">
                                            {sellerType === 'seller'
                                                ? 'Anexe prints de boas abordagens ou objeções difíceis. A IA vai analisar sua técnica.'
                                                : 'Suba o áudio da sua melhor (ou pior) call. A IA vai analisar seu SPIN Selling.'}
                                        </InstructionBalloon>
                                    </div>

                                    {sellerType === 'seller' ? (
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
                                            {printPreviews.map((preview, i) => (
                                                <div key={i} style={{
                                                    position: 'relative',
                                                    aspectRatio: '9/16',
                                                    background: '#111',
                                                    borderRadius: 10,
                                                    overflow: 'hidden',
                                                    border: `1px solid ${T.border}`,
                                                }}>
                                                    <img src={preview} alt="Print" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                    <button
                                                        onClick={() => removePrint(i)}
                                                        style={{
                                                            position: 'absolute', top: 8, right: 8,
                                                            width: 26, height: 26, borderRadius: '50%',
                                                            background: 'rgba(0,0,0,0.55)', border: 'none',
                                                            color: '#fff', cursor: 'pointer',
                                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        }}
                                                    >
                                                        <X size={13} strokeWidth={1.5} />
                                                    </button>
                                                </div>
                                            ))}
                                            {printPreviews.length < MAX_PRINTS && (
                                                <button
                                                    onClick={() => fileInputRef.current?.click()}
                                                    style={{
                                                        aspectRatio: '9/16',
                                                        borderRadius: 10,
                                                        border: `2px dashed ${T.border}`,
                                                        background: 'transparent',
                                                        display: 'flex',
                                                        flexDirection: 'column',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        gap: 8,
                                                        cursor: 'pointer',
                                                        color: T.textMuted,
                                                        fontFamily: fonts.body,
                                                        transition: 'border-color 0.2s, color 0.2s',
                                                    }}
                                                    onMouseEnter={e => {
                                                        e.currentTarget.style.borderColor = T.primary;
                                                        e.currentTarget.style.color = T.primary;
                                                    }}
                                                    onMouseLeave={e => {
                                                        e.currentTarget.style.borderColor = T.border;
                                                        e.currentTarget.style.color = T.textMuted;
                                                    }}
                                                >
                                                    <Camera size={24} strokeWidth={1.5} />
                                                    <span style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                                        Adicionar Print
                                                    </span>
                                                </button>
                                            )}
                                        </div>
                                    ) : (
                                        <div
                                            style={{
                                                border: `2px dashed ${uploadHover ? T.primary : T.border}`,
                                                borderRadius: 12,
                                                display: 'flex',
                                                flexDirection: 'column',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                padding: '32px 24px',
                                                cursor: 'pointer',
                                                transition: 'border-color 0.2s, background 0.2s',
                                                background: uploadHover ? 'rgba(10,61,44,0.02)' : 'transparent',
                                                gap: 8,
                                            }}
                                            onMouseEnter={() => setUploadHover(true)}
                                            onMouseLeave={() => setUploadHover(false)}
                                            onClick={() => {
                                                if (!callFile) {
                                                    const input = document.createElement('input');
                                                    input.type = 'file';
                                                    input.accept = 'audio/*,video/*';
                                                    input.onchange = (e) => {
                                                        const f = (e.target as HTMLInputElement).files?.[0];
                                                        if (f) setCallFile(f);
                                                    };
                                                    input.click();
                                                }
                                            }}
                                        >
                                            <Upload size={32} color={uploadHover ? T.primary : T.textMuted} strokeWidth={1.5} />
                                            {callFile ? (
                                                <div style={{ textAlign: 'center' }}>
                                                    <p style={{ fontFamily: fonts.body, fontSize: 14, fontWeight: 500, color: T.primary, margin: 0 }}>
                                                        {callFile.name}
                                                    </p>
                                                    <button
                                                        onClick={e => { e.stopPropagation(); setCallFile(null); }}
                                                        style={{ ...s.btnGhost, color: '#EF4444', margin: '8px auto 0', fontSize: 13 }}
                                                    >
                                                        Remover Arquivo
                                                    </button>
                                                </div>
                                            ) : (
                                                <>
                                                    <p style={{ fontFamily: fonts.body, fontSize: 14, fontWeight: 500, color: T.textPrimary, margin: 0 }}>
                                                        Arraste ou clique para enviar
                                                    </p>
                                                    <p style={{ fontFamily: fonts.body, fontSize: 12, color: T.textMuted, margin: 0, textAlign: 'center' }}>
                                                        Gravação da call (MP3, MP4, WAV)
                                                    </p>
                                                    <div style={{
                                                        marginTop: 8,
                                                        background: T.primary,
                                                        color: '#fff',
                                                        borderRadius: 8,
                                                        padding: '8px 18px',
                                                        fontSize: 13,
                                                        fontFamily: fonts.body,
                                                        fontWeight: 500,
                                                    }}>
                                                        Selecionar Arquivo
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    )}

                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/*"
                                        multiple
                                        style={{ display: 'none' }}
                                        onChange={handleFileSelect}
                                    />

                                    <p style={{ ...s.helpText, textAlign: 'center' }}>
                                        {sellerType === 'seller'
                                            ? 'Envie conversas reais para análise da IA.'
                                            : 'Sua gravação será transcrita e analisada.'}
                                    </p>
                                </div>
                            )}

                            {/* ── STEP 3: NOTES ───────────────────────── */}
                            {currentStep === 2 && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                    <div>
                                        <label style={s.label}>Observações Gerais</label>
                                        <textarea
                                            style={{ ...s.textarea, minHeight: 150 }}
                                            value={notes}
                                            onChange={e => setNotes(e.target.value)}
                                            placeholder="Destaques do dia, dificuldades, insights..."
                                            onFocus={e => {
                                                e.currentTarget.style.borderColor = T.primary;
                                                e.currentTarget.style.boxShadow = T.inputFocusShadow;
                                            }}
                                            onBlur={e => {
                                                e.currentTarget.style.borderColor = T.border;
                                                e.currentTarget.style.boxShadow = 'none';
                                            }}
                                        />
                                    </div>

                                    <div style={s.summaryBox}>
                                        <p style={{
                                            fontFamily: fonts.body,
                                            fontSize: 11,
                                            fontWeight: 600,
                                            color: T.textSecondary,
                                            marginBottom: 10,
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.06em',
                                        }}>
                                            Resumo do envio
                                        </p>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                            {sellerType === 'seller' ? (
                                                <>
                                                    <SummaryRow label="Abordagens" value={sellerMetrics.approaches} />
                                                    <SummaryRow label="Vendas" value={sellerMetrics.sales} />
                                                    <SummaryRow label="Prints" value={printFiles.length} />
                                                </>
                                            ) : (
                                                <>
                                                    <SummaryRow label="Calls" value={closerMetrics.calls_made} />
                                                    <SummaryRow label="Propostas" value={closerMetrics.proposals_sent} />
                                                    <SummaryRow label="Vendas" value={closerMetrics.sales_closed} />
                                                    <SummaryRow label="Conversão" value={`${closerMetrics.conversion_rate}%`} />
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Card Footer */}
                        <div style={s.cardFooter}>
                            <button
                                style={{
                                    ...s.btnGhost,
                                    visibility: currentStep === 0 ? 'hidden' : 'visible',
                                    opacity: isSubmitting ? 0.5 : 1,
                                }}
                                onClick={handleBack}
                                disabled={currentStep === 0 || isSubmitting}
                                onMouseEnter={e => (e.currentTarget.style.background = '#F3F4F6')}
                                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                            >
                                <ArrowLeft size={15} strokeWidth={1.5} /> Voltar
                            </button>

                            {currentStep < steps.length - 1 ? (
                                <button
                                    style={s.btnPrimary}
                                    onClick={handleNext}
                                    onMouseEnter={e => (e.currentTarget.style.opacity = '0.9')}
                                    onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
                                >
                                    Próximo <ArrowRight size={15} strokeWidth={1.5} />
                                </button>
                            ) : (
                                <button
                                    style={{ ...s.btnPrimary, opacity: isSubmitting ? 0.7 : 1 }}
                                    onClick={handleSubmit}
                                    disabled={isSubmitting}
                                    onMouseEnter={e => { if (!isSubmitting) e.currentTarget.style.opacity = '0.9'; }}
                                    onMouseLeave={e => (e.currentTarget.style.opacity = isSubmitting ? '0.7' : '1')}
                                >
                                    {isSubmitting
                                        ? <Loader2 size={15} className="animate-spin" />
                                        : <><Send size={15} strokeWidth={1.5} /> Enviar</>
                                    }
                                </button>
                            )}
                        </div>
                    </div>
                </motion.div>
            </AnimatePresence>
        </div>
    );
}
