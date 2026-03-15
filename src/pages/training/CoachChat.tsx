import { useState, useRef, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { MarkdownMessage } from '@/components/ui/MarkdownMessage';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Send,
    Sparkles,
    User,
    Loader2,
    Bot,
    Target,
    TrendingUp,
    TrendingDown,
    ArrowLeft,
    BarChart3,
    ChevronDown,
    ChevronUp,
    Zap,
    Paperclip,
    X,
    Instagram,
    MessageCircle,
    Linkedin,
    Copy,
    Check,
    MessageSquare,
    Crosshair,
    UserCheck,
    PhoneCall,
    Handshake,
    ShieldOff,
    Clock,
    Activity,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { CoachInteraction } from '@/types';

// ─── Types ───────────────────────────────────────────────────

interface ChatMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    image_url?: string;
    timestamp: Date;
}

interface QuickPrompt {
    icon: React.ElementType;
    title: string;
    desc: string;
    prompt: string;
}

// ─── Constants ───────────────────────────────────────────────

const AGENT_PERSONA: Record<string, { name: string; subtitle: string; gradient: string }> = {
    seller: { name: 'Nexus SS', subtitle: 'Agente de Social Selling', gradient: 'from-solar to-amber-400' },
    closer: { name: 'Nexus Closer', subtitle: 'Agente de Fechamento', gradient: 'from-blue-400 to-cyan-400' },
    client: { name: 'Nexus', subtitle: 'Consultoria Estratégica', gradient: 'from-solar to-amber-400' },
    team_member: { name: 'Nexus', subtitle: 'Agente do Time', gradient: 'from-solar to-amber-400' },
};

const WELCOME_MESSAGES: Record<string, string> = {
    seller: 'Pronto para turbinar sua prospecção. Qual é o desafio de hoje — abordagem, follow-up ou objeção?',
    closer: 'Pronto para fechar mais deals. Me fale: precisa de script de call, técnica de fechamento ou como contornar objeção?',
    client: 'Olá! Sou seu consultor estratégico. Como posso ajudar o seu negócio hoje?',
    team_member: 'Pronto para ajudar. Qual é sua dúvida sobre o processo de vendas?',
};

const SELLER_QUICK_PROMPTS: QuickPrompt[] = [
    { icon: MessageSquare, title: 'Abordar Lead Frio', desc: 'Script de primeiro contato sem parecer vendedor', prompt: 'Como abordar um lead frio sem parecer vendedor agressivo? Me dá um script de abertura para WhatsApp.' },
    { icon: Clock, title: 'Follow-up Cirúrgico', desc: 'Reativar lead sem soar desesperado', prompt: 'Como fazer um follow-up eficiente com um lead que parou de responder há 3 dias?' },
    { icon: ShieldOff, title: 'Quebrar Objeção', desc: 'Contornar "não tenho tempo" ou "tá caro"', prompt: 'Me ajuda a contornar a objeção "não tenho tempo agora".' },
    { icon: Zap, title: 'Script de Abertura', desc: 'Primeira mensagem de alto impacto', prompt: 'Cria um script de abertura de alto impacto para Instagram DM sobre prospecção de clientes.' },
    { icon: UserCheck, title: 'Rapport Express', desc: 'Criar conexão nos primeiros 30 segundos', prompt: 'Como construir rapport rapidamente em uma conversa de prospecção no WhatsApp?' },
    { icon: Activity, title: 'Gestão de Pipeline', desc: 'Organizar e priorizar leads ativos', prompt: 'Como organizar e priorizar meu pipeline de leads para não deixar oportunidades esfriarem?' },
];

