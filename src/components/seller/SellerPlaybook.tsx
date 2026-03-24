import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { BookOpen, AlertTriangle, Plus, Copy, Trash2, Search, Check } from 'lucide-react';
import type { SellerPlaybookItem } from '@/types';

export function SellerPlaybook() {
    const { user } = useAuth();
    const [items, setItems] = useState<SellerPlaybookItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [copiedId, setCopiedId] = useState<string | null>(null);

    // Form state
    const [isAdding, setIsAdding] = useState(false);
    const [newType, setNewType] = useState<'script' | 'blacklist' | 'objection_handling'>('script');
    const [newTitle, setNewTitle] = useState('');
    const [newContent, setNewContent] = useState('');

    useEffect(() => {
        if (user) fetchPlaybook();
    }, [user]);

    const fetchPlaybook = async () => {
        setIsLoading(true);
        const { data, error } = await supabase
            .from('seller_scripts')
            .select('*')
            .eq('user_id', user?.id)
            .order('created_at', { ascending: false });

        if (!error && data) {
            setItems(data as unknown as SellerPlaybookItem[]);
        }
        setIsLoading(false);
    };

    const handleAddItem = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        const { error } = await supabase.from('seller_scripts').insert({
            user_id: user.id,
            type: newType,
            title: newTitle,
            content: newContent
        } as unknown as import('@/types/database.types').Database['public']['Tables']['seller_scripts']['Insert']);

        if (error) {
            toast.error('Erro ao salvar item');
        } else {
            toast.success('Adicionado ao seu Playbook!');
            setIsAdding(false);
            setNewTitle('');
            setNewContent('');
            fetchPlaybook();
        }
    };

    const handleDelete = async (id: string) => {
        const { error } = await supabase
            .from('seller_scripts')
            .delete()
            .eq('id', id);

        if (error) {
            toast.error('Erro ao excluir');
        } else {
            setItems(items.filter(i => i.id !== id));
            toast.success('Removido');
        }
    };

    const copyToClipboard = (text: string, id: string) => {
        navigator.clipboard.writeText(text);
        setCopiedId(id);
        toast.success('Copiado!');
        setTimeout(() => setCopiedId(null), 2000);
    };

    const filteredItems = items.filter(item =>
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.content.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const renderList = (type: string) => {
        const list = filteredItems.filter(i => i.type === type);

        if (list.length === 0) {
            return (
                <div className="py-8 text-center text-muted-foreground border border-dashed rounded-lg border-border">
                    <p className="text-sm">Nenhum item encontrado.</p>
                </div>
            );
        }

        return (
            <div className="grid grid-cols-1 gap-3">
                {list.map((item) => (
                    <div key={item.id} className={`p-4 rounded-lg border transition-all ${item.type === 'blacklist'
                            ? 'bg-red-500/5 border-red-500/20 hover:border-red-500/40'
                            : 'bg-card border-border hover:border-solar/30'
                        }`}>
                        <div className="flex justify-between items-start mb-2">
                            <h4 className="font-semibold text-sm">{item.title}</h4>
                            <div className="flex gap-1">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7"
                                    onClick={() => copyToClipboard(item.content, item.id)}
                                >
                                    {copiedId === item.id ? <Check className="h-4 w-4 text-nc-success" /> : <Copy className="h-4 w-4" />}
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 text-muted-foreground hover:text-red-400"
                                    onClick={() => handleDelete(item.id)}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                        <p className="text-xs text-muted-foreground whitespace-pre-wrap line-clamp-4">
                            {item.content}
                        </p>
                    </div>
                ))}
            </div>
        );
    };

    return (
        <Card className="nc-card-border bg-card/50">
            <CardHeader className="pb-3">
                <div className="flex justify-between items-center">
                    <div>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <BookOpen className="h-5 w-5 text-solar" />
                            Meu Playbook
                        </CardTitle>
                        <CardDescription>Seus scripts e avisos de segurança.</CardDescription>
                    </div>
                    <Button
                        size="sm"
                        variant={isAdding ? "ghost" : "outline"}
                        onClick={() => setIsAdding(!isAdding)}
                        className={!isAdding ? "border-solar/30 text-solar" : ""}
                    >
                        {isAdding ? "Cancelar" : <><Plus className="h-4 w-4 mr-1" /> Novo</>}
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                {isAdding ? (
                    <form onSubmit={handleAddItem} className="space-y-4 p-4 rounded-lg bg-muted/30 border border-border mb-6 fade-in">
                        <div className="grid grid-cols-3 gap-2">
                            <Button
                                type="button"
                                variant={newType === 'script' ? 'default' : 'outline'}
                                size="sm"
                                className="text-xs"
                                onClick={() => setNewType('script')}
                            >
                                Script
                            </Button>
                            <Button
                                type="button"
                                variant={newType === 'objection_handling' ? 'default' : 'outline'}
                                size="sm"
                                className="text-xs"
                                onClick={() => setNewType('objection_handling')}
                            >
                                Objeção
                            </Button>
                            <Button
                                type="button"
                                variant={newType === 'blacklist' ? 'destructive' : 'outline'}
                                size="sm"
                                className="text-xs"
                                onClick={() => setNewType('blacklist')}
                            >
                                Blacklist
                            </Button>
                        </div>
                        <Input
                            placeholder="Título (ex: Abordagem Inicial)"
                            value={newTitle}
                            onChange={e => setNewTitle(e.target.value)}
                            required
                        />
                        <Textarea
                            placeholder="Conteúdo do texto..."
                            value={newContent}
                            onChange={e => setNewContent(e.target.value)}
                            required
                            rows={4}
                        />
                        <Button type="submit" className="w-full bg-solar text-deep-space">Salvar no Playbook</Button>
                    </form>
                ) : (
                    <div className="relative mb-4">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Buscar no playbook..."
                            className="pl-9 h-9"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                        />
                    </div>
                )}

                <Tabs defaultValue="script">
                    <TabsList className="grid w-full grid-cols-3 mb-4">
                        <TabsTrigger value="script">Scripts</TabsTrigger>
                        <TabsTrigger value="objection_handling">Objeções</TabsTrigger>
                        <TabsTrigger value="blacklist" className="data-[state=active]:bg-red-500/20 data-[state=active]:text-red-400">
                            Blacklist
                        </TabsTrigger>
                    </TabsList>
                    <TabsContent value="script" className="mt-0">{renderList('script')}</TabsContent>
                    <TabsContent value="objection_handling" className="mt-0">{renderList('objection_handling')}</TabsContent>
                    <TabsContent value="blacklist" className="mt-0">{renderList('blacklist')}</TabsContent>
                </Tabs>
            </CardContent>
        </Card>
    );
}
