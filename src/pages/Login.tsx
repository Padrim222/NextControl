import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const success = login(email, password);
    if (success) {
      const role = email.includes('admin') ? '/admin' : email.includes('ana') || email.includes('maria') ? '/seller' : '/closer';
      navigate(role);
      toast({ title: 'Login realizado com sucesso!' });
    } else {
      toast({ title: 'Credenciais inválidas', description: 'Verifique seu email e senha.', variant: 'destructive' });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <Card className="w-full max-w-md border-border/50 sf-card-glow">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto">
              <h1 className="font-display text-3xl font-bold sf-gradient-text">Social Funnels™</h1>
            </div>
            <CardTitle className="text-xl">Entrar no CRM</CardTitle>
            <CardDescription>Acesse com suas credenciais</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="seu@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <Input id="password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
              </div>
              <Button type="submit" className="w-full sf-gradient text-primary-foreground font-semibold">Entrar</Button>
            </form>
            <div className="mt-6 p-4 rounded-lg bg-secondary/50 border border-border">
              <p className="text-xs text-muted-foreground mb-2 font-medium">Demo — use um dos emails:</p>
              <div className="space-y-1 text-xs text-muted-foreground">
                <p>admin@socialfunnels.com (Admin)</p>
                <p>ana@socialfunnels.com (Seller)</p>
                <p>joao@socialfunnels.com (Closer)</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default Login;