const CLOSER_QUICK_PROMPTS: QuickPrompt[] = [
    { icon: PhoneCall, title: 'Script de Call', desc: 'Estrutura completa de abertura a fechamento', prompt: 'Me dá uma estrutura completa de call de fechamento: do rapport até o CTA final.' },
    { icon: ShieldOff, title: 'Contornar "Tá caro"', desc: 'Defender preço sem descontar valor', prompt: 'Como contornar a objeção de preço sem dar desconto e sem perder o cliente?' },
    { icon: Handshake, title: 'Técnica de Fechamento', desc: 'Os melhores fechamentos testados', prompt: 'Quais são as técnicas de fechamento mais eficientes para uma call de serviços B2B?' },
    { icon: Clock, title: 'Lidar com No-Show', desc: 'Resgatar o lead após falta na call', prompt: 'Um prospect não apareceu na call agendada. Como reconquistar ele e reagendar de forma eficaz?' },
    { icon: Crosshair, title: 'Qualificar Prospect', desc: 'BANT e SPIN aplicados na prática', prompt: 'Me explica como aplicar qualificação BANT de forma natural em uma conversa de descoberta.' },
    { icon: Target, title: 'NPQ na prática', desc: 'Next Possible Question — manter controle', prompt: 'Como usar a técnica NPQ (Next Possible Question) para manter o controle da call sem pressionar o prospect?' },
];

const CHANNEL_PLACEHOLDERS: Record<'whatsapp' | 'instagram' | 'linkedin', string> = {
    whatsapp: 'Pergunte sobre prospecção via WhatsApp ou cole um print...',
    instagram: 'Pergunte sobre abordagem via Instagram DM...',
    linkedin: 'Pergunte sobre prospecção e conexões no LinkedIn...',
};

// ─── Sub-components ──────────────────────────────────────────

function TypingIndicator() {
    return (
        <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            className="flex gap-3 items-end"
        >
            <div className="w-8 h-8 rounded-xl nc-gradient flex items-center justify-center shrink-0">
                <Bot className="h-4 w-4 text-deep-space" />
            </div>
            <div className="bg-card nc-card-border rounded-2xl rounded-bl-md px-4 py-3">
                <div className="flex gap-1.5 items-center">
                    {[0, 150, 300].map((delay) => (
                        <motion.div
                            key={delay}
                            className="w-2 h-2 rounded-full bg-solar"
                            animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1, 0.8] }}
                            transition={{ duration: 1.2, repeat: Infinity, delay: delay / 1000, ease: 'easeInOut' }}
                        />
                    ))}
                </div>
            </div>
        </motion.div>
    );
}

function CopyButton({ text }: { text: string }) {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            // clipboard not available
        }
    };

    return (
        <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={handleCopy}
            className="shrink-0 p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            title="Copiar mensagem"
        >
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
        </motion.button>
    );
}

function formatTimestamp(date: Date): string {
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - date.getTime()) / 60000);

    if (diffMinutes < 1) return 'agora';
    if (diffMinutes < 60) return formatDistanceToNow(date, { locale: ptBR, addSuffix: true });
    return format(date, 'HH:mm');
}

// ─── Main Component ──────────────────────────────────────────

