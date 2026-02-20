import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import {
    ClipboardCopy,
    ExternalLink,
    CheckCircle,
    Clock,
    AlertTriangle,
    Sparkles,
    Link2,
    Users,
    FileText,
} from 'lucide-react';
import { FORM_CONFIG, type FormType, type FormSubmission } from '@/types/forms';

const FORM_LINKS: { type: FormType; slug: string }[] = [
    { type: 'expert_weekly', slug: 'expert-weekly' },
    { type: 'seller_daily', slug: 'seller-daily' },
    { type: 'closer_daily', slug: 'closer-daily' },
];

export function AdminFormPanel() {
    const [submissions, setSubmissions] = useState<FormSubmission[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filter, setFilter] = useState<FormType | 'all'>('all');

    useEffect(() => {
        fetchSubmissions();
    }, []);

    async function fetchSubmissions() {
        if (!supabase) return;
        setIsLoading(true);
        try {
            const { data, error } = await (supabase as any)
                .from('form_submissions')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(50);

            if (error) throw error;
            setSubmissions(data || []);
        } catch (err) {
            console.error('Fetch form submissions error:', err);
        } finally {
            setIsLoading(false);
        }
    }

    const baseUrl = typeof window !== 'undefined'
        ? `${window.location.origin}`
        : 'https://nextcontrol.app';

    const copyLink = (slug: string) => {
        const url = `${baseUrl}/form/${slug}`;
        navigator.clipboard.writeText(url);
        toast.success('Link copiado!', { description: url });
    };

    const openLink = (slug: string) => {
        window.open(`/form/${slug}`, '_blank');
    };

    const filteredSubmissions = filter === 'all'
        ? submissions
        : submissions.filter((s) => s.form_type === filter);

    const statusBadge = (status: string) => {
        switch (status) {
            case 'done':
                return <Badge variant="outline" className="bg-nc-success/10 text-nc-success border-nc-success/30"><CheckCircle className="h-3 w-3 mr-1" /> Analisado</Badge>;
            case 'processing':
                return <Badge variant="outline" className="bg-nc-info/10 text-nc-info border-nc-info/30 animate-pulse"><Sparkles className="h-3 w-3 mr-1" /> Processando</Badge>;
            case 'error':
                return <Badge variant="outline" className="bg-nc-error/10 text-nc-error border-nc-error/30"><AlertTriangle className="h-3 w-3 mr-1" /> Erro</Badge>;
            default:
                return <Badge variant="outline" className="bg-nc-warning/10 text-nc-warning border-nc-warning/30"><Clock className="h-3 w-3 mr-1" /> Pendente</Badge>;
        }
    };

    const todayStr = new Date().toISOString().split('T')[0];
    const todayCount = submissions.filter(
        (s) => s.submission_date === todayStr || s.created_at?.startsWith(todayStr)
    ).length;

    return (
        <Card className="nc-card-border">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-solar" />
                    Formulários Públicos
                </CardTitle>
                <CardDescription>
                    Links para enviar no WhatsApp + {submissions.length} envios registrados
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Links Section */}
                <div>
                    <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                        <Link2 className="h-3.5 w-3.5" /> Links Rápidos
                    </h3>
                    <div className="space-y-2">
                        {FORM_LINKS.map(({ type, slug }) => {
                            const config = FORM_CONFIG[type];
                            return (
                                <div
                                    key={type}
                                    className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border hover:border-primary/30 transition-colors"
                                >
                                    <div className="flex items-center gap-3 min-w-0">
                                        <span className="text-xl">{config.emoji}</span>
                                        <div className="min-w-0">
                                            <p className="text-sm font-medium truncate">{config.title}</p>
                                            <p className="text-xs text-muted-foreground truncate">
                                                /form/{slug} • {config.frequency}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex gap-1.5 flex-shrink-0">
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="h-8"
                                            onClick={() => copyLink(slug)}
                                        >
                                            <ClipboardCopy className="h-3.5 w-3.5 mr-1" />
                                            Copiar
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            className="h-8"
                                            onClick={() => openLink(slug)}
                                        >
                                            <ExternalLink className="h-3.5 w-3.5" />
                                        </Button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Submissions Section */}
                <div>
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                            <Users className="h-3.5 w-3.5" /> Envios Recentes
                            {todayCount > 0 && (
                                <Badge variant="outline" className="bg-nc-success/10 text-nc-success text-xs">
                                    {todayCount} hoje
                                </Badge>
                            )}
                        </h3>
                        <div className="flex gap-1">
                            {(['all', 'expert_weekly', 'seller_daily', 'closer_daily'] as const).map((f) => (
                                <button
                                    key={f}
                                    className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${filter === f
                                            ? 'bg-primary text-primary-foreground'
                                            : 'text-muted-foreground hover:bg-muted'
                                        }`}
                                    onClick={() => setFilter(f)}
                                >
                                    {f === 'all' ? 'Todos' : FORM_CONFIG[f].emoji}
                                </button>
                            ))}
                        </div>
                    </div>

                    {isLoading ? (
                        <div className="text-center py-8 text-muted-foreground">
                            <Clock className="h-6 w-6 mx-auto mb-2 animate-spin opacity-50" />
                            <p className="text-sm">Carregando...</p>
                        </div>
                    ) : filteredSubmissions.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            <FileText className="h-6 w-6 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">Nenhum envio encontrado</p>
                            <p className="text-xs mt-1">Envie os links acima no grupo de WhatsApp</p>
                        </div>
                    ) : (
                        <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
                            {filteredSubmissions.map((sub) => {
                                const config = FORM_CONFIG[sub.form_type];
                                return (
                                    <div
                                        key={sub.id}
                                        className="flex items-center justify-between p-3 rounded-lg bg-card border border-border"
                                    >
                                        <div className="flex items-center gap-3 min-w-0">
                                            <span className="text-lg">{config?.emoji || '📋'}</span>
                                            <div className="min-w-0">
                                                <p className="text-sm font-medium truncate">
                                                    {sub.submitter_name}
                                                </p>
                                                <p className="text-xs text-muted-foreground truncate">
                                                    {new Date(sub.created_at).toLocaleDateString('pt-BR', {
                                                        day: '2-digit',
                                                        month: 'short',
                                                        hour: '2-digit',
                                                        minute: '2-digit',
                                                    })}
                                                    {sub.submitter_email && ` • ${sub.submitter_email}`}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 flex-shrink-0">
                                            {sub.ai_score != null && (
                                                <span className="text-sm font-mono font-bold text-primary">
                                                    {sub.ai_score}
                                                </span>
                                            )}
                                            {statusBadge(sub.ai_status)}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
