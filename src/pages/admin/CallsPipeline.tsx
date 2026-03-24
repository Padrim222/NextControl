import { useState, useEffect, useMemo, lazy, Suspense } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/Spinner';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import {
    Upload,
    FileAudio,
    CheckCircle,
    XCircle,
    Clock,
    Eye,
    Sparkles,
    MessageSquare,
    ArrowRight,
    Filter,
    RefreshCw,
    Pencil,
} from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
const VideoUploader = lazy(() =>
    import('@/components/calls/VideoUploader').then(m => ({ default: m.VideoUploader }))
);

interface CallUpload {
    id: string;
    client_id: string | null;
    closer_id: string | null;
    upload_source: 'drive' | 'manual';
    original_url: string | null;
    mp3_url: string | null;
    transcription_text: string | null;
    status: 'uploaded' | 'converting' | 'transcribing' | 'ready' | 'analyzing' | 'analyzed' | 'approved' | 'rejected';
    admin_notes: string | null;
    approved_by: string | null;
    approved_at: string | null;
    call_date: string;
    prospect_name: string | null;
    duration_minutes: number | null;
    evaluation_id: string | null;
    created_at: string;
    closer?: { name: string; email: string };
    client?: { name: string };
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: typeof Clock; bg: string }> = {
    uploaded: { label: 'Enviado', color: 'text-blue-400', icon: Upload, bg: 'bg-blue-500/10' },
    converting: { label: 'Convertendo', color: 'text-amber-400', icon: RefreshCw, bg: 'bg-amber-500/10' },
    transcribing: { label: 'Transcrevendo', color: 'text-amber-400', icon: RefreshCw, bg: 'bg-amber-500/10' },
    ready: { label: 'Pronto p/ Revisão', color: 'text-cyan-400', icon: Eye, bg: 'bg-cyan-500/10' },
    analyzing: { label: 'Analisando', color: 'text-purple-400', icon: Sparkles, bg: 'bg-purple-500/10' },
    analyzed: { label: 'Analisado', color: 'text-emerald-400', icon: CheckCircle, bg: 'bg-emerald-500/10' },
    approved: { label: 'Aprovado', color: 'text-emerald-400', icon: CheckCircle, bg: 'bg-emerald-500/10' },
    rejected: { label: 'Rejeitado', color: 'text-red-400', icon: XCircle, bg: 'bg-red-500/10' },
};

function StatusBadge({ status }: { status: string }) {
    const config = STATUS_CONFIG[status] || STATUS_CONFIG.uploaded;
    const Icon = config.icon;
    return (
        <Badge variant="outline" className={`${config.color} ${config.bg} border-current/20 gap-1`}>
            <Icon className="h-3 w-3" />
            {config.label}
        </Badge>
    );
}

function TimeSince({ date }: { date: string }) {
    const hours = Math.floor((Date.now() - new Date(date).getTime()) / (1000 * 60 * 60));
    const isUrgent = hours >= 1;
    return (
        <span className={`text-xs ${isUrgent ? 'text-red-400 font-semibold' : 'text-muted-foreground'}`}>
            {hours < 1 ? 'Agora' : `${hours}h atrás`}
            {isUrgent && ' ⏰'}
        </span>
    );
}

