import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
    Phone,
    Clock,
    CheckCircle,
    AlertTriangle,
    Loader2,
    FileAudio,
    FileText,
    Eye,
} from 'lucide-react';

interface CallUpload {
    id: string;
    prospect_name?: string;
    closer?: { name: string };
    client?: { name: string };
    call_date?: string;
    duration_minutes?: number;
    status: string;
    upload_source?: string;
    created_at: string;
    approved_at?: string;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: typeof CheckCircle }> = {
    uploaded: { label: 'Enviada', color: 'bg-blue-500/10 text-blue-400 border-blue-500/30', icon: FileAudio },
    converting: { label: 'Convertendo', color: 'bg-amber-500/10 text-amber-400 border-amber-500/30', icon: Loader2 },
    transcribing: { label: 'Transcrevendo', color: 'bg-purple-500/10 text-purple-400 border-purple-500/30', icon: FileText },
    ready: { label: 'Pronta p/ Revisão', color: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30', icon: Eye },
    analyzed: { label: 'Analisada', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30', icon: CheckCircle },
    approved: { label: 'Aprovada', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30', icon: CheckCircle },
    rejected: { label: 'Rejeitada', color: 'bg-red-500/10 text-red-400 border-red-500/30', icon: AlertTriangle },
};

function getTimeSince(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    if (hours > 24) return `${Math.floor(hours / 24)}d`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
}

interface CallUploadCardProps {
    call: CallUpload;
    onReview?: (call: CallUpload) => void;
}

export function CallUploadCard({ call, onReview }: CallUploadCardProps) {
    const cfg = STATUS_CONFIG[call.status] || STATUS_CONFIG.uploaded;
    const StatusIcon = cfg.icon;
    const timeSince = getTimeSince(call.created_at);
    const isUrgent = !call.approved_at && (Date.now() - new Date(call.created_at).getTime()) > 60 * 60 * 1000;

    // Pipeline progress
    const stages = ['uploaded', 'converting', 'transcribing', 'ready', 'analyzed', 'approved'];
    const currentIdx = stages.indexOf(call.status);
    const progress = Math.max(0, ((currentIdx + 1) / stages.length) * 100);

    return (
        <Card className={`nc-card-border bg-card overflow-hidden transition-all hover:border-primary/30 ${isUrgent ? 'ring-1 ring-red-500/30' : ''}`}>
            {/* Progress bar */}
            <div className="h-1 bg-muted">
                <div
                    className="h-full bg-gradient-to-r from-solar to-emerald-400 transition-all duration-500"
                    style={{ width: `${progress}%` }}
                />
            </div>

            <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                        {/* Prospect + Client */}
                        <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4 text-solar shrink-0" />
                            <p className="font-medium truncate">
                                {call.prospect_name || 'Sem nome'}
                            </p>
                        </div>

                        <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                            {call.closer?.name && <span>🎙️ {call.closer.name}</span>}
                            {call.client?.name && <span>🏢 {call.client.name}</span>}
                            {call.call_date && (
                                <span>{new Date(call.call_date + 'T12:00:00').toLocaleDateString('pt-BR')}</span>
                            )}
                            {call.duration_minutes && <span>{call.duration_minutes}min</span>}
                        </div>
                    </div>

                    {/* Status Badge */}
                    <div className="flex flex-col items-end gap-1.5">
                        <Badge variant="outline" className={`text-[10px] gap-1 ${cfg.color}`}>
                            <StatusIcon className={`h-3 w-3 ${call.status === 'converting' || call.status === 'transcribing' ? 'animate-spin' : ''}`} />
                            {cfg.label}
                        </Badge>

                        {/* Time since upload */}
                        <div className={`flex items-center gap-1 text-[10px] ${isUrgent ? 'text-red-400' : 'text-muted-foreground'}`}>
                            <Clock className="h-3 w-3" />
                            {timeSince}
                            {isUrgent && <span className="font-bold">⚠️</span>}
                        </div>
                    </div>
                </div>

                {/* Review button */}
                {(call.status === 'ready' || call.status === 'analyzed') && onReview && (
                    <Button
                        variant="outline"
                        size="sm"
                        className="w-full mt-3 gap-2"
                        onClick={() => onReview(call)}
                    >
                        <Eye className="h-3.5 w-3.5" />
                        Revisar
                    </Button>
                )}
            </CardContent>
        </Card>
    );
}
