import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { UserRole } from '@/types';

export default function Register() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState<UserRole>('client'); // Default to client
    const [isLoading, setIsLoading] = useState(false);

    const { register } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const success = await register(email, password, name, role);

            if (success) {
                // Navigate based on user role or to login
                // login usually auto-sets user, so we might be logged in.
                // AuthContext register doesn't auto-login in my impl?
                // Wait, signUp triggers session if confirmed. 
                // Let's assume we need to login or are logged in.
                // My AuthContext listens to onAuthStateChange, so if signUp signs in, we are good.
                navigate('/');
            }
        } catch {
            toast.error('Erro ao criar conta');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
            <Card className="w-full max-w-md sf-card-glow">
                <CardHeader className="text-center">
                    <div className="mx-auto mb-4">
                        <span className="text-3xl font-bold sf-gradient-text">Next Control</span>
                    </div>
                    <CardTitle className="text-2xl">Crie sua conta</CardTitle>
                    <CardDescription>Preencha os dados para começar</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Nome Completo</Label>
                            <Input
                                id="name"
                                type="text"
                                placeholder="Seu nome"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                            />
                        </div>
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
                            <Label htmlFor="role">Função</Label>
                            <Select value={role} onValueChange={(value) => setRole(value as UserRole)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecione sua função" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="client">Cliente</SelectItem>
                                    <SelectItem value="seller">Seller (Vendedor)</SelectItem>
                                    <SelectItem value="closer">Closer (Fechador)</SelectItem>
                                </SelectContent>
                            </Select>
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
                                minLength={6}
                            />
                        </div>
                        <Button type="submit" className="w-full sf-gradient" disabled={isLoading}>
                            {isLoading ? 'Criando conta...' : 'Registrar'}
                        </Button>
                    </form>

                    <p className="mt-4 text-center text-sm text-muted-foreground">
                        Já tem conta?{' '}
                        <Link to="/login" className="text-primary hover:underline">
                            Entre aqui
                        </Link>
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
