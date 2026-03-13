import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
    Phone,
    Mail,
    Info,
    Link as LinkIcon,
    Pencil,
    Trash2,
} from '@/components/ui/icons';

type UserRole = 'seller' | 'closer' | 'cs' | 'client' | 'admin';

interface ManagedUser {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    seller_type: string | null;
    status: string;
    client_id: string | null;
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
    const [newUser, setNewUser] = useState({ name: '', email: '', role: 'seller' as UserRole, password: '', client_id: '' });
    const [isCreatingUser, setIsCreatingUser] = useState(false);
    const [createdCredentials, setCreatedCredentials] = useState<{ email: string; password: string } | null>(null);

    // New client form
    const [showClientForm, setShowClientForm] = useState(false);
    const [newClient, setNewClient] = useState({ name: '', email: '', phone: '', company: '', segment: '' });
    const [isCreatingClient, setIsCreatingClient] = useState(false);

    // Link user to client
    const [linkingUserId, setLinkingUserId] = useState<string | null>(null);
    const [selectedClientId, setSelectedClientId] = useState('');
    const [isLinking, setIsLinking] = useState(false);

    // Edit client
    const [editingClientId, setEditingClientId] = useState<string | null>(null);
    const [editForm, setEditForm] = useState({ name: '', email: '', phone: '', company: '', segment: '', status: 'active' });
    const [isSavingClient, setIsSavingClient] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        if (!supabase) return;
        setIsLoading(true);
        try {
            const { data: usersData } = await (supabase as any)
                .from('users')
                .select('id, name, email, role, seller_type, status, client_id, created_at')
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
        if (newUser.role === 'client' && !newUser.client_id) {
            toast.error('Selecione o cliente que este usuário irá acessar');
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
            if (!authData.user) throw new Error('Criação de usuário falhou');

            const insertData: any = {
                id: authData.user.id,
                email: newUser.email.trim().toLowerCase(),
                name: newUser.name.trim(),
                role: newUser.role,
                status: 'active',
            };

            if (newUser.role === 'client' && newUser.client_id) {
                insertData.client_id = newUser.client_id;
            }

            await (supabase as any).from('users').upsert([insertData], { onConflict: 'id' });

            toast.success(`✅ Usuário ${newUser.name} criado!`, {
                description: newUser.role === 'client'
                    ? 'O cliente já pode acessar o painel com as credenciais abaixo.'
                    : 'Envie as credenciais para o novo membro.'
            });
            setCreatedCredentials({ email: newUser.email.trim().toLowerCase(), password });
            setNewUser({ name: '', email: '', role: 'seller', password: '', client_id: '' });
            setShowUserForm(false);
            fetchData();
        } catch (error: any) {
            if (error?.message?.includes('already registered')) {
                toast.error('Este email já está cadastrado no sistema.');
            } else {
                toast.error(error?.message || 'Erro ao criar usuário');
            }
        } finally {
            setIsCreatingUser(false);
        }
    };

    const handleCreateClient = async () => {
        if (!newClient.name.trim()) {
            toast.error('Nome é obrigatório');
            return;
        }
        setIsCreatingClient(true);
        try {
            const { error } = await (supabase as any).from('clients').insert({
                name: newClient.name.trim(),
                email: newClient.email.trim() || null,
                phone: newClient.phone.trim() || null,
                company: newClient.company.trim() || null,
                segment: newClient.segment.trim() || null,
                status: 'active',
            });

            if (error) throw error;

            toast.success(`Cliente ${newClient.name} criado!`, {
                description: 'Agora crie um usuário de acesso para ele na aba Equipe.'
            });
            setNewClient({ name: '', email: '', phone: '', company: '', segment: '' });
            setShowClientForm(false);
            fetchData();
        } catch (error: any) {
            toast.error(error?.message || 'Erro ao criar cliente');
        } finally {
            setIsCreatingClient(false);
        }
    };

