
import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, Square, Play, RefreshCw, Send, Trash2, StopCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface AudioRecorderProps {
    onRecordingComplete: (audioBlob: Blob) => void;
    onCancel?: () => void;
    isUploading?: boolean;
}

export function AudioRecorder({ onRecordingComplete, onCancel, isUploading = false }: AudioRecorderProps) {
    const [isRecording, setIsRecording] = useState(false);
    const [audioUrl, setAudioUrl] = useState<string | null>(null);
    const [recordingTime, setRecordingTime] = useState(0);
    const [analyserData, setAnalyserData] = useState<Uint8Array | null>(null);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const requestRef = useRef<number>();
    const blobRef = useRef<Blob | null>(null);

    useEffect(() => {
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
            if (audioUrl) URL.revokeObjectURL(audioUrl);
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
            if (audioContextRef.current) audioContextRef.current.close();
        };
    }, []);

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

            // Audio Context for Visualizer
            const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
            const analyser = audioContext.createAnalyser();
            const source = audioContext.createMediaStreamSource(stream);
            source.connect(analyser);
            analyser.fftSize = 256;

            audioContextRef.current = audioContext;
            analyserRef.current = analyser;

            // Recorder
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            mediaRecorder.onstop = () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                const url = URL.createObjectURL(audioBlob);
                setAudioUrl(url);
                blobRef.current = audioBlob;

                // Stop tracks
                stream.getTracks().forEach(track => track.stop());
                if (audioContextRef.current) audioContextRef.current.close();
            };

            mediaRecorder.start();
            setIsRecording(true);
            setRecordingTime(0);

            timerRef.current = setInterval(() => {
                setRecordingTime(prev => prev + 1);
            }, 1000);

            visualize();

        } catch (error) {
            console.error('Error accessing microphone:', error);
            toast.error('Erro ao acessar microfone. Verifique as permissões.');
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            if (timerRef.current) clearInterval(timerRef.current);
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
        }
    };

    const visualize = () => {
        if (!analyserRef.current) return;

        const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteFrequencyData(dataArray);
        setAnalyserData(dataArray);

        requestRef.current = requestAnimationFrame(visualize);
    };

    const handleReset = () => {
        setAudioUrl(null);
        setRecordingTime(0);
        blobRef.current = null;
    };

    const handleSend = () => {
        if (blobRef.current) {
            onRecordingComplete(blobRef.current);
        }
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="flex flex-col items-center justify-center p-4 bg-muted/50 rounded-lg border border-border w-full max-w-md mx-auto fade-in">
            {/* Visualizer / Status */}
            <div className="h-16 w-full flex items-center justify-center mb-4 bg-background rounded-md border shadow-inner overflow-hidden relative">
                {isRecording ? (
                    <div className="flex items-end justify-center gap-[2px] h-full w-full px-4 py-2">
                        {analyserData && Array.from(analyserData).slice(0, 30).map((val, i) => (
                            <div
                                key={i}
                                className="bg-primary w-1.5 rounded-t-sm transition-all duration-75"
                                style={{ height: `${(val / 255) * 100}%` }}
                            />
                        ))}
                    </div>
                ) : audioUrl ? (
                    <audio src={audioUrl} controls className="w-full h-8" />
                ) : (
                    <div className="text-muted-foreground text-sm flex items-center gap-2">
                        <Mic className="h-4 w-4" />
                        Pronto para gravar
                    </div>
                )}

                {isRecording && (
                    <div className="absolute top-1 right-2 text-xs font-mono font-bold text-red-500 animate-pulse">
                        REC {formatTime(recordingTime)}
                    </div>
                )}
            </div>

            {/* Controls */}
            <div className="flex items-center gap-4">
                {!isRecording && !audioUrl && (
                    <Button
                        size="lg"
                        variant="default"
                        className="rounded-full w-12 h-12 p-0 bg-red-500 hover:bg-red-600 shadow-lg hover:shadow-xl transition-all hover:scale-105"
                        onClick={startRecording}
                    >
                        <Mic className="h-6 w-6 text-white" />
                    </Button>
                )}

                {isRecording && (
                    <Button
                        size="lg"
                        variant="destructive"
                        className="rounded-full w-12 h-12 p-0 animate-pulse"
                        onClick={stopRecording}
                    >
                        <Square className="h-5 w-5 fill-current" />
                    </Button>
                )}

                {audioUrl && (
                    <div className="flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={handleReset}
                            disabled={isUploading}
                            className="rounded-full text-muted-foreground hover:text-destructive"
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>

                        <Button
                            variant="default"
                            onClick={handleSend}
                            disabled={isUploading}
                            className="bg-green-600 hover:bg-green-700 text-white rounded-full px-6"
                        >
                            {isUploading ? (
                                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                            ) : (
                                <Send className="h-4 w-4 mr-2" />
                            )}
                            {isUploading ? 'Enviando...' : 'Enviar Feedback'}
                        </Button>
                    </div>
                )}

                {onCancel && !isRecording && (
                    <Button variant="ghost" size="sm" onClick={onCancel}>
                        Cancelar
                    </Button>
                )}
            </div>
        </div>
    );
}
