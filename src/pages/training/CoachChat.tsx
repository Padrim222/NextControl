import { useState, useRef, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { motion, AnimatePresence } from 'framer-motion';
import {
    MessageSquare,
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
    Image as ImageIcon
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { CoachInteraction } from '@/types';

interface ChatMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    image_url?: string;
    timestamp: Date;
}

const WELCOME_MESSAGES: Record<string, string> = {
    seller: '👋 Olá! Sou sua Consultoria de Bolso. Posso te ajudar com técnicas de abordagem, follow-up, como lidar com objeções e melhorar seus números. O que gostaria de aprender hoje?',
    closer: '👋 Olá! Sou sua Consultoria de Bolso. Posso te ajudar com técnicas de fechamento, scripts de call, como contornar objeções e aumentar sua taxa de conversão. O que gostaria de praticar?',
};

const SELLER_QUESTIONS = [
    'Como abordar leads frios?',
    'Script de prospecção',
    'Dicas de follow-up',
    'Técnicas de rapport',
];

const CLOSER_QUESTIONS = [
    'Como lidar com "tá caro"?',
    'Roteiro de call',
    'Técnicas de fechamento',
    'Quebra de objeções',
];

export default function CoachChat() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showContext, setShowContext] = useState(false);
    const [aiContext, setAiContext] = useState<Record<string, any> | null>(null);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [selectedChannel, setSelectedChannel] = useState<'instagram' | 'whatsapp' | 'linkedin'>('whatsapp');
    const scrollRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const sellerType = user?.seller_type || 'seller';

    useEffect(() => {
        // Welcome message
        setMessages([{
            id: 'welcome',
            role: 'assistant',
            content: WELCOME_MESSAGES[sellerType] || WELCOME_MESSAGES.seller,
            timestamp: new Date(),
        }]);

        // Load history
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
                    { id: `q-${interaction.id}`, role: 'user' as const, content: interaction.question, timestamp: new Date(interaction.created_at) },
                    ...(interaction.answer ? [{ id: `a-${interaction.id}`, role: 'assistant' as const, content: interaction.answer, timestamp: new Date(interaction.created_at) }] : []),
                ]);
                setMessages(prev => [...prev, ...historyMessages]);
            }
        } catch (error) {
            console.error('Error loading history:', error);
        }
    };

    const sendMessage = async (text: string) => {
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
            if (!supabase) {
                throw new Error('Conexão com o servidor não disponível.');
            }

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

            // Check for error in response body (edge function returns 200 with error payload)
            if (data?.error) {
                throw new Error(data.error);
            }

            const aiResponse = data?.answer;
            if (!aiResponse) {
                throw new Error('Resposta vazia da IA. Tente novamente.');
            }

            if (data?.context_used) setAiContext(data.context_used);

            const botMsg: ChatMessage = {
                id: `b-${Date.now()}`,
                role: 'assistant',
                content: aiResponse,
                timestamp: new Date(),
            };
            setMessages(prev => [...prev, botMsg]);

        } catch (error: any) {
            console.error('Error sending message:', error);
            const errorMsg = error?.message || 'Erro desconhecido';

            let userFriendlyError: string;
            if (errorMsg.includes('API Key') || errorMsg.includes('not configured')) {
                userFriendlyError = '⚠️ A IA não está configurada ainda. O admin precisa adicionar a chave OPENROUTER_API_KEY nos secrets do Supabase.\n\nEnquanto isso, entre em contato com seu CS para dúvidas.';
            } else if (errorMsg.includes('limit') || errorMsg.includes('Limite')) {
                userFriendlyError = '⏳ Você atingiu o limite diário de mensagens. Volte amanhã! Enquanto isso, revise suas análises no dashboard.';
            } else {
                userFriendlyError = `❌ Erro ao consultar a IA: ${errorMsg}\n\nTente novamente em alguns segundos.`;
            }

            const errorBotMsg: ChatMessage = {
                id: `err-${Date.now()}`,
                role: 'assistant',
                content: userFriendlyError,
                timestamp: new Date(),
            };
            setMessages(prev => [...prev, errorBotMsg]);
        } finally {
            setIsLoading(false);
            inputRef.current?.focus();
        }
    };

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
            const base64String = reader.result as string;
            setSelectedImage(base64String);
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
        
        // Reset input value to allow selecting the same file again
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    return (
        <div className="flex flex-col h-[calc(100vh-4rem)] max-w-3xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-3 py-4 border-b border-border">
                <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="shrink-0">
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <div className="flex items-center gap-3 flex-1">
                    <div className="w-10 h-10 rounded-xl nc-gradient flex items-center justify-center">
                        <Sparkles className="h-5 w-5 text-deep-space" />
                    </div>
                    <div>
                        <h1 className="font-display text-lg font-bold">Consultoria de Bolso</h1>
                        <p className="text-xs text-muted-foreground">Coaching IA personalizado</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setShowContext(p => !p)}
                        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-md hover:bg-muted"
                    >
                        <BarChart3 className="h-3.5 w-3.5" />
                        Contexto IA
                        {showContext ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                    </button>
                    <div className="w-2 h-2 rounded-full bg-nc-success animate-pulse" />
                    <span className="text-xs text-muted-foreground">Online</span>
                </div>
            </div>

            {/* Context Panel */}
            <AnimatePresence>
                {showContext && aiContext && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden border-b border-border"
                    >
                        <div className="p-3 bg-muted/30 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                            {/* Metrics */}
                            {aiContext.today_metrics && Object.keys(aiContext.today_metrics).length > 0 && (
                                <div className="p-2 rounded-lg bg-card border border-border/50">
                                    <p className="text-muted-foreground uppercase tracking-wider mb-1 text-[10px]">Métricas Hoje</p>
                                    {Object.entries(aiContext.today_metrics).slice(0, 4).map(([k, v]) => {
                                        const delta = aiContext.metric_deltas?.[k] || 0;
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

                            {/* Trend */}
                            {aiContext.weekly_trend && aiContext.weekly_trend !== 'unknown' && (
                                <div className="p-2 rounded-lg bg-card border border-border/50">
                                    <p className="text-muted-foreground uppercase tracking-wider mb-1 text-[10px]">Tendência</p>
                                    <div className="flex items-center gap-1">
                                        {aiContext.weekly_trend === 'improving' && <TrendingUp className="h-4 w-4 text-emerald-400" />}
                                        {aiContext.weekly_trend === 'declining' && <TrendingDown className="h-4 w-4 text-red-400" />}
                                        {aiContext.weekly_trend === 'stable' && <Target className="h-4 w-4 text-amber-400" />}
                                        <span className="font-semibold capitalize">{aiContext.weekly_trend === 'improving' ? 'Em Alta' : aiContext.weekly_trend === 'declining' ? 'Em Queda' : 'Estável'}</span>
                                    </div>
                                </div>
                            )}

                            {/* Scores */}
                            {aiContext.recent_scores?.length > 0 && (
                                <div className="p-2 rounded-lg bg-card border border-border/50">
                                    <p className="text-muted-foreground uppercase tracking-wider mb-1 text-[10px]">Scores</p>
                                    <span className="font-mono font-bold text-solar">
                                        {aiContext.recent_scores.slice(0, 3).join(', ')}
                                    </span>
                                </div>
                            )}

                            {/* Strategies */}
                            <div className="p-2 rounded-lg bg-card border border-border/50">
                                <p className="text-muted-foreground uppercase tracking-wider mb-1 text-[10px]">Estratégias</p>
                                <div className="flex items-center gap-2">
                                    <span className="flex items-center gap-0.5"><Zap className="h-3 w-3 text-emerald-400" /> {aiContext.active_strategies_count || 0} ativas</span>
                                    <span className="flex items-center gap-0.5 text-muted-foreground">· {aiContext.discarded_strategies_count || 0} ❌</span>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto py-4 space-y-4 px-2">
                <AnimatePresence initial={false}>
                    {messages.map((msg) => (
                        <motion.div
                            key={msg.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                        >
                            {/* Avatar */}
                            <div className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${msg.role === 'assistant' ? 'bg-solar/15 text-solar' : 'bg-graphite text-platinum'
                                }`}>
                                {msg.role === 'assistant' ? <Bot className="h-4 w-4" /> : <User className="h-4 w-4" />}
                            </div>

                            {/* Bubble */}
                            <div className={`max-w-[80%] flex flex-col gap-2 ${
                                msg.role === 'assistant' ? 'items-start' : 'items-end'
                            }`}>
                                {msg.image_url && (
                                    <div className="rounded-lg overflow-hidden border border-border/50 max-w-[250px] sm:max-w-sm">
                                        <img src={msg.image_url} alt="Anexo do usuário" className="w-full h-auto object-contain" />
                                    </div>
                                )}
                                {msg.content && (
                                    <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${msg.role === 'assistant'
                                        ? 'bg-card nc-card-border text-foreground rounded-tl-md'
                                        : 'nc-gradient text-deep-space rounded-tr-md'
                                        }`}>
                                        {msg.content}
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>

                {/* Loading indicator */}
                {isLoading && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex gap-3"
                    >
                        <div className="w-8 h-8 rounded-lg bg-solar/15 flex items-center justify-center">
                            <Bot className="h-4 w-4 text-solar" />
                        </div>
                        <div className="bg-card nc-card-border rounded-2xl rounded-tl-md px-4 py-3">
                            <div className="flex gap-1.5">
                                <div className="w-2 h-2 rounded-full bg-solar/40 animate-bounce" style={{ animationDelay: '0ms' }} />
                                <div className="w-2 h-2 rounded-full bg-solar/40 animate-bounce" style={{ animationDelay: '150ms' }} />
                                <div className="w-2 h-2 rounded-full bg-solar/40 animate-bounce" style={{ animationDelay: '300ms' }} />
                            </div>
                        </div>
                    </motion.div>
                )}
            </div>

            {/* Quick questions (show when few messages) */}
            {messages.length <= 1 && (
                <div className="px-2 pb-3">
                    <p className="text-xs text-muted-foreground mb-2">Perguntas rápidas:</p>
                    <div className="flex flex-wrap gap-2">
                        {(sellerType === 'closer' ? CLOSER_QUESTIONS : SELLER_QUESTIONS).map((q) => (
                            <button
                                key={q}
                                onClick={() => sendMessage(q)}
                                className="text-xs px-3 py-1.5 rounded-full nc-card-border bg-card hover:bg-solar/10 hover:text-solar transition-colors"
                            >
                                {q}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Input Area */}
            <div className="border-t border-border bg-background p-3 flex flex-col gap-2">
                
                {/* Channel Selector */}
                <div className="flex gap-2 items-center px-1 mb-1">
                    <span className="text-xs text-muted-foreground mr-1">Canal:</span>
                    <button
                        type="button"
                        onClick={() => setSelectedChannel('whatsapp')}
                        className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                            selectedChannel === 'whatsapp' 
                            ? 'bg-emerald-500/15 text-emerald-500 border border-emerald-500/30' 
                            : 'bg-muted/50 text-muted-foreground hover:bg-muted border border-transparent'
                        }`}
                    >
                        <MessageCircle className="w-3.5 h-3.5" />
                        WhatsApp
                    </button>
                    <button
                        type="button"
                        onClick={() => setSelectedChannel('instagram')}
                        className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                            selectedChannel === 'instagram' 
                            ? 'bg-pink-500/15 text-pink-500 border border-pink-500/30' 
                            : 'bg-muted/50 text-muted-foreground hover:bg-muted border border-transparent'
                        }`}
                    >
                        <Instagram className="w-3.5 h-3.5" />
                        Instagram
                    </button>
                    <button
                        type="button"
                        onClick={() => setSelectedChannel('linkedin')}
                        className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                            selectedChannel === 'linkedin' 
                            ? 'bg-blue-500/15 text-blue-500 border border-blue-500/30' 
                            : 'bg-muted/50 text-muted-foreground hover:bg-muted border border-transparent'
                        }`}
                    >
                        <Linkedin className="w-3.5 h-3.5" />
                        LinkedIn
                    </button>
                </div>

                {/* Image Preview */}
                <AnimatePresence>
                    {selectedImage && (
                        <motion.div 
                            initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                            animate={{ opacity: 1, height: 'auto', marginBottom: 8 }}
                            exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                            className="relative self-start"
                        >
                            <div className="relative group rounded-lg overflow-hidden border border-border bg-muted/30 w-24 h-24">
                                <img src={selectedImage} alt="Preview" className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
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

                <form onSubmit={handleSubmit} className="flex gap-2 items-end">
                    <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        className="hidden"
                        ref={fileInputRef}
                        onChange={handleImageSelect}
                    />
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="shrink-0 h-10 w-10 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isLoading}
                        title="Anexar print da conversa"
                    >
                        <Paperclip className="h-5 w-5" />
                    </Button>
                    <Input
                        ref={inputRef}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onPaste={handleInitialPaste}
                        placeholder="Pergunte ao seu treinador ou cole (Ctrl+V) um print..."
                        className="flex-1 nc-input-glow"
                        disabled={isLoading}
                    />
                    <Button
                        type="submit"
                        disabled={(!input.trim() && !selectedImage) || isLoading}
                        className="nc-btn-primary px-4 shrink-0"
                    >
                        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    </Button>
                </form>
            </div>
        </div>
    );
}
