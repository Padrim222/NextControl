import { useState, useCallback, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Upload,
    FileVideo,
    Music,
    CheckCircle,
    AlertTriangle,
    Loader2,
    X,
    Sparkles,
    Zap,
} from 'lucide-react';
import {
    extractAudioFromVideo,
    isVideoFile,
    isAudioFile,
    isSupportedMediaFile,
    isWasmSupported,
} from '@/lib/audio-extractor';

interface VideoUploaderProps {
    onAudioReady: (audioFile: File, metadata: {
        originalName: string;
        originalSizeMB: number;
        compressedSizeMB: number;
        processingSeconds: number;
        wasVideo: boolean;
    }) => void;
    disabled?: boolean;
}

type Phase = 'idle' | 'extracting' | 'done' | 'error';

export function VideoUploader({ onAudioReady, disabled }: VideoUploaderProps) {
    const [phase, setPhase] = useState<Phase>('idle');
    const [progress, setProgress] = useState(0);
    const [statusMessage, setStatusMessage] = useState('');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [errorMessage, setErrorMessage] = useState('');
    const [resultInfo, setResultInfo] = useState<{ original: number; compressed: number; time: number } | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = useCallback(async (file: File) => {
        if (!isSupportedMediaFile(file)) {
            setErrorMessage('Formato não suportado. Use .mp4, .mkv, .mov, .webm, .mp3, .wav, .m4a');
            setPhase('error');
            return;
        }

        if (!isWasmSupported()) {
            setErrorMessage('Seu navegador não suporta processamento de vídeo. Atualize para a versão mais recente do Chrome ou Edge.');
            setPhase('error');
            return;
        }

        setSelectedFile(file);
        setErrorMessage('');

        // If already audio, skip extraction
        if (isAudioFile(file)) {
            setPhase('done');
            setProgress(100);
            setStatusMessage('Arquivo de áudio pronto!');
            setResultInfo({
                original: file.size / (1024 * 1024),
                compressed: file.size / (1024 * 1024),
                time: 0,
            });
            onAudioReady(file, {
                originalName: file.name,
                originalSizeMB: file.size / (1024 * 1024),
                compressedSizeMB: file.size / (1024 * 1024),
                processingSeconds: 0,
                wasVideo: false,
            });
            return;
        }

        // Video file → extract audio
        setPhase('extracting');
        setProgress(0);
        setStatusMessage('Preparando extração...');

        try {
            const result = await extractAudioFromVideo(file, (pct, msg) => {
                setProgress(pct);
                setStatusMessage(msg);
            });

            setPhase('done');
            setResultInfo({
                original: result.originalSizeMB,
                compressed: result.compressedSizeMB,
                time: result.durationSeconds,
            });

            onAudioReady(result.audioFile, {
                originalName: file.name,
                originalSizeMB: result.originalSizeMB,
                compressedSizeMB: result.compressedSizeMB,
                processingSeconds: result.durationSeconds,
                wasVideo: true,
            });
        } catch (err) {
            console.error('Audio extraction error:', err);
            setPhase('error');
            setErrorMessage('Erro ao processar vídeo. Tente novamente ou use um arquivo de áudio (.mp3).');
        }
    }, [onAudioReady]);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        if (disabled || phase === 'extracting') return;
        const file = e.dataTransfer.files?.[0];
        if (file) handleFileSelect(file);
    }, [disabled, phase, handleFileSelect]);

    const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) handleFileSelect(file);
    }, [handleFileSelect]);

    const handleReset = () => {
        setPhase('idle');
        setProgress(0);
        setStatusMessage('');
        setSelectedFile(null);
        setErrorMessage('');
        setResultInfo(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    return (
        <Card className="nc-card-border overflow-hidden">
            <CardContent className="p-0">
                {/* Educational header */}
                <div className="px-4 py-3 bg-gradient-to-r from-solar/5 to-transparent border-b border-border/50">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Sparkles className="h-3.5 w-3.5 text-solar" />
                        <span>
                            Otimização automática: extraímos o áudio do seu vídeo <strong>direto no seu computador</strong> antes do envio. Nenhum vídeo pesado é enviado para a nuvem.
                        </span>
                    </div>
                </div>

                <div className="p-4">
                    {phase === 'idle' && (
                        <div
                            className="border-2 border-dashed border-border/60 rounded-xl p-8 text-center hover:border-solar/40 hover:bg-solar/5 transition-all cursor-pointer group"
                            onDrop={handleDrop}
                            onDragOver={(e) => e.preventDefault()}
                            onClick={() => !disabled && fileInputRef.current?.click()}
                        >
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="video/*,audio/*,.mp4,.mkv,.mov,.webm,.avi,.m4v,.mp3,.wav,.m4a,.ogg,.aac,.flac"
                                className="hidden"
                                onChange={handleInputChange}
                                disabled={disabled}
                            />

                            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-solar/10 to-amber-500/10 border border-solar/20 mb-4 group-hover:scale-110 transition-transform">
                                <Upload className="h-7 w-7 text-solar" />
                            </div>
                            <h3 className="font-semibold mb-1">Arraste sua gravação aqui</h3>
                            <p className="text-sm text-muted-foreground mb-3">
                                Aceita vídeos (.mp4, .mkv, .mov) e áudios (.mp3, .wav, .m4a)
                            </p>
                            <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1">
                                    <FileVideo className="h-3 w-3" /> Vídeo → extrai áudio
                                </span>
                                <span className="flex items-center gap-1">
                                    <Music className="h-3 w-3" /> Áudio → envio direto
                                </span>
                            </div>
                        </div>
                    )}

                    {phase === 'extracting' && (
                        <div className="space-y-4 py-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-solar/10 animate-pulse">
                                    <Zap className="h-5 w-5 text-solar" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-medium">{selectedFile?.name}</p>
                                    <p className="text-xs text-muted-foreground">{statusMessage}</p>
                                </div>
                                <Loader2 className="h-5 w-5 text-solar animate-spin" />
                            </div>

                            {/* Progress bar */}
                            <div className="w-full bg-muted rounded-full h-2.5 overflow-hidden">
                                <div
                                    className="bg-gradient-to-r from-solar to-amber-400 h-2.5 rounded-full transition-all duration-300 ease-out"
                                    style={{ width: `${progress}%` }}
                                />
                            </div>
                            <p className="text-center text-xs text-muted-foreground">
                                {progress}% — Não feche esta aba enquanto processamos 🔒
                            </p>
                        </div>
                    )}

                    {phase === 'done' && resultInfo && (
                        <div className="space-y-3 py-2">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-emerald-500/10">
                                    <CheckCircle className="h-5 w-5 text-emerald-500" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-medium">{selectedFile?.name}</p>
                                    <p className="text-xs text-muted-foreground">Áudio pronto para envio</p>
                                </div>
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleReset}>
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>

                            {resultInfo.original !== resultInfo.compressed && (
                                <div className="flex items-center gap-2 text-xs px-2">
                                    <Badge variant="outline" className="text-solar border-solar/30 gap-1">
                                        <Zap className="h-2.5 w-2.5" />
                                        {resultInfo.original.toFixed(0)}MB → {resultInfo.compressed.toFixed(1)}MB
                                    </Badge>
                                    <span className="text-muted-foreground">
                                        Redução de {((1 - resultInfo.compressed / resultInfo.original) * 100).toFixed(0)}%
                                    </span>
                                    {resultInfo.time > 0 && (
                                        <span className="text-muted-foreground">
                                            em {resultInfo.time.toFixed(0)}s
                                        </span>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {phase === 'error' && (
                        <div className="space-y-3 py-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-red-500/10">
                                    <AlertTriangle className="h-5 w-5 text-red-500" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-red-400">{errorMessage}</p>
                                </div>
                            </div>
                            <Button variant="outline" size="sm" onClick={handleReset} className="w-full">
                                Tentar novamente
                            </Button>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
