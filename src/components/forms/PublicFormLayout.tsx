import { ReactNode } from 'react';
import { Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import type { FormType } from '@/types/forms';
import { FORM_CONFIG } from '@/types/forms';

interface PublicFormLayoutProps {
    formType: FormType;
    children: ReactNode;
}

export function PublicFormLayout({ formType, children }: PublicFormLayoutProps) {
    const config = FORM_CONFIG[formType];

    return (
        <div className="min-h-screen bg-background flex flex-col">
            {/* Header */}
            <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-10">
                <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-md nc-gradient flex items-center justify-center">
                        <Sparkles className="h-4 w-4 text-deep-space" />
                    </div>
                    <div>
                        <span className="text-sm font-display font-bold nc-gradient-text">
                            Next Control
                        </span>
                        <span className="text-xs text-muted-foreground ml-2">
                            {config.frequency}
                        </span>
                    </div>
                </div>
            </header>

            {/* Form Header */}
            <div className="max-w-2xl mx-auto w-full px-4 pt-8 pb-4">
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="text-center"
                >
                    <span className="text-4xl mb-3 block">{config.emoji}</span>
                    <h1 className="font-display text-2xl font-bold mb-1">{config.title}</h1>
                    <p className="text-muted-foreground text-sm">{config.subtitle}</p>
                    <p className="text-xs text-muted-foreground/60 mt-2">
                        ⏱ Tempo estimado: {config.estimatedTime}
                    </p>
                </motion.div>
            </div>

            {/* Content */}
            <main className="flex-1 max-w-2xl mx-auto w-full px-4 pb-12">
                {children}
            </main>

            {/* Footer */}
            <footer className="border-t border-border/30 py-4 text-center">
                <p className="text-xs text-muted-foreground/50">
                    Powered by <span className="nc-gradient-text font-semibold">Next Control</span>
                </p>
            </footer>
        </div>
    );
}
