import { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { Shield, BarChart3, Phone, Eye, HeadphonesIcon, Sparkles } from 'lucide-react';
import type { UserRole } from '@/types';

const ROLE_META: Record<string, { label: string; icon: React.ElementType; color: string }> = {
    admin: { label: 'Administrador', icon: Shield, color: 'text-amber-500' },
    seller: { label: 'Seller', icon: BarChart3, color: 'text-emerald-500' },
    closer: { label: 'Closer', icon: Phone, color: 'text-blue-500' },
    client: { label: 'Cliente', icon: Eye, color: 'text-rose-500' },
    cs: { label: 'CS de Vendas', icon: HeadphonesIcon, color: 'text-cyan-500' },
};

const REMEMBER_KEY = 'nc_remember_email';

const roleRoutes: Record<string, string> = {
    admin: '/admin',
    seller: '/seller',
    closer: '/closer',
    client: '/client',
    cs: '/cs',
};

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const { login, loginAsBeta, user, isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    const roleParam = searchParams.get('role');
    const roleMeta = roleParam ? ROLE_META[roleParam] : null;
    const RoleIcon = roleMeta?.icon;

    useEffect(() => {
        const saved = localStorage.getItem(REMEMBER_KEY);
        if (saved) {
            setEmail(saved);
            setRememberMe(true);
        }
    }, []);

    useEffect(() => {
        if (isAuthenticated && user?.role) {
            navigate(roleRoutes[user.role] || '/admin', { replace: true });
        }
    }, [isAuthenticated, user, navigate]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        if (rememberMe) {
            localStorage.setItem(REMEMBER_KEY, email);
        } else {
            localStorage.removeItem(REMEMBER_KEY);
        }

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
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="w-full max-w-md"
            >
                <Card className="sf-card-glow">
                    <CardHeader className="text-center">
                        <div className="mx-auto mb-2 flex items-center justify-center gap-2">
                            <div className="w-9 h-9 rounded-lg nc-gradient flex items-center justify-center">
                                <Sparkles className="h-4 w-4 text-deep-space" />
                            </div>
                            <span className="text-2xl font-bold sf-gradient-text">Next Control</span>
                        </div>
                        <p className="text-xs text-muted-foreground tracking-widest uppercase mb-3">
                            Consultoria de Bolso
                        </p>

                        {roleMeta && RoleIcon ? (
                            <div className="flex items-center justify-center gap-2 mb-2">
                                <RoleIcon className={`h-5 w-5 ${roleMeta.color}`} />
                                <span className={`text-sm font-medium ${roleMeta.color}`}>
                                    Entrando como {roleMeta.label}
                                </span>
                            </div>
                        ) : null}

                        <CardTitle className="text-xl">Bem-vindo de volta</CardTitle>
                        <CardDescription>Entre com suas credenciais</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="seu@email.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="password">Senha</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="remember"
                                    checked={rememberMe}
                                    onChange={(e) => setRememberMe(e.target.checked)}
                                    className="h-4 w-4 rounded border-border accent-primary"
                                />
                                <Label htmlFor="remember" className="text-sm text-muted-foreground cursor-pointer">
                                    Lembrar meu email
                                </Label>
                            </div>

                            <Button type="submit" className="w-full sf-gradient" disabled={isLoading}>
                                {isLoading ? 'Entrando...' : 'Entrar'}
                            </Button>
                        </form>

                        <div className="mt-6 text-center text-sm">
                            <Link to="/register" className="text-primary hover:underline">
                                Criar nova conta
                            </Link>
                        </div>

                        {true && (
                            <div className="mt-6 border-t border-border pt-4">
                                <p className="text-xs text-muted-foreground text-center mb-3">
                                    Modo Demo — Acesso rápido sem backend
                                </p>
                                <div className="grid grid-cols-2 gap-2">
                                    {(Object.entries(ROLE_META) as [UserRole, typeof ROLE_META[string]][]).map(([role, meta]) => {
                                        const Icon = meta.icon;
                                        return (
                                            <Button
                                                key={role}
                                                variant="outline"
                                                size="sm"
                                                className="text-xs"
                                                onClick={() => {
                                                    loginAsBeta(role);
                                                    toast.success(`Logado como ${meta.label} (beta)`);
                                                    navigate(roleRoutes[role] || '/admin', { replace: true });
                                                }}
                                            >
                                                <Icon className={`h-3 w-3 mr-1 ${meta.color}`} />
                                                {meta.label}
                                            </Button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <p className="mt-4 text-xs text-center text-muted-foreground/40">
                    Next Control © {new Date().getFullYear()} — Sistema Interno
                </p>
            </motion.div>
        </div>
    );
}
