import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import {
    UserPlus,
    Users,
    Building2,
    ArrowLeft,
    Loader2,
    Copy,
    Plus,
    Shield,
    Phone,
    Mail,
} from 'lucide-react';

type UserRole = 'seller' | 'closer' | 'cs' | 'client' | 'admin';

interface ManagedUser {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    seller_type: string | null;
    status: string;
    created_at: string;
}

interface ManagedClient {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    company: string | null;
    segment: string | null;
    status: string;
    project_summary: string | null;
    current_phase: string | null;
    next_step: string | null;
    team_status: string | null;
    operational_processes: string | null;
    created_at: string;
}

type ActiveTab = 'users' | 'clients';

const ROLE_LABELS: Record<string, string> = {
    admin: 'Admin',
    seller: 'Seller',
    closer: 'Closer',
    cs: 'CS',
    client: 'Cliente',
};

const ROLE_COLORS: Record<string, string> = {
    admin: 'bg-red-500/10 text-red-500',
    seller: 'bg-blue-500/10 text-blue-500',
    closer: 'bg-amber-500/10 text-amber-500',
    cs: 'bg-emerald-500/10 text-emerald-500',
    client: 'bg-purple-500/10 text-purple-500',
};

export default function AdminManage() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<ActiveTab>('users');
    const [users, setUsers] = useState<ManagedUser[]>([]);
    const [clients, setClients] = useState<ManagedClient[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // New user form
    const [showUserForm, setShowUserForm] = useState(false);
    const [newUser, setNewUser] = useState({ name: '', email: '', role: 'seller' as UserRole, password: '' });
    const [isCreatingUser, setIsCreatingUser] = useState(false);
    const [createdCredentials, setCreatedCredentials] = useState<{ email: string; password: string } | null>(null);

    // Client form (create/edit)
    const [showClientForm, setShowClientForm] = useState(false);
    const [editingClientId, setEditingClientId] = useState<string | null>(null);
    const [clientForm, setClientForm] = useState({
        name: '',
        email: '',
        phone: '',
        company: '',
        segment: '',
        project_summary: '',
        current_phase: '',
        next_step: '',
        team_status: '',
        operational_processes: ''
    });
    const [isSubmittingClient, setIsSubmittingClient] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        if (!supabase) return;
        setIsLoading(true);
        try {
            // Use direct DB queries since they're simpler
            const { data: usersData } = await (supabase as any)
                .from('users')
                .select('id, name, email, role, seller_type, status, created_at')
                .order('created_at', { ascending: false });

            const { data: clientsData } = await (supabase as any)
                .from('clients')
                .select('*')
                .order('created_at', { ascending: false });

            setUsers(usersData || []);
            setClients(clientsData || []);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateUser = async () => {
        if (!newUser.name.trim() || !newUser.email.trim()) {
            toast.error('Nome e email são obrigatórios');
            return;
        }
        setIsCreatingUser(true);
        try {
            const password = newUser.password.trim() || 'NextControl2026!';
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email: newUser.email.trim().toLowerCase(),
                password,
                options: { data: { name: newUser.name.trim(), role: newUser.role } },
            });

            if (authError) throw authError;
            if (!authData.user) throw new Error('User creation failed');

            // Insert into users table
            await (supabase as any).from('users').upsert([{
                id: authData.user.id,
                email: newUser.email.trim().toLowerCase(),
                name: newUser.name.trim(),
                role: newUser.role,
                status: 'active',
            }], { onConflict: 'id' });

            toast.success(`Usuário ${newUser.name} criado!`);
            setCreatedCredentials({ email: newUser.email.trim().toLowerCase(), password });
            setNewUser({ name: '', email: '', role: 'seller', password: '' });
            setShowUserForm(false);
            fetchData();
        } catch (error: any) {
            toast.error(error?.message || 'Erro ao criar usuário');
        } finally {
            setIsCreatingUser(false);
        }
    };

    const handleSaveClient = async () => {
        if (!clientForm.name.trim()) {
            toast.error('Nome é obrigatório');
            return;
        }
        setIsSubmittingClient(true);
        try {
            const payload = {
                name: clientForm.name.trim(),
                email: clientForm.email.trim() || null,
                phone: clientForm.phone.trim() || null,
                company: clientForm.company.trim() || null,
                segment: clientForm.segment.trim() || null,
                project_summary: clientForm.project_summary.trim() || null,
                current_phase: clientForm.current_phase.trim() || null,
                next_step: clientForm.next_step.trim() || null,
                team_status: clientForm.team_status.trim() || null,
                operational_processes: clientForm.operational_processes.trim() || null,
                status: 'active',
            };

            if (editingClientId) {
                const { error } = await (supabase as any)
                    .from('clients')
                    .update(payload)
                    .eq('id', editingClientId);
                if (error) throw error;
                toast.success('Cliente atualizado!');
            } else {
                const { error } = await (supabase as any)
                    .from('clients')
                    .insert(payload);
                if (error) throw error;
                toast.success('Cliente criado!');
            }

            setClientForm({
                name: '', email: '', phone: '', company: '', segment: '',
                project_summary: '', current_phase: '', next_step: '',
                team_status: '', operational_processes: ''
            });
            setEditingClientId(null);
            setShowClientForm(false);
            fetchData();
        } catch (error: any) {
            toast.error(error?.message || 'Erro ao processar cliente');
        } finally {
            setIsSubmittingClient(false);
        }
    };

    const handleEditClient = (c: ManagedClient) => {
        setClientForm({
            name: c.name || '',
            email: c.email || '',
            phone: c.phone || '',
            company: c.company || '',
            segment: c.segment || '',
            project_summary: c.project_summary || '',
            current_phase: c.current_phase || '',
            next_step: c.next_step || '',
            team_status: c.team_status || '',
            operational_processes: c.operational_processes || ''
        });
        setEditingClientId(c.id);
        setShowClientForm(true);
        setActiveTab('clients');
    };

    const copyCredentials = () => {
        if (!createdCredentials) return;
        const text = `Login: ${createdCredentials.email}\nSenha: ${createdCredentials.password}`;
        navigator.clipboard.writeText(text);
        toast.success('Credenciais copiadas!');
    };

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon" onClick={() => navigate('/admin')}>
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                    <h1 className="font-display text-2xl font-bold">
                        Gestão <span className="nc-gradient-text">Next Control</span>
                    </h1>
                    <p className="text-muted-foreground text-sm">Criar e gerenciar equipe e clientes</p>
                </div>
            </div>

            {/* Credentials Card */}
            {createdCredentials && (
                <Card className="nc-card-border border-nc-success/30 bg-nc-success/5">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-nc-success">✅ Usuário criado! Copie as credenciais:</p>
                                <p className="text-sm font-mono mt-1">
                                    Login: <strong>{createdCredentials.email}</strong> • Senha: <strong>{createdCredentials.password}</strong>
                                </p>
                            </div>
                            <div className="flex gap-2">
                                <Button size="sm" variant="outline" onClick={copyCredentials}>
                                    <Copy className="h-3 w-3 mr-1" /> Copiar
                                </Button>
                                <Button size="sm" variant="ghost" onClick={() => setCreatedCredentials(null)}>✕</Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Tab Navigation */}
            <div className="flex gap-1 bg-card border border-border rounded-lg p-1">
                <button
                    onClick={() => setActiveTab('users')}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-md text-sm font-medium transition-all
                        ${activeTab === 'users'
                            ? 'bg-primary text-primary-foreground shadow-sm'
                            : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                        }`}
                >
                    <Users className="h-4 w-4" />
                    Equipe ({users.length})
                </button>
                <button
                    onClick={() => setActiveTab('clients')}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-md text-sm font-medium transition-all
                        ${activeTab === 'clients'
                            ? 'bg-primary text-primary-foreground shadow-sm'
                            : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                        }`}
                >
                    <Building2 className="h-4 w-4" />
                    Clientes ({clients.length})
                </button>
            </div>

            {/* Users Tab */}
            {activeTab === 'users' && (
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold">Equipe</h3>
                        <Button onClick={() => setShowUserForm(!showUserForm)} size="sm">
                            <Plus className="h-4 w-4 mr-1" /> Novo Membro
                        </Button>
                    </div>

                    {/* New User Form */}
                    {showUserForm && (
                        <Card className="nc-card-border border-primary/20">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base flex items-center gap-2">
                                    <UserPlus className="h-4 w-4 text-primary" />
                                    Adicionar Membro
                                </CardTitle>
                                <CardDescription>O login será o email e a senha padrão é NextControl2026!</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <Label>Nome</Label>
                                        <Input
                                            placeholder="Nome completo"
                                            value={newUser.name}
                                            onChange={e => setNewUser(prev => ({ ...prev, name: e.target.value }))}
                                        />
                                    </div>
                                    <div>
                                        <Label>Email</Label>
                                        <Input
                                            type="email"
                                            placeholder="email@empresa.com"
                                            value={newUser.email}
                                            onChange={e => setNewUser(prev => ({ ...prev, email: e.target.value }))}
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <Label>Função</Label>
                                        <select
                                            value={newUser.role}
                                            onChange={e => setNewUser(prev => ({ ...prev, role: e.target.value as UserRole }))}
                                            className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                                        >
                                            <option value="seller">Seller</option>
                                            <option value="closer">Closer</option>
                                            <option value="cs">CS</option>
                                            <option value="client">Cliente</option>
                                            <option value="admin">Admin</option>
                                        </select>
                                    </div>
                                    <div>
                                        <Label>Senha (opcional)</Label>
                                        <Input
                                            type="text"
                                            placeholder="NextControl2026!"
                                            value={newUser.password}
                                            onChange={e => setNewUser(prev => ({ ...prev, password: e.target.value }))}
                                        />
                                    </div>
                                </div>
                                <div className="flex gap-2 pt-2">
                                    <Button onClick={handleCreateUser} disabled={isCreatingUser}>
                                        {isCreatingUser ? <><Loader2 className="h-4 w-4 mr-1 animate-spin" /> Criando...</> : 'Criar Membro'}
                                    </Button>
                                    <Button variant="ghost" onClick={() => setShowUserForm(false)}>Cancelar</Button>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Users List */}
                    {isLoading ? (
                        <div className="text-center py-8">
                            <Loader2 className="h-6 w-6 mx-auto animate-spin text-muted-foreground" />
                        </div>
                    ) : (
                        <Card className="nc-card-border">
                            <CardContent className="p-0">
                                <div className="divide-y divide-border">
                                    {users.map(u => (
                                        <div key={u.id} className="p-3 flex items-center justify-between hover:bg-muted/50 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-full bg-solar/10 flex items-center justify-center text-solar font-bold text-sm">
                                                    {u.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium">{u.name}</p>
                                                    <p className="text-xs text-muted-foreground">{u.email}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Badge className={`text-xs ${ROLE_COLORS[u.role] || ''}`}>
                                                    {ROLE_LABELS[u.role] || u.role}
                                                </Badge>
                                                <Badge variant={u.status === 'active' ? 'default' : 'secondary'} className="text-xs">
                                                    {u.status === 'active' ? '✓' : u.status}
                                                </Badge>
                                            </div>
                                        </div>
                                    ))}
                                    {users.length === 0 && (
                                        <div className="p-8 text-center text-muted-foreground text-sm">
                                            Nenhum membro encontrado
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            )}

            {/* Clients Tab */}
            {activeTab === 'clients' && (
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold">Clientes</h3>
                        <Button onClick={() => setShowClientForm(!showClientForm)} size="sm">
                            <Plus className="h-4 w-4 mr-1" /> Novo Cliente
                        </Button>
                    </div>

                    {/* New/Edit Client Form */}
                    {showClientForm && (
                        <Card className="nc-card-border border-primary/20">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base flex items-center gap-2">
                                    <Building2 className="h-4 w-4 text-primary" />
                                    {editingClientId ? 'Editar Cliente' : 'Adicionar Cliente'}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <Label>Nome</Label>
                                        <Input
                                            placeholder="Nome do cliente"
                                            value={clientForm.name}
                                            onChange={e => setClientForm(prev => ({ ...prev, name: e.target.value }))}
                                        />
                                    </div>
                                    <div>
                                        <Label>Empresa</Label>
                                        <Input
                                            placeholder="Nome da empresa"
                                            value={clientForm.company}
                                            onChange={e => setClientForm(prev => ({ ...prev, company: e.target.value }))}
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-3 gap-3">
                                    <div>
                                        <Label>Email</Label>
                                        <Input
                                            type="email"
                                            placeholder="email@cliente.com"
                                            value={clientForm.email}
                                            onChange={e => setClientForm(prev => ({ ...prev, email: e.target.value }))}
                                        />
                                    </div>
                                    <div>
                                        <Label>Telefone</Label>
                                        <Input
                                            placeholder="(11) 99999-9999"
                                            value={clientForm.phone}
                                            onChange={e => setClientForm(prev => ({ ...prev, phone: e.target.value }))}
                                        />
                                    </div>
                                    <div>
                                        <Label>Segmento</Label>
                                        <Input
                                            placeholder="Ex: Clínica, Advocacia"
                                            value={clientForm.segment}
                                            onChange={e => setClientForm(prev => ({ ...prev, segment: e.target.value }))}
                                        />
                                    </div>
                                </div>

                                <div className="pt-2 border-t border-border/50">
                                    <h4 className="text-xs font-bold text-muted-foreground uppercase mb-3 px-1">Estratégia & Painel do Cliente</h4>
                                    <div className="space-y-3">
                                        <div>
                                            <Label>Resumo do Projeto (Visível para o cliente)</Label>
                                            <Textarea
                                                placeholder="Descreva o foco do projeto..."
                                                value={clientForm.project_summary}
                                                onChange={e => setClientForm(prev => ({ ...prev, project_summary: e.target.value }))}
                                                className="h-20 text-sm"
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <Label>Fase Atual</Label>
                                                <Input
                                                    placeholder="Ex: Onboarding"
                                                    value={clientForm.current_phase}
                                                    onChange={e => setClientForm(prev => ({ ...prev, current_phase: e.target.value }))}
                                                />
                                            </div>
                                            <div>
                                                <Label>Próxima Etapa</Label>
                                                <Input
                                                    placeholder="Ex: Máquina de Vendas"
                                                    value={clientForm.next_step}
                                                    onChange={e => setClientForm(prev => ({ ...prev, next_step: e.target.value }))}
                                                />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <Label>Status do Time</Label>
                                                <Input
                                                    placeholder="Ex: Treinando Closer"
                                                    value={clientForm.team_status}
                                                    onChange={e => setClientForm(prev => ({ ...prev, team_status: e.target.value }))}
                                                />
                                            </div>
                                            <div>
                                                <Label>Processos Operacionais</Label>
                                                <Input
                                                    placeholder="Ex: CRM Configurado"
                                                    value={clientForm.operational_processes}
                                                    onChange={e => setClientForm(prev => ({ ...prev, operational_processes: e.target.value }))}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-2 pt-4">
                                    <Button onClick={handleSaveClient} disabled={isSubmittingClient}>
                                        {isSubmittingClient ? <><Loader2 className="h-4 w-4 mr-1 animate-spin" /> Salvando...</> : 'Salvar Cliente'}
                                    </Button>
                                    <Button variant="ghost" onClick={() => {
                                        setShowClientForm(false);
                                        setEditingClientId(null);
                                        setClientForm({
                                            name: '', email: '', phone: '', company: '', segment: '',
                                            project_summary: '', current_phase: '', next_step: '',
                                            team_status: '', operational_processes: ''
                                        });
                                    }}>Cancelar</Button>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Clients List */}
                    {isLoading ? (
                        <div className="text-center py-8">
                            <Loader2 className="h-6 w-6 mx-auto animate-spin text-muted-foreground" />
                        </div>
                    ) : (
                        <Card className="nc-card-border">
                            <CardContent className="p-0">
                                <div className="divide-y divide-border">
                                    {clients.map(c => (
                                        <div key={c.id} className="p-3 flex items-center justify-between hover:bg-muted/50 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-full bg-nc-info/10 flex items-center justify-center text-nc-info font-bold text-sm">
                                                    {c.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium">{c.name}</p>
                                                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                                        {c.company && <span>{c.company}</span>}
                                                        {c.email && <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{c.email}</span>}
                                                        {c.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{c.phone}</span>}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {c.segment && (
                                                    <Badge variant="secondary" className="text-xs">{c.segment}</Badge>
                                                )}
                                                <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => handleEditClient(c)}>
                                                    <Plus className="h-4 w-4 rotate-45" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                    {clients.length === 0 && (
                                        <div className="p-8 text-center text-muted-foreground text-sm">
                                            Nenhum cliente cadastrado
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            )}
        </div>
    );
}
