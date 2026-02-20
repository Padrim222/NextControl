import { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight, Send, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface FormWizardStep {
    id: string;
    title: string;
    emoji: string;
}

interface FormWizardProps {
    steps: FormWizardStep[];
    currentStep: number;
    onNext: () => void;
    onBack: () => void;
    onSubmit: () => void;
    isSubmitting: boolean;
    canProceed: boolean;
    children: ReactNode;
}

export function FormWizard({
    steps,
    currentStep,
    onNext,
    onBack,
    onSubmit,
    isSubmitting,
    canProceed,
    children,
}: FormWizardProps) {
    const isLastStep = currentStep === steps.length - 1;

    return (
        <div className="space-y-6">
            {/* Progress */}
            <div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <motion.div
                        className="h-full nc-gradient"
                        initial={{ width: 0 }}
                        animate={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
                        transition={{ duration: 0.3 }}
                    />
                </div>
                <div className="flex justify-between mt-2">
                    {steps.map((s, i) => (
                        <span
                            key={s.id}
                            className={`text-xs transition-colors ${i <= currentStep ? 'text-primary font-medium' : 'text-muted-foreground/50'
                                }`}
                        >
                            {s.emoji} {s.title}
                        </span>
                    ))}
                </div>
            </div>

            {/* Step Content */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={currentStep}
                    initial={{ opacity: 0, x: 16 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -16 }}
                    transition={{ duration: 0.2 }}
                >
                    {children}
                </motion.div>
            </AnimatePresence>

            {/* Navigation */}
            <div className="flex justify-between pt-4">
                <Button
                    variant="ghost"
                    onClick={onBack}
                    disabled={currentStep === 0 || isSubmitting}
                    className={currentStep === 0 ? 'invisible' : ''}
                >
                    <ArrowLeft className="w-4 h-4 mr-2" /> Voltar
                </Button>

                {isLastStep ? (
                    <Button
                        onClick={onSubmit}
                        disabled={isSubmitting || !canProceed}
                        className="nc-gradient text-deep-space font-semibold min-w-[140px]"
                    >
                        {isSubmitting ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <>
                                <Send className="w-4 h-4 mr-2" /> Enviar
                            </>
                        )}
                    </Button>
                ) : (
                    <Button
                        onClick={onNext}
                        disabled={!canProceed}
                        className="nc-gradient text-deep-space font-semibold"
                    >
                        Próximo <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                )}
            </div>
        </div>
    );
}
