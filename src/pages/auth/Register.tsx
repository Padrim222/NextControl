import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { UserRole } from '@/types';
import { motion } from 'framer-motion';
import { Zap, ArrowRight, User, Mail, Lock, Briefcase } from '@/components/ui/icons';

// Roles de equipe são criadas apenas pelo admin em /admin/manage
const ROLES: { value: UserRole; label: string }[] = [
    { value: 'client', label: 'Cliente' },
];

const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 14px',
    borderRadius: 8,
    border: '1px solid #E5E7EB',
    background: '#FFFFFF',
    color: '#1A1A1A',
    fontSize: 14,
    fontFamily: 'DM Sans, system-ui, sans-serif',
    outline: 'none',
    transition: 'all 0.15s ease',
};

function Field({ label, icon: Icon, children }: { label: string; icon: React.ElementType; children: React.ReactNode }) {
    return (
        <div>
            <label
                className="flex items-center gap-1.5 text-[13px] font-medium mb-1.5"
                style={{ color: '#374151' }}
            >
                <Icon size={13} strokeWidth={1.5} style={{ color: '#9CA3AF' }} />
                {label}
            </label>
            {children}
        </div>
    );
}

export default function Register() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState<UserRole>('client');
    const [isLoading, setIsLoading] = useState(false);

    const { register } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const success = await register(email, password, name, role);
            if (success) navigate('/');
        } catch {
            toast.error('Erro ao criar conta');
        } finally {
            setIsLoading(false);
        }
    };

    const focusStyle = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
        e.currentTarget.style.borderColor = '#1B2B4A';
        e.currentTarget.style.boxShadow = '0 0 0 3px rgba(27,43,74,0.08)';
    };
    const blurStyle = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
        e.currentTarget.style.borderColor = '#E5E7EB';
        e.currentTarget.style.boxShadow = 'none';
    };

    return (
        <div
            className="min-h-screen flex items-center justify-center p-4"
            style={{ background: '#FAFAFA', fontFamily: 'DM Sans, system-ui, sans-serif' }}
        >
            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
                className="w-full max-w-[420px]"
            >
                {/* Logo */}
                <div className="flex items-center justify-center gap-2.5 mb-8">
                    <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center"
                        style={{ background: '#1B2B4A' }}
                    >
                        <Zap size={16} style={{ color: '#E6B84D' }} strokeWidth={2} />
                    </div>
                    <span
                        className="text-[17px] font-bold"
                        style={{ fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif', color: '#1A1A1A' }}
                    >
                        Next Control
                    </span>
                </div>

                <div
                    className="bg-white rounded-2xl p-8"
                    style={{ border: '1px solid #E5E7EB', boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}
                >
                    <div className="mb-6">
                        <h1
                            className="text-[24px] font-bold mb-1"
                            style={{ fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif', color: '#1A1A1A' }}
                        >
                            Crie sua conta
                        </h1>
                        <p className="text-[14px]" style={{ color: '#6B7280' }}>
                            Preencha os dados para começar
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <Field label="Nome Completo" icon={User}>
                            <input
                                type="text"
                                placeholder="Seu nome"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                                style={inputStyle}
                                onFocus={focusStyle}
                                onBlur={blurStyle}
                            />
                        </Field>

                        <Field label="Email" icon={Mail}>
                            <input
                                type="email"
                                placeholder="seu@email.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                style={inputStyle}
                                onFocus={focusStyle}
                                onBlur={blurStyle}
                            />
                        </Field>

                        <Field label="Função" icon={Briefcase}>
                            <select
                                value={role}
                                onChange={(e) => setRole(e.target.value as UserRole)}
                                style={{ ...inputStyle, cursor: 'pointer' }}
                                onFocus={focusStyle}
                                onBlur={blurStyle}
                            >
                                {ROLES.map((r) => (
                                    <option key={r.value} value={r.value}>{r.label}</option>
                                ))}
                            </select>
                        </Field>

                        <Field label="Senha" icon={Lock}>
                            <input
                                type="password"
                                placeholder="Mínimo 6 caracteres"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                minLength={6}
                                style={inputStyle}
                                onFocus={focusStyle}
                                onBlur={blurStyle}
                            />
                        </Field>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-[14px] font-semibold text-white transition-all mt-2 disabled:opacity-60"
                            style={{ background: '#1B2B4A', marginTop: 8 }}
                            onMouseEnter={(e) => !isLoading && ((e.currentTarget as HTMLButtonElement).style.background = '#141F35')}
                            onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.background = '#1B2B4A')}
                        >
                            {isLoading ? (
                                <span className="flex items-center gap-2">
                                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Criando conta...
                                </span>
                            ) : (
                                <>Criar conta <ArrowRight size={15} /></>
                            )}
                        </button>
                    </form>

                    <p className="mt-5 text-center text-[13px]" style={{ color: '#6B7280' }}>
                        Já tem conta?{' '}
                        <Link
                            to="/login"
                            className="font-medium"
                            style={{ color: '#1B2B4A' }}
                        >
                            Entre aqui
                        </Link>
                    </p>
                </div>

                <p className="mt-6 text-center text-[12px]" style={{ color: '#D1D5DB' }}>
                    Next Control © {new Date().getFullYear()} — Sistema Interno
                </p>
            </motion.div>
        </div>
    );
}
