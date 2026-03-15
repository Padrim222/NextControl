import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { AlertTriangle, ArrowRight, X } from '@/components/ui/icons';
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

    useEffect(() => { checkPending(); }, [user]);

    async function checkPending() {
        if (!supabase || !user) { setChecked(true); setIsPending(true); return; }
        try {
            const now = new Date();
            let dateFilter: string;
            if (isWeekly) {
                const day = now.getDay();
                const diff = day === 0 ? 6 : day - 1;
                const monday = new Date(now);
                monday.setDate(now.getDate() - diff);
                dateFilter = monday.toISOString().split('T')[0];
            } else {
                dateFilter = now.toISOString().split('T')[0];
            }
            const { data, error } = await (supabase as any)
                .from('form_submissions')
                .select('id')
                .eq('form_type', formType)
                .eq('submitter_email', user.email)
                .gte('submission_date', dateFilter)
                .limit(1);

            if (error) { setIsPending(true); } else { setIsPending(!data || data.length === 0); }
        } catch { setIsPending(true); }
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
                transition={{ duration: 0.25 }}
            >
                <div
                    className="flex items-center justify-between gap-3 p-4 rounded-xl"
                    style={{
                        background: '#FFFBEB',
                        border: '1px solid #FDE68A',
                        fontFamily: 'DM Sans, sans-serif',
                    }}
                >
                    <div className="flex items-center gap-3 min-w-0">
                        <div
                            className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                            style={{ background: '#FEF3C7' }}
                        >
                            <AlertTriangle size={16} strokeWidth={1.5} style={{ color: '#D97706' }} />
                        </div>
                        <div className="min-w-0">
                            <p
                                className="text-[13px] font-semibold truncate"
                                style={{ color: '#92400E' }}
                            >
                                {isWeekly ? 'Relatório semanal' : 'Check-in diário'} pendente
                            </p>
                            <p className="text-[12px] truncate" style={{ color: '#B45309' }}>
                                ~{config.estimatedTime} · {config.frequency}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                            onClick={() => navigate(`/form/${slug}`)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold text-white transition-opacity hover:opacity-90"
                            style={{ background: '#1B2B4A' }}
                        >
                            Preencher <ArrowRight size={12} />
                        </button>
                        <button
                            onClick={() => setDismissed(true)}
                            className="p-1.5 rounded-lg transition-colors"
                            style={{ color: '#B45309' }}
                            onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.background = '#FEF3C7')}
                            onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.background = 'transparent')}
                            aria-label="Fechar"
                        >
                            <X size={14} strokeWidth={1.5} />
                        </button>
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}
