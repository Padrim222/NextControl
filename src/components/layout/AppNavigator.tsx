import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import {
    Sparkles,
    X,
    Search,
    ClipboardCheck,
    MessageSquare,
    TrendingUp,
    LayoutDashboard,
    Phone,
    Users,
    Database,
    BarChart3,
    BookOpen,
    Inbox,
    type LucideIcon,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────

interface QuickAction {
    icon: LucideIcon;
    label: string;
    desc: string;
    path: string;
}

// ─── Quick Actions per role ───────────────────────────────────

const QUICK_ACTIONS: Record<string, QuickAction[]> = {
    seller: [
        { icon: ClipboardCheck, label: 'Check-in Diário', desc: 'Registrar métricas de hoje', path: '/seller/report' },
        { icon: MessageSquare, label: 'Consultoria de Bolso', desc: 'Perguntar ao Agente SS', path: '/training/coach' },
        { icon: TrendingUp, label: 'Ver Evolução', desc: 'Semana em números', path: '/seller/evolution' },
        { icon: LayoutDashboard, label: 'Dashboard', desc: 'Visão geral de performance', path: '/seller' },
    ],
    closer: [
        { icon: Phone, label: 'Análise de Call', desc: 'Analisar chamada de vendas', path: '/closer/call-analysis' },
        { icon: MessageSquare, label: 'Consultoria de Bolso', desc: 'Perguntar ao Agente Closer', path: '/training/coach' },
        { icon: BarChart3, label: 'Insights', desc: 'Resultados e tendências', path: '/seller/evolution' },
        { icon: LayoutDashboard, label: 'Dashboard', desc: 'Visão geral', path: '/closer' },
    ],
    client: [
        { icon: MessageSquare, label: 'Consultoria', desc: 'Falar com o agente IA', path: '/agent' },
        { icon: LayoutDashboard, label: 'Onboarding', desc: 'Completar briefing do negócio', path: '/client/onboarding' },
    ],
    team_member: [
        { icon: MessageSquare, label: 'Consultoria de Bolso', desc: 'Perguntar ao Agente SS', path: '/training/coach' },
        { icon: ClipboardCheck, label: 'Check-in Diário', desc: 'Registrar métricas de hoje', path: '/seller/report' },
        { icon: Phone, label: 'Análise de Call', desc: 'Analisar chamada', path: '/closer/call-analysis' },
        { icon: LayoutDashboard, label: 'Dashboard', desc: 'Visão geral', path: '/seller' },
    ],
    admin: [
        { icon: LayoutDashboard, label: 'Dashboard', desc: 'Painel administrativo', path: '/admin' },
        { icon: Users, label: 'Clientes', desc: 'Gerenciar clientes', path: '/admin/manage' },
        { icon: Phone, label: 'Pipeline de Calls', desc: 'Análise de chamadas', path: '/admin/calls-pipeline' },
        { icon: Database, label: 'Base RAG', desc: 'Gerenciar base de conhecimento', path: '/admin/rag' },
    ],
    cs: [
        { icon: Inbox, label: 'Inbox', desc: 'Mensagens e tickets', path: '/cs' },
    ],
};

// ─── Overlay ─────────────────────────────────────────────────

interface PanelProps {
    onClose: () => void;
}

function NavigatorPanel({ onClose }: PanelProps) {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [query, setQuery] = useState('');
    const searchRef = useRef<HTMLInputElement>(null);

    const role = user?.role ?? 'seller';
    const actions = QUICK_ACTIONS[role] ?? [];

    const filtered = query.trim()
        ? actions.filter(a =>
            a.label.toLowerCase().includes(query.toLowerCase()) ||
            a.desc.toLowerCase().includes(query.toLowerCase())
        )
        : actions;

    useEffect(() => {
        // Auto-focus the search field when panel opens
        const timeout = setTimeout(() => searchRef.current?.focus(), 80);
        return () => clearTimeout(timeout);
    }, []);

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [onClose]);

    const handleAction = (path: string) => {
        navigate(path);
        onClose();
    };

    return (
        <>
            {/* Backdrop */}
            <motion.div
                key="backdrop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[59] bg-background/60 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Panel */}
            <motion.div
                key="panel"
                initial={{ x: '100%', opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: '100%', opacity: 0 }}
                transition={{ type: 'spring', stiffness: 360, damping: 34 }}
                className="fixed top-0 right-0 h-full z-[60] w-80 sm:w-80 w-full bg-card border-l border-border/50 flex flex-col shadow-2xl"
            >
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-border/50 shrink-0">
                    <div>
                        <h2 className="font-display font-bold text-base">O que você quer fazer?</h2>
                        <p className="text-xs text-muted-foreground mt-0.5">Ações rápidas para você</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                {/* Search */}
                <div className="px-4 py-3 shrink-0">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                        <input
                            ref={searchRef}
                            value={query}
                            onChange={e => setQuery(e.target.value)}
                            placeholder="Buscar ação..."
                            className="w-full h-9 pl-9 pr-4 rounded-lg bg-muted/50 border border-border/50 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-solar/30 focus:border-solar/50 transition-all"
                        />
                    </div>
                </div>

                {/* Actions */}
                <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-2">
                    <AnimatePresence mode="popLayout">
                        {filtered.length > 0 ? (
                            filtered.map((action, idx) => {
                                const Icon = action.icon;
                                return (
                                    <motion.button
                                        key={action.path + action.label}
                                        initial={{ opacity: 0, y: 8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -8 }}
                                        transition={{ delay: idx * 0.04, type: 'spring', stiffness: 300, damping: 26 }}
                                        whileHover={{ x: 3 }}
                                        onClick={() => handleAction(action.path)}
                                        className="w-full flex items-center gap-3 p-3 rounded-xl bg-muted/30 hover:bg-solar/8 border border-transparent hover:border-solar/20 transition-colors text-left group"
                                    >
                                        <div className="w-9 h-9 rounded-lg nc-gradient flex items-center justify-center shrink-0 shadow-sm shadow-solar/20">
                                            <Icon className="h-4 w-4 text-deep-space" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-sm font-semibold leading-tight">{action.label}</p>
                                            <p className="text-xs text-muted-foreground leading-tight mt-0.5 truncate">{action.desc}</p>
                                        </div>
                                    </motion.button>
                                );
                            })
                        ) : (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="flex flex-col items-center justify-center py-10 text-center"
                            >
                                <Search className="h-8 w-8 text-muted-foreground/30 mb-2" />
                                <p className="text-sm text-muted-foreground">Nenhuma ação encontrada</p>
                                <p className="text-xs text-muted-foreground/60 mt-1">Tente outro termo de busca</p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>
        </>
    );
}

// ─── Main export ──────────────────────────────────────────────

export function AppNavigator() {
    const [open, setOpen] = useState(false);

    const handleOpen = useCallback(() => setOpen(true), []);
    const handleClose = useCallback(() => setOpen(false), []);

    return (
        <>
            {/* Floating button — hidden on mobile (bottom nav is present) */}
            <div className="hidden md:block">
                <motion.button
                    onClick={handleOpen}
                    whileHover={{ scale: 1.08 }}
                    whileTap={{ scale: 0.94 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                    className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-2xl nc-gradient flex items-center justify-center shadow-lg shadow-solar/25"
                    aria-label="Abrir navegador de ações"
                >
                    {/* Pulse ring */}
                    <span className="absolute inset-0 rounded-2xl animate-ping bg-solar/30 pointer-events-none" />
                    <Sparkles className="h-6 w-6 text-deep-space relative z-10" />
                </motion.button>
            </div>

            <AnimatePresence>
                {open && <NavigatorPanel onClose={handleClose} />}
            </AnimatePresence>
        </>
    );
}
