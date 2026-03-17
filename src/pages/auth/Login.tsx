import { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { Zap, Eye, EyeOff, ArrowRight } from '@/components/ui/icons';
import type { UserRole } from '@/types';

const roleRoutes: Record<string, string> = {
    admin: '/admin',
    seller: '/seller',
    closer: '/closer',
    client: '/agent',
    cs: '/cs',
};

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPwd, setShowPwd] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const { login, user, isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    const REMEMBER_KEY = 'nc_remember_email';

    useEffect(() => {
        const saved = localStorage.getItem(REMEMBER_KEY);
        if (saved) { setEmail(saved); setRememberMe(true); }
    }, []);

    useEffect(() => {
        if (isAuthenticated && user?.role) {
            navigate(roleRoutes[user.role] || '/admin', { replace: true });
        }
    }, [isAuthenticated, user, navigate]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        if (rememberMe) localStorage.setItem(REMEMBER_KEY, email);
        else localStorage.removeItem(REMEMBER_KEY);

        try {
            const role = await login(email, password);
            if (role) {
                toast.success('Login realizado com sucesso!');
                navigate(roleRoutes[role] || '/admin', { replace: true });
            } else {
                toast.error('Email ou senha inválidos');
            }
        } catch {
            toast.error('Erro ao fazer login');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div
            className="min-h-screen flex"
            style={{ background: '#FAFAFA', fontFamily: 'DM Sans, system-ui, sans-serif' }}
        >
            {/* Left panel — brand */}
            <div
                className="hidden lg:flex flex-col justify-between w-[440px] flex-shrink-0 p-12"
                style={{ background: '#1B2B4A' }}
            >
                <div className="flex items-center gap-3">
                    <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center"
                        style={{ background: 'rgba(159, 232, 112, 0.15)' }}
                    >
                        <Zap size={17} style={{ color: '#E6B84D' }} strokeWidth={2} />
                    </div>
                    <span
                        className="text-[17px] font-bold text-white"
                        style={{ fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif' }}
                    >
                        Next Control
                    </span>
                </div>

                <div>
                    <div
                        className="text-[38px] font-bold text-white leading-tight mb-4"
                        style={{ fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif' }}
                    >
                        Sua consultoria<br />
                        <span style={{ color: '#E6B84D' }}>no bolso.</span>
                    </div>
                    <p className="text-[15px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.55)' }}>
                        Análise de performance, coaching personalizado e evolução contínua para equipes de vendas de alto impacto.
                    </p>
                </div>

                <div className="space-y-4">
                    {[
                        { val: '94', lbl: 'Score médio de performance' },
                        { val: '73%', lbl: 'Taxa de conversão dos usuários' },
                        { val: '7d', lbl: 'Até ver os primeiros resultados' },
                    ].map((stat) => (
                        <div key={stat.val} className="flex items-center gap-4">
                            <div
                                className="text-[22px] font-bold"
                                style={{
                                    fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif',
                                    color: '#E6B84D',
                                    minWidth: 56,
                                }}
                            >
                                {stat.val}
                            </div>
                            <div className="text-[13px]" style={{ color: 'rgba(255,255,255,0.45)' }}>
                                {stat.lbl}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Right panel — form */}
            <div className="flex-1 flex items-center justify-center p-8">
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
                    className="w-full max-w-[400px]"
                >
                    {/* Mobile logo */}
                    <div className="flex lg:hidden items-center gap-2.5 mb-8">
                        <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center"
                            style={{ background: '#1B2B4A' }}
                        >
                            <Zap size={15} style={{ color: '#E6B84D' }} strokeWidth={2} />
                        </div>
                        <span
                            className="text-[16px] font-bold"
                            style={{ fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif', color: '#1A1A1A' }}
                        >
                            Next Control
                        </span>
                    </div>

                    <div className="mb-8">
                        <h1
                            className="text-[28px] font-bold mb-2"
                            style={{ fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif', color: '#1A1A1A' }}
                        >
                            Bem-vindo de volta
                        </h1>
                        <p className="text-[14px]" style={{ color: '#6B7280' }}>
                            Entre com suas credenciais para acessar o painel
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label
                                htmlFor="email"
                                className="block text-[13px] font-medium mb-1.5"
                                style={{ color: '#374151' }}
                            >
                                Email
                            </label>
                            <input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="seu@email.com"
                                required
                                className="w-full px-3.5 py-2.5 rounded-lg text-[14px] outline-none transition-all"
                                style={{
                                    background: '#FFFFFF',
                                    border: '1px solid #E5E7EB',
                                    color: '#1A1A1A',
                                    fontFamily: 'DM Sans, sans-serif',
                                }}
                                onFocus={(e) => {
                                    e.currentTarget.style.borderColor = '#1B2B4A';
                                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(27,43,74,0.08)';
                                }}
                                onBlur={(e) => {
                                    e.currentTarget.style.borderColor = '#E5E7EB';
                                    e.currentTarget.style.boxShadow = 'none';
                                }}
                            />
                        </div>

                        <div>
                            <label
                                htmlFor="password"
                                className="block text-[13px] font-medium mb-1.5"
                                style={{ color: '#374151' }}
                            >
                                Senha
                            </label>
                            <div className="relative">
                                <input
                                    id="password"
                                    type={showPwd ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    required
                                    className="w-full px-3.5 py-2.5 pr-10 rounded-lg text-[14px] outline-none transition-all"
                                    style={{
                                        background: '#FFFFFF',
                                        border: '1px solid #E5E7EB',
                                        color: '#1A1A1A',
                                        fontFamily: 'DM Sans, sans-serif',
                                    }}
                                    onFocus={(e) => {
                                        e.currentTarget.style.borderColor = '#1B2B4A';
                                        e.currentTarget.style.boxShadow = '0 0 0 3px rgba(27,43,74,0.08)';
                                    }}
                                    onBlur={(e) => {
                                        e.currentTarget.style.borderColor = '#E5E7EB';
                                        e.currentTarget.style.boxShadow = 'none';
                                    }}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPwd(!showPwd)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2"
                                    style={{ color: '#9CA3AF' }}
                                >
                                    {showPwd
                                        ? <EyeOff size={16} strokeWidth={1.5} />
                                        : <Eye size={16} strokeWidth={1.5} />
                                    }
                                </button>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 pt-1">
                            <input
                                type="checkbox"
                                id="remember"
                                checked={rememberMe}
                                onChange={(e) => setRememberMe(e.target.checked)}
                                className="h-4 w-4 rounded"
                                style={{ accentColor: '#1B2B4A' }}
                            />
                            <label
                                htmlFor="remember"
                                className="text-[13px] cursor-pointer"
                                style={{ color: '#6B7280' }}
                            >
                                Lembrar meu email
                            </label>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-[14px] font-semibold text-white transition-all mt-2 disabled:opacity-60"
                            style={{ background: '#1B2B4A' }}
                            onMouseEnter={(e) => !isLoading && ((e.currentTarget as HTMLButtonElement).style.background = '#141F35')}
                            onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.background = '#1B2B4A')}
                        >
                            {isLoading ? (
                                <span className="flex items-center gap-2">
                                    <span
                                        className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"
                                    />
                                    Entrando...
                                </span>
                            ) : (
                                <>
                                    Entrar <ArrowRight size={15} />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-6 text-center">
                        <Link
                            to="/register"
                            className="text-[13px] transition-colors"
                            style={{ color: '#6B7280' }}
                            onMouseEnter={(e) => (e.currentTarget.style.color = '#1B2B4A')}
                            onMouseLeave={(e) => (e.currentTarget.style.color = '#6B7280')}
                        >
                            Não tem conta? <span className="font-medium" style={{ color: '#1B2B4A' }}>Criar agora</span>
                        </Link>
                    </div>

                    <p className="mt-8 text-center text-[12px]" style={{ color: '#D1D5DB' }}>
                        Next Control © {new Date().getFullYear()} — Sistema Interno
                    </p>
                </motion.div>
            </div>
        </div>
    );
}
