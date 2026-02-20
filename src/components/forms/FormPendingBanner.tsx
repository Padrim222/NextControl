import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { AlertTriangle, ArrowRight, CheckCircle, X } from 'lucide-react';
import type { FormType } from '@/types/forms';
import { FORM_CONFIG } from '@/types/forms';

interface FormPendingBannerProps {
    formType: FormType;
}

export function FormPendingBanner({ formType }: FormPendingBannerProps) {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [isPending, setIsPending] = useState(false);
    const [dismissed, setDismissed] = useState(false);
    const [checked, setChecked] = useState(false);

    const config = FORM_CONFIG[formType];
    const isWeekly = formType === 'expert_weekly';

    useEffect(() => {
        checkPending();
    }, [user]);

    async function checkPending() {
        if (!supabase || !user) {
            setChecked(true);
            setIsPending(true); // Show by default if no auth context
            return;
        }

        try {
            const now = new Date();
            let dateFilter: string;

            if (isWeekly) {
                // Check if submitted this week (Mon-Sun)
                const day = now.getDay();
                const diff = day === 0 ? 6 : day - 1; // Monday = start
                const monday = new Date(now);
                monday.setDate(now.getDate() - diff);
                dateFilter = monday.toISOString().split('T')[0];
            } else {
                // Check if submitted today
                dateFilter = now.toISOString().split('T')[0];
            }

            const { data, error } = await (supabase as any)
                .from('form_submissions')
                .select('id')
                .eq('form_type', formType)
                .eq('submitter_email', user.email)
                .gte('submission_date', dateFilter)
                .limit(1);

            if (error) {
                console.warn('FormPendingBanner check error:', error);
                setIsPending(true);
            } else {
                setIsPending(!data || data.length === 0);
            }
        } catch {
            setIsPending(true);
        }
        setChecked(true);
    }

    if (!checked || !isPending || dismissed) return null;

    const slug = formType.replace('_', '-');

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: -8, height: 0 }}
                animate={{ opacity: 1, y: 0, height: 'auto' }}
                exit={{ opacity: 0, y: -8, height: 0 }}
                transition={{ duration: 0.3 }}
            >
                <Card className="border-nc-warning/40 bg-nc-warning/5 overflow-hidden">
                    <CardContent className="p-4 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                            <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-nc-warning/10 flex items-center justify-center">
                                <AlertTriangle className="h-5 w-5 text-nc-warning" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-sm font-medium truncate">
                                    {config.emoji} {isWeekly ? 'Relatório semanal' : 'Check-in diário'} pendente!
                                </p>
                                <p className="text-xs text-muted-foreground truncate">
                                    ⏱ ~{config.estimatedTime} • {config.frequency}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                            <Button
                                size="sm"
                                className="nc-gradient text-deep-space font-semibold"
                                onClick={() => navigate(`/form/${slug}`)}
                            >
                                Preencher <ArrowRight className="h-3.5 w-3.5 ml-1" />
                            </Button>
                            <button
                                onClick={() => setDismissed(true)}
                                className="p-1.5 rounded-md hover:bg-muted/50 text-muted-foreground transition-colors"
                                aria-label="Fechar"
                            >
                                <X className="h-3.5 w-3.5" />
                            </button>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>
        </AnimatePresence>
    );
}
