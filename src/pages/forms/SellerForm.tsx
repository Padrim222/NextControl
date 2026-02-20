import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { PublicFormLayout } from '@/components/forms/PublicFormLayout';
import { FormIdentification } from '@/components/forms/FormIdentification';
import { FormWizard } from '@/components/forms/FormWizard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { toast } from 'sonner';
import { submitPublicForm, triggerFormAnalysis, uploadFormFiles } from '@/lib/formSubmission';
import type { SellerDailyData } from '@/types/forms';
import { MessageSquare, Camera, CheckCircle, X } from 'lucide-react';

const STEPS = [
    { id: 'identify', title: 'Identificação', emoji: '👤' },
    { id: 'metrics', title: 'Métricas', emoji: '📊' },
    { id: 'evidence', title: 'Prints', emoji: '📸' },
    { id: 'summary', title: 'Envio', emoji: '✅' },
];

const MAX_PRINTS = 5;

export default function SellerForm() {
    const navigate = useNavigate();
    const [currentStep, setCurrentStep] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Identity
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');

    // Print files
    const [printPreviews, setPrintPreviews] = useState<string[]>([]);
    const [printFiles, setPrintFiles] = useState<File[]>([]);

    // Form data
    const [data, setData] = useState<SellerDailyData>({
        new_qualified_followers: 0,
        conversations_started: 0,
        conversations_to_opportunity: 0,
        followups_done: 0,
        common_objection: '',
        conversation_quality_score: 5,
        crm_screenshots: [],
    });

    const updateData = <K extends keyof SellerDailyData>(key: K, value: SellerDailyData[K]) => {
        setData((prev) => ({ ...prev, [key]: value }));
    };

    const handleIdentityChange = (field: 'name' | 'email' | 'phone', value: string) => {
        if (field === 'name') setName(value);
        else if (field === 'email') setEmail(value);
        else setPhone(value);
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        const remaining = MAX_PRINTS - printPreviews.length;
        const toAdd = files.slice(0, remaining);

        toAdd.forEach((file) => {
            const reader = new FileReader();
            reader.onload = (ev) => {
                setPrintPreviews((prev) => [...prev, ev.target?.result as string]);
            };
            reader.readAsDataURL(file);
        });
        setPrintFiles((prev) => [...prev, ...toAdd]);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const removePrint = (index: number) => {
        setPrintPreviews((prev) => prev.filter((_, i) => i !== index));
        setPrintFiles((prev) => prev.filter((_, i) => i !== index));
    };

    const canProceed = currentStep === 0 ? name.trim().length > 0 : true;

    const handleSubmit = async () => {
        if (!name.trim()) { toast.error('Nome é obrigatório.'); return; }
        setIsSubmitting(true);
        try {
            let printUrls: string[] = [];
            if (printFiles.length > 0) {
                try {
                    printUrls = await uploadFormFiles(printFiles, 'print');
                } catch {
                    console.warn('Upload fallback');
                    printUrls = printPreviews.map((_, i) => `print_${i}.jpg`);
                }
            }

            const finalData = { ...data, crm_screenshots: printUrls };

            const result = await submitPublicForm({
                formType: 'seller_daily',
                submitterName: name,
                submitterEmail: email || undefined,
                submitterPhone: phone || undefined,
                data: finalData,
                attachments: printUrls,
            });

            if (result?.id) triggerFormAnalysis(result.id, 'seller_daily');

            toast.success('Check-in enviado com sucesso! 💬');
            navigate('/form/success?type=seller_daily');
        } catch (error) {
            console.error('Submit error:', error);
            toast.error('Erro ao enviar. Tente novamente.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const METRIC_FIELDS = [
        { key: 'new_qualified_followers' as const, label: 'Novos seguidores qualificados', emoji: '👥' },
        { key: 'conversations_started' as const, label: 'Conversas iniciadas', emoji: '💬' },
        { key: 'conversations_to_opportunity' as const, label: 'Conversas → Oportunidade', emoji: '🎯' },
        { key: 'followups_done' as const, label: 'Follow-ups feitos', emoji: '🔄' },
    ];

    return (
        <PublicFormLayout formType="seller_daily">
            <FormWizard
                steps={STEPS}
                currentStep={currentStep}
                onNext={() => setCurrentStep((p) => p + 1)}
                onBack={() => setCurrentStep((p) => p - 1)}
                onSubmit={handleSubmit}
                isSubmitting={isSubmitting}
                canProceed={canProceed}
            >
                {/* Step 0: Identification */}
                {currentStep === 0 && (
                    <FormIdentification name={name} email={email} phone={phone} onChange={handleIdentityChange} />
                )}

                {/* Step 1: Metrics */}
                {currentStep === 1 && (
                    <Card className="nc-card-border bg-card">
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <MessageSquare className="h-5 w-5 text-solar" />
                                Métricas do Dia
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {METRIC_FIELDS.map((field) => (
                                <div key={field.key} className="space-y-1.5">
                                    <Label className="flex items-center gap-2">
                                        <span className="text-xl">{field.emoji}</span>
                                        {field.label}
                                    </Label>
                                    <Input
                                        type="number"
                                        min={0}
                                        value={data[field.key] || ''}
                                        onChange={(e) => updateData(field.key, parseInt(e.target.value) || 0)}
                                        className="h-12 font-mono nc-input-glow"
                                    />
                                </div>
                            ))}

                            <div className="space-y-2">
                                <Label>Objeção mais comum hoje</Label>
                                <Textarea
                                    value={data.common_objection}
                                    onChange={(e) => updateData('common_objection', e.target.value)}
                                    placeholder="Qual foi a barreira mais frequente?"
                                    className="nc-input-glow"
                                    rows={2}
                                />
                            </div>

                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <Label>Qualidade das conversas (0–10)</Label>
                                    <span className="text-2xl font-mono font-bold text-primary">
                                        {data.conversation_quality_score}
                                    </span>
                                </div>
                                <Slider
                                    value={[data.conversation_quality_score]}
                                    onValueChange={([v]) => updateData('conversation_quality_score', v)}
                                    min={0}
                                    max={10}
                                    step={1}
                                />
                                <div className="flex justify-between text-xs text-muted-foreground">
                                    <span>Baixa</span>
                                    <span>Excelente</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Step 2: Evidence */}
                {currentStep === 2 && (
                    <Card className="nc-card-border bg-card">
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Camera className="h-5 w-5 text-solar" />
                                Prints do CRM ({printPreviews.length}/{MAX_PRINTS})
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 gap-3">
                                {printPreviews.map((preview, i) => (
                                    <div key={i} className="relative aspect-[9/16] bg-muted rounded-lg overflow-hidden border border-border group">
                                        <img src={preview} alt={`Print ${i + 1}`} className="w-full h-full object-cover" />
                                        <button
                                            onClick={() => removePrint(i)}
                                            className="absolute top-2 right-2 p-1.5 bg-black/60 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <X className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                ))}
                                {printPreviews.length < MAX_PRINTS && (
                                    <button
                                        onClick={() => fileInputRef.current?.click()}
                                        className="aspect-[9/16] rounded-lg border-2 border-dashed border-muted-foreground/25 hover:border-primary/50 flex flex-col items-center justify-center gap-2 text-muted-foreground hover:text-primary transition-all"
                                    >
                                        <Camera className="w-8 h-8" />
                                        <span className="text-xs font-bold uppercase">Adicionar</span>
                                    </button>
                                )}
                            </div>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                multiple
                                className="hidden"
                                onChange={handleFileSelect}
                            />
                            <p className="text-xs text-muted-foreground text-center mt-4">
                                Anexe prints de conversas reais para análise da IA.
                            </p>
                        </CardContent>
                    </Card>
                )}

                {/* Step 3: Summary */}
                {currentStep === 3 && (
                    <Card className="nc-card-border bg-card">
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <CheckCircle className="h-5 w-5 text-nc-success" />
                                Resumo do Envio
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3 text-sm">
                                <div className="p-3 rounded-lg bg-muted/30">
                                    <p className="text-muted-foreground text-xs uppercase tracking-wider mb-1">Identificação</p>
                                    <p className="font-medium">{name}</p>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    {METRIC_FIELDS.map((f) => (
                                        <div key={f.key} className="p-3 rounded-lg bg-muted/30">
                                            <p className="text-muted-foreground text-xs uppercase tracking-wider mb-1">{f.label}</p>
                                            <p className="font-mono font-bold text-lg">{data[f.key]}</p>
                                        </div>
                                    ))}
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="p-3 rounded-lg bg-muted/30">
                                        <p className="text-muted-foreground text-xs uppercase tracking-wider mb-1">Nota Conversas</p>
                                        <p className="font-mono font-bold text-lg">{data.conversation_quality_score}/10</p>
                                    </div>
                                    <div className="p-3 rounded-lg bg-muted/30">
                                        <p className="text-muted-foreground text-xs uppercase tracking-wider mb-1">Prints</p>
                                        <p className="font-mono font-bold text-lg">{printFiles.length}</p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </FormWizard>
        </PublicFormLayout>
    );
}
