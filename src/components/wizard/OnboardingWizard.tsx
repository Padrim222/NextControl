import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import {
    Rocket,
    Sparkles,
    ClipboardCheck,
    LayoutDashboard,
    Phone,
    MessageSquare,
    BookOpen,
    type LucideIcon,
} from 'lucide-react';

// ─── Types ─────────────────────────────────────────────────────

interface WizardStep {
    title: string;
    desc: string;
    cta: string;
    path: string;
    icon: LucideIcon;
}

// ─── Steps per role ────────────────────────────────────────────

const WIZARD_STEPS: Record<string, WizardStep[]> = {
    seller: [
        {
            title: 'Bem-vindo, Seller!',
            desc: 'Você é o motor da prospecção. Aqui está sua base de operações — métricas, coaching e evolução em um só lugar.',
            cta: 'Explorar Dashboard',
            path: '/seller',
            icon: Rocket,
        },
        {
            title: 'Conheça o Agente SS',
            desc: 'O Nexus SS conhece cada detalhe do seu processo de vendas. Pergunte qualquer coisa sobre prospecção, abordagem e objeções.',
            cta: 'Abrir Agente',
            path: '/training/coach',
            icon: Sparkles,
        },
        {
            title: 'Faça seu Check-in',
            desc: 'Registre suas métricas diárias. O agente usa esses dados para calibrar os conselhos e acompanhar sua evolução semana a semana.',
            cta: 'Fazer Check-in',
            path: '/seller/report',
            icon: ClipboardCheck,
        },
    ],
    closer: [
        {
            title: 'Bem-vindo, Closer!',
            desc: 'Você fecha. O Nexus Closer vai te ajudar a converter mais calls, superar objeções e aumentar sua taxa de fechamento.',
            cta: 'Ver Dashboard',
            path: '/closer',
            icon: Rocket,
        },
        {
            title: 'Conheça o Agente Closer',
            desc: 'Scripts de call, técnicas de fechamento e como contornar "tá caro" — o Nexus Closer está pronto para te ajudar.',
            cta: 'Abrir Agente',
            path: '/training/coach',
            icon: Sparkles,
        },
        {
            title: 'Analise sua Primeira Call',
            desc: 'Envie a gravação ou transcrição de uma call. O agente analisa e traz os pontos de melhoria em detalhes.',
            cta: 'Analisar Call',
            path: '/closer/call-analysis',
            icon: Phone,
        },
    ],
    client: [
        {
            title: 'Bem-vindo ao Next Control!',
            desc: 'Acompanhe o progresso do seu projeto, acesse relatórios e veja os conteúdos gerados pela IA para o seu negócio.',
            cta: 'Ver Meu Plano',
            path: '/client',
            icon: LayoutDashboard,
        },
        {
            title: 'Conteúdos IA',
            desc: 'Os conteúdos gerados especialmente para o seu negócio ficam aqui. Prontos para usar no seu marketing.',
            cta: 'Ver Conteúdos',
            path: '/training',
            icon: BookOpen,
        },
        {
            title: 'Fale com o Agente',
            desc: 'Tem dúvidas estratégicas sobre seu negócio? O Nexus pode ajudar com insights e direcionamentos personalizados.',
            cta: 'Conversar com Nexus',
            path: '/training/coach',
            icon: Sparkles,
        },
    ],
    team_member: [
        {
            title: 'Bem-vindo ao Time!',
            desc: 'Aqui você acessa o coaching de IA, faz seu check-in diário e analisa suas calls — tudo integrado.',
            cta: 'Começar',
            path: '/seller',
            icon: Rocket,
        },
        {
            title: 'Agente SS na sua mão',
            desc: 'O Nexus SS é seu parceiro de prospecção. Pergunte sobre scripts, abordagens e como melhorar seus números.',
            cta: 'Abrir Agente SS',
            path: '/training/coach',
            icon: MessageSquare,
        },
        {
            title: 'Check-in Diário',
            desc: 'Registre suas métricas todos os dias. Quanto mais dados, mais preciso o coaching fica.',
            cta: 'Fazer Check-in',
            path: '/seller/report',
            icon: ClipboardCheck,
        },
    ],
};

// ─── Storage helpers ──────────────────────────────────────────

function getOnboardedKey(userId: string) {
    return `nc_onboarded_${userId}`;
}

function isOnboarded(userId: string): boolean {
    try {
        return !!localStorage.getItem(getOnboardedKey(userId));
    } catch {
        return true; // fail safe — don't show if storage unavailable
    }
}

