import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { FileText, Link as LinkIcon, Upload, Search, Library, FileVideo, EyeOff, LayoutGrid, CheckCircle, Bot } from 'lucide-react';
import type { Client, ClientMaterial } from '@/types';

export function ClientMaterialsPanel() {
    const [clients, setClients] = useState<Client[]>([]);
    const [selectedClient, setSelectedClient] = useState<string>('');
    const [materials, setMaterials] = useState<ClientMaterial[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    // Upload state
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [fileType, setFileType] = useState<'link' | 'pdf' | 'video' | 'doc'>('link');
    const [fileUrl, setFileUrl] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [isRagActive, setIsRagActive] = useState(true);
    const [sentToClient, setSentToClient] = useState(true); // Se visivel pro cliente na aba "Meu Plano" / onboarding
    const [category, setCategory] = useState<string>('methodology');
    const [isUploading, setIsUploading] = useState(false);
    const [agentTarget, setAgentTarget] = useState<'ss' | 'closer' | 'both'>('both');

    useEffect(() => {
        const fetchClients = async () => {
            const { data } = await supabase.from('clients').select('*');
            if (data) setClients(data);
        };
        fetchClients();
    }, []);

    useEffect(() => {
        if (!selectedClient) {
            setMaterials([]);
            return;
        }

        const fetchMaterials = async () => {
            setIsLoading(true);
            const { data, error } = await (supabase as any)
                .from('client_materials')
                .select('*')
                .eq('client_id', selectedClient)
                .order('created_at', { ascending: false });

            if (error) {
                console.error(error);
            } else if (data) {
                setMaterials(data as ClientMaterial[]);
            }
            setIsLoading(false);
        };

        fetchMaterials();
    }, [selectedClient]);

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!selectedClient) {
            toast.error('Selecione um cliente primeiro');
            return;
        }

        setIsUploading(true);
        let finalUrl = fileUrl;

        try {
            // Se for upload real de arquivo PDF/Video e nao um link
            if (fileType !== 'link' && file) {
                const fileExt = file.name.split('.').pop();
                const fileName = `${Math.random()}.${fileExt}`;
                const filePath = `client_materials/${selectedClient}/${fileName}`;

                const { error: uploadError } = await supabase.storage
                    .from('materials')
                    .upload(filePath, file);

                if (uploadError) {
                    // Try to create the bucket if it doesn't exist
                    console.log('Bucket may not exist, moving on or failing');
                    throw uploadError;
                }

                const { data } = supabase.storage
                    .from('materials')
                    .getPublicUrl(filePath);

                finalUrl = data.publicUrl;
            }

            const { data: userAuth } = await supabase.auth.getUser();

            const { error } = await (supabase as any).from('client_materials').insert({
                client_id: selectedClient,
                title,
                description,
                file_url: finalUrl,
                file_type: fileType,
                is_rag_active: isRagActive,
                sent_to_client: sentToClient,
                category,
                agent_target: agentTarget,
                created_by: userAuth.user?.id
            });

            if (error) throw error;

            toast.success('Material adicionado com sucesso!');

            // Reset form
            setTitle('');
            setDescription('');
            setFileUrl('');
            setFile(null);
            setAgentTarget('both');

            // Refresh list
            const { data: newMaterials } = await (supabase as any)
                .from('client_materials')
                .select('*')
                .eq('client_id', selectedClient)
                .order('created_at', { ascending: false });

            if (newMaterials) setMaterials(newMaterials as ClientMaterial[]);

        } catch (error: any) {
            console.error('Erro no upload:', error);
            toast.error(`Falha: ${error?.message || 'Erro no envio'}`);
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Esquerda: Formulário de Adição */}
            <div className="lg:col-span-1 space-y-6">
                <Card className="nc-card-border bg-card/50">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Upload className="h-5 w-5 text-solar" />
                            Novo Material
                        </CardTitle>
                        <CardDescription>
                            Envie base de conhecimento (RAG) ou material de entrega pro cliente.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleUpload} className="space-y-4">
                            <div className="space-y-2">
                                <Label>Cliente Destino</Label>
                                <Select value={selectedClient} onValueChange={setSelectedClient}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecione um cliente..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {clients.map(c => (
                                            <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label>Título do Material</Label>
                                <Input
                                    placeholder="Ex: ICP e Proposta de Valor"
                                    value={title}
                                    onChange={e => setTitle(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>Descrição / Instruções</Label>
                                <Textarea
                                    placeholder="Detalhes ou roteiro deste arquivo..."
                                    value={description}
                                    onChange={e => setDescription(e.target.value)}
                                    rows={2}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>Tipo de Arquivo</Label>
                                <Select value={fileType} onValueChange={(v: any) => setFileType(v)}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="link">Link Externo (Drive/Youtube)</SelectItem>
                                        <SelectItem value="pdf">Documento PDF</SelectItem>
                                        <SelectItem value="video">Upload de Vídeo (.mp4)</SelectItem>
                                        <SelectItem value="doc">Documento Word</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label>Categoria do Material</Label>
                                <Select value={category} onValueChange={setCategory}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="process_optimization">Otimização de Processo</SelectItem>
                                        <SelectItem value="approach_technique">Técnica de Abordagem</SelectItem>
                                        <SelectItem value="sales_pitch">Pitch de Vendas</SelectItem>
                                        <SelectItem value="methodology">Metodologia</SelectItem>
                                        <SelectItem value="objection_handling">Contorno de Objeções</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label>Agente Destino</Label>
                                <Select value={agentTarget} onValueChange={(v: 'ss' | 'closer' | 'both') => setAgentTarget(v)}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="ss">🤖 Agente SS (Social Selling)</SelectItem>
                                        <SelectItem value="closer">🤖 Agente Closer</SelectItem>
                                        <SelectItem value="both">Ambos os Agentes</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {fileType === 'link' ? (
                                <div className="space-y-2">
                                    <Label>URL</Label>
                                    <Input
                                        type="url"
                                        placeholder="https://..."
                                        value={fileUrl}
                                        onChange={e => setFileUrl(e.target.value)}
                                        required
                                    />
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    <Label>Arquivo</Label>
                                    <Input
                                        type="file"
                                        onChange={e => setFile(e.target.files?.[0] || null)}
                                        required
                                        accept={fileType === 'pdf' ? '.pdf' : fileType === 'video' ? 'video/*' : undefined}
                                    />
                                </div>
                            )}

                            <div className="pt-2 pb-2 space-y-4 rounded-lg bg-black/20 p-4 border border-border/50">
                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <Label className="flex items-center gap-2">
                                            <Search className="h-4 w-4" />
                                            Base RAG Yorik
                                        </Label>
                                        <p className="text-xs text-muted-foreground mr-6">
                                            A IA vai usar este documento para gerar respostas com contexto.
                                        </p>
                                    </div>
                                    <Switch checked={isRagActive} onCheckedChange={setIsRagActive} />
                                </div>

                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <Label className="flex items-center gap-2">
                                            <LayoutGrid className="h-4 w-4" />
                                            Visível no "Meu Plano"
                                        </Label>
                                        <p className="text-xs text-muted-foreground mr-6">
                                            O cliente assistirá/lerá isso na aba Onboarding dele (substitui WhatsApp).
                                        </p>
                                    </div>
                                    <Switch checked={sentToClient} onCheckedChange={setSentToClient} />
                                </div>
                            </div>

                            <Button type="submit" className="w-full bg-solar text-deep-space hover:bg-solar/90" disabled={isUploading || !selectedClient}>
                                {isUploading ? 'Enviando...' : 'Fazer Upload e Distribuir'}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>

            {/* Direita: Inventário de Materiais */}
            <div className="lg:col-span-2">
                <Card className="nc-card-border h-full bg-card">
                    <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                            <span className="flex items-center gap-2">
                                <Library className="h-5 w-5 text-nc-info" />
                                Materiais do Cliente
                            </span>
                            <span className="text-sm font-normal text-muted-foreground px-3 py-1 bg-muted/50 rounded-full">
                                {selectedClient ? `${materials.length} itens` : 'Selecione um cliente'}
                            </span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {!selectedClient ? (
                            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                                <Search className="h-10 w-10 mb-4 opacity-20" />
                                <p>Selecione um cliente para ver a base de conhecimento.</p>
                            </div>
                        ) : isLoading ? (
                            <div className="flex flex-col items-center justify-center py-20">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
                                <p className="text-sm text-muted-foreground">Buscando documentos...</p>
                            </div>
                        ) : materials.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground bg-muted/20 rounded-xl border border-dashed border-border">
                                <FileText className="h-10 w-10 mb-4 opacity-50" />
                                <p className="font-medium text-foreground">Nenhum material de conhecimento salvo.</p>
                                <p className="text-sm mt-1 mb-4 text-center max-w-sm">
                                    Adicione materiais ao lado. A IE de Treinamento RAG precisará deles para gerar contexto.
                                </p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {materials.map((mat) => (
                                    <div key={mat.id} className="p-4 border border-border bg-card/50 rounded-xl flex flex-col hover:border-solar/30 transition-colors group">
                                        <div className="flex justify-between items-start mb-2">
                                            <h4 className="font-medium text-sm line-clamp-2">{mat.title}</h4>
                                            <div className="flex flex-col gap-1 items-end shrink-0">
                                                {mat.file_type === 'video' ? (
                                                    <FileVideo className="h-4 w-4 text-nc-success" />
                                                ) : mat.file_type === 'link' ? (
                                                    <LinkIcon className="h-4 w-4 text-blue-400" />
                                                ) : (
                                                    <FileText className="h-4 w-4 text-solar" />
                                                )}
                                                <span className="text-[9px] bg-muted px-1.5 py-0.5 rounded uppercase font-bold tracking-tighter">
                                                    {(mat as any).category || 'Metodologia'}
                                                </span>
                                            </div>
                                        </div>

                                        <p className="text-xs text-muted-foreground line-clamp-2 mt-1 mb-3 flex-1 flex">
                                            {mat.description || 'Sem descrição.'}
                                        </p>

                                        <div className="flex items-center gap-3 text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-4 border-t border-border pt-3">
                                            <span className="flex items-center gap-1">
                                                {mat.is_rag_active ? <CheckCircle className="h-3 w-3 text-solar" /> : <EyeOff className="h-3 w-3" />}
                                                {mat.is_rag_active ? 'Na Base RAG' : 'Oculto RAG'}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                {mat.sent_to_client ? <CheckCircle className="h-3 w-3 text-nc-info" /> : <EyeOff className="h-3 w-3" />}
                                                {mat.sent_to_client ? 'App do Cliente' : 'Docs Internos'}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Bot className="h-3 w-3" />
                                                {mat.agent_target === 'ss' ? 'SS'
                                                    : mat.agent_target === 'closer' ? 'Closer'
                                                    : 'Ambos'}
                                            </span>
                                        </div>

                                        <div className="flex gap-2">
                                            <Button variant="outline" size="sm" className="w-full text-xs h-8" onClick={() => window.open(mat.file_url, '_blank')}>
                                                Abrir Material
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