export default function CoachChat() {
    const { user } = useAuth();
    const navigate = useNavigate();

    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showContext, setShowContext] = useState(false);
    const [aiContext, setAiContext] = useState<Record<string, unknown> | null>(null);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [selectedChannel, setSelectedChannel] = useState<'instagram' | 'whatsapp' | 'linkedin'>('whatsapp');
    const [hoveredMsgId, setHoveredMsgId] = useState<string | null>(null);

    const scrollRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const sellerType = user?.seller_type || 'seller';
    const persona = AGENT_PERSONA[sellerType] ?? AGENT_PERSONA.seller;
    const quickPrompts = sellerType === 'closer' ? CLOSER_QUICK_PROMPTS : SELLER_QUICK_PROMPTS;
    const isWelcomeState = messages.length <= 1;

    useEffect(() => {
        setMessages([{
            id: 'welcome',
            role: 'assistant',
            content: WELCOME_MESSAGES[sellerType] ?? WELCOME_MESSAGES.seller,
            timestamp: new Date(),
        }]);
        loadHistory();
    }, [user]);

    useEffect(() => {
        scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }, [messages]);

    const loadHistory = async () => {
        if (!supabase || !user) return;
        try {
            const { data } = await (supabase as any)
                .from('coach_interactions')
                .select('*')
                .eq('seller_id', user.id)
                .order('created_at', { ascending: true })
                .limit(20);

            if (data?.length) {
                const historyMessages: ChatMessage[] = data.flatMap((interaction: CoachInteraction) => [
                    {
                        id: `q-${interaction.id}`,
                        role: 'user' as const,
                        content: interaction.question,
                        timestamp: new Date(interaction.created_at),
                    },
                    ...(interaction.answer
                        ? [{
                            id: `a-${interaction.id}`,
                            role: 'assistant' as const,
                            content: interaction.answer,
                            timestamp: new Date(interaction.created_at),
                        }]
                        : []),
                ]);
                setMessages(prev => [...prev, ...historyMessages]);
            }
        } catch (error) {
            console.error('Error loading history:', error);
        }
    };

    const sendMessage = useCallback(async (text: string) => {
        if ((!text.trim() && !selectedImage) || !user) return;

        const currentImage = selectedImage;
        const userMsg: ChatMessage = {
            id: `u-${Date.now()}`,
            role: 'user',
            content: text.trim(),
            ...(currentImage ? { image_url: currentImage } : {}),
            timestamp: new Date(),
        };

        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setSelectedImage(null);
        setIsLoading(true);

        try {
            if (!supabase) throw new Error('Conexão com o servidor não disponível.');

            const conversationHistory = messages
                .filter(m => m.id !== 'welcome')
                .map(m => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: m.content }));

            const { data, error: fnError } = await (supabase as any).functions.invoke('coach-chat', {
                body: {
                    seller_id: user.id,
                    message: text.trim(),
                    channel: selectedChannel,
                    ...(currentImage ? { image_base64: currentImage } : {}),
                    conversation_history: conversationHistory.slice(-10),
                },
            });

            if (fnError) throw fnError;
            if (data?.error) throw new Error(data.error);

            const aiResponse = data?.answer;
            if (!aiResponse) throw new Error('Resposta vazia da IA. Tente novamente.');

            if (data?.context_used) setAiContext(data.context_used);

            setMessages(prev => [
                ...prev,
                {
                    id: `b-${Date.now()}`,
                    role: 'assistant',
                    content: aiResponse,
                    timestamp: new Date(),
                },
            ]);
        } catch (error: unknown) {
            const errorMsg = error instanceof Error ? error.message : 'Erro desconhecido';

            let userFriendlyError: string;
            if (errorMsg.includes('API Key') || errorMsg.includes('not configured')) {
                userFriendlyError = 'A IA não está configurada ainda. O admin precisa adicionar a chave OPENROUTER_API_KEY nos secrets do Supabase.\n\nEnquanto isso, entre em contato com seu CS para dúvidas.';
            } else if (errorMsg.includes('limit') || errorMsg.includes('Limite')) {
                userFriendlyError = 'Você atingiu o limite diário de mensagens. Volte amanhã! Enquanto isso, revise suas análises no dashboard.';
            } else {
                userFriendlyError = `Erro ao consultar a IA: ${errorMsg}\n\nTente novamente em alguns segundos.`;
            }

            setMessages(prev => [
                ...prev,
                {
                    id: `err-${Date.now()}`,
                    role: 'assistant',
                    content: userFriendlyError,
                    timestamp: new Date(),
                },
            ]);
        } finally {
            setIsLoading(false);
            inputRef.current?.focus();
        }
    }, [messages, selectedImage, selectedChannel, user]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        sendMessage(input);
    };

    const processFile = (file: File) => {
        if (file.size > 5 * 1024 * 1024) {
            alert('A imagem deve ter no máximo 5MB.');
            return;
        }
        const reader = new FileReader();
        reader.onloadend = () => {
            setSelectedImage(reader.result as string);
        };
        reader.readAsDataURL(file);
    };

    const handleInitialPaste = (e: React.ClipboardEvent) => {
        const items = e.clipboardData?.items;
        if (!items) return;
        for (let i = 0; i < items.length; i++) {
            if (items[i].type.indexOf('image') !== -1) {
                const file = items[i].getAsFile();
                if (file) {
                    processFile(file);
                    e.preventDefault();
                    break;
                }
            }
        }
    };

    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        processFile(file);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    return (
        <div className="flex h-[calc(100vh-4rem)] overflow-hidden">
            {/* ─── Desktop Sidebar ─────────────────────────────── */}
            <aside className="hidden lg:flex flex-col w-72 shrink-0 border-r border-border/50 bg-card/50">
                {/* Agent Identity */}
                <div className="p-5 border-b border-border/50">
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-5"
                    >
                        <ArrowLeft className="h-3.5 w-3.5" />
                        Voltar
                    </button>

                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${persona.gradient} flex items-center justify-center shadow-lg shadow-solar/20 mb-4`}>
                        <Bot className="h-7 w-7 text-white" />
                    </div>

                    <h2 className="font-display text-lg font-bold">{persona.name}</h2>
                    <p className="text-xs text-muted-foreground mt-0.5">{persona.subtitle}</p>

                    <div className="flex items-center gap-1.5 mt-3">
                        <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        <span className="text-xs text-muted-foreground">Online agora</span>
                    </div>
                </div>

                {/* Context Panel */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {aiContext ? (
                        <>
                            <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">Contexto da IA</p>

                            {aiContext.today_metrics && Object.keys(aiContext.today_metrics as object).length > 0 && (
                                <div className="p-3 rounded-xl bg-card nc-card-border space-y-1.5">
                                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Métricas Hoje</p>
                                    {Object.entries(aiContext.today_metrics as Record<string, unknown>).slice(0, 4).map(([k, v]) => {
                                        const deltas = aiContext.metric_deltas as Record<string, number> | undefined;
                                        const delta = deltas?.[k] ?? 0;
                                        return (
                                            <div key={k} className="flex items-center justify-between text-xs">
                                                <span className="text-muted-foreground truncate">{k}</span>
                                                <span className="flex items-center gap-0.5 font-mono font-semibold">
                                                    {String(v)}
                                                    {delta !== 0 && (
                                                        <span className={delta > 0 ? 'text-emerald-400' : 'text-red-400'}>
                                                            {delta > 0 ? <TrendingUp className="h-3 w-3 inline" /> : <TrendingDown className="h-3 w-3 inline" />}
                                                        </span>
                                                    )}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            {aiContext.weekly_trend && aiContext.weekly_trend !== 'unknown' && (
                                <div className="p-3 rounded-xl bg-card nc-card-border">
                                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5">Tendência</p>
                                    <div className="flex items-center gap-1.5 text-xs font-semibold">
                                        {aiContext.weekly_trend === 'improving' && <TrendingUp className="h-4 w-4 text-emerald-400" />}
                                        {aiContext.weekly_trend === 'declining' && <TrendingDown className="h-4 w-4 text-red-400" />}
                                        {aiContext.weekly_trend === 'stable' && <Target className="h-4 w-4 text-amber-400" />}
                                        <span>
                                            {aiContext.weekly_trend === 'improving' ? 'Em Alta' : aiContext.weekly_trend === 'declining' ? 'Em Queda' : 'Estável'}
                                        </span>
                                    </div>
                                </div>
                            )}

                            {Array.isArray(aiContext.recent_scores) && (aiContext.recent_scores as number[]).length > 0 && (
                                <div className="p-3 rounded-xl bg-card nc-card-border">
                                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5">Scores Recentes</p>
                                    <span className="font-mono font-bold text-solar text-sm">
                                        {(aiContext.recent_scores as number[]).slice(0, 3).join('  ·  ')}
                                    </span>
                                </div>
                            )}

                            <div className="p-3 rounded-xl bg-card nc-card-border">
                                <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5">Estratégias</p>
                                <div className="flex items-center gap-3 text-xs">
                                    <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                                        <Zap className="h-3 w-3" />
                                        {(aiContext.active_strategies_count as number) || 0} ativas
                                    </span>
                                    <span className="text-muted-foreground">
                                        {(aiContext.discarded_strategies_count as number) || 0} descartadas
                                    </span>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-32 text-center">
                            <BarChart3 className="h-8 w-8 text-muted-foreground/30 mb-2" />
                            <p className="text-xs text-muted-foreground">
                                O contexto da IA aparece aqui após a primeira resposta.
                            </p>
                        </div>
                    )}
                </div>

                {/* Conversation stats */}
                <div className="p-4 border-t border-border/50">
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">Esta conversa</p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>{messages.filter(m => m.role === 'user').length} perguntas</span>
                        <span>{messages.filter(m => m.role === 'assistant').length} respostas</span>
                    </div>
                </div>
            </aside>

            {/* ─── Chat Area ───────────────────────────────────── */}
            <div className="flex flex-col flex-1 min-w-0">
                {/* Mobile/tablet header */}
                <div className="flex items-center gap-3 px-4 py-3 border-b border-border/50 lg:hidden shrink-0">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                    >
                        <ArrowLeft className="h-4 w-4" />
                    </button>
                    <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${persona.gradient} flex items-center justify-center shrink-0`}>
                        <Bot className="h-4.5 w-4.5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="font-display font-bold text-sm truncate">{persona.name}</p>
                        <p className="text-[11px] text-muted-foreground truncate">{persona.subtitle}</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setShowContext(p => !p)}
                            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-md hover:bg-muted"
                        >
                            <BarChart3 className="h-3.5 w-3.5" />
                            {showContext ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                        </button>
                        <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    </div>
                </div>

                {/* Desktop chat header */}
                <div className="hidden lg:flex items-center gap-3 px-6 py-3 border-b border-border/50 shrink-0">
                    <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${persona.gradient} flex items-center justify-center shrink-0`}>
                        <Bot className="h-4.5 w-4.5 text-white" />
                    </div>
                    <div className="flex-1">
                        <p className="font-display font-bold">{persona.name}</p>
                        <p className="text-xs text-muted-foreground">{persona.subtitle}</p>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        Online
                    </div>
                </div>

                {/* Mobile context panel */}
                <AnimatePresence>
                    {showContext && aiContext && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden border-b border-border/50 lg:hidden shrink-0"
                        >
                            <div className="p-3 bg-muted/30 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                                {aiContext.today_metrics && Object.keys(aiContext.today_metrics as object).length > 0 && (
                                    <div className="p-2 rounded-lg bg-card border border-border/50">
                                        <p className="text-muted-foreground uppercase tracking-wider mb-1 text-[10px]">Métricas Hoje</p>
                                        {Object.entries(aiContext.today_metrics as Record<string, unknown>).slice(0, 4).map(([k, v]) => {
                                            const deltas = aiContext.metric_deltas as Record<string, number> | undefined;
                                            const delta = deltas?.[k] ?? 0;
                                            return (
                                                <div key={k} className="flex items-center justify-between">
                                                    <span className="truncate">{k}</span>
                                                    <span className="flex items-center gap-0.5 font-mono">
                                                        {String(v)}
                                                        {delta !== 0 && (
                                                            <span className={delta > 0 ? 'text-emerald-400' : 'text-red-400'}>
                                                                {delta > 0 ? '↑' : '↓'}
                                                            </span>
                                                        )}
                                                    </span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                                {aiContext.weekly_trend && aiContext.weekly_trend !== 'unknown' && (
                                    <div className="p-2 rounded-lg bg-card border border-border/50">
                                        <p className="text-muted-foreground uppercase tracking-wider mb-1 text-[10px]">Tendência</p>
                                        <div className="flex items-center gap-1">
                                            {aiContext.weekly_trend === 'improving' && <TrendingUp className="h-4 w-4 text-emerald-400" />}
                                            {aiContext.weekly_trend === 'declining' && <TrendingDown className="h-4 w-4 text-red-400" />}
                                            {aiContext.weekly_trend === 'stable' && <Target className="h-4 w-4 text-amber-400" />}
                                            <span className="font-semibold capitalize">
                                                {aiContext.weekly_trend === 'improving' ? 'Em Alta' : aiContext.weekly_trend === 'declining' ? 'Em Queda' : 'Estável'}
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Messages */}
                <div ref={scrollRef} className="flex-1 overflow-y-auto py-4 px-4 lg:px-6 space-y-5">
                    <AnimatePresence initial={false}>
                        {messages.map((msg) => (
                            <motion.div
                                key={msg.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                                className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
                                onMouseEnter={() => setHoveredMsgId(msg.id)}
                                onMouseLeave={() => setHoveredMsgId(null)}
                            >
                                {/* Avatar */}
                                <div className={`shrink-0 w-8 h-8 rounded-xl flex items-center justify-center ${
                                    msg.role === 'assistant'
                                        ? `bg-gradient-to-br ${persona.gradient}`
                                        : 'bg-graphite/50 text-platinum'
                                }`}>
                                    {msg.role === 'assistant'
                                        ? <Bot className="h-4 w-4 text-white" />
                                        : <User className="h-4 w-4" />
                                    }
                                </div>

                                {/* Bubble + actions */}
                                <div className={`max-w-[78%] flex flex-col gap-1.5 ${
                                    msg.role === 'assistant' ? 'items-start' : 'items-end'
                                }`}>
                                    {msg.image_url && (
                                        <div className="rounded-xl overflow-hidden border border-border/50 max-w-[250px] sm:max-w-sm">
                                            <img src={msg.image_url} alt="Anexo" className="w-full h-auto object-contain" />
                                        </div>
                                    )}
                                    {msg.content && (
                                        <div className={`px-4 py-3 rounded-2xl text-sm ${
                                            msg.role === 'assistant'
                                                ? 'bg-card nc-card-border text-foreground rounded-tl-md'
                                                : 'nc-gradient text-deep-space font-medium rounded-tr-md'
                                        }`}>
                                            {msg.role === 'assistant'
                                                ? <MarkdownMessage content={msg.content} />
                                                : <p className="leading-relaxed">{msg.content}</p>
                                            }
                                        </div>
                                    )}
                                    {/* Timestamp + copy */}
                                    <div className={`flex items-center gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                                        <span className="text-[10px] text-muted-foreground/60">
                                            {formatTimestamp(msg.timestamp)}
                                        </span>
                                        {msg.role === 'assistant' && hoveredMsgId === msg.id && (
                                            <CopyButton text={msg.content} />
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>

                    {/* Typing indicator */}
                    <AnimatePresence>
                        {isLoading && <TypingIndicator />}
                    </AnimatePresence>
                </div>

                {/* Quick Prompts — welcome state */}
                <AnimatePresence>
                    {isWelcomeState && (
                        <motion.div
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 8 }}
                            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
                            className="px-4 lg:px-6 pb-3 shrink-0"
                        >
                            <p className="text-xs text-muted-foreground mb-2.5 font-medium">Comece por aqui:</p>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                {quickPrompts.map((item) => {
                                    const Icon = item.icon;
                                    return (
                                        <motion.button
                                            key={item.title}
                                            whileHover={{ scale: 1.02, y: -1 }}
                                            whileTap={{ scale: 0.98 }}
                                            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                                            onClick={() => sendMessage(item.prompt)}
                                            className="flex flex-col items-start gap-1.5 p-3 rounded-xl bg-card nc-card-border text-left hover:bg-solar/5 hover:border-solar/30 transition-colors group"
                                        >
                                            <div className="w-7 h-7 rounded-lg bg-solar/10 flex items-center justify-center shrink-0 group-hover:bg-solar/20 transition-colors">
                                                <Icon className="h-3.5 w-3.5 text-solar" />
                                            </div>
                                            <div>
                                                <p className="text-xs font-semibold leading-tight">{item.title}</p>
                                                <p className="text-[11px] text-muted-foreground leading-tight mt-0.5 line-clamp-2">
                                                    {item.desc}
                                                </p>
                                            </div>
                                        </motion.button>
                                    );
                                })}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* ─── Input Area ──────────────────────────────── */}
                <div className="shrink-0 border-t border-border/50 bg-card/80 backdrop-blur-sm px-4 lg:px-6 py-3 space-y-2.5">
                    {/* Channel Selector */}
                    <div className="flex items-center gap-1.5">
                        <span className="text-[11px] text-muted-foreground mr-1">Canal:</span>
                        {(
                            [
                                { key: 'whatsapp', label: 'WhatsApp', Icon: MessageCircle, activeClass: 'bg-emerald-500/15 text-emerald-500 border-emerald-500/30' },
                                { key: 'instagram', label: 'Instagram', Icon: Instagram, activeClass: 'bg-pink-500/15 text-pink-500 border-pink-500/30' },
                                { key: 'linkedin', label: 'LinkedIn', Icon: Linkedin, activeClass: 'bg-blue-500/15 text-blue-500 border-blue-500/30' },
                            ] as const
                        ).map(({ key, label, Icon, activeClass }) => (
                            <button
                                key={key}
                                type="button"
                                onClick={() => setSelectedChannel(key)}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 border ${
                                    selectedChannel === key
                                        ? activeClass
                                        : 'bg-muted/30 text-muted-foreground hover:bg-muted border-transparent'
                                }`}
                            >
                                <Icon className="w-3.5 h-3.5" />
                                {label}
                            </button>
                        ))}
                    </div>

                    {/* Image Preview */}
                    <AnimatePresence>
                        {selectedImage && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="relative self-start"
                            >
                                <div className="relative group rounded-xl overflow-hidden border border-border bg-muted/30 w-24 h-24">
                                    <img src={selectedImage} alt="Preview" className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <Button
                                            type="button"
                                            variant="destructive"
                                            size="icon"
                                            className="h-6 w-6 rounded-full"
                                            onClick={() => setSelectedImage(null)}
                                        >
                                            <X className="h-3 w-3" />
                                        </Button>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="flex gap-2 items-end">
                        <input
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            className="hidden"
                            ref={fileInputRef}
                            onChange={handleImageSelect}
                        />
                        <button
                            type="button"
                            className="shrink-0 h-10 w-10 rounded-xl flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-40"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isLoading}
                            title="Anexar print da conversa"
                        >
                            <Paperclip className="h-5 w-5" />
                        </button>

                        <input
                            ref={inputRef}
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onPaste={handleInitialPaste}
                            placeholder={CHANNEL_PLACEHOLDERS[selectedChannel]}
                            className="flex-1 h-10 rounded-xl bg-muted/50 border border-border/50 px-4 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-solar/30 focus:border-solar/50 nc-input-glow transition-all disabled:opacity-50"
                            disabled={isLoading}
                        />

                        <motion.button
                            type="submit"
                            disabled={(!input.trim() && !selectedImage) || isLoading}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                            className="shrink-0 h-10 w-10 rounded-xl nc-gradient flex items-center justify-center text-deep-space font-semibold disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-solar/20"
                        >
                            {isLoading
                                ? <Loader2 className="h-4 w-4 animate-spin" />
                                : <Send className="h-4 w-4" />
                            }
                        </motion.button>
                    </form>
                </div>
            </div>
        </div>
    );
}