export default function CallsPipeline() {
    const { user } = useAuth();
    const [callUploads, setCallUploads] = useState<CallUpload[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedCall, setSelectedCall] = useState<CallUpload | null>(null);
    const [adminNotes, setAdminNotes] = useState('');
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [isProcessing, setIsProcessing] = useState(false);
    const [showUploader, setShowUploader] = useState(false);
    const [isUploading, setIsUploading] = useState(false);

    useEffect(() => {
        fetchCallUploads();
    }, []);

    const fetchCallUploads = async () => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('call_uploads')
                .select('*, closer:users!closer_id(name, email), client:clients!client_id(name)')
                .order('created_at', { ascending: false })
                .limit(100);

            if (error) throw error;
            setCallUploads(data || []);
        } catch (err) {
            console.error('Error fetching call uploads:', err);
            toast.error('Erro ao carregar pipeline de calls');
        } finally {
            setIsLoading(false);
        }
    };

    const filteredCalls = useMemo(() => {
        if (filterStatus === 'all') return callUploads;
        return callUploads.filter(c => c.status === filterStatus);
    }, [callUploads, filterStatus]);

    const pipelineCounts = useMemo(() => {
        const counts: Record<string, number> = {};
        callUploads.forEach(c => {
            counts[c.status] = (counts[c.status] || 0) + 1;
        });
        return counts;
    }, [callUploads]);

    const handleApprove = async (call: CallUpload) => {
        if (!user) return;
        setIsProcessing(true);
        try {
            const { error } = await supabase
                .from('call_uploads')
                .update({
                    status: 'approved',
                    approved_by: user.id,
                    approved_at: new Date().toISOString(),
                    admin_notes: adminNotes || call.admin_notes,
                })
                .eq('id', call.id);

            if (error) throw error;
            toast.success('✅ Call aprovada e enviada para o cliente!');
            setSelectedCall(null);
            setAdminNotes('');
            fetchCallUploads();
        } catch (err) {
            console.error('Error approving:', err);
            toast.error('Erro ao aprovar call');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleReject = async (call: CallUpload) => {
        if (!user) return;
        setIsProcessing(true);
        try {
            const { error } = await supabase
                .from('call_uploads')
                .update({
                    status: 'rejected',
                    approved_by: user.id,
                    approved_at: new Date().toISOString(),
                    admin_notes: adminNotes || 'Rejeitada pelo admin',
                })
                .eq('id', call.id);

            if (error) throw error;
            toast.success('Call rejeitada');
            setSelectedCall(null);
            setAdminNotes('');
            fetchCallUploads();
        } catch (err) {
            console.error('Error rejecting:', err);
            toast.error('Erro ao rejeitar');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleAnalyze = async (call: CallUpload) => {
        if (!call.transcription_text) {
            toast.error('Transcrição não disponível');
            return;
        }
        setIsProcessing(true);
        try {
            // Update status to analyzing
            await supabase
                .from('call_uploads')
                .update({ status: 'analyzing' })
                .eq('id', call.id);

            // Invoke analyze-call edge function
            const session = (await supabase.auth.getSession()).data.session;
            const response = await fetch(
                `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-call`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${session?.access_token}`,
                    },
                    body: JSON.stringify({
                        transcription: call.transcription_text,
                        prospect_name: call.prospect_name || undefined,
                        duration_minutes: call.duration_minutes || undefined,
                        client_id: call.client_id || undefined,
                    }),
                }
            );

            if (!response.ok) throw new Error('Analysis failed');
            const evaluation = await response.json();

            // Update call upload with evaluation reference
            await supabase
                .from('call_uploads')
                .update({
                    status: 'analyzed',
                    evaluation_id: evaluation.id,
                })
                .eq('id', call.id);

            toast.success(`🤖 Análise concluída! Score: ${evaluation.score_geral}`);
            fetchCallUploads();
        } catch (err) {
            console.error('Error analyzing:', err);
            // Revert status
            await supabase
                .from('call_uploads')
                .update({ status: 'ready' })
                .eq('id', call.id);
            toast.error('Erro na análise IA');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleRewriteWithAI = async () => {
        if (!selectedCall?.transcription_text) return;
        setIsProcessing(true);
        try {
            const session = (await supabase.auth.getSession()).data.session;
            const response = await fetch(
                `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/coach-chat`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${session?.access_token}`,
                    },
                    body: JSON.stringify({
                        message: `Reescreva as anotações do admin de forma profissional e construtiva, baseado na transcrição da call. Transcrição: ${selectedCall.transcription_text.substring(0, 2000)}. Notas atuais: ${adminNotes || 'sem notas'}`,
                        seller_type: 'closer',
                    }),
                }
            );

            if (!response.ok) throw new Error('Rewrite failed');
            const data = await response.json();
            setAdminNotes(data.response || data.message || adminNotes);
            toast.success('Reescrita aplicada com IA');
        } catch (err) {
            console.error('Rewrite error:', err);
            toast.error('Erro ao reescrever com IA');
        } finally {
            setIsProcessing(false);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Spinner size="md" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background p-6">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold">
                            Pipeline de <span className="nc-gradient-text">Calls</span> 📞
                        </h1>
                        <p className="text-muted-foreground text-sm mt-1">
                            Acompanhe o fluxo: upload → conversão → transcrição → revisão → entrega
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Button onClick={() => setShowUploader(!showUploader)} variant={showUploader ? 'default' : 'outline'} className="gap-2">
                            <Upload className="h-4 w-4" />
                            {showUploader ? 'Fechar Upload' : 'Novo Upload'}
                        </Button>
                        <Button onClick={fetchCallUploads} variant="outline" className="gap-2">
                            <RefreshCw className="h-4 w-4" />
                            Atualizar
                        </Button>
                    </div>
                </div>

                {/* Video Uploader */}
                {showUploader && (
                  <Suspense fallback={<div className="p-8 text-center text-muted-foreground">Carregando uploader...</div>}>
                    <VideoUploader
                        disabled={isUploading}
                        onAudioReady={async (audioFile, meta) => {
                            setIsUploading(true);
                            try {
                                // 1. Upload audio to Supabase Storage
                                const filename = `calls/${Date.now()}_${audioFile.name}`;
                                const { error: uploadError } = await supabase.storage
                                    .from('call-recordings')
                                    .upload(filename, audioFile, { contentType: 'audio/mpeg' });

                                if (uploadError) throw uploadError;

                                const { data: urlData } = supabase.storage
                                    .from('call-recordings')
                                    .getPublicUrl(filename);

                                // 2. Create call_upload record
                                const { data: insertData, error: insertError } = await supabase
                                    .from('call_uploads')
                                    .insert({
                                        upload_source: 'manual',
                                        mp3_url: urlData?.publicUrl || null,
                                        status: 'transcribing',
                                        call_date: new Date().toISOString().split('T')[0],
                                        prospect_name: meta.originalName.replace(/\.[^.]+$/, ''),
                                        duration_minutes: null,
                                    })
                                    .select()
                                    .single();

                                if (insertError) throw insertError;

                                toast.success(`✅ Call enviada! Iniciando transcrição com IA...`);
                                setShowUploader(false);
                                fetchCallUploads();
                                
                                // 3. Invoke transcribe-audio
                                const formData = new FormData();
                                formData.append('file', audioFile, audioFile.name);
                                
                                const session = (await supabase.auth.getSession()).data.session;
                                const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/transcribe-audio`, {
                                    method: 'POST',
                                    headers: {
                                        'Authorization': `Bearer ${session?.access_token}`,
                                    },
                                    body: formData,
                                });
                                
                                const data = await response.json();
                                if (!response.ok || data?.error) {
                                  // Fallback to uploaded status if transcription fails
                                  await supabase.from('call_uploads').update({ status: 'uploaded' }).eq('id', insertData.id);
                                  throw new Error(data?.error || `HTTP ${response.status}`);
                                }
                                
                                // 4. Update status to ready
                                await supabase
                                  .from('call_uploads')
                                  .update({ 
                                    status: 'ready', 
                                    transcription_text: data.text 
                                  })
                                  .eq('id', insertData.id);
                                  
                                toast.success('🎤 Transcrição concluída com sucesso!');
                                fetchCallUploads();
                                
                            } catch (err: any) {
                                console.error('Upload/Transcription error:', err);
                                const msg = err?.message || '';
                                if (msg.includes('GROQ_API_KEY')) {
                                    toast.error('⚠️ A transcrição requer a GROQ_API_KEY configurada nos Secrets do Supabase.');
                                } else {
                                    toast.error(`Erro: ${msg || 'tente novamente.'}`);
                                }
                                fetchCallUploads();
                            } finally {
                                setIsUploading(false);
                            }
                        }}

                    />
                  </Suspense>
                )}

                {/* Pipeline Status Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
                    {Object.entries(STATUS_CONFIG).map(([key, config]) => {
                        const Icon = config.icon;
                        const count = pipelineCounts[key] || 0;
                        const isActive = filterStatus === key;
                        return (
                            <button
                                key={key}
                                onClick={() => setFilterStatus(isActive ? 'all' : key)}
                                className={`p-3 rounded-xl border text-left transition-all ${isActive
                                    ? 'border-primary bg-primary/5'
                                    : 'border-border/50 bg-card hover:border-primary/30'
                                    }`}
                            >
                                <Icon className={`h-4 w-4 mb-1 ${config.color}`} />
                                <p className="text-xl font-mono font-bold">{count}</p>
                                <p className="text-[10px] text-muted-foreground truncate">{config.label}</p>
                            </button>
                        );
                    })}
                </div>

                {/* Calls List */}
                <Card className="nc-card-border">
                    <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-base flex items-center gap-2">
                                <FileAudio className="h-4 w-4 text-solar" />
                                Calls {filterStatus !== 'all' && `(${STATUS_CONFIG[filterStatus]?.label})`}
                            </CardTitle>
                            {filterStatus !== 'all' && (
                                <Button variant="ghost" size="sm" onClick={() => setFilterStatus('all')}>
                                    <Filter className="h-3 w-3 mr-1" /> Limpar filtro
                                </Button>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent>
                        {filteredCalls.length === 0 ? (
                            <div className="text-center py-12 text-muted-foreground">
                                <FileAudio className="h-10 w-10 mx-auto mb-3 opacity-30" />
                                <p>Nenhuma call encontrada</p>
                                <p className="text-xs mt-1">
                                    Calls aparecerão aqui quando forem enviadas pelo Google Drive ou manualmente
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                                {filteredCalls.map((call, i) => (
                                    <motion.div
                                        key={call.id}
                                        initial={{ opacity: 0, y: 5 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 0.03 }}
                                        className="flex items-center justify-between p-3 bg-card rounded-xl border border-border/50 hover:border-primary/30 transition-all"
                                    >
                                        <div className="flex items-center gap-3 min-w-0 flex-1">
                                            <div className={`h-9 w-9 rounded-lg ${STATUS_CONFIG[call.status]?.bg || 'bg-muted'} flex items-center justify-center shrink-0`}>
                                                <FileAudio className={`h-4 w-4 ${STATUS_CONFIG[call.status]?.color || ''}`} />
                                            </div>
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <p className="font-medium text-sm truncate">
                                                        {call.closer?.name || 'Closer'}
                                                    </p>
                                                    {call.prospect_name && (
                                                        <span className="text-xs text-muted-foreground">
                                                            → {call.prospect_name}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    <span className="text-xs text-muted-foreground">
                                                        {new Date(call.call_date).toLocaleDateString('pt-BR')}
                                                    </span>
                                                    {call.duration_minutes && (
                                                        <span className="text-xs text-muted-foreground">
                                                            • {call.duration_minutes}min
                                                        </span>
                                                    )}
                                                    <TimeSince date={call.created_at} />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 shrink-0">
                                            <StatusBadge status={call.status} />

                                            {(call.status === 'ready' || call.status === 'analyzed') && (
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="h-7 text-xs"
                                                    onClick={() => {
                                                        setSelectedCall(call);
                                                        setAdminNotes(call.admin_notes || '');
                                                    }}
                                                >
                                                    <Eye className="h-3 w-3 mr-1" />
                                                    Revisar
                                                </Button>
                                            )}
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Review Dialog */}
            <Dialog open={!!selectedCall} onOpenChange={() => { setSelectedCall(null); setAdminNotes(''); }}>
                <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <FileAudio className="h-5 w-5 text-solar" />
                            Revisão da Call
                        </DialogTitle>
                        <DialogDescription>
                            {selectedCall && (
                                <>
                                    {selectedCall.closer?.name || 'Closer'} •{' '}
                                    {new Date(selectedCall.call_date).toLocaleDateString('pt-BR')}
                                    {selectedCall.prospect_name && ` → ${selectedCall.prospect_name}`}
                                </>
                            )}
                        </DialogDescription>
                    </DialogHeader>

                    {selectedCall && (
                        <div className="space-y-5">
                            {/* Transcription Preview */}
                            {selectedCall.transcription_text && (
                                <div>
                                    <h3 className="text-sm font-medium text-muted-foreground mb-2 uppercase tracking-wider">
                                        Transcrição
                                    </h3>
                                    <div className="bg-muted/30 rounded-xl p-4 max-h-[250px] overflow-y-auto text-sm leading-relaxed font-mono">
                                        {selectedCall.transcription_text.substring(0, 3000)}
                                        {selectedCall.transcription_text.length > 3000 && (
                                            <p className="text-muted-foreground mt-2 italic">
                                                ... ({selectedCall.transcription_text.length} caracteres total)
                                            </p>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Admin Notes */}
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                                        Anotações do Admin
                                    </h3>
                                    <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={handleRewriteWithAI}>
                                        <Sparkles className="h-3 w-3" />
                                        Reescrever com IA
                                    </Button>
                                </div>
                                <Textarea
                                    value={adminNotes}
                                    onChange={(e) => setAdminNotes(e.target.value)}
                                    placeholder="Adicione observações, correções ou contexto adicional..."
                                    className="min-h-[100px] resize-none"
                                />
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3 pt-3 border-t">
                                {selectedCall.status === 'ready' && (
                                    <Button
                                        className="flex-1 bg-solar hover:bg-solar/90 text-deep-space gap-2"
                                        onClick={() => handleAnalyze(selectedCall)}
                                        disabled={isProcessing}
                                    >
                                        <Sparkles className="h-4 w-4" />
                                        Analisar com IA
                                    </Button>
                                )}

                                {(selectedCall.status === 'analyzed' || selectedCall.status === 'ready') && (
                                    <>
                                        <Button
                                            variant="outline"
                                            className="gap-2 text-red-400 border-red-500/30 hover:bg-red-500/10"
                                            onClick={() => handleReject(selectedCall)}
                                            disabled={isProcessing}
                                        >
                                            <XCircle className="h-4 w-4" />
                                            Rejeitar
                                        </Button>
                                        <Button
                                            className="flex-1 bg-emerald-600 hover:bg-emerald-600/90 text-white gap-2"
                                            onClick={() => handleApprove(selectedCall)}
                                            disabled={isProcessing}
                                        >
                                            <CheckCircle className="h-4 w-4" />
                                            Aprovar & Enviar ao Cliente
                                        </Button>
                                    </>
                                )}
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
