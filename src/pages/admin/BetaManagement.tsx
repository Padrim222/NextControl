import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/Spinner';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowLeft,
    Flag,
    Users,
    Shield,
    Zap,
    Search,
    CheckCircle,
    XCircle,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface FeatureFlag {
    id: string;
    flag_key: string;
    description: string;
    is_enabled: boolean;
    client_ids: string[];
    created_at: string;
}

interface ClientRow {
    id: string;
    name: string;
    company?: string;
    is_beta: boolean;
}

export default function BetaManagement() {
    const navigate = useNavigate();
    const [flags, setFlags] = useState<FeatureFlag[]>([]);
    const [clients, setClients] = useState<ClientRow[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState('');

    useEffect(() => {
        fetchAll();
    }, []);

    const fetchAll = async () => {
        setIsLoading(true);
        try {
            const [flagRes, clientRes] = await Promise.all([
                (supabase as any).from('feature_flags').select('*').order('flag_key'),
                (supabase as any).from('clients').select('id, name, company, is_beta').order('name'),
            ]);
            setFlags(flagRes.data || []);
            setClients(clientRes.data || []);
        } catch (err) {
            toast.error('Erro ao carregar dados');
        } finally {
            setIsLoading(false);
        }
    };

    const toggleFlag = async (flag: FeatureFlag) => {
        const { error } = await (supabase as any)
            .from('feature_flags')
            .update({ is_enabled: !flag.is_enabled, updated_at: new Date().toISOString() })
            .eq('id', flag.id);

        if (error) {
            toast.error('Erro ao atualizar flag');
            return;
        }
        setFlags(prev => prev.map(f => f.id === flag.id ? { ...f, is_enabled: !f.is_enabled } : f));
        toast.success(`${flag.flag_key} ${!flag.is_enabled ? 'ativada' : 'desativada'}`);
    };

    const toggleBeta = async (client: ClientRow) => {
        const { error } = await (supabase as any)
            .from('clients')
            .update({ is_beta: !client.is_beta })
            .eq('id', client.id);

        if (error) {
            toast.error('Erro ao atualizar cliente');
            return;
        }
        setClients(prev => prev.map(c => c.id === client.id ? { ...c, is_beta: !c.is_beta } : c));
        toast.success(`${client.name} ${!client.is_beta ? 'adicionado ao' : 'removido do'} beta`);
    };

    const toggleClientOnFlag = async (flag: FeatureFlag, clientId: string) => {
        const hasClient = flag.client_ids.includes(clientId);
        const newIds = hasClient
            ? flag.client_ids.filter(id => id !== clientId)
            : [...flag.client_ids, clientId];

        const { error } = await (supabase as any)
            .from('feature_flags')
            .update({ client_ids: newIds, updated_at: new Date().toISOString() })
            .eq('id', flag.id);

        if (error) {
            toast.error('Erro ao atualizar');
            return;
        }
        setFlags(prev => prev.map(f => f.id === flag.id ? { ...f, client_ids: newIds } : f));
    };

    const betaClients = clients.filter(c => c.is_beta);
    const filteredClients = clients.filter(c =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.company?.toLowerCase().includes(search.toLowerCase())
    );

    if (isLoading) {
        return <div className="min-h-[60vh] flex items-center justify-center"><Spinner size="md" /></div>;
    }

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon" onClick={() => navigate('/admin')}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <Shield className="h-6 w-6 text-solar" />
                        Beta <span className="nc-gradient-text">Management</span>
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        {betaClients.length} clientes beta • {flags.filter(f => f.is_enabled).length}/{flags.length} features ativas
                    </p>
                </div>
            </div>

            {/* Feature Flags */}
            <Card className="nc-card-border bg-card">
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Flag className="h-5 w-5 text-solar" />
                        Feature Flags
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    {flags.map((flag, i) => (
                        <motion.div
                            key={flag.id}
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.05 }}
                            className="flex items-center justify-between p-3 rounded-xl bg-muted/30 border border-border/50"
                        >
                            <div className="flex items-center gap-3">
                                <Zap className={`h-4 w-4 ${flag.is_enabled ? 'text-emerald-400' : 'text-muted-foreground'}`} />
                                <div>
                                    <p className="font-mono text-sm font-medium">{flag.flag_key}</p>
                                    <p className="text-xs text-muted-foreground">{flag.description}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <Badge variant="outline" className="text-[10px]">
                                    {flag.client_ids.length} clientes
                                </Badge>
                                <Switch checked={flag.is_enabled} onCheckedChange={() => toggleFlag(flag)} />
                            </div>
                        </motion.div>
                    ))}
                </CardContent>
            </Card>

            {/* Beta Clients */}
            <Card className="nc-card-border bg-card">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Users className="h-5 w-5 text-solar" />
                            Clientes Beta ({betaClients.length})
                        </CardTitle>
                        <div className="relative w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Buscar cliente..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                className="pl-9 h-8 text-sm"
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                        {filteredClients.map((client) => (
                            <div
                                key={client.id}
                                className={`flex items-center justify-between p-3 rounded-xl border transition-all ${client.is_beta
                                        ? 'bg-solar/5 border-solar/20'
                                        : 'bg-muted/30 border-border/50'
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    {client.is_beta ? (
                                        <CheckCircle className="h-4 w-4 text-emerald-400" />
                                    ) : (
                                        <XCircle className="h-4 w-4 text-muted-foreground" />
                                    )}
                                    <div>
                                        <p className="text-sm font-medium">{client.name}</p>
                                        {client.company && (
                                            <p className="text-xs text-muted-foreground">{client.company}</p>
                                        )}
                                    </div>
                                </div>
                                <Switch checked={client.is_beta} onCheckedChange={() => toggleBeta(client)} />
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Per-flag client assignments */}
            {flags.filter(f => f.is_enabled).length > 0 && betaClients.length > 0 && (
                <Card className="nc-card-border bg-card">
                    <CardHeader>
                        <CardTitle className="text-lg">Acesso por Feature</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-border/50">
                                        <th className="text-left py-2 px-3 text-muted-foreground font-medium">Cliente</th>
                                        {flags.filter(f => f.is_enabled).map(f => (
                                            <th key={f.id} className="text-center py-2 px-2 text-muted-foreground font-mono text-xs">
                                                {f.flag_key}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {betaClients.map(client => (
                                        <tr key={client.id} className="border-b border-border/30">
                                            <td className="py-2 px-3 font-medium">{client.name}</td>
                                            {flags.filter(f => f.is_enabled).map(f => (
                                                <td key={f.id} className="text-center py-2 px-2">
                                                    <Switch
                                                        checked={f.client_ids.includes(client.id)}
                                                        onCheckedChange={() => toggleClientOnFlag(f, client.id)}
                                                    />
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
