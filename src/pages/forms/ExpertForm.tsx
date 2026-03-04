import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PublicFormLayout } from '@/components/forms/PublicFormLayout';
import { FormIdentification } from '@/components/forms/FormIdentification';
import { FormWizard } from '@/components/forms/FormWizard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { toast } from 'sonner';
import { submitPublicForm, triggerFormAnalysis } from '@/lib/formSubmission';
import {
    LEAD_RANGES,
    CHANNEL_OPTIONS,
    VOLUME_STATUS_OPTIONS,
    QUALITY_OPTIONS,
    BOTTLENECK_OPTIONS,
} from '@/types/forms';
import type { ExpertWeeklyData } from '@/types/forms';
import { BarChart3, Crosshair, Megaphone, CheckCircle, Compass, Shield } from 'lucide-react';

const STEPS = [
    { id: 'identify', title: 'Identificação', emoji: '👤' },
    { id: 'strategy_base', title: 'Fase & Modelo', emoji: '🚀' },
    { id: 'numbers', title: 'Bloco 1: Números', emoji: '📊' },
    { id: 'funnel', title: 'Bloco 2: Funil', emoji: '🎯' },
    { id: 'positioning', title: 'Bloco 3: Posição', emoji: '📢' },
    { id: 'decision', title: 'Decisão', emoji: '💡' },
    { id: 'summary', title: 'Envio', emoji: '✅' },
];

const COMPANY_PHASES = [
    { value: 'validation', label: 'Validação', desc: 'Provando a oferta' },
    { value: 'traction', label: 'Tração', desc: 'Escalando aquisição' },
    { value: 'scale', label: 'Escala', desc: 'Maximizando volume' },
    { value: 'optimization', label: 'Otimização', desc: 'Melhorando margem' },
] as const;

