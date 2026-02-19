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
    ArrowLeft,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { CoachInteraction } from '@/types';

interface ChatMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string;
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
    const scrollRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

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

            // Try Edge Function first, fall back to mock
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

                    // Save to database manually since Edge Function didn't
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

            const botMsg: ChatMessage = {
                id: `b-${Date.now()}`,
                role: 'assistant',
                content: aiResponse,
                timestamp: new Date(),
            };
            setMessages(prev => [...prev, botMsg]);
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
                    <div className="w-2 h-2 rounded-full bg-nc-success animate-pulse" />
                    <span className="text-xs text-muted-foreground">Online</span>
                </div>
            </div>

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
                            <div className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${msg.role === 'assistant'
                                ? 'bg-card nc-card-border text-foreground rounded-tl-md'
                                : 'nc-gradient text-deep-space rounded-tr-md'
                                }`}>
                                {msg.content}
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

            {/* Input */}
            <form onSubmit={handleSubmit} className="p-3 border-t border-border">
                <div className="flex gap-2">
                    <Input
                        ref={inputRef}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Pergunte ao seu treinador..."
                        className="flex-1 nc-input-glow"
                        disabled={isLoading}
                    />
                    <Button
                        type="submit"
                        disabled={!input.trim() || isLoading}
                        className="nc-btn-primary px-4"
                    >
                        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    </Button>
                </div>
            </form>
        </div>
    );
}

// MVP Mock response generator — will be replaced by OpenAI Edge Function
function generateMockResponse(question: string, sellerType: string): string {
    const q = question.toLowerCase();

    if (q.includes('abord') || q.includes('prospec')) {
        return '💡 Para abordagens eficazes:\n\n1. **Personalização** — Pesquise o perfil antes de abordar. Mencione algo específico (post recente, empresa, cargo).\n2. **Value-first** — Ofereça algo de valor antes de pedir algo. Compartilhe um insight ou dado relevante.\n3. **Pergunta aberta** — Evite "tem interesse?" e use "como vocês estão lidando com [problema]?".\n4. **Timing** — Terças e quartas, 9-11h são os melhores horários.\n\nQuer que eu elabore algum desses pontos?';
    }

    if (q.includes('follow') || q.includes('acompanham')) {
        return '🔄 Estratégia de Follow-up:\n\n1. **Regra 2-5-12** — 2 dias após primeiro contato, 5 dias se não responder, 12 dias último follow-up.\n2. **Nunca diga "só passando pra ver"** — Sempre traga algo novo: artigo, caso de sucesso, dado.\n3. **Multicanal** — Alterne entre LinkedIn, email e WhatsApp.\n4. **Break-up email** — No último follow-up, seja direto: "Entendo que o timing pode não ser ideal. Posso retomar em [período]?".\n\nQuer um template de follow-up?';
    }

    if (q.includes('obje') || q.includes('caro') || q.includes('preço')) {
        return '🛡️ Contornando "Tá caro":\n\n1. **Nunca desconte direto** — Isso posiciona seu produto como sobrevalorizado.\n2. **Isole a objeção** — "Além do preço, existe alguma outra preocupação?"\n3. **Reframe para ROI** — "Se este investimento te gerasse 3x de retorno em 90 dias, faria sentido?"\n4. **Parcele** — Divida o valor por dia/semana para diminuir a percepção.\n5. **Social proof** — "O [cliente X] teve a mesma preocupação e em 60 dias já tinha pago o investimento."\n\nQuer praticar um roleplay?';
    }

    if (q.includes('rapport') || q.includes('conex')) {
        return '🤝 Construindo Rapport:\n\n1. **Espelhamento** — Adapte seu tom, velocidade e energia ao prospect.\n2. **Interesses comuns** — LinkedIn é seu melhor amigo pra pesquisar.\n3. **Escuta ativa** — Repita o que ouviu: "Se entendi bem, seu maior desafio é...".\n4. **Vulnerabilidade calculada** — Admita limitações genuínas do seu produto. Gera confiança.\n\nRapport não é técnica, é intenção genuína. O prospect sente quando é forçado.';
    }

    if (q.includes('script') || q.includes('roteiro') || q.includes('call')) {
        return '📞 Roteiro de Call Vencedora:\n\n1. **Abertura (30s)** — Nome, empresa, motivo claro. "Estou ligando porque notei que..."\n2. **Qualificação (2min)** — 3 perguntas SPIN: Situação, Problema, Implicação.\n3. **Apresentação (3min)** — Conecte a solução ao problema que ELE descreveu.\n4. **Objeções (2min)** — "Faz sentido? O que te preocupa?"\n5. **Fechamento (1min)** — "Baseado no que conversamos, faz sentido avançarmos com [próximo passo]?"\n\nDica: Grave suas calls e reveja 1 por semana. Você vai evoluir 10x.';
    }

    return `🤖 Boa pergunta! Como ${sellerType === 'closer' ? 'closer' : 'vendedor'}, isso é super relevante.\n\nVou analisar suas últimas submissões para personalizar minha resposta. Por enquanto, aqui vai uma dica rápida:\n\n**Foco no processo, não só no resultado.** Se você está fazendo as atividades certas, os números vêm naturalmente.\n\nQuer que eu aprofunde em alguma área específica?`;
}
