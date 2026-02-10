import { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { ArrowLeft, Shield, BarChart3, Phone, Eye } from 'lucide-react';

const ROLE_META: Record<string, { label: string; icon: React.ElementType; color: string }> = {
    admin: { label: 'Administrador', icon: Shield, color: 'text-amber-500' },
    seller: { label: 'Seller', icon: BarChart3, color: 'text-emerald-500' },
    closer: { label: 'Closer', icon: Phone, color: 'text-blue-500' },
    client: { label: 'Cliente', icon: Eye, color: 'text-rose-500' },
};

const REMEMBER_KEY = 'nc_remember_email';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const { login, user, isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    const roleParam = searchParams.get('role');
    const roleMeta = roleParam ? ROLE_META[roleParam] : null;
    const RoleIcon = roleMeta?.icon;

    // Load saved email on mount
    useEffect(() => {
        const saved = localStorage.getItem(REMEMBER_KEY);
        if (saved) {
            setEmail(saved);
            setRememberMe(true);
        }
    }, []);

    // If already logged in, redirect immediately
    useEffect(() => {
        if (isAuthenticated && user?.role) {
            const roleRoutes: Record<string, string> = {
                admin: '/admin',
                seller: '/seller',
                closer: '/closer',
                client: '/client',
            };
            navigate(roleRoutes[user.role] || '/', { replace: true });
        }
    }, [isAuthenticated, user, navigate]);

    const roleRoutes: Record<string, string> = {
        admin: '/admin',
        seller: '/seller',
        closer: '/closer',
        client: '/client',
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        // Remember email
        if (rememberMe) {
            localStorage.setItem(REMEMBER_KEY, email);
        } else {
            localStorage.removeItem(REMEMBER_KEY);
        }

        try {
            const role = await login(email, password);

            if (role) {
                toast.success('Login realizado com sucesso!');
                navigate(roleRoutes[role] || '/', { replace: true });
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
                        <div className="mx-auto mb-4">
                            <span className="text-3xl font-bold sf-gradient-text">Next Control</span>
                        </div>

                        {roleMeta && RoleIcon ? (
                            <div className="flex items-center justify-center gap-2 mb-2">
                                <RoleIcon className={`h-5 w-5 ${roleMeta.color}`} />
                                <span className={`text-sm font-medium ${roleMeta.color}`}>
                                    Entrando como {roleMeta.label}
                                </span>
                            </div>
                        ) : null}

                        <CardTitle className="text-2xl">Bem-vindo de volta</CardTitle>
                        <CardDescription>Entre com suas credenciais para acessar o sistema</CardDescription>
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

                            {/* Remember me */}
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

                        <div className="mt-6 flex items-center justify-between text-sm">
                            <Link
                                to="/"
                                className="text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
                            >
                                <ArrowLeft className="h-3 w-3" />
                                Voltar
                            </Link>
                            <Link to="/register" className="text-primary hover:underline">
                                Registre-se
                            </Link>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>
        </div>
    );
}