    const handleLinkUserToClient = async (userId: string) => {
        if (!selectedClientId) {
            toast.error('Selecione um cliente para vincular');
            return;
        }
        setIsLinking(true);
        try {
            const { error } = await (supabase as any)
                .from('users')
                .update({ client_id: selectedClientId })
                .eq('id', userId);
            if (error) throw error;
            toast.success('Usuário vinculado ao cliente!');
            setLinkingUserId(null);
            setSelectedClientId('');
            fetchData();
        } catch (error: any) {
            toast.error(error?.message || 'Erro ao vincular');
        } finally {
            setIsLinking(false);
        }
    };

    const handleEditClient = (c: ManagedClient) => {
        setEditingClientId(c.id);
        setEditForm({
            name: c.name,
            email: c.email || '',
            phone: c.phone || '',
            company: c.company || '',
            segment: c.segment || '',
            status: c.status,
        });
    };

    const handleSaveClient = async () => {
        if (!editingClientId) return;
        if (!editForm.name.trim()) {
            toast.error('Nome é obrigatório');
            return;
        }
        setIsSavingClient(true);
        try {
            const { error } = await (supabase as any)
                .from('clients')
                .update({
                    name: editForm.name.trim(),
                    email: editForm.email.trim() || null,
                    phone: editForm.phone.trim() || null,
                    company: editForm.company.trim() || null,
                    segment: editForm.segment.trim() || null,
                    status: editForm.status,
                })
                .eq('id', editingClientId);
            if (error) throw error;
            toast.success('Cliente atualizado!');
            setEditingClientId(null);
            fetchData();
        } catch (error: any) {
            toast.error(error?.message || 'Erro ao salvar cliente');
        } finally {
            setIsSavingClient(false);
        }
    };

    const handleDeleteClient = async (id: string, name: string) => {
        if (!window.confirm(`Tem certeza que deseja excluir o cliente "${name}"? Esta ação não pode ser desfeita.`)) return;
        try {
            const { error } = await (supabase as any)
                .from('clients')
                .delete()
                .eq('id', id);
            if (error) throw error;
            toast.success(`Cliente ${name} excluído.`);
            if (editingClientId === id) setEditingClientId(null);
            fetchData();
        } catch (error: any) {
            toast.error(error?.message || 'Erro ao excluir cliente');
        }
    };

    const copyCredentials = () => {
        if (!createdCredentials) return;
        const text = `Login: ${createdCredentials.email}\nSenha: ${createdCredentials.password}`;
        navigator.clipboard.writeText(text);
        toast.success('Credenciais copiadas!');
    };