export default function ExpertForm() {
    const navigate = useNavigate();
    const [currentStep, setCurrentStep] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Identity
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');

    // Form data
    const [data, setData] = useState<ExpertWeeklyData>({
        company_phase: 'traction',
        formula_x: '',
        leads_range: '0-10',
        opportunities_opened: 0,
        sales_closed: 0,
        revenue: 0,
        top_channel: 'inbound_organic',
        lead_volume_status: 'expected',
        lead_quality: 'medium',
        bottleneck: 'acquisition',
        content_generated_leads: false,
        content_problems: '',
        brand_clarity_score: 5,
        strategic_notes: '',
    });

    const updateData = <K extends keyof ExpertWeeklyData>(key: K, value: ExpertWeeklyData[K]) => {
        setData((prev) => ({ ...prev, [key]: value }));
    };

    const handleIdentityChange = (field: 'name' | 'email' | 'phone', value: string) => {
        if (field === 'name') setName(value);
        else if (field === 'email') setEmail(value);
        else setPhone(value);
    };

    const isStep0Valid = name.trim().length > 0;
    const isStep1Valid = !!data.company_phase;
    const isStep2Valid = data.opportunities_opened !== null && data.sales_closed !== null && data.revenue !== null;
    const isStep3Valid = data.lead_volume_status !== null && data.lead_quality !== null && data.bottleneck !== null;
    const isStep4Valid = data.brand_clarity_score !== null;
    const isStep5Valid = data.strategic_notes.trim().length > 0;

    let canProceed = false;
    if (currentStep === 0) canProceed = isStep0Valid;
    else if (currentStep === 1) canProceed = isStep1Valid;
    else if (currentStep === 2) canProceed = isStep2Valid;
    else if (currentStep === 3) canProceed = isStep3Valid;
    else if (currentStep === 4) canProceed = isStep4Valid;
    else if (currentStep === 5) canProceed = isStep5Valid;
    else canProceed = true;

    const handleSubmit = async () => {
        if (!name.trim()) {
            toast.error('Nome é obrigatório.');
            return;
        }
        setIsSubmitting(true);
        try {
            const result = await submitPublicForm({
                formType: 'expert_weekly',
                submitterName: name,
                submitterEmail: email || undefined,
                submitterPhone: phone || undefined,
                data,
            });

            if (result?.id) {
                triggerFormAnalysis(result.id, 'expert_weekly');
            }

            toast.success('Relatório enviado com sucesso! 🎯');
            navigate('/form/success?type=expert_weekly');
        } catch (error) {
            console.error('Submit error:', error);
            toast.error('Erro ao enviar. Tente novamente.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <PublicFormLayout formType="expert_weekly">
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
                    <FormIdentification
                        name={name}
                        email={email}
                        phone={phone}
                        onChange={handleIdentityChange}
                    />
                )}

                {/* Step 1: Strategy Base */}
                {currentStep === 1 && (
                    <Card className="nc-card-border bg-card">
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Shield className="h-5 w-5 text-solar" />
                                Fase & Modelo de Negócio
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-5">
                            <div className="space-y-2">
                                <Label>Fase atual da sua empresa</Label>
                                <RadioGroup
                                    value={data.company_phase}
                                    onValueChange={(v) => updateData('company_phase', v as ExpertWeeklyData['company_phase'])}
                                    className="grid grid-cols-1 gap-2"
                                >
                                    {COMPANY_PHASES.map((ph) => (
                                        <Label
                                            key={ph.value}
                                            htmlFor={`ph-${ph.value}`}
                                            className={`flex flex-col gap-1 p-3 rounded-lg border cursor-pointer transition-all ${data.company_phase === ph.value
                                                ? 'border-primary bg-primary/10'
                                                : 'border-border hover:border-primary/40'
                                                }`}
                                        >
                                            <div className="flex items-center gap-2">
                                                <RadioGroupItem value={ph.value} id={`ph-${ph.value}`} />
                                                <span className="font-bold">{ph.label}</span>
                                            </div>
                                            <span className="text-xs text-muted-foreground ml-6">{ph.desc}</span>
                                        </Label>
                                    ))}
                                </RadioGroup>
                            </div>

                            <div className="space-y-2">
                                <Label>Fórmula X (Opcional)</Label>
                                <Input
                                    value={data.formula_x}
                                    onChange={(e) => updateData('formula_x', e.target.value)}
                                    placeholder="Ex: Aquisição + Conversão = ROI"
                                    className="h-12 font-mono nc-input-glow"
                                />
                                <p className="text-[10px] text-muted-foreground">Defina a métrica core ou o modelo de crescimento atual.</p>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Step 2: Numbers (Bloco 1) */}
                {currentStep === 2 && (
                    <Card className="nc-card-border bg-card">
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <BarChart3 className="h-5 w-5 text-solar" />
                                Bloco 1: Números da Semana
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-5">
                            <div className="space-y-2">
                                <Label>Leads gerados desde o último formulário</Label>
                                <RadioGroup
                                    value={data.leads_range}
                                    onValueChange={(v) => updateData('leads_range', v as ExpertWeeklyData['leads_range'])}
                                    className="grid grid-cols-2 gap-2"
                                >
                                    {LEAD_RANGES.map((r) => (
                                        <Label
                                            key={r.value}
                                            htmlFor={`leads-${r.value}`}
                                            className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-all ${data.leads_range === r.value
                                                ? 'border-primary bg-primary/10'
                                                : 'border-border hover:border-primary/40'
                                                }`}
                                        >
                                            <RadioGroupItem value={r.value} id={`leads-${r.value}`} />
                                            {r.label}
                                        </Label>
                                    ))}
                                </RadioGroup>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Oportunidades abertas</Label>
                                    <Input
                                        type="number"
                                        min={0}
                                        value={data.opportunities_opened === null ? '' : data.opportunities_opened}
                                        onChange={(e) => updateData('opportunities_opened', e.target.value === '' ? null as any : parseInt(e.target.value))}
                                        className="h-12 font-mono nc-input-glow"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Vendas fechadas</Label>
                                    <Input
                                        type="number"
                                        min={0}
                                        value={data.sales_closed === null ? '' : data.sales_closed}
                                        onChange={(e) => updateData('sales_closed', e.target.value === '' ? null as any : parseInt(e.target.value))}
                                        className="h-12 font-mono nc-input-glow"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Faturamento gerado (R$)</Label>
                                <Input
                                    type="number"
                                    min={0}
                                    step={100}
                                    value={data.revenue === null ? '' : data.revenue}
                                    onChange={(e) => updateData('revenue', e.target.value === '' ? null as any : parseFloat(e.target.value))}
                                    className="h-12 font-mono nc-input-glow"
                                    placeholder="0.00"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>Canal que gerou mais oportunidades</Label>
                                <RadioGroup
                                    value={data.top_channel}
                                    onValueChange={(v) => updateData('top_channel', v as ExpertWeeklyData['top_channel'])}
                                    className="space-y-2"
                                >
                                    {CHANNEL_OPTIONS.map((opt) => (
                                        <Label
                                            key={opt.value}
                                            htmlFor={`ch-${opt.value}`}
                                            className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-all ${data.top_channel === opt.value
                                                ? 'border-primary bg-primary/10'
                                                : 'border-border hover:border-primary/40'
                                                }`}
                                        >
                                            <RadioGroupItem value={opt.value} id={`ch-${opt.value}`} />
                                            {opt.label}
                                        </Label>
                                    ))}
                                </RadioGroup>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Step 3: Funnel (Bloco 2) */}
                {currentStep === 3 && (
                    <Card className="nc-card-border bg-card">
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Crosshair className="h-5 w-5 text-solar" />
                                Bloco 2: Funil e Demanda
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-5">
                            <div className="space-y-2">
                                <Label>Volume de leads está...</Label>
                                <RadioGroup
                                    value={data.lead_volume_status}
                                    onValueChange={(v) => updateData('lead_volume_status', v as ExpertWeeklyData['lead_volume_status'])}
                                    className="space-y-2"
                                >
                                    {VOLUME_STATUS_OPTIONS.map((opt) => (
                                        <Label
                                            key={opt.value}
                                            htmlFor={`vol-${opt.value}`}
                                            className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-all ${data.lead_volume_status === opt.value
                                                ? 'border-primary bg-primary/10'
                                                : 'border-border hover:border-primary/40'
                                                }`}
                                        >
                                            <RadioGroupItem value={opt.value} id={`vol-${opt.value}`} />
                                            {opt.label}
                                        </Label>
                                    ))}
                                </RadioGroup>
                            </div>

                            <div className="space-y-2">
                                <Label>Qualidade dos leads</Label>
                                <RadioGroup
                                    value={data.lead_quality}
                                    onValueChange={(v) => updateData('lead_quality', v as ExpertWeeklyData['lead_quality'])}
                                    className="grid grid-cols-3 gap-2"
                                >
                                    {QUALITY_OPTIONS.map((opt) => (
                                        <Label
                                            key={opt.value}
                                            htmlFor={`qual-${opt.value}`}
                                            className={`flex items-center justify-center gap-1.5 p-3 rounded-lg border cursor-pointer transition-all text-center ${data.lead_quality === opt.value
                                                ? 'border-primary bg-primary/10'
                                                : 'border-border hover:border-primary/40'
                                                }`}
                                        >
                                            <RadioGroupItem value={opt.value} id={`qual-${opt.value}`} />
                                            {opt.label}
                                        </Label>
                                    ))}
                                </RadioGroup>
                            </div>

                            <div className="space-y-2">
                                <Label>Gargalo principal hoje</Label>
                                <RadioGroup
                                    value={data.bottleneck}
                                    onValueChange={(v) => updateData('bottleneck', v as ExpertWeeklyData['bottleneck'])}
                                    className="space-y-2"
                                >
                                    {BOTTLENECK_OPTIONS.map((opt) => (
                                        <Label
                                            key={opt.value}
                                            htmlFor={`bn-${opt.value}`}
                                            className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-all ${data.bottleneck === opt.value
                                                ? 'border-primary bg-primary/10'
                                                : 'border-border hover:border-primary/40'
                                                }`}
                                        >
                                            <RadioGroupItem value={opt.value} id={`bn-${opt.value}`} />
                                            {opt.label}
                                        </Label>
                                    ))}
                                </RadioGroup>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Step 4: Positioning (Bloco 3) */}
                {currentStep === 4 && (
                    <Card className="nc-card-border bg-card">
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Megaphone className="h-5 w-5 text-solar" />
                                Bloco 3: Posicionamento
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-5">
                            <div className="flex items-center justify-between p-3 rounded-lg border border-border">
                                <Label htmlFor="content-leads">O conteúdo gerou leads esta semana?</Label>
                                <Switch
                                    id="content-leads"
                                    checked={data.content_generated_leads}
                                    onCheckedChange={(v) => updateData('content_generated_leads', v)}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>Problemas identificados no conteúdo</Label>
                                <Textarea
                                    value={data.content_problems}
                                    onChange={(e) => updateData('content_problems', e.target.value)}
                                    placeholder="Descreva problemas de frequência, engajamento, posicionamento..."
                                    className="min-h-[100px] nc-input-glow"
                                />
                            </div>

                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <Label>Clareza da marca (0–10)</Label>
                                    <span className="text-2xl font-mono font-bold text-primary">
                                        {data.brand_clarity_score}
                                    </span>
                                </div>
                                <Slider
                                    value={[data.brand_clarity_score]}
                                    onValueChange={([v]) => updateData('brand_clarity_score', v)}
                                    min={0}
                                    max={10}
                                    step={1}
                                    className="w-full"
                                />
                                <div className="flex justify-between text-xs text-muted-foreground">
                                    <span>Confuso</span>
                                    <span>Cristalino</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Step 5: Strategic Decision */}
                {currentStep === 5 && (
                    <Card className="nc-card-border bg-card">
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Compass className="h-5 w-5 text-solar" />
                                Decisão Estratégica
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-5">
                            <div className="space-y-2">
                                <Label>Notas de Decisão Estratégica</Label>
                                <Textarea
                                    value={data.strategic_notes}
                                    onChange={(e) => updateData('strategic_notes', e.target.value)}
                                    placeholder="O que você decide fazer a partir desta análise? Quais os próximos passos?"
                                    className="min-h-[200px] nc-input-glow"
                                />
                                <p className="text-xs text-muted-foreground italic">
                                    Essa é a parte mais importante para o seu Coach te orientar.
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Step 6: Summary */}
                {currentStep === 6 && (
                    <Card className="nc-card-border bg-card">
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <CheckCircle className="h-5 w-5 text-nc-success" />
                                Resumo do Envio
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3 text-sm">
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="p-3 rounded-lg bg-muted/30">
                                        <p className="text-muted-foreground text-xs uppercase tracking-wider mb-1">Identificação</p>
                                        <p className="font-medium">{name}</p>
                                    </div>
                                    <div className="p-3 rounded-lg bg-muted/30">
                                        <p className="text-muted-foreground text-xs uppercase tracking-wider mb-1">Fase</p>
                                        <p className="font-medium capitalize">{data.company_phase}</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="p-3 rounded-lg bg-muted/30">
                                        <p className="text-muted-foreground text-xs uppercase tracking-wider mb-1">Leads</p>
                                        <p className="font-mono font-bold text-lg">{data.leads_range}</p>
                                    </div>
                                    <div className="p-3 rounded-lg bg-muted/30">
                                        <p className="text-muted-foreground text-xs uppercase tracking-wider mb-1">Faturamento</p>
                                        <p className="font-mono font-bold text-lg">R$ {data.revenue.toLocaleString()}</p>
                                    </div>
                                </div>
                                <div className="p-3 rounded-lg bg-muted/30">
                                    <p className="text-muted-foreground text-xs uppercase tracking-wider mb-1">Decisão Estratégica</p>
                                    <p className="text-xs line-clamp-3">{data.strategic_notes}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </FormWizard>
        </PublicFormLayout>
    );
}
