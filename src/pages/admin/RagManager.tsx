import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Database, Plus, Trash2, Search, FileText, Loader2, Info, Users, Target, Briefcase } from '@/components/ui/icons';

const CATEGORIES = [
    { value: 'estrategia', label: '🎯 Estratégia' },
    { value: 'oferta', label: '💰 Oferta' },
    { value: 'posicionamento', label: '📍 Posicionamento' },
    { value: 'copy', label: '✍️ Copy' },
    { value: 'funil', label: '🔄 Funil' },
    { value: 'scripts', label: '📝 Scripts' },
    { value: 'social_selling', label: '📱 Social Selling' },
    { value: 'call_analysis', label: '📞 Call Analysis' },
    { value: 'processos', label: '⚙️ Processos' },
    { value: 'playbooks', label: '📖 Playbooks' },
];

const AGENT_TYPES = [
    { value: 'geral', label: '📚 Base Geral' },
    { value: 'ss', label: '🎯 Agente SS (Social Selling)' },
    { value: 'closer', label: '💼 Agente Closer' },
];

interface RagDocument {
    id: string;
    title: string;
    content: string;
    category: string;
    agent_type: string;
    is_active: boolean;
    created_at: string;
}

interface Client {
    id: string;
    name: string;
}

export default function RagManager() {
    const [documents, setDocuments] = useState<RagDocument[]>([]);
    const [clients, setClients] = useState<Client[]>([]);
    const [loading, setLoading] = useState(true);
    const [ingesting, setIngesting] = useState(false);
    const [searching, setSearching] = useState(false);
    const [showForm, setShowForm] = useState(false);

    const [newDoc, setNewDoc] = useState({
        title: '',
        content: '',
        category: '',
        agent_type: 'geral',
        client_id: '',
    });
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [filterCategory, setFilterCategory] = useState<string>('all');
    const [filterAgentType, setFilterAgentType] = useState<string>('all');
    const [filterClientId, setFilterClientId] = useState<string>('all');

    useEffect(() => {
        fetchDocuments();
        fetchClients();
    }, []);

    async function fetchClients() {
        const { data, error } = await supabase
            .from('clients')
            .select('id, name')
            .order('name', { ascending: true });

        if (!error && data) {
            setClients(data);
        }
    }

    async function fetchDocuments() {
        setLoading(true);
        const { data, error } = await supabase
            .from('rag_documents')
            .select('id, title, content, category, agent_type, is_active, created_at')
            .order('created_at', { ascending: false });

        if (error) {
            toast.error('Erro ao carregar documentos');
            console.error(error);
        } else {
            setDocuments(data || []);
        }
        setLoading(false);
    }

    async function handleIngest() {
        if (!newDoc.title || !newDoc.content || !newDoc.category) {
            toast.error('Preencha todos os campos');
            return;
        }

        setIngesting(true);
        try {
            const response = await supabase.functions.invoke('rag-ingest', {
                body: {
                    title: newDoc.title,
                    content: newDoc.content,
                    category: newDoc.category,
                    agent_type: newDoc.agent_type,
                    client_id: newDoc.client_id || undefined,
                },
            });

            if (response.error) throw response.error;

            toast.success('Documento adicionado à base de conhecimento!');
            setNewDoc({ title: '', content: '', category: '', agent_type: 'geral', client_id: '' });
            setShowForm(false);
            fetchDocuments();
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Erro ao adicionar documento';
            toast.error(message);
        }
        setIngesting(false);
    }

    async function handleSearch() {
        if (!searchQuery.trim()) return;

        setSearching(true);
        try {
            const response = await supabase.functions.invoke('rag-query', {
                body: {
                    query: searchQuery,
                    category: filterCategory !== 'all' ? filterCategory : undefined,
                    max_results: 5,
                },
            });

            if (response.error) throw response.error;

            setSearchResults(response.data?.results || []);
            if (!response.data?.results?.length) {
                toast.info('Nenhum resultado encontrado');
            }
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Erro na busca';
            toast.error(message);
        }
        setSearching(false);
    }

    async function handleDelete(id: string) {
        const { error } = await supabase
            .from('rag_documents')
            .delete()
            .eq('id', id);

        if (error) {
            toast.error('Erro ao deletar documento');
        } else {
            toast.success('Documento removido');
            fetchDocuments();
        }
    }

    const filteredDocs = documents.filter(d => {
        if (filterCategory !== 'all' && d.category !== filterCategory) return false;
        if (filterAgentType !== 'all' && (d.agent_type || 'geral') !== filterAgentType) return false;
        return true;
    });

    function getAgentBadge(agent_type: string) {
        const type = agent_type || 'geral';
        if (type === 'ss') {
            return (
                <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 font-medium">
                    <Target size={10} />
                    SS
                </span>
            );
        }
        if (type === 'closer') {
            return (
                <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 font-medium">
                    <Briefcase size={10} />
                    Closer
                </span>
            );
        }
        return (
            <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-gray-500/10 text-gray-500 font-medium">
                <FileText size={10} />
                Geral
            </span>
        );
    }

    const selectedClient = clients.find(c => c.id === newDoc.client_id);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <Database className="h-6 w-6 text-amber-500" />
                        Base de Conhecimento
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        {documents.length} documento{documents.length !== 1 ? 's' : ''} indexado{documents.length !== 1 ? 's' : ''} · A IA usa isso para analisar os vendedores
                    </p>
                </div>
                <Button onClick={() => setShowForm(!showForm)} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Adicionar Material
                </Button>
            </div>

            {/* How-to guide */}
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                <div className="flex items-start gap-3">
                    <Info className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-amber-800 space-y-1">
                        <p className="font-semibold">Como embedar material de um cliente:</p>
                        <ol className="list-decimal list-inside space-y-1 text-amber-700">
                            <li>Clique em <strong>"Adicionar Material"</strong> no canto superior direito.</li>
                            <li>Cole o conteúdo do material no campo de texto (playbook, script, estratégia, etc.).</li>
                            <li>Escolha a categoria certa (ex: Estratégia, Scripts, Playbooks).</li>
                            <li>Escolha o <strong>Agente</strong> para o qual o material se destina (SS, Closer ou Base Geral).</li>
                            <li>Clique em <strong>"Adicionar &amp; Indexar"</strong> — a IA passa a usar esse conteúdo automaticamente.</li>
                        </ol>
                        <p className="mt-1 text-amber-600 text-xs">Quanto mais material relevante você adicionar, mais precisa fica a análise da IA.</p>
                    </div>
                </div>
            </div>

            {/* Search Section */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <Search className="h-4 w-4" />
                        Busca Semântica
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex gap-2 flex-wrap">
                        <Input
                            placeholder="Buscar na base de conhecimento..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                            className="flex-1 min-w-[200px]"
                        />
                        <Select value={filterCategory} onValueChange={setFilterCategory}>
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Categoria" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todas as categorias</SelectItem>
                                {CATEGORIES.map(cat => (
                                    <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Select value={filterAgentType} onValueChange={setFilterAgentType}>
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Agente" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todos os agentes</SelectItem>
                                {AGENT_TYPES.map(a => (
                                    <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Button onClick={handleSearch} disabled={searching}>
                            {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                        </Button>
                    </div>

                    {searchResults.length > 0 && (
                        <div className="mt-4 space-y-3">
                            <h3 className="text-sm font-medium text-muted-foreground">Resultados:</h3>
                            {searchResults.map((result) => (
                                <div key={result.id} className="p-3 rounded-lg border bg-muted/30">
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="font-medium text-sm">{result.title}</span>
                                        <span className="text-xs text-amber-600 font-mono">
                                            {(result.similarity * 100).toFixed(1)}% match
                                        </span>
                                    </div>
                                    <p className="text-xs text-muted-foreground line-clamp-2">{result.content}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Add Document Form */}
            {showForm && (
                <Card className="border-amber-500/50">
                    <CardHeader>
                        <CardTitle className="text-sm font-medium">Adicionar Documento</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Input
                            placeholder="Título do documento"
                            value={newDoc.title}
                            onChange={(e) => setNewDoc({ ...newDoc, title: e.target.value })}
                        />

                        {/* Client Selector */}
                        <div className="space-y-1">
                            <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                                <Users size={12} />
                                Cliente (opcional)
                            </label>
                            <Select value={newDoc.client_id || 'none'} onValueChange={(v) => setNewDoc({ ...newDoc, client_id: v === 'none' ? '' : v })}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Todos os clientes" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">Todos os clientes</SelectItem>
                                    {clients.map(client => (
                                        <SelectItem key={client.id} value={client.id}>{client.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {selectedClient && (
                                <p className="text-xs text-blue-600 flex items-center gap-1">
                                    <Users size={12} />
                                    Carregando material para: <strong>{selectedClient.name}</strong>
                                </p>
                            )}
                        </div>

                        <Select value={newDoc.category} onValueChange={(v) => setNewDoc({ ...newDoc, category: v })}>
                            <SelectTrigger>
                                <SelectValue placeholder="Selecione a categoria" />
                            </SelectTrigger>
                            <SelectContent>
                                {CATEGORIES.map(cat => (
                                    <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        {/* Agent Type Selector */}
                        <div className="space-y-1">
                            <label className="text-xs font-medium text-muted-foreground">
                                Agente de destino
                            </label>
                            <Select value={newDoc.agent_type} onValueChange={(v) => setNewDoc({ ...newDoc, agent_type: v })}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecione o agente" />
                                </SelectTrigger>
                                <SelectContent>
                                    {AGENT_TYPES.map(a => (
                                        <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <p className="text-xs text-muted-foreground">
                                Escolha para qual agente este material será carregado
                            </p>
                        </div>

                        <Textarea
                            placeholder="Conteúdo do documento (texto completo para indexação)"
                            value={newDoc.content}
                            onChange={(e) => setNewDoc({ ...newDoc, content: e.target.value })}
                            rows={8}
                        />
                        <div className="flex gap-2">
                            <Button onClick={handleIngest} disabled={ingesting} className="gap-2">
                                {ingesting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                                {ingesting ? 'Indexando...' : 'Adicionar & Indexar'}
                            </Button>
                            <Button variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Documents List */}
            <div className="space-y-3">
                <h2 className="text-sm font-medium text-muted-foreground">
                    Documentos ({filteredDocs.length})
                </h2>
                {loading ? (
                    <div className="flex justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                ) : filteredDocs.length === 0 ? (
                    <Card className="p-8 text-center text-muted-foreground">
                        <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>Nenhum documento na base</p>
                    </Card>
                ) : (
                    filteredDocs.map(doc => (
                        <Card key={doc.id} className="hover:border-amber-500/30 transition-colors">
                            <CardContent className="p-4 flex items-start justify-between">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                                        <span className="font-medium text-sm">{doc.title}</span>
                                        <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600">
                                            {CATEGORIES.find(c => c.value === doc.category)?.label || doc.category}
                                        </span>
                                        {getAgentBadge(doc.agent_type)}
                                    </div>
                                    <p className="text-xs text-muted-foreground line-clamp-2">{doc.content}</p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        {new Date(doc.created_at).toLocaleDateString('pt-BR')}
                                    </p>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleDelete(doc.id)}
                                    className="text-destructive hover:text-destructive"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
}