    const getClientName = (clientId: string | null) => {
        if (!clientId) return null;
        return clients.find(c => c.id === clientId)?.name || null;
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

            {/* Guide Banner */}
            <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
                <div className="flex items-start gap-3">
                    <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-blue-800 space-y-1">
                        <p className="font-semibold">Como adicionar um cliente ao sistema:</p>
                        <ol className="list-decimal list-inside space-y-1 text-blue-700">
                            <li>Na aba <strong>Clientes</strong>, clique em "Novo Cliente" e preencha os dados da empresa.</li>
                            <li>Na aba <strong>Equipe</strong>, clique em "Novo Membro", selecione a função <strong>Cliente</strong> e vincule ao cliente criado no passo 1.</li>
                            <li>Copie o email e senha gerados e envie para o cliente — ele já pode acessar o painel.</li>
                        </ol>
                        <p className="mt-2 text-blue-600 font-medium">Para embedar material do cliente: menu lateral → <strong>Base de Conhecimento</strong></p>
                    </div>
                </div>
            </div>

            {/* Credentials Card */}
            {createdCredentials && (
                <Card className="nc-card-border border-nc-success/30 bg-nc-success/5">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-nc-success">✅ Usuário criado! Copie e envie as credenciais:</p>
                                <p className="text-sm font-mono mt-1">
                                    Login: <strong>{createdCredentials.email}</strong> · Senha: <strong>{createdCredentials.password}</strong>
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">O usuário deve acessar o sistema com esses dados e pode trocar a senha depois.</p>
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
                        <div>
                            <h3 className="text-lg font-semibold">Equipe & Acessos</h3>
                            <p className="text-xs text-muted-foreground">Membros com login no sistema</p>
                        </div>
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
                                <CardDescription>
                                    A senha padrão é <strong>NextControl2026!</strong> — o usuário pode alterar depois.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <Label>Nome completo</Label>
                                        <Input
                                            placeholder="Nome do usuário"
                                            value={newUser.name}
                                            onChange={e => setNewUser(prev => ({ ...prev, name: e.target.value }))}
                                        />
                                    </div>
                                    <div>
                                        <Label>Email de acesso</Label>
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
                                        <Label>Função no sistema</Label>
                                        <select
                                            value={newUser.role}
                                            onChange={e => setNewUser(prev => ({ ...prev, role: e.target.value as UserRole, client_id: '' }))}
                                            className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                                        >
                                            <option value="seller">Seller (Vendedor)</option>
                                            <option value="closer">Closer</option>
                                            <option value="cs">CS (Suporte)</option>
                                            <option value="client">Cliente (acesso ao painel do cliente)</option>
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

                                {/* Client linking — only shown when role = client */}
                                {newUser.role === 'client' && (
                                    <div className="rounded-lg border border-purple-200 bg-purple-50 p-3 space-y-2">
                                        <p className="text-xs font-semibold text-purple-800 flex items-center gap-1.5">
                                            <LinkIcon className="h-3 w-3" />
                                            Vincular ao cliente (obrigatório para role Cliente)
                                        </p>
                                        <p className="text-xs text-purple-600">
                                            Selecione o cliente que este usuário irá acessar. Se o cliente ainda não existe, crie-o primeiro na aba "Clientes".
                                        </p>
                                        <select
                                            value={newUser.client_id}
                                            onChange={e => setNewUser(prev => ({ ...prev, client_id: e.target.value }))}
                                            className="w-full h-10 px-3 rounded-md border border-purple-300 bg-white text-sm"
                                        >
                                            <option value="">— Selecione o cliente —</option>
                                            {clients.map(c => (
                                                <option key={c.id} value={c.id}>
                                                    {c.name}{c.company ? ` (${c.company})` : ''}
                                                </option>
                                            ))}
                                        </select>
                                        {clients.length === 0 && (
                                            <p className="text-xs text-amber-700 font-medium">
                                                Nenhum cliente cadastrado. Crie um cliente na aba "Clientes" primeiro.
                                            </p>
                                        )}
                                    </div>
                                )}

                                <div className="flex gap-2 pt-2">
                                    <Button onClick={handleCreateUser} disabled={isCreatingUser}>
                                        {isCreatingUser ? <><Loader2 className="h-4 w-4 mr-1 animate-spin" /> Criando...</> : 'Criar Acesso'}
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
                                        <div key={u.id}>
                                            <div className="p-3 flex items-center justify-between hover:bg-muted/50 transition-colors">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 rounded-full bg-solar/10 flex items-center justify-center text-solar font-bold text-sm">
                                                        {u.name.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-medium">{u.name}</p>
                                                        <p className="text-xs text-muted-foreground">{u.email}</p>
                                                        {u.role === 'client' && (
                                                            <p className="text-xs mt-0.5">
                                                                {u.client_id
                                                                    ? <span className="text-purple-600 font-medium">→ {getClientName(u.client_id)}</span>
                                                                    : <span className="text-amber-600 font-medium">⚠ Sem cliente vinculado</span>
                                                                }
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Badge className={`text-xs ${ROLE_COLORS[u.role] || ''}`}>
                                                        {ROLE_LABELS[u.role] || u.role}
                                                    </Badge>
                                                    <Badge variant={u.status === 'active' ? 'default' : 'secondary'} className="text-xs">
                                                        {u.status === 'active' ? '✓' : u.status}
                                                    </Badge>
                                                    {u.role === 'client' && !u.client_id && (
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            className="text-xs h-7 border-purple-300 text-purple-700 hover:bg-purple-50"
                                                            onClick={() => {
                                                                setLinkingUserId(u.id);
                                                                setSelectedClientId('');
                                                            }}
                                                        >
                                                            <LinkIcon className="h-3 w-3 mr-1" />
                                                            Vincular
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                            {/* Inline link panel */}
                                            {linkingUserId === u.id && (
                                                <div className="px-4 pb-3 bg-purple-50 border-t border-purple-100">
                                                    <p className="text-xs text-purple-700 font-medium pt-2 mb-2">Selecione o cliente para vincular a {u.name}:</p>
                                                    <div className="flex gap-2">
                                                        <select
                                                            value={selectedClientId}
                                                            onChange={e => setSelectedClientId(e.target.value)}
                                                            className="flex-1 h-8 px-2 rounded border border-purple-300 bg-white text-xs"
                                                        >
                                                            <option value="">— Selecione —</option>
                                                            {clients.map(c => (
                                                                <option key={c.id} value={c.id}>
                                                                    {c.name}{c.company ? ` (${c.company})` : ''}
                                                                </option>
                                                            ))}
                                                        </select>
                                                        <Button
                                                            size="sm"
                                                            className="h-8 text-xs"
                                                            onClick={() => handleLinkUserToClient(u.id)}
                                                            disabled={isLinking || !selectedClientId}
                                                        >
                                                            {isLinking ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Vincular'}
                                                        </Button>
                                                        <Button size="sm" variant="ghost" className="h-8 text-xs" onClick={() => setLinkingUserId(null)}>
                                                            Cancelar
                                                        </Button>
                                                    </div>
                                                </div>
                                            )}
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
                        <div>
                            <h3 className="text-lg font-semibold">Clientes Cadastrados</h3>
                            <p className="text-xs text-muted-foreground">Empresas e projetos gerenciados</p>
                        </div>
                        <Button onClick={() => setShowClientForm(!showClientForm)} size="sm">
                            <Plus className="h-4 w-4 mr-1" /> Novo Cliente
                        </Button>
                    </div>

                    {/* New Client Form */}
                    {showClientForm && (
                        <Card className="nc-card-border border-primary/20">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base flex items-center gap-2">
                                    <Building2 className="h-4 w-4 text-primary" />
                                    Adicionar Cliente
                                </CardTitle>
                                <CardDescription>
                                    Após criar o cliente aqui, vá para a aba <strong>Equipe</strong> e crie o acesso de login para ele.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <Label>Nome do responsável *</Label>
                                        <Input
                                            placeholder="Nome do cliente"
                                            value={newClient.name}
                                            onChange={e => setNewClient(prev => ({ ...prev, name: e.target.value }))}
                                        />
                                    </div>
                                    <div>
                                        <Label>Empresa</Label>
                                        <Input
                                            placeholder="Nome da empresa"
                                            value={newClient.company}
                                            onChange={e => setNewClient(prev => ({ ...prev, company: e.target.value }))}
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-3 gap-3">
                                    <div>
                                        <Label>Email</Label>
                                        <Input
                                            type="email"
                                            placeholder="email@cliente.com"
                                            value={newClient.email}
                                            onChange={e => setNewClient(prev => ({ ...prev, email: e.target.value }))}
                                        />
                                    </div>
                                    <div>
                                        <Label>Telefone / WhatsApp</Label>
                                        <Input
                                            placeholder="(11) 99999-9999"
                                            value={newClient.phone}
                                            onChange={e => setNewClient(prev => ({ ...prev, phone: e.target.value }))}
                                        />
                                    </div>
                                    <div>
                                        <Label>Segmento</Label>
                                        <Input
                                            placeholder="Ex: Clínica, Advocacia"
                                            value={newClient.segment}
                                            onChange={e => setNewClient(prev => ({ ...prev, segment: e.target.value }))}
                                        />
                                    </div>
                                </div>
                                <div className="flex gap-2 pt-2">
                                    <Button onClick={handleCreateClient} disabled={isCreatingClient}>
                                        {isCreatingClient ? <><Loader2 className="h-4 w-4 mr-1 animate-spin" /> Criando...</> : 'Criar Cliente'}
                                    </Button>
                                    <Button variant="ghost" onClick={() => setShowClientForm(false)}>Cancelar</Button>
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
                                    {clients.map(c => {
                                        const linkedUser = users.find(u => u.client_id === c.id);
                                        const isEditing = editingClientId === c.id;
                                        return (
                                            <div key={c.id}>
                                                <div className="p-3 flex items-center justify-between hover:bg-muted/50 transition-colors">
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
                                                            {linkedUser
                                                                ? <p className="text-xs text-emerald-600 mt-0.5">✓ Acesso: {linkedUser.email}</p>
                                                                : <p className="text-xs text-amber-600 mt-0.5">⚠ Sem login — crie na aba Equipe</p>
                                                            }
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        {c.segment && (
                                                            <Badge variant="secondary" className="text-xs">{c.segment}</Badge>
                                                        )}
                                                        <Badge variant={c.status === 'active' ? 'default' : 'secondary'} className="text-xs">
                                                            {c.status === 'active' ? '✓ Ativo' : c.status}
                                                        </Badge>
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                                                            onClick={() => isEditing ? setEditingClientId(null) : handleEditClient(c)}
                                                            title="Editar cliente"
                                                        >
                                                            <Pencil className="h-3.5 w-3.5" />
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                                                            onClick={() => handleDeleteClient(c.id, c.name)}
                                                            title="Excluir cliente"
                                                        >
                                                            <Trash2 className="h-3.5 w-3.5" />
                                                        </Button>
                                                    </div>
                                                </div>
                                                {/* Inline edit panel */}
                                                {isEditing && (
                                                    <div className="px-4 pb-4 bg-muted/30 border-t border-border">
                                                        <p className="text-xs font-semibold text-foreground pt-3 mb-3">Editar cliente</p>
                                                        <div className="grid grid-cols-2 gap-3 mb-3">
                                                            <div>
                                                                <Label className="text-xs">Nome do responsável *</Label>
                                                                <Input
                                                                    className="h-8 text-sm"
                                                                    value={editForm.name}
                                                                    onChange={e => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                                                                />
                                                            </div>
                                                            <div>
                                                                <Label className="text-xs">Empresa</Label>
                                                                <Input
                                                                    className="h-8 text-sm"
                                                                    value={editForm.company}
                                                                    onChange={e => setEditForm(prev => ({ ...prev, company: e.target.value }))}
                                                                />
                                                            </div>
                                                        </div>
                                                        <div className="grid grid-cols-3 gap-3 mb-3">
                                                            <div>
                                                                <Label className="text-xs">Email</Label>
                                                                <Input
                                                                    type="email"
                                                                    className="h-8 text-sm"
                                                                    value={editForm.email}
                                                                    onChange={e => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                                                                />
                                                            </div>
                                                            <div>
                                                                <Label className="text-xs">Telefone</Label>
                                                                <Input
                                                                    className="h-8 text-sm"
                                                                    value={editForm.phone}
                                                                    onChange={e => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
                                                                />
                                                            </div>
                                                            <div>
                                                                <Label className="text-xs">Segmento</Label>
                                                                <Input
                                                                    className="h-8 text-sm"
                                                                    value={editForm.segment}
                                                                    onChange={e => setEditForm(prev => ({ ...prev, segment: e.target.value }))}
                                                                />
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-3 mb-3">
                                                            <div>
                                                                <Label className="text-xs">Status</Label>
                                                                <select
                                                                    value={editForm.status}
                                                                    onChange={e => setEditForm(prev => ({ ...prev, status: e.target.value }))}
                                                                    className="h-8 px-2 rounded-md border border-input bg-background text-sm"
                                                                >
                                                                    <option value="active">Ativo</option>
                                                                    <option value="inactive">Inativo</option>
                                                                </select>
                                                            </div>
                                                        </div>
                                                        <div className="flex gap-2">
                                                            <Button size="sm" className="h-8 text-xs" onClick={handleSaveClient} disabled={isSavingClient}>
                                                                {isSavingClient ? <><Loader2 className="h-3 w-3 mr-1 animate-spin" />Salvando...</> : 'Salvar'}
                                                            </Button>
                                                            <Button size="sm" variant="ghost" className="h-8 text-xs" onClick={() => setEditingClientId(null)}>
                                                                Cancelar
                                                            </Button>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                    {clients.length === 0 && (
                                        <div className="p-8 text-center text-muted-foreground text-sm">
                                            <Building2 className="h-8 w-8 mx-auto mb-2 opacity-30" />
                                            <p>Nenhum cliente cadastrado ainda.</p>
                                            <p className="text-xs mt-1">Clique em "Novo Cliente" para começar.</p>
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
