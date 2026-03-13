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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { submitPublicForm, triggerFormAnalysis, uploadFormFiles } from '@/lib/formSubmission';
import type { CloserDailyData } from '@/types/forms';
import { Phone, Upload, CheckCircle, X as XIcon } from '@/components/ui/icons';

const STEPS = [
    { id: 'identify', title: 'Identificação', emoji: '👤' },
    { id: 'metrics', title: 'Métricas', emoji: '📊' },
    { id: 'recording', title: 'Gravação', emoji: '🎙️' },
    { id: 'summary', title: 'Envio', emoji: '✅' },
];

export default function CloserForm() {
    const navigate = useNavigate();
    const [currentStep, setCurrentStep] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Identity
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');

    // Call file
    const [callFile, setCallFile] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Form data
    const [data, setData] = useState<CloserDailyData>({
        calls_made: 0,
        sales_closed: 0,
        conversion_rate: 0,
        main_objection: '',
        avoidable_loss: false,
        avoidable_loss_reason: '',
        self_score: 5,
        call_recording_url: '',
    });

    const updateData = <K extends keyof CloserDailyData>(key: K, value: CloserDailyData[K]) => {
        setData((prev) => ({ ...prev, [key]: value }));
    };

    const handleIdentityChange = (field: 'name' | 'email' | 'phone', value: string) => {
        if (field === 'name') setName(value);
        else if (field === 'email') setEmail(value);
        else setPhone(value);
    };

    const canProceed = currentStep === 0 ? name.trim().length > 0 : true;

    const handleSubmit = async () => {
        if (!name.trim()) { toast.error('Nome é obrigatório.'); return; }
        setIsSubmitting(true);
        try {
            let callUrl = '';
            const attachments: string[] = [];

            if (callFile) {
                try {
                    const urls = await uploadFormFiles([callFile], 'call');
                    callUrl = urls[0] || '';
                    if (callUrl) attachments.push(callUrl);
                } catch {
                    console.warn('Call upload fallback');
                    callUrl = `call_${Date.now()}.mp3`;
                }
            }

            const finalData = { ...data, call_recording_url: callUrl };

            const result = await submitPublicForm({
                formType: 'closer_daily',
                submitterName: name,
                submitterEmail: email || undefined,
                submitterPhone: phone || undefined,
                data: finalData,
                attachments,
            });

            if (result?.id) triggerFormAnalysis(result.id, 'closer_daily');

            toast.success('Check-in enviado com sucesso! 📞');
            navigate('/form/success?type=closer_daily');
        } catch (error) {
            console.error('Submit error:', error);
            toast.error('Erro ao enviar. Tente novamente.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <PublicFormLayout formType="closer_daily">
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
                                <Phone className="h-5 w-5 text-solar" />
                                Métricas do Dia
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <Label className="flex items-center gap-2">
                                        <span className="text-xl">📞</span> Calls realizadas
                                    </Label>
                                    <Input
                                        type="number"
                                        min={0}
                                        value={data.calls_made || ''}
                                        onChange={(e) => updateData('calls_made', parseInt(e.target.value) || 0)}
                                        className="h-12 font-mono nc-input-glow"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="flex items-center gap-2">
                                        <span className="text-xl">🎯</span> Vendas fechadas
                                    </Label>
                                    <Input
                                        type="number"
                                        min={0}
                                        value={data.sales_closed || ''}
                                        onChange={(e) => updateData('sales_closed', parseInt(e.target.value) || 0)}
                                        className="h-12 font-mono nc-input-glow"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <Label className="flex items-center gap-2">
                                    <span className="text-xl">📈</span> Taxa de conversão do dia (%)
                                </Label>
                                <Input
                                    type="number"
                                    min={0}
                                    max={100}
                                    step={0.1}
                                    value={data.conversion_rate || ''}
                                    onChange={(e) => updateData('conversion_rate', parseFloat(e.target.value) || 0)}
                                    className="h-12 font-mono nc-input-glow"
                                    placeholder="Ex: 33.3"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>Principal objeção ou trava</Label>
                                <Textarea
                                    value={data.main_objection}
                                    onChange={(e) => updateData('main_objection', e.target.value)}
                                    placeholder="Qual foi a maior barreira hoje?"
                                    className="nc-input-glow"
                                    rows={2}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>Perdeu alguma venda evitável?</Label>
                                <RadioGroup
                                    value={data.avoidable_loss ? 'yes' : 'no'}
                                    onValueChange={(v) => updateData('avoidable_loss', v === 'yes')}
                                    className="grid grid-cols-2 gap-2"
                                >
                                    <Label
                                        htmlFor="loss-yes"
                                        className={`flex items-center justify-center gap-2 p-3 rounded-lg border cursor-pointer transition-all ${data.avoidable_loss
                                                ? 'border-red-500/50 bg-red-500/10 text-red-400'
                                                : 'border-border hover:border-primary/40'
                                            }`}
                                    >
                                        <RadioGroupItem value="yes" id="loss-yes" />
                                        Sim
                                    </Label>
                                    <Label
                                        htmlFor="loss-no"
                                        className={`flex items-center justify-center gap-2 p-3 rounded-lg border cursor-pointer transition-all ${!data.avoidable_loss
                                                ? 'border-green-500/50 bg-green-500/10 text-green-400'
                                                : 'border-border hover:border-primary/40'
                                            }`}
                                    >
                                        <RadioGroupItem value="no" id="loss-no" />
                                        Não
                                    </Label>
                                </RadioGroup>
                            </div>

                            {data.avoidable_loss && (
                                <div className="space-y-2">
                                    <Label>Por quê?</Label>
                                    <Textarea
                                        value={data.avoidable_loss_reason}
                                        onChange={(e) => updateData('avoidable_loss_reason', e.target.value)}
                                        placeholder="Explique o que poderia ter feito diferente..."
                                        className="nc-input-glow"
                                        rows={2}
                                    />
                                </div>
                            )}

                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <Label>Nota da performance (0–10)</Label>
                                    <span className="text-2xl font-mono font-bold text-primary">{data.self_score}</span>
                                </div>
                                <Slider
                                    value={[data.self_score]}
                                    onValueChange={([v]) => updateData('self_score', v)}
                                    min={0}
                                    max={10}
                                    step={1}
                                />
                                <div className="flex justify-between text-xs text-muted-foreground">
                                    <span>Fraco</span>
                                    <span>Excelente</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Step 2: Recording */}
                {currentStep === 2 && (
                    <Card className="nc-card-border bg-card">
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Upload className="h-5 w-5 text-solar" />
                                Gravação da Call
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-col items-center justify-center min-h-[200px] border-2 border-dashed border-muted-foreground/25 rounded-xl hover:bg-muted/5 transition-all p-6">
                                {callFile ? (
                                    <div className="text-center space-y-3">
                                        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                                            <Phone className="w-8 h-8 text-primary" />
                                        </div>
                                        <p className="font-medium text-primary">{callFile.name}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {(callFile.size / 1024 / 1024).toFixed(1)} MB
                                        </p>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setCallFile(null)}
                                            className="text-red-400 hover:text-red-300"
                                        >
                                            <XIcon className="w-3.5 h-3.5 mr-1" /> Remover
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="text-center space-y-3">
                                        <Upload className="w-12 h-12 text-muted-foreground mx-auto" />
                                        <div>
                                            <p className="font-medium">Arraste ou clique para enviar</p>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                MP3, MP4, WAV — Será transcrita e analisada pela IA
                                            </p>
                                        </div>
                                        <Button
                                            variant="outline"
                                            onClick={() => {
                                                const input = document.createElement('input');
                                                input.type = 'file';
                                                input.accept = 'audio/*,video/*';
                                                input.onchange = (e) => {
                                                    const f = (e.target as HTMLInputElement).files?.[0];
                                                    if (f) setCallFile(f);
                                                };
                                                input.click();
                                            }}
                                        >
                                            Selecionar Arquivo
                                        </Button>
                                    </div>
                                )}
                            </div>
                            <p className="text-xs text-muted-foreground text-center mt-4">
                                Opcional: suba a gravação da sua melhor call do dia.
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
                                <div className="grid grid-cols-3 gap-3">
                                    <div className="p-3 rounded-lg bg-muted/30">
                                        <p className="text-muted-foreground text-xs uppercase tracking-wider mb-1">Calls</p>
                                        <p className="font-mono font-bold text-lg">{data.calls_made}</p>
                                    </div>
                                    <div className="p-3 rounded-lg bg-muted/30">
                                        <p className="text-muted-foreground text-xs uppercase tracking-wider mb-1">Vendas</p>
                                        <p className="font-mono font-bold text-lg">{data.sales_closed}</p>
                                    </div>
                                    <div className="p-3 rounded-lg bg-muted/30">
                                        <p className="text-muted-foreground text-xs uppercase tracking-wider mb-1">Conversão</p>
                                        <p className="font-mono font-bold text-lg">{data.conversion_rate}%</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="p-3 rounded-lg bg-muted/30">
                                        <p className="text-muted-foreground text-xs uppercase tracking-wider mb-1">Nota</p>
                                        <p className="font-mono font-bold text-lg">{data.self_score}/10</p>
                                    </div>
                                    <div className="p-3 rounded-lg bg-muted/30">
                                        <p className="text-muted-foreground text-xs uppercase tracking-wider mb-1">Call</p>
                                        <p className="font-mono font-bold text-lg">{callFile ? '✅' : '—'}</p>
                                    </div>
                                </div>
                                {data.avoidable_loss && (
                                    <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                                        <p className="text-red-400 text-xs uppercase tracking-wider mb-1">⚠️ Venda Evitável</p>
                                        <p className="text-sm">{data.avoidable_loss_reason || 'Não explicou'}</p>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                )}
            </FormWizard>
        </PublicFormLayout>
    );
}