function markOnboarded(userId: string): void {
    try {
        localStorage.setItem(getOnboardedKey(userId), '1');
    } catch {
        // ignore
    }
}

// ─── Component ────────────────────────────────────────────────

export function OnboardingWizard() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [visible, setVisible] = useState(false);
    const [step, setStep] = useState(0);
    const [direction, setDirection] = useState(1);

    const role = user?.role ?? 'seller';
    const steps = WIZARD_STEPS[role] ?? WIZARD_STEPS.seller;
    const currentStep = steps[step];
    const isLast = step === steps.length - 1;

    useEffect(() => {
        if (!user) return;
        if (!isOnboarded(user.id)) {
            // Small delay so the dashboard renders first
            const timeout = setTimeout(() => setVisible(true), 600);
            return () => clearTimeout(timeout);
        }
    }, [user]);

    const complete = () => {
        if (user) markOnboarded(user.id);
        setVisible(false);
    };

    const handleNext = () => {
        setDirection(1);
        setStep(s => s + 1);
    };

    const handleCta = () => {
        complete();
        navigate(currentStep.path);
    };

    if (!visible || !currentStep) return null;

    const Icon = currentStep.icon;

    return (
        <AnimatePresence>
            {visible && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[70] bg-background/80 backdrop-blur-md"
                        onClick={complete}
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ type: 'spring', stiffness: 320, damping: 28 }}
                        className="fixed inset-0 z-[71] flex items-center justify-center p-4 pointer-events-none"
                    >
                        <div
                            className="w-full max-w-md bg-card nc-card-border rounded-2xl shadow-2xl shadow-solar/10 overflow-hidden pointer-events-auto"
                            onClick={e => e.stopPropagation()}
                        >
                            {/* Progress bar */}
                            <div className="h-1 bg-muted/50">
                                <motion.div
                                    className="h-full nc-gradient"
                                    initial={false}
                                    animate={{ width: `${((step + 1) / steps.length) * 100}%` }}
                                    transition={{ type: 'spring', stiffness: 200, damping: 26 }}
                                />
                            </div>

                            {/* Step content */}
                            <div className="p-6">
                                {/* Steps indicator */}
                                <div className="flex items-center gap-1.5 mb-6">
                                    {steps.map((_, idx) => (
                                        <div
                                            key={idx}
                                            className={`h-1.5 rounded-full transition-all duration-300 ${
                                                idx === step
                                                    ? 'w-6 bg-solar'
                                                    : idx < step
                                                    ? 'w-3 bg-solar/50'
                                                    : 'w-3 bg-muted'
                                            }`}
                                        />
                                    ))}
                                    <span className="ml-auto text-xs text-muted-foreground">
                                        {step + 1} / {steps.length}
                                    </span>
                                </div>

                                {/* Animated step body */}
                                <AnimatePresence mode="wait" custom={direction}>
                                    <motion.div
                                        key={step}
                                        custom={direction}
                                        initial={{ opacity: 0, x: direction * 40 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: direction * -40 }}
                                        transition={{ type: 'spring', stiffness: 320, damping: 30 }}
                                    >
                                        {/* Icon */}
                                        <div className="w-14 h-14 rounded-2xl nc-gradient flex items-center justify-center mb-4 shadow-lg shadow-solar/20">
                                            <Icon className="h-7 w-7 text-deep-space" />
                                        </div>

                                        <h2 className="font-display text-xl font-bold mb-2">{currentStep.title}</h2>
                                        <p className="text-sm text-muted-foreground leading-relaxed">{currentStep.desc}</p>
                                    </motion.div>
                                </AnimatePresence>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center justify-between px-6 pb-6 pt-2 gap-3">
                                <button
                                    onClick={complete}
                                    className="text-sm text-muted-foreground hover:text-foreground transition-colors px-3 py-2 rounded-lg hover:bg-muted"
                                >
                                    Pular tudo
                                </button>

                                <div className="flex items-center gap-2">
                                    {!isLast && (
                                        <button
                                            onClick={handleNext}
                                            className="text-sm px-4 py-2 rounded-lg border border-border/50 hover:bg-muted transition-colors"
                                        >
                                            Próximo
                                        </button>
                                    )}
                                    <motion.button
                                        whileHover={{ scale: 1.03 }}
                                        whileTap={{ scale: 0.97 }}
                                        transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                                        onClick={handleCta}
                                        className="nc-btn-primary text-sm px-5 py-2"
                                    >
                                        {currentStep.cta}
                                    </motion.button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
