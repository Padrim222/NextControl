import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield, BarChart3, Phone, Eye, ArrowRight, Zap } from 'lucide-react';
import type { UserRole } from '@/types';

const roles: {
    role: UserRole;
    label: string;
    description: string;
    icon: React.ElementType;
    gradient: string;
    delay: number;
}[] = [
        {
            role: 'admin',
            label: 'Administrador',
            description: 'Gerencie equipe, aprove relatórios e gere feedbacks com IA',
            icon: Shield,
            gradient: 'from-amber-500 to-orange-600',
            delay: 0.1,
        },
        {
            role: 'seller',
            label: 'Seller',
            description: 'Preencha check-ins diários e acompanhe seus clientes',
            icon: BarChart3,
            gradient: 'from-emerald-500 to-teal-600',
            delay: 0.2,
        },
        {
            role: 'closer',
            label: 'Closer',
            description: 'Registre calls de venda e acompanhe fechamentos',
            icon: Phone,
            gradient: 'from-blue-500 to-indigo-600',
            delay: 0.3,
        },
        {
            role: 'client',
            label: 'Cliente',
            description: 'Acompanhe o progresso do seu projeto em tempo real',
            icon: Eye,
            gradient: 'from-rose-500 to-pink-600',
            delay: 0.4,
        },
    ];

export default function LandingPage() {
    const { isAuthenticated, user, loginAsBeta } = useAuth();
    const navigate = useNavigate();

    if (isAuthenticated && user) {
        const roleRoutes: Record<UserRole, string> = {
            admin: '/admin',
            seller: '/seller',
            closer: '/closer',
            client: '/client',
        };
        return <Navigate to={roleRoutes[user.role]} replace />;
    }

    const handleBetaLogin = (role: UserRole) => {
        loginAsBeta(role);
        // Navigate will happen via the isAuthenticated check above on re-render
    };

    return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="text-center mb-12"
            >
                <h1 className="font-display text-4xl md:text-5xl font-bold mb-3">
                    <span className="sf-gradient-text">Next Control</span>
                </h1>
                <p className="text-muted-foreground text-lg max-w-md mx-auto">
                    CRM inteligente para equipes de vendas. Escolha seu painel.
                </p>
                <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold">
                    <Zap className="h-3 w-3" />
                    MODO BETA — Acesso direto
                </div>
            </motion.div>

            {/* Role Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 w-full max-w-2xl">
                {roles.map(({ role, label, description, icon: Icon, gradient, delay }) => (
                    <motion.button
                        key={role}
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay }}
                        whileHover={{ scale: 1.03, y: -4 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleBetaLogin(role as UserRole)}
                        className="group relative overflow-hidden rounded-xl border border-border bg-card p-6 text-left transition-shadow duration-300 hover:shadow-lg hover:shadow-primary/10 focus:outline-none focus:ring-2 focus:ring-ring cursor-pointer"
                    >
                        {/* Gradient accent bar */}
                        <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${gradient} opacity-70 group-hover:opacity-100 transition-opacity`} />

                        <div className="flex items-start gap-4">
                            <div className={`shrink-0 flex items-center justify-center h-12 w-12 rounded-lg bg-gradient-to-br ${gradient} text-white shadow-md`}>
                                <Icon className="h-6 w-6" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-lg font-semibold text-foreground">{label}</h2>
                                    <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                                <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{description}</p>
                            </div>
                        </div>
                    </motion.button>
                ))}
            </div>

            {/* Footer */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="mt-10 flex gap-4 text-xs text-muted-foreground"
            >
                <button
                    onClick={() => navigate('/login')}
                    className="text-primary hover:underline font-medium"
                >
                    Login com credenciais
                </button>
                <span>•</span>
                <button
                    onClick={() => navigate('/register')}
                    className="text-primary hover:underline font-medium"
                >
                    Registre-se
                </button>
            </motion.div>
        </div>
    );
}

