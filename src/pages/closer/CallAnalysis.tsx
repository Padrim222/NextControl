import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
    Phone,
    Send,
    Loader2,
    Target,
    TrendingUp,
    AlertTriangle,
    CheckCircle,
    Star,
    BarChart3,
    Clock,
    User,
    FileText,
    Award,
    ArrowLeft,
    Sparkles,
    RefreshCw,
} from '@/components/ui/icons';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

interface CallEvaluation {
    id: string;
    prospect_name: string | null;
    duration_minutes: number | null;
    score_abertura: number;
    score_descoberta: number;
    score_apresentacao: number;
    score_objecoes: number;
    score_fechamento: number;
    score_comunicacao: number;
    score_geral: number;
    pontos_fortes: string[];
    melhorias: string[];
    resultado: string;
    feedback_detalhado: string;
    nivel: string;
    created_at: string;
}

interface ScoreCategory {
    key: string;
    label: string;
    icon: React.ReactNode;
    score: number;
}

function ScoreBar({ label, score, icon }: { label: string; score: number; icon: React.ReactNode }) {
    const percentage = (score / 10) * 100;
    const color = score >= 8 ? 'bg-emerald-500' : score >= 6 ? 'bg-amber-500' : 'bg-red-500';
    const textColor = score >= 8 ? 'text-emerald-400' : score >= 6 ? 'text-amber-400' : 'text-red-400';

    return (
        <div className="space-y-1.5">
            <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                    {icon}
                    <span>{label}</span>
                </div>
                <span className={`font-bold ${textColor}`}>{score}/10</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                    className={`h-full ${color} rounded-full transition-all duration-1000 ease-out`}
                    style={{ width: `${percentage}%` }}
                />
            </div>
        </div>
    );
}

function NivelBadge({ nivel }: { nivel: string }) {
    const config: Record<string, { bg: string; text: string; border: string }> = {
        Expert: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/30' },
        Avançado: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/30' },
        Intermediário: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/30' },
        Iniciante: { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/30' },
    };
    const c = config[nivel] || config.Iniciante;

    return (
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${c.bg} ${c.text} ${c.border}`}>
            <Award className="h-3 w-3" />
            {nivel}
        </span>
    );
}

function ResultadoBadge({ resultado }: { resultado: string }) {
    const config: Record<string, { bg: string; text: string; label: string }> = {
        vendeu: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', label: '✅ Vendeu' },
        perdeu: { bg: 'bg-red-500/10', text: 'text-red-400', label: '❌ Perdeu' },
        'follow-up': { bg: 'bg-amber-500/10', text: 'text-amber-400', label: '🔄 Follow-up' },
    };
    const c = config[resultado] || config['follow-up'];

    return (
        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${c.bg} ${c.text}`}>
            {c.label}
        </span>
    );
}

