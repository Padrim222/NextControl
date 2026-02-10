import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FUNNEL_LABELS, type FunnelMetricKey, FUNNEL_METRICS } from '@/types';
import { MessageSquare, Target, CheckCircle, ArrowRight, ArrowLeft, Send } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface DailyCheckinWizardProps {
    onSubmit: (data: Record<string, number | string>) => void;
    isSubmitting: boolean;
}

const STEPS = [
    {
        id: 'engagement',
        title: 'Engajamento Inicial',
        description: 'Como foi o topo do funil hoje?',
        icon: MessageSquare,
        fields: ['chat_ativo', 'boas_vindas', 'reaquecimento'] as FunnelMetricKey[],
    },
    {
        id: 'qualification',
        title: 'Qualificação & Pitch',
        description: 'Quantos leads avançaram?',
        icon: Target,
        fields: ['nutricao', 'conexoes', 'mapeamentos', 'pitchs'] as FunnelMetricKey[],
    },
    {
        id: 'closing',
        title: 'Fechamento & Follow-up',
        description: 'Resultados finais do dia',
        icon: CheckCircle,
        fields: ['capturas', 'followups'] as FunnelMetricKey[],
    },
];

export function DailyCheckinWizard({ onSubmit, isSubmitting }: DailyCheckinWizardProps) {
    const [currentStep, setCurrentStep] = useState(0);
    const [formData, setFormData] = useState<Record<string, number | string>>({});
    const [notes, setNotes] = useState('');

    const handleNext = () => {
        if (currentStep < STEPS.length) {
            setCurrentStep(prev => prev + 1);
        }
    };

    const handleBack = () => {
        if (currentStep > 0) {
            setCurrentStep(prev => prev - 1);
        }
    };

    const handleInputChange = (field: string, value: string) => {
        setFormData(prev => ({
            ...prev,
            [field]: parseInt(value) || 0
        }));
    };

    const handleSubmit = () => {
        onSubmit({ ...formData, notes });
    };

    // Initialize default values
    if (Object.keys(formData).length === 0) {
        const defaults: Record<string, number> = {};
        FUNNEL_METRICS.forEach(key => defaults[key] = 0);
        setFormData(defaults);
    }

    const isLastStep = currentStep === STEPS.length;

    return (
        <div className="max-w-2xl mx-auto">
            {/* Progress Bar */}
            <div className="mb-8 relative">
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <motion.div
                        className="h-full bg-primary"
                        initial={{ width: 0 }}
                        animate={{ width: `${((currentStep + 1) / (STEPS.length + 1)) * 100}%` }}
                        transition={{ duration: 0.3 }}
                    />
                </div>
                <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                    <span>Início</span>
                    <span>Progresso</span>
                    <span>Conclusão</span>
                </div>
            </div>

            <AnimatePresence mode="wait">
                {!isLastStep ? (
                    <motion.div
                        key={currentStep}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.2 }}
                    >
                        <Card className="sf-card-glow border-primary/20">
                            <CardHeader>
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="p-2 rounded-full bg-primary/10">
                                        {(() => {
                                            const Icon = STEPS[currentStep].icon;
                                            return <Icon className="h-6 w-6 text-primary" />;
                                        })()}
                                    </div>
                                    <CardTitle>{STEPS[currentStep].title}</CardTitle>
                                </div>
                                <CardDescription className="text-lg">
                                    {STEPS[currentStep].description}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {STEPS[currentStep].fields.map(field => {
                                    const { label, emoji } = FUNNEL_LABELS[field];
                                    return (
                                        <div key={field} className="space-y-2">
                                            <Label htmlFor={field} className="text-base flex items-center gap-2">
                                                <span className="text-xl">{emoji}</span>
                                                {label}
                                            </Label>
                                            <div className="relative">
                                                <Input
                                                    id={field}
                                                    type="number"
                                                    min="0"
                                                    value={formData[field as string] || 0}
                                                    onChange={(e) => handleInputChange(field, e.target.value)}
                                                    className="pl-4 text-lg h-12 bg-background/50 focus:bg-background transition-colors"
                                                />
                                                <div className="absolute right-3 top-3 flex gap-1">
                                                    <Button
                                                        type="button"
                                                        size="sm"
                                                        variant="ghost"
                                                        className="h-6 w-6 p-0"
                                                        onClick={() => handleInputChange(field, String((formData[field as string] as number || 0) + 1))}
                                                    >
                                                        +
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </CardContent>
                        </Card>
                    </motion.div>
                ) : (
                    <motion.div
                        key="notes"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                    >
                        <Card className="sf-card-glow border-primary/20">
                            <CardHeader>
                                <CardTitle>Observações Finais</CardTitle>
                                <CardDescription>Algo importante para relatar hoje?</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <textarea
                                        className="w-full min-h-[150px] p-4 rounded-md border bg-background resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                                        placeholder="Digite suas observações aqui..."
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Navigation */}
            <div className="flex justify-between mt-6">
                <Button
                    variant="ghost"
                    onClick={handleBack}
                    disabled={currentStep === 0}
                    className={currentStep === 0 ? 'invisible' : ''}
                >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Voltar
                </Button>

                {!isLastStep ? (
                    <Button onClick={handleNext} className="sf-gradient w-32">
                        Próximo
                        <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                ) : (
                    <Button
                        onClick={handleSubmit}
                        className="sf-gradient w-32"
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? 'Enviando...' : 'Finalizar'}
                        <Send className="ml-2 h-4 w-4" />
                    </Button>
                )}
            </div>
        </div>
    );
}
