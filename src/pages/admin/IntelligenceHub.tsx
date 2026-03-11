import { useState, useRef, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { Database, UploadCloud, FileText, Bot, File as FileIcon, Loader2, CheckCircle2, Trash2 } from 'lucide-react';

interface Material {
    id: string;
    file_url: string;
    material_type: string;
    processing_status: string;
    created_at: string;
}

export default function IntelligenceHub() {
    const [materials, setMaterials] = useState<Material[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [dragActive, setDragActive] = useState(false);
    
    // Upload state
    const [file, setFile] = useState<File | null>(null);
    const [materialType, setMaterialType] = useState<string>('metodologia_master');
    const [clientId, setClientId] = useState<string>('none');
    const [clients, setClients] = useState<{id: string, name: string}[]>([]);
    const [activeProcessId, setActiveProcessId] = useState<string | null>(null);
    const [progressValue, setProgressValue] = useState(0);
    const [progressText, setProgressText] = useState('');

    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        fetchMaterials();
        fetchClients();

        // Inscrever no canal Realtime para acompanhar o processamento
        const channel = (supabase as any)
            .channel('materials_status')
            .on(
                'postgres_changes',
                { event: 'UPDATE', schema: 'public', table: 'client_materials' },
                (payload) => {
                    const newStatus = payload.new.processing_status;
                    
                    // Atualiza a lista geral
                    setMaterials(prev => prev.map(m => m.id === payload.new.id ? { ...m, processing_status: newStatus } as Material : m));

                    // Atualiza a barra de progresso se for o upload atual
                    if (activeProcessId === payload.new.id) {
                        switch (newStatus) {
                            case 'chunking':
                                setProgressValue(40);
                                setProgressText('Lendo e fragmentando o PDF...');
                                break;
                            case 'generating_embeddings':
                                setProgressValue(70);
                                setProgressText('Gerando vetores na Inteligência Artificial...');
                                break;
                            case 'ready':
                                setProgressValue(100);
                                setProgressText('Processamento concluído!');
                                setTimeout(() => {
                                    setActiveProcessId(null);
                                    setFile(null);
                                }, 3000);
                                break;
                            case 'error':
                                setProgressValue(100);
                                setProgressText('Erro no processamento.');
                                setTimeout(() => setActiveProcessId(null), 3000);
                                break;
                        }
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [activeProcessId]);

    async function fetchMaterials() {
        setLoading(true);
        const { data, error } = await (supabase as any)
            .from('client_materials')
            .select('*')
            .order('created_at', { ascending: false });

        if (!error && data) {
            setMaterials(data);
        }
        setLoading(false);
    }

    async function fetchClients() {
        const { data, error } = await supabase
            .from('clients')
            .select('id, name')
            .order('name');
        
        if (!error && data) {
            setClients(data);
        }
    }

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFileSelection(e.dataTransfer.files[0]);
        }
    };

    const handleFileSelection = (selectedFile: File) => {
        if (selectedFile.type !== 'application/pdf') {
            toast.error('Apenas arquivos PDF são suportados no momento.');
            return;
        }
        setFile(selectedFile);
    };

    const handleUpload = async () => {
        if (!file) return;

        setUploading(true);
        setActiveProcessId(null);
        setProgressValue(10);
        setProgressText('Fazendo upload do arquivo...');

        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
            const filePath = `admin_uploads/${fileName}`; // Será salvo no bucket "materials"

            // 1. Upload do Arquivo no Storage
            const { error: uploadError } = await supabase.storage
                .from('materials')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            setProgressValue(20);
            setProgressText('Salvando registro...');

            // 2. Criar Registro no DB com status uploading
            const { data: materialData, error: dbError } = await (supabase as any)
                .from('client_materials')
                .insert([{
                    client_id: materialType === 'produto_cliente' && clientId !== 'none' ? clientId : null,
                    file_url: filePath,
                    material_type: materialType,
                    processing_status: 'uploading'
                }])
                .select()
                .single();

            if (dbError || !materialData) throw dbError;

            // Define o ID ativo para acompanhar as mudanças de status (se for o último upado)
            setActiveProcessId(materialData.id);
            setMaterials([materialData as Material, ...materials]);

            // 3. Chamar a Edge Function de Processamento (Chunking e Embeddings)
            setProgressValue(30);
            setProgressText('Iniciando Inteligência (Extração e Chunking)...');
            
            // Função async em background
            supabase.functions.invoke('process-material', {
                body: { material_id: materialData.id }
            }).then(response => {
                if (response.error) {
                    toast.error('Erro na indexação da IA: ' + response.error.message);
                } else {
                    toast.success('O Cerebro leu o arquivo com sucesso!');
                }
            });

        } catch (error: any) {
            console.error('Upload error:', error);
            toast.error('Erro ao subir arquivo: ' + error.message);
            setActiveProcessId(null);
        } finally {
            setUploading(false);
        }
    };

    async function handleDelete(id: string, url: string) {
        if (!confirm('Deletar este material limpa todos os vetores da IA associados a ele. Tem certeza?')) return;

        // Tabela material_chunks tá vinculada via ON DELETE CASCADE
        const { error: dbError } = await (supabase as any).from('client_materials').delete().eq('id', id);
        
        if (!dbError) {
            await supabase.storage.from('materials').remove([url]);
            setMaterials(materials.filter(m => m.id !== id));
            toast.success('Material e Vetores Excluídos.');
        } else {
            toast.error('Erro ao excluir material.');
        }
    }

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'ready': return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
            case 'error': return <X className="h-4 w-4 text-destructive" />;
            default: return <Loader2 className="h-4 w-4 text-amber-500 animate-spin" />;
        }
    };

    const getStatusText = (status: string) => {
        switch (status) {
            case 'uploading': return 'Enviando...';
            case 'chunking': return 'Fragmentando (RAG)...';
            case 'generating_embeddings': return 'Gerando Vetores OpenAI...';
            case 'ready': return 'Pronto (Cérebro ativo)';
            case 'error': return 'Falha na Indexação';
            default: return status;
        }
    };

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold flex items-center gap-2">
                    <Database className="h-8 w-8 text-indigo-500" />
                    QG de Inteligência (Paiol)
                </h1>
                <p className="text-muted-foreground">
                    Faça o upload dos Manuais NPQC e Briefings de produto para indexação semântica (Vector DB). A IA "Treinador de Bolso" sugará esse conhecimento.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* UPOLADER ZONe */}
                <Card className="md:col-span-1 border-indigo-500/20 shadow-md">
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <UploadCloud className="w-5 h-5 text-indigo-500"/>
                            Novo Material
                        </CardTitle>
                        <CardDescription>Envie PDFs para o Cérebro</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        
                        <div className="space-y-2">
                            <label className="text-xs font-medium text-muted-foreground">Categoria do Material</label>
                            <Select value={materialType} onValueChange={setMaterialType}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecione o tipo..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="metodologia_master">Metodologia MASTER (Rafa NPQC)</SelectItem>
                                    <SelectItem value="produto_cliente">Produto/Briefing do Cliente</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {materialType === 'produto_cliente' && (
                            <div className="space-y-2">
                                <label className="text-xs font-medium text-muted-foreground">Vincular Cliente</label>
                                <Select value={clientId} onValueChange={setClientId}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecione o cliente..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">Selecione...</SelectItem>
                                        {clients.map(c => (
                                            <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}

                        {!activeProcessId && !file ? (
                            <div 
                                className={`border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-colors ${dragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:bg-muted/50'}`}
                                onDragEnter={handleDrag}
                                onDragLeave={handleDrag}
                                onDragOver={handleDrag}
                                onDrop={handleDrop}
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <input 
                                    type="file" 
                                    accept="application/pdf" 
                                    className="hidden" 
                                    ref={fileInputRef}
                                    onChange={(e) => e.target.files && handleFileSelection(e.target.files[0])}
                                />
                                <FileIcon className="h-8 w-8 text-muted-foreground mb-2" />
                                <p className="text-sm font-medium">Arraste seu PDF aqui</p>
                                <p className="text-xs text-muted-foreground mt-1">ou clique para procurar</p>
                            </div>
                        ) : activeProcessId ? (
                            <div className="border rounded-lg p-4 bg-muted/20 space-y-3">
                                <div className="flex items-center gap-3">
                                    <Bot className="h-8 w-8 text-indigo-500 animate-pulse" />
                                    <div>
                                        <p className="text-sm font-medium">Ensinando Inteligência...</p>
                                        <p className="text-xs text-muted-foreground">{progressText}</p>
                                    </div>
                                </div>
                                <Progress value={progressValue} className="h-2" />
                            </div>
                        ) : (
                            <div className="border rounded-lg p-4 bg-muted/20 space-y-4">
                                <div className="flex items-center gap-3">
                                    <FileText className="h-8 w-8 text-amber-500" />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium truncate">{file?.name}</p>
                                        <p className="text-xs text-muted-foreground">{(file?.size! / 1024 / 1024).toFixed(2)} MB</p>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <Button onClick={handleUpload} disabled={uploading} className="w-full gap-2">
                                        {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UploadCloud className="h-4 w-4" />}
                                        Upload e Indexar
                                    </Button>
                                    <Button onClick={() => setFile(null)} disabled={uploading} variant="outline" size="icon">
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* LISTA DE MATERIalS */}
                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle className="text-lg">Acervo do Cérebro (Master RAG)</CardTitle>
                        <CardDescription>
                            Os documentos abaixo definem as regras e restrições da IA do Coach.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="flex justify-center p-8">
                                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                            </div>
                        ) : materials.length === 0 ? (
                            <div className="text-center p-8 bg-muted/10 rounded-lg border border-dashed">
                                <Database className="h-8 w-8 text-muted-foreground/50 mx-auto mb-2" />
                                <p className="text-sm text-muted-foreground">A inteligência ainda não foi alimentada com PDFs mestres.</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {materials.map((m) => {
                                    const filename = m.file_url.split('/').pop();
                                    return (
                                        <div key={m.id} className="flex items-center justify-between p-3 rounded-md border bg-card hover:bg-muted/50 transition-colors">
                                            <div className="flex items-center gap-3 overflow-hidden">
                                                <div className={`p-2 rounded-full ${m.material_type === 'metodologia_master' ? 'bg-amber-500/10 text-amber-600' : 'bg-indigo-500/10 text-indigo-600'}`}>
                                                    <FileText className="w-4 h-4" />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-sm font-medium truncate">{filename}</p>
                                                    <div className="flex flex-wrap items-center gap-2 mt-1">
                                                        <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${m.material_type === 'metodologia_master' ? 'bg-amber-500/10 text-amber-600' : 'bg-indigo-500/10 text-indigo-600'}`}>
                                                            {m.material_type === 'metodologia_master' ? 'Master NPQC' : 'Cliente'}
                                                        </span>
                                                        <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                                                            {getStatusIcon(m.processing_status)}
                                                            {getStatusText(m.processing_status)}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-[10px] text-muted-foreground hidden sm:block">
                                                    {new Date(m.created_at).toLocaleDateString()}
                                                </span>
                                                <Button variant="ghost" size="icon" onClick={() => handleDelete(m.id, m.file_url)} className="text-destructive hover:text-destructive hover:bg-destructive/10">
                                                    <Trash2 className="h-3 w-3" />
                                                </Button>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </CardContent>
                </Card>

            </div>
        </div>
    );
}

// Dummy lucide component needed internally
const X = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
)