export default function CallAnalysis() {
    const { user } = useAuth();
    const navigate = useNavigate();

    const [transcription, setTranscription] = useState('');
    const [prospectName, setProspectName] = useState('');
    const [duration, setDuration] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<CallEvaluation | null>(null);
    const [history, setHistory] = useState<CallEvaluation[]>([]);
    const [loadingHistory, setLoadingHistory] = useState(true);
    const [showForm, setShowForm] = useState(true);
    const [generatingSuggestion, setGeneratingSuggestion] = useState(false);
    const [suggestionSent, setSuggestionSent] = useState(false);

    useEffect(() => {
        fetchHistory();
    }, []);

    async function fetchHistory() {
        try {
            const { data, error } = await (supabase as any)
                .from('call_evaluations')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(10);

            if (!error && data) setHistory(data as CallEvaluation[]);
        } catch (err) {
            console.error('Failed to fetch history:', err);
        } finally {
            setLoadingHistory(false);
        }
    }

    async function handleAnalyze() {
        if (!transcription.trim()) {
            toast.error('Cole a transcrição da call primeiro.');
            return;
        }
        if (transcription.trim().length < 100) {
            toast.error('Transcrição muito curta. Mínimo 100 caracteres.');
            return;
        }

        setLoading(true);
        setResult(null);

        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) throw new Error('Sessão expirada');

            const response = await fetch(
                `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-call`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${session.access_token}`,
                    },
                    body: JSON.stringify({
                        transcription: transcription.trim(),
                        prospect_name: prospectName.trim() || undefined,
                        duration_minutes: duration ? parseInt(duration) : undefined,
                    }),
                }
            );

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error || 'Erro na análise');
            }

            const data = await response.json();
            // analyze-call returns the evaluation object at the root level
            setResult(data.evaluation ?? data);
            setShowForm(false);
            toast.success('Análise concluída!');
            fetchHistory();
        } catch (err: any) {
            toast.error(err.message || 'Erro ao analisar call');
        } finally {
            setLoading(false);
        }
    }

    function handleNewAnalysis() {
        setResult(null);
        setTranscription('');
        setProspectName('');
        setDuration('');
        setShowForm(true);
        setSuggestionSent(false);
    }

    async function handleGenerateSuggestion() {
        if (!user || !result) return;

        setGeneratingSuggestion(true);
        try {
            const title = `Melhoria Closer — ${new Date().toLocaleDateString('pt-BR')}`;

            // Build suggestion text from melhorias and feedback_detalhado
            const melhoriasList = (result.melhorias || []).map((m, i) => `${i + 1}. ${m}`).join('\n');
            const suggestionText = [
                melhoriasList ? `Áreas de melhoria identificadas:\n${melhoriasList}` : '',
                result.feedback_detalhado ? `\nFeedback detalhado:\n${result.feedback_detalhado}` : '',
            ]
                .filter(Boolean)
                .join('\n')
                .trim() || 'Análise de call sem melhorias específicas identificadas.';

            await (supabase as any).from('agent_suggestions').insert({
                user_id: user.id,
                client_id: user.client_id || null,
                agent_type: 'closer',
                title,
                suggestion_text: suggestionText,
                context_note: result.prospect_name
                    ? `Call com ${result.prospect_name} — Score geral: ${result.score_geral}/10`
                    : `Score geral: ${result.score_geral}/10`,
                source: 'call_analysis',
                status: 'pending',
            });

            setSuggestionSent(true);
            toast.success('Sugestão gerada e enviada para revisão!');
        } catch (error) {
            console.error('Error generating suggestion:', error);
            toast.error('Erro ao gerar sugestão. Tente novamente.');
        } finally {
            setGeneratingSuggestion(false);
        }
    }

    const scoreCategories: ScoreCategory[] = result
        ? [
            { key: 'abertura', label: 'Abertura & Rapport', icon: <User className="h-3.5 w-3.5" />, score: result.score_abertura },
            { key: 'descoberta', label: 'Descoberta de Dor', icon: <Target className="h-3.5 w-3.5" />, score: result.score_descoberta },
            { key: 'apresentacao', label: 'Apresentação', icon: <FileText className="h-3.5 w-3.5" />, score: result.score_apresentacao },
            { key: 'objecoes', label: 'Contorno de Objeções', icon: <AlertTriangle className="h-3.5 w-3.5" />, score: result.score_objecoes },
            { key: 'fechamento', label: 'Fechamento', icon: <CheckCircle className="h-3.5 w-3.5" />, score: result.score_fechamento },
            { key: 'comunicacao', label: 'Comunicação', icon: <TrendingUp className="h-3.5 w-3.5" />, score: result.score_comunicacao },
        ]
        : [];

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => navigate('/closer')}
                        className="text-muted-foreground"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-display font-bold">Análise de Calls</h1>
                        <p className="text-sm text-muted-foreground">
                            Cole a transcrição e receba avaliação IA em segundos
                        </p>
                    </div>
                </div>
                {!showForm && (
                    <Button onClick={handleNewAnalysis} className="nc-gradient text-deep-space font-semibold">
                        Nova Análise
                    </Button>
                )}
            </div>

            {showForm && (
                <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <Phone className="h-5 w-5 text-primary" />
                            Nova Análise de Call
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-muted-foreground">
                                    Nome do Prospect
                                </label>
                                <Input
                                    placeholder="Ex: João da Silva"
                                    value={prospectName}
                                    onChange={(e) => setProspectName(e.target.value)}
                                    disabled={loading}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-muted-foreground">
                                    Duração (minutos)
                                </label>
                                <Input
                                    type="number"
                                    placeholder="Ex: 30"
                                    min={1}
                                    value={duration}
                                    onChange={(e) => setDuration(e.target.value)}
                                    disabled={loading}
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-muted-foreground">
                                Transcrição da Call *
                            </label>
                            <Textarea
                                placeholder="Cole aqui a transcrição completa da call de vendas..."
                                value={transcription}
                                onChange={(e) => setTranscription(e.target.value)}
                                disabled={loading}
                                rows={12}
                                className="resize-none font-mono text-sm"
                            />
                            <p className="text-xs text-muted-foreground">
                                {transcription.length} caracteres
                                {transcription.length > 0 && transcription.length < 100 && (
                                    <span className="text-red-400 ml-2">
                                        (mínimo 100)
                                    </span>
                                )}
                            </p>
                        </div>

                        <Button
                            onClick={handleAnalyze}
                            disabled={loading || transcription.trim().length < 100}
                            className="w-full nc-gradient text-deep-space font-semibold h-11"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Analisando com IA...
                                </>
                            ) : (
                                <>
                                    <Send className="h-4 w-4 mr-2" />
                                    Analisar Call
                                </>
                            )}
                        </Button>
                    </CardContent>
                </Card>
            )}

            {/* Result */}
            {result && (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {/* Score Overview */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Card className="border-border/50 bg-card/50 backdrop-blur-sm md:col-span-1">
                            <CardContent className="pt-6 flex flex-col items-center justify-center text-center space-y-3">
                                <div className="relative">
                                    <div className="w-28 h-28 rounded-full border-4 border-primary/20 flex items-center justify-center">
                                        <span className="text-4xl font-display font-bold nc-gradient-text">
                                            {result.score_geral}
                                        </span>
                                    </div>
                                    <div className="absolute -top-1 -right-1">
                                        <NivelBadge nivel={result.nivel || 'Iniciante'} />
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-sm text-muted-foreground">Nota Geral</p>
                                    <ResultadoBadge resultado={result.resultado || 'follow-up'} />
                                </div>
                                {result.prospect_name && (
                                    <p className="text-xs text-muted-foreground">
                                        Prospect: {result.prospect_name}
                                    </p>
                                )}
                                {result.duration_minutes && (
                                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                                        <Clock className="h-3 w-3" /> {result.duration_minutes} min
                                    </p>
                                )}
                            </CardContent>
                        </Card>

                        <Card className="border-border/50 bg-card/50 backdrop-blur-sm md:col-span-2">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base flex items-center gap-2">
                                    <BarChart3 className="h-4 w-4 text-primary" />
                                    Scores por Área
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {scoreCategories.map((cat) => (
                                    <ScoreBar
                                        key={cat.key}
                                        label={cat.label}
                                        score={cat.score}
                                        icon={cat.icon}
                                    />
                                ))}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Strengths & Improvements */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Card className="border-emerald-500/20 bg-emerald-500/5">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-base flex items-center gap-2 text-emerald-400">
                                    <CheckCircle className="h-4 w-4" />
                                    Pontos Fortes
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ul className="space-y-2">
                                    {(result.pontos_fortes || []).map((ponto, i) => (
                                        <li key={i} className="flex items-start gap-2 text-sm">
                                            <Star className="h-3.5 w-3.5 text-emerald-400 mt-0.5 shrink-0" />
                                            <span className="text-muted-foreground">{ponto}</span>
                                        </li>
                                    ))}
                                </ul>
                            </CardContent>
                        </Card>

                        <Card className="border-amber-500/20 bg-amber-500/5">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-base flex items-center gap-2 text-amber-400">
                                    <AlertTriangle className="h-4 w-4" />
                                    Áreas de Melhoria
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ul className="space-y-2">
                                    {(result.melhorias || []).map((melhoria, i) => (
                                        <li key={i} className="flex items-start gap-2 text-sm">
                                            <TrendingUp className="h-3.5 w-3.5 text-amber-400 mt-0.5 shrink-0" />
                                            <span className="text-muted-foreground">{melhoria}</span>
                                        </li>
                                    ))}
                                </ul>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Detailed Feedback */}
                    {result.feedback_detalhado && (
                        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-base flex items-center gap-2">
                                    <FileText className="h-4 w-4 text-primary" />
                                    Feedback Detalhado
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                                    {result.feedback_detalhado}
                                </p>
                            </CardContent>
                        </Card>
                    )}

                    {/* Agent Suggestion Section */}
                    <Card className="border-primary/20 bg-primary/5">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base flex items-center gap-2">
                                <RefreshCw className="h-4 w-4 text-primary" />
                                Atualizar Agente com esta Análise
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {suggestionSent ? (
                                <div className="flex items-center gap-3 py-2">
                                    <CheckCircle className="h-5 w-5 text-emerald-400 shrink-0" />
                                    <p className="text-sm text-emerald-400 font-medium">
                                        Sugestão gerada e enviada para revisão!
                                    </p>
                                </div>
                            ) : (
                                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                    <div className="flex items-start gap-3">
                                        <Sparkles className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                                        <p className="text-sm text-muted-foreground">
                                            Baseado nessa análise, gerar uma sugestão de melhoria para o Agente Closer?
                                        </p>
                                    </div>
                                    <Button
                                        onClick={handleGenerateSuggestion}
                                        disabled={generatingSuggestion}
                                        size="sm"
                                        className="nc-gradient text-deep-space font-semibold shrink-0"
                                    >
                                        {generatingSuggestion ? (
                                            <>
                                                <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />
                                                Gerando...
                                            </>
                                        ) : (
                                            <>
                                                <Sparkles className="h-3.5 w-3.5 mr-2" />
                                                Gerar Sugestão Automática
                                            </>
                                        )}
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* History */}
            {history.length > 0 && (
                <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                    <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                            <Clock className="h-4 w-4 text-primary" />
                            Histórico de Análises
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {history.map((eval_) => (
                                <div
                                    key={eval_.id}
                                    className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer"
                                    onClick={() => {
                                        setResult(eval_);
                                        setShowForm(false);
                                    }}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                            <span className="text-sm font-bold text-primary">
                                                {eval_.score_geral}
                                            </span>
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium">
                                                {eval_.prospect_name || 'Prospect não informado'}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {new Date(eval_.created_at).toLocaleDateString('pt-BR', {
                                                    day: '2-digit',
                                                    month: 'short',
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                })}
                                                {eval_.duration_minutes && ` · ${eval_.duration_minutes}min`}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <NivelBadge nivel={eval_.nivel || 'Iniciante'} />
                                        <ResultadoBadge resultado={eval_.resultado || 'follow-up'} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
