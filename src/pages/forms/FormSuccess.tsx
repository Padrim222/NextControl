import { useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { CheckCircle, ArrowRight, Sparkles } from 'lucide-react';
import { FORM_CONFIG, type FormType } from '@/types/forms';

export default function FormSuccess() {
    const [searchParams] = useSearchParams();
    const formType = (searchParams.get('type') || 'seller_daily') as FormType;
    const config = FORM_CONFIG[formType];

    return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] as [number, number, number, number] }}
                className="text-center max-w-md w-full space-y-8"
            >
                {/* Success Icon */}
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.5, delay: 0.1, type: 'spring', stiffness: 200 }}
                    className="w-24 h-24 rounded-full nc-gradient flex items-center justify-center mx-auto"
                >
                    <CheckCircle className="h-12 w-12 text-deep-space" />
                </motion.div>

                {/* Title */}
                <div>
                    <h1 className="font-display text-3xl font-bold mb-2">Enviado! 🎉</h1>
                    <p className="text-muted-foreground">
                        Seu <span className="text-primary font-medium">{config.title}</span> foi registrado com sucesso.
                    </p>
                </div>

                {/* AI Processing Notice */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="p-4 rounded-xl border border-primary/20 bg-primary/5"
                >
                    <div className="flex items-center gap-2 mb-2">
                        <Sparkles className="h-4 w-4 text-solar" />
                        <span className="text-sm font-medium">IA Analisando...</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                        Seu envio está sendo processado pela inteligência artificial do Next Control.
                        O feedback estará disponível em breve no dashboard.
                    </p>
                </motion.div>

                {/* Actions */}
                <div className="space-y-3">
                    <Link to={`/form/${formType.replace('_', '-')}`}>
                        <Button variant="outline" className="w-full">
                            <ArrowRight className="w-4 h-4 mr-2" /> Preencher Novamente
                        </Button>
                    </Link>
                </div>

                {/* Footer */}
                <p className="text-xs text-muted-foreground/50">
                    Powered by <span className="nc-gradient-text font-semibold">Next Control</span>
                </p>
            </motion.div>
        </div>
    );
}
