import { useState, useRef, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Send,
    Sparkles,
    User,
    Loader2,
    Bot,
    ArrowLeft,
    Zap,
    Lightbulb,
    X,
    CheckCircle,
} from '@/components/ui/icons';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import type { CoachInteraction } from '@/types';

interface ChatMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
}

type AgentType = 'ss' | 'closer' | 'geral';

interface SuggestionModalState {
    open: boolean;
    title: string;
    agentType: AgentType;
    suggestionText: string;
    contextNote: string;
}

const WELCOME_MESSAGES: Record<string, string> = {
    seller: 'Olá! Sou sua Consultoria de Bolso. Posso te ajudar com técnicas de abordagem, follow-up, como lidar com objeções e melhorar seus números. O que gostaria de aprender hoje?',
    closer: 'Olá! Sou sua Consultoria de Bolso. Posso te ajudar com técnicas de fechamento, scripts de call, como contornar objeções e aumentar sua taxa de conversão. O que gostaria de praticar?',
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

function defaultAgentType(role: string | undefined, sellerType: string): AgentType {
    if (role === 'closer' || sellerType === 'closer') return 'closer';
    if (role === 'seller') return 'ss';
    return 'geral';
}

export default function CoachChat() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [modal, setModal] = useState<SuggestionModalState>({
        open: false,
        title: '',
        agentType: 'geral',
        suggestionText: '',
        contextNote: '',
    });
    const [submitting, setSubmitting] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const sellerType = user?.seller_type || 'seller';

    useEffect(() => {
        setMessages([{
            id: 'welcome',
            role: 'assistant',
            content: WELCOME_MESSAGES[sellerType] || WELCOME_MESSAGES.seller,
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
        if (!text.trim() || !user) return;

        const userMsg: ChatMessage = {
            id: `u-${Date.now()}`,
            role: 'user',
            content: text.trim(),
            timestamp: new Date(),
        };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsLoading(true);

        try {
            let aiResponse: string;

            if (supabase) {
                try {
                    const conversationHistory = messages
                        .filter(m => m.id !== 'welcome')
                        .map(m => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: m.content }));

                    const { data, error: fnError } = await (supabase as any).functions.invoke('coach-chat', {
                        body: {
                            seller_id: user.id,
                            message: text.trim(),
                            conversation_history: conversationHistory.slice(-10),
                        },
                    });

                    if (fnError) throw fnError;
                    aiResponse = data?.answer || generateMockResponse(text, sellerType);
                } catch (edgeFnError) {
                    console.warn('Edge Function fallback to mock:', edgeFnError);
                    aiResponse = generateMockResponse(text, sellerType);
                    await (supabase as any).from('coach_interactions').insert({
                        seller_id: user.id,
                        question: text.trim(),
                        answer: aiResponse,
                        context: { seller_type: sellerType },
                    });
                }
            } else {
                aiResponse = generateMockResponse(text, sellerType);
            }

            setMessages(prev => [...prev, {
                id: `b-${Date.now()}`,
                role: 'assistant',
                content: aiResponse,
                timestamp: new Date(),
            }]);
        } catch (error) {
            console.error('Error sending message:', error);
        } finally {
            setIsLoading(false);
            inputRef.current?.focus();
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        sendMessage(input);
    };

    const openSuggestionModal = () => {
        if (!user) return;

        // Pre-fill title with last 60 chars of recent conversation
        const recentConversation = messages
            .filter(m => m.id !== 'welcome')
            .map(m => m.content)
            .join(' ')
            .slice(-60)
            .trim();

        // Pre-fill suggestion text with last assistant message
        const lastAiMsg = [...messages].reverse().find(m => m.role === 'assistant' && m.id !== 'welcome');

        setModal({
            open: true,
            title: recentConversation || 'Melhoria baseada no chat de coaching',
            agentType: defaultAgentType(user.role, sellerType),
            suggestionText: lastAiMsg?.content || '',
            contextNote: '',
        });
    };

    const closeSuggestionModal = () => {
        setModal(prev => ({ ...prev, open: false }));
    };

    const handleSuggestionSubmit = async () => {
        if (!user || !modal.title.trim() || !modal.suggestionText.trim()) {
            toast.error('Preencha o título e a descrição da melhoria.');
            return;
        }

        setSubmitting(true);
        try {
            await (supabase as any).from('agent_suggestions').insert({
                user_id: user.id,
                client_id: user.client_id || null,
                agent_type: modal.agentType,
                title: modal.title.trim(),
                suggestion_text: modal.suggestionText.trim(),
                context_note: modal.contextNote.trim() || null,
                source: 'user',
                status: 'pending',
            });

            toast.success('Sugestão enviada para revisão do admin!');
            closeSuggestionModal();
        } catch (error) {
            console.error('Error submitting suggestion:', error);
            toast.error('Erro ao enviar sugestão. Tente novamente.');
        } finally {
            setSubmitting(false);
        }
    };

    const hasConversation = messages.filter(m => m.id !== 'welcome').length > 0;

    return (
        <div
            className="flex flex-col max-w-3xl mx-auto"
            style={{ height: 'calc(100vh - 64px)', fontFamily: 'DM Sans, system-ui, sans-serif' }}
        >
            {/* Header */}
            <div
                className="flex items-center gap-3 px-4 py-3 bg-white"
                style={{ borderBottom: '1px solid #E5E7EB' }}
            >
                <button
                    onClick={() => navigate(-1)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
                    style={{ color: '#6B7280' }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = '#F3F4F6')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                    <ArrowLeft size={16} strokeWidth={1.5} />
                </button>

                <div className="flex items-center gap-3 flex-1">
                    <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center"
                        style={{ background: '#1B2B4A' }}
                    >
                        <Zap size={16} style={{ color: '#E6B84D' }} strokeWidth={2} />
                    </div>
                    <div>
                        <h1
                            className="text-[15px] font-semibold leading-tight"
                            style={{ fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif', color: '#1A1A1A' }}
                        >
                            Consultoria de Bolso
                        </h1>
                        <p className="text-[11px]" style={{ color: '#9CA3AF' }}>
                            Coaching IA personalizado
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-1.5">
                    <div
                        className="w-2 h-2 rounded-full"
                        style={{ background: '#059669', boxShadow: '0 0 6px rgba(5,150,105,0.4)' }}
                    />
                    <span className="text-[11px]" style={{ color: '#9CA3AF' }}>Online</span>
                </div>
            </div>

            {/* Messages */}
            <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto py-5 space-y-4 px-4"
                style={{ background: '#FAFAFA' }}
            >
                <AnimatePresence initial={false}>
                    {messages.map((msg) => (
                        <motion.div
                            key={msg.id}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                        >
                            {/* Avatar */}
                            <div
                                className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center"
                                style={
                                    msg.role === 'assistant'
                                        ? { background: '#FEF9EC', color: '#1B2B4A' }
                                        : { background: '#1B2B4A', color: '#E6B84D' }
                                }
                            >
                                {msg.role === 'assistant'
                                    ? <Bot size={15} strokeWidth={1.5} />
                                    : <User size={15} strokeWidth={1.5} />
                                }
                            </div>

                            {/* Bubble */}
                            <div
                                className="max-w-[78%] px-4 py-3 text-[14px] leading-relaxed"
                                style={
                                    msg.role === 'assistant'
                                        ? {
                                            background: '#FFFFFF',
                                            border: '1px solid #E5E7EB',
                                            borderRadius: '12px 12px 12px 3px',
                                            color: '#1A1A1A',
                                            boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                                            whiteSpace: 'pre-wrap',
                                        }
                                        : {
                                            background: '#1B2B4A',
                                            borderRadius: '12px 12px 3px 12px',
                                            color: '#FFFFFF',
                                            whiteSpace: 'pre-wrap',
                                        }
                                }
                            >
                                {msg.content}
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>

                {/* Loading dots */}
                {isLoading && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex gap-3"
                    >
                        <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center"
                            style={{ background: '#FEF9EC' }}
                        >
                            <Bot size={15} strokeWidth={1.5} style={{ color: '#1B2B4A' }} />
                        </div>
                        <div
                            className="px-4 py-3 rounded-xl"
                            style={{
                                background: '#FFFFFF',
                                border: '1px solid #E5E7EB',
                                borderRadius: '12px 12px 12px 3px',
                            }}
                        >
                            <div className="flex gap-1.5 items-center h-5">
                                {[0, 150, 300].map((delay) => (
                                    <div
                                        key={delay}
                                        className="w-2 h-2 rounded-full animate-bounce"
                                        style={{ background: '#9CA3AF', animationDelay: `${delay}ms` }}
                                    />
                                ))}
                            </div>
                        </div>
                    </motion.div>
                )}
            </div>

            {/* Quick questions */}
            {messages.length <= 1 && (
                <div
                    className="px-4 py-3"
                    style={{ background: '#FAFAFA', borderTop: '1px solid #F3F4F6' }}
                >
                    <p className="text-[11px] font-medium mb-2" style={{ color: '#9CA3AF' }}>
                        Perguntas rápidas
                    </p>
                    <div className="flex flex-wrap gap-2">
                        {(sellerType === 'closer' ? CLOSER_QUESTIONS : SELLER_QUESTIONS).map((q) => (
                            <button
                                key={q}
                                onClick={() => sendMessage(q)}
                                className="text-[12px] px-3 py-1.5 rounded-full transition-all"
                                style={{
                                    background: '#FFFFFF',
                                    border: '1px solid #E5E7EB',
                                    color: '#6B7280',
                                    fontFamily: 'DM Sans, sans-serif',
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.background = '#FEF9EC';
                                    e.currentTarget.style.borderColor = '#1B2B4A';
                                    e.currentTarget.style.color = '#1B2B4A';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.background = '#FFFFFF';
                                    e.currentTarget.style.borderColor = '#E5E7EB';
                                    e.currentTarget.style.color = '#6B7280';
                                }}
                            >
                                {q}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Input */}
            <form
                onSubmit={handleSubmit}
                className="px-4 pt-3 pb-2 bg-white"
                style={{ borderTop: '1px solid #E5E7EB' }}
            >
                <div className="flex gap-2">
                    <input
                        ref={inputRef}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Pergunte ao seu coach..."
                        disabled={isLoading}
                        className="flex-1 px-4 py-2.5 rounded-lg text-[14px] outline-none transition-all"
                        style={{
                            background: '#FAFAFA',
                            border: '1px solid #E5E7EB',
                            color: '#1A1A1A',
                            fontFamily: 'DM Sans, sans-serif',
                        }}
                        onFocus={(e) => {
                            e.currentTarget.style.borderColor = '#1B2B4A';
                            e.currentTarget.style.boxShadow = '0 0 0 3px rgba(27,43,74,0.08)';
                        }}
                        onBlur={(e) => {
                            e.currentTarget.style.borderColor = '#E5E7EB';
                            e.currentTarget.style.boxShadow = 'none';
                        }}
                    />
                    <button
                        type="submit"
                        disabled={!input.trim() || isLoading}
                        className="w-10 h-10 rounded-lg flex items-center justify-center transition-all disabled:opacity-40"
                        style={{ background: '#1B2B4A', color: '#E6B84D' }}
                    >
                        {isLoading
                            ? <Loader2 size={16} className="animate-spin" />
                            : <Send size={16} strokeWidth={2} />
                        }
                    </button>
                </div>

                {/* Suggestion button — shown only when there is conversation */}
                {hasConversation && (
                    <div className="flex justify-center mt-2 pb-1">
                        <button
                            type="button"
                            onClick={openSuggestionModal}
                            className="flex items-center gap-1.5 text-[12px] px-3 py-1.5 rounded-full transition-all"
                            style={{
                                background: '#FEF9EC',
                                border: '1px solid #E6B84D',
                                color: '#92620A',
                                fontFamily: 'DM Sans, sans-serif',
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.background = '#FEF3C7';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background = '#FEF9EC';
                            }}
                        >
                            <Lightbulb size={13} />
                            Salvar como melhoria do agente
                        </button>
                    </div>
                )}
            </form>

            {/* Suggestion Modal */}
            <AnimatePresence>
                {modal.open && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-4"
                        style={{ background: 'rgba(0,0,0,0.5)' }}
                        onClick={(e) => { if (e.target === e.currentTarget) closeSuggestionModal(); }}
                    >
                        <motion.div
                            initial={{ opacity: 0, y: 40 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 40 }}
                            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                            className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden"
                            style={{ maxHeight: '90vh' }}
                        >
                            {/* Modal header */}
                            <div
                                className="flex items-center justify-between px-5 py-4"
                                style={{ borderBottom: '1px solid #F3F4F6' }}
                            >
                                <div className="flex items-center gap-2">
                                    <div
                                        className="w-7 h-7 rounded-lg flex items-center justify-center"
                                        style={{ background: '#FEF9EC' }}
                                    >
                                        <Lightbulb size={14} style={{ color: '#92620A' }} />
                                    </div>
                                    <span
                                        className="text-[15px] font-semibold"
                                        style={{ fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif', color: '#1A1A1A' }}
                                    >
                                        Sugerir melhoria ao agente
                                    </span>
                                </div>
                                <button
                                    onClick={closeSuggestionModal}
                                    className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
                                    style={{ color: '#9CA3AF' }}
                                    onMouseEnter={(e) => (e.currentTarget.style.background = '#F3F4F6')}
                                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                                >
                                    <X size={15} />
                                </button>
                            </div>

                            {/* Modal body */}
                            <div className="px-5 py-4 space-y-4 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 130px)' }}>
                                {/* Title */}
                                <div className="space-y-1.5">
                                    <label
                                        className="text-[12px] font-medium"
                                        style={{ color: '#374151' }}
                                    >
                                        Título da melhoria
                                    </label>
                                    <input
                                        value={modal.title}
                                        onChange={(e) => setModal(prev => ({ ...prev, title: e.target.value }))}
                                        placeholder="Ex: Como lidar com objeção de preço"
                                        className="w-full px-3 py-2.5 rounded-lg text-[13px] outline-none transition-all"
                                        style={{
                                            background: '#FAFAFA',
                                            border: '1px solid #E5E7EB',
                                            color: '#1A1A1A',
                                            fontFamily: 'DM Sans, sans-serif',
                                        }}
                                        onFocus={(e) => {
                                            e.currentTarget.style.borderColor = '#1B2B4A';
                                            e.currentTarget.style.boxShadow = '0 0 0 3px rgba(27,43,74,0.08)';
                                        }}
                                        onBlur={(e) => {
                                            e.currentTarget.style.borderColor = '#E5E7EB';
                                            e.currentTarget.style.boxShadow = 'none';
                                        }}
                                    />
                                </div>

                                {/* Agent type */}
                                <div className="space-y-1.5">
                                    <label
                                        className="text-[12px] font-medium"
                                        style={{ color: '#374151' }}
                                    >
                                        Tipo de agente
                                    </label>
                                    <div className="flex gap-2">
                                        {(['ss', 'closer', 'geral'] as AgentType[]).map((type) => (
                                            <button
                                                key={type}
                                                type="button"
                                                onClick={() => setModal(prev => ({ ...prev, agentType: type }))}
                                                className="flex-1 py-2 rounded-lg text-[12px] font-medium transition-all capitalize"
                                                style={
                                                    modal.agentType === type
                                                        ? { background: '#1B2B4A', color: '#E6B84D', border: '1px solid #1B2B4A' }
                                                        : { background: '#FAFAFA', color: '#6B7280', border: '1px solid #E5E7EB' }
                                                }
                                            >
                                                {type === 'ss' ? 'SS' : type === 'closer' ? 'Closer' : 'Geral'}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Suggestion text */}
                                <div className="space-y-1.5">
                                    <label
                                        className="text-[12px] font-medium"
                                        style={{ color: '#374151' }}
                                    >
                                        Descreva a melhoria ou novo contexto
                                    </label>
                                    <textarea
                                        value={modal.suggestionText}
                                        onChange={(e) => setModal(prev => ({ ...prev, suggestionText: e.target.value }))}
                                        placeholder="Descreva o que o agente deveria saber ou como deveria responder..."
                                        rows={5}
                                        className="w-full px-3 py-2.5 rounded-lg text-[13px] outline-none transition-all resize-none"
                                        style={{
                                            background: '#FAFAFA',
                                            border: '1px solid #E5E7EB',
                                            color: '#1A1A1A',
                                            fontFamily: 'DM Sans, sans-serif',
                                        }}
                                        onFocus={(e) => {
                                            e.currentTarget.style.borderColor = '#1B2B4A';
                                            e.currentTarget.style.boxShadow = '0 0 0 3px rgba(27,43,74,0.08)';
                                        }}
                                        onBlur={(e) => {
                                            e.currentTarget.style.borderColor = '#E5E7EB';
                                            e.currentTarget.style.boxShadow = 'none';
                                        }}
                                    />
                                </div>

                                {/* Context note */}
                                <div className="space-y-1.5">
                                    <label
                                        className="text-[12px] font-medium"
                                        style={{ color: '#374151' }}
                                    >
                                        O que motivou essa sugestão?{' '}
                                        <span style={{ color: '#9CA3AF', fontWeight: 400 }}>(opcional)</span>
                                    </label>
                                    <input
                                        value={modal.contextNote}
                                        onChange={(e) => setModal(prev => ({ ...prev, contextNote: e.target.value }))}
                                        placeholder="Ex: Percebi que o agente não sabe lidar com esse cenário"
                                        className="w-full px-3 py-2.5 rounded-lg text-[13px] outline-none transition-all"
                                        style={{
                                            background: '#FAFAFA',
                                            border: '1px solid #E5E7EB',
                                            color: '#1A1A1A',
                                            fontFamily: 'DM Sans, sans-serif',
                                        }}
                                        onFocus={(e) => {
                                            e.currentTarget.style.borderColor = '#1B2B4A';
                                            e.currentTarget.style.boxShadow = '0 0 0 3px rgba(27,43,74,0.08)';
                                        }}
                                        onBlur={(e) => {
                                            e.currentTarget.style.borderColor = '#E5E7EB';
                                            e.currentTarget.style.boxShadow = 'none';
                                        }}
                                    />
                                </div>
                            </div>

                            {/* Modal footer */}
                            <div
                                className="px-5 py-4 flex gap-2"
                                style={{ borderTop: '1px solid #F3F4F6' }}
                            >
                                <button
                                    type="button"
                                    onClick={closeSuggestionModal}
                                    className="flex-1 py-2.5 rounded-lg text-[13px] font-medium transition-all"
                                    style={{
                                        background: '#F3F4F6',
                                        color: '#6B7280',
                                        border: '1px solid #E5E7EB',
                                    }}
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="button"
                                    onClick={handleSuggestionSubmit}
                                    disabled={submitting || !modal.title.trim() || !modal.suggestionText.trim()}
                                    className="flex-1 py-2.5 rounded-lg text-[13px] font-semibold flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                                    style={{ background: '#1B2B4A', color: '#E6B84D' }}
                                >
                                    {submitting
                                        ? <Loader2 size={14} className="animate-spin" />
                                        : <CheckCircle size={14} />
                                    }
                                    Enviar Sugestão
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

function generateMockResponse(question: string, sellerType: string): string {
    const q = question.toLowerCase();

    if (q.includes('abord') || q.includes('prospec')) {
        return 'Para abordagens eficazes:\n\n1. Personalização — Pesquise o perfil antes de abordar. Mencione algo específico (post recente, empresa, cargo).\n2. Value-first — Ofereça algo de valor antes de pedir algo. Compartilhe um insight ou dado relevante.\n3. Pergunta aberta — Evite "tem interesse?" e use "como vocês estão lidando com [problema]?".\n4. Timing — Terças e quartas, 9-11h são os melhores horários.\n\nQuer que eu elabore algum desses pontos?';
    }

    if (q.includes('follow') || q.includes('acompanham')) {
        return 'Estratégia de Follow-up:\n\n1. Regra 2-5-12 — 2 dias após primeiro contato, 5 dias se não responder, 12 dias último follow-up.\n2. Nunca diga "só passando pra ver" — Sempre traga algo novo: artigo, caso de sucesso, dado.\n3. Multicanal — Alterne entre LinkedIn, email e WhatsApp.\n4. Break-up email — No último follow-up, seja direto: "Entendo que o timing pode não ser ideal. Posso retomar em [período]?"\n\nQuer um template de follow-up?';
    }

    if (q.includes('obje') || q.includes('caro') || q.includes('preço')) {
        return 'Contornando "Tá caro":\n\n1. Nunca desconte direto — Isso posiciona seu produto como sobrevalorizado.\n2. Isole a objeção — "Além do preço, existe alguma outra preocupação?"\n3. Reframe para ROI — "Se este investimento te gerasse 3x de retorno em 90 dias, faria sentido?"\n4. Parcele — Divida o valor por dia/semana para diminuir a percepção.\n5. Social proof — "O [cliente X] teve a mesma preocupação e em 60 dias já tinha pago o investimento."\n\nQuer praticar um roleplay?';
    }

    if (q.includes('rapport') || q.includes('conex')) {
        return 'Construindo Rapport:\n\n1. Espelhamento — Adapte seu tom, velocidade e energia ao prospect.\n2. Interesses comuns — LinkedIn é seu melhor amigo pra pesquisar.\n3. Escuta ativa — Repita o que ouviu: "Se entendi bem, seu maior desafio é...".\n4. Vulnerabilidade calculada — Admita limitações genuínas do seu produto. Gera confiança.\n\nRapport não é técnica, é intenção genuína. O prospect sente quando é forçado.';
    }

    if (q.includes('script') || q.includes('roteiro') || q.includes('call')) {
        return 'Roteiro de Call Vencedora:\n\n1. Abertura (30s) — Nome, empresa, motivo claro. "Estou ligando porque notei que..."\n2. Qualificação (2min) — 3 perguntas SPIN: Situação, Problema, Implicação.\n3. Apresentação (3min) — Conecte a solução ao problema que ELE descreveu.\n4. Objeções (2min) — "Faz sentido? O que te preocupa?"\n5. Fechamento (1min) — "Baseado no que conversamos, faz sentido avançarmos com [próximo passo]?"\n\nDica: Grave suas calls e reveja 1 por semana. Você vai evoluir 10x.';
    }

    return `Boa pergunta! Como ${sellerType === 'closer' ? 'closer' : 'vendedor'}, isso é super relevante.\n\nVou analisar suas últimas submissões para personalizar minha resposta. Por enquanto, aqui vai uma dica rápida:\n\nFoco no processo, não só no resultado. Se você está fazendo as atividades certas, os números vêm naturalmente.\n\nQuer que eu aprofunde em alguma área específica?`;
}
