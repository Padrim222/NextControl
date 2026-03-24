import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import {
    CheckCircle,
    XCircle,
    Lightbulb,
    Users,
    Target,
    Briefcase,
} from '@/components/ui/icons';

/* ─── Types ──────────────────────────────────────────────────── */
interface AgentSuggestion {
    id: string;
    client_id: string | null;
    user_id: string;
    agent_type: 'ss' | 'closer' | 'geral';
    title: string;
    suggestion_text: string;
    context_note: string | null;
    source: 'user' | 'call_analysis';
    call_upload_id: string | null;
    status: 'pending' | 'approved' | 'rejected';
    reviewed_by: string | null;
    reviewed_at: string | null;
    created_at: string;
    client?: { name: string } | null;
}

/* ─── Design tokens (mirror AdminDashboard) ──────────────────── */
const cardStyle: React.CSSProperties = {
    background: '#FFFFFF',
    border: '1px solid #E5E7EB',
    borderRadius: '12px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
};

/* ─── Agent type config ──────────────────────────────────────── */
const agentConfig = {
    ss: {
        label: 'SS',
        bg: '#EFF6FF',
        color: '#1D4ED8',
        icon: <Target size={13} />,
    },
    closer: {
        label: 'Closer',
        bg: '#FFFBEB',
        color: '#D97706',
        icon: <Briefcase size={13} />,
    },
    geral: {
        label: 'Geral',
        bg: '#F3F4F6',
        color: '#374151',
        icon: <Users size={13} />,
    },
} as const;

const sourceConfig = {
    user: { label: 'Usuário', bg: '#F0FDF4', color: '#166534' },
    call_analysis: { label: 'Call IA', bg: '#F5F3FF', color: '#6D28D9' },
} as const;

/* ─── Component ──────────────────────────────────────────────── */
export function AgentSuggestionsPanel() {
    const { user } = useAuth();
    const [suggestions, setSuggestions] = useState<AgentSuggestion[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [processing, setProcessing] = useState<string | null>(null);

    useEffect(() => {
        fetchSuggestions();
    }, []);

    const fetchSuggestions = async () => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase!
                .from('agent_suggestions')
                .select('*, client:clients(name)')
                .eq('status', 'pending')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setSuggestions((data as AgentSuggestion[]) || []);
        } catch (err) {
            console.error('Error fetching suggestions:', err);
            toast.error('Erro ao carregar sugestões');
        } finally {
            setIsLoading(false);
        }
    };

    const handleApprove = async (suggestion: AgentSuggestion) => {
        setProcessing(suggestion.id);
        try {
            // 1. Ingest into RAG
            const { error: ragError } = await supabase!.functions.invoke('rag-ingest', {
                body: {
                    title: suggestion.title,
                    content: suggestion.suggestion_text,
                    category: 'scripts',
                    agent_type: suggestion.agent_type,
                    client_id: suggestion.client_id,
                },
            });
            if (ragError) throw ragError;

            // 2. Update suggestion status
            const { error: updateError } = await supabase!
                .from('agent_suggestions')
                .update({
                    status: 'approved',
                    reviewed_by: user?.id ?? null,
                    reviewed_at: new Date().toISOString(),
                })
                .eq('id', suggestion.id);
            if (updateError) throw updateError;

            setSuggestions(prev => prev.filter(s => s.id !== suggestion.id));
            toast.success('Sugestão aprovada e adicionada à base do agente!');
        } catch (err) {
            console.error('Approve error:', err);
            toast.error('Erro ao aprovar sugestão');
        } finally {
            setProcessing(null);
        }
    };

    const handleReject = async (suggestion: AgentSuggestion) => {
        setProcessing(suggestion.id);
        try {
            const { error } = await supabase!
                .from('agent_suggestions')
                .update({
                    status: 'rejected',
                    reviewed_by: user?.id ?? null,
                    reviewed_at: new Date().toISOString(),
                })
                .eq('id', suggestion.id);
            if (error) throw error;

            setSuggestions(prev => prev.filter(s => s.id !== suggestion.id));
            toast.success('Sugestão rejeitada');
        } catch (err) {
            console.error('Reject error:', err);
            toast.error('Erro ao rejeitar sugestão');
        } finally {
            setProcessing(null);
        }
    };

    return (
        <div style={cardStyle}>
            {/* Header */}
            <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#F5F3FF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Lightbulb size={18} style={{ color: '#6D28D9' }} />
                    </div>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <p style={{ fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif', fontSize: '16px', fontWeight: 600, color: '#1A1A1A', margin: 0 }}>
                                Sugestões para o Agente
                            </p>
                            {suggestions.length > 0 && (
                                <span style={{ background: '#6D28D9', color: '#FFFFFF', fontSize: '11px', fontWeight: 700, padding: '1px 8px', borderRadius: '999px', lineHeight: '18px', display: 'inline-block' }}>
                                    {suggestions.length}
                                </span>
                            )}
                        </div>
                        <p style={{ fontSize: '13px', color: '#6B7280', margin: '2px 0 0' }}>
                            Revisão de sugestões enviadas pela equipe
                        </p>
                    </div>
                </div>
            </div>

            {/* Body */}
            <div style={{ padding: '16px 20px' }}>
                {isLoading ? (
                    <div style={{ textAlign: 'center', padding: '32px 0', color: '#9CA3AF' }}>
                        <p style={{ fontSize: '14px', margin: 0 }}>Carregando...</p>
                    </div>
                ) : suggestions.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px 0', color: '#9CA3AF' }}>
                        <CheckCircle size={32} style={{ margin: '0 auto 10px', display: 'block', opacity: 0.35 }} />
                        <p style={{ fontSize: '14px', margin: 0, fontWeight: 500 }}>
                            Nenhuma sugestão pendente — o sistema está atualizado ✓
                        </p>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {suggestions.map(suggestion => {
                            const agent = agentConfig[suggestion.agent_type];
                            const source = sourceConfig[suggestion.source];
                            const isProcessing = processing === suggestion.id;

                            return (
                                <div
                                    key={suggestion.id}
                                    style={{
                                        padding: '14px 16px',
                                        background: '#FAFAFA',
                                        border: '1px solid #E5E7EB',
                                        borderRadius: '10px',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '10px',
                                    }}
                                >
                                    {/* Top row: badges + client */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                        {/* Agent type badge */}
                                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: agent.bg, color: agent.color, fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '999px' }}>
                                            {agent.icon}
                                            {agent.label}
                                        </span>
                                        {/* Source badge */}
                                        <span style={{ background: source.bg, color: source.color, fontSize: '11px', fontWeight: 600, padding: '2px 8px', borderRadius: '999px' }}>
                                            {source.label}
                                        </span>
                                        {/* Client name */}
                                        {suggestion.client?.name && (
                                            <span style={{ fontSize: '12px', color: '#6B7280' }}>
                                                {suggestion.client.name}
                                            </span>
                                        )}
                                        {/* Date */}
                                        <span style={{ fontSize: '11px', color: '#9CA3AF', marginLeft: 'auto' }}>
                                            {new Date(suggestion.created_at).toLocaleDateString('pt-BR')}
                                        </span>
                                    </div>

                                    {/* Title */}
                                    <div>
                                        <p style={{ fontSize: '14px', fontWeight: 600, color: '#1A1A1A', margin: '0 0 4px', fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif' }}>
                                            {suggestion.title}
                                        </p>
                                        <p style={{ fontSize: '13px', color: '#374151', margin: 0, lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
                                            {suggestion.suggestion_text}
                                        </p>
                                    </div>

                                    {/* Context note */}
                                    {suggestion.context_note && (
                                        <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: '6px', padding: '8px 10px' }}>
                                            <p style={{ fontSize: '12px', color: '#92400E', margin: 0 }}>
                                                <strong>Contexto:</strong> {suggestion.context_note}
                                            </p>
                                        </div>
                                    )}

                                    {/* Action buttons */}
                                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', paddingTop: '4px', borderTop: '1px solid #E5E7EB' }}>
                                        <button
                                            style={{
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: '6px',
                                                background: 'transparent',
                                                color: '#DC2626',
                                                border: '1px solid #FECACA',
                                                borderRadius: '8px',
                                                padding: '6px 12px',
                                                fontSize: '12px',
                                                fontFamily: 'DM Sans, system-ui, sans-serif',
                                                fontWeight: 500,
                                                cursor: isProcessing ? 'not-allowed' : 'pointer',
                                                opacity: isProcessing ? 0.5 : 1,
                                            }}
                                            onClick={() => handleReject(suggestion)}
                                            disabled={isProcessing}
                                        >
                                            <XCircle size={13} />
                                            Rejeitar
                                        </button>
                                        <button
                                            style={{
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: '6px',
                                                background: '#059669',
                                                color: '#FFFFFF',
                                                border: 'none',
                                                borderRadius: '8px',
                                                padding: '6px 12px',
                                                fontSize: '12px',
                                                fontFamily: 'DM Sans, system-ui, sans-serif',
                                                fontWeight: 500,
                                                cursor: isProcessing ? 'not-allowed' : 'pointer',
                                                opacity: isProcessing ? 0.5 : 1,
                                            }}
                                            onClick={() => handleApprove(suggestion)}
                                            disabled={isProcessing}
                                        >
                                            <CheckCircle size={13} />
                                            {isProcessing ? 'Processando...' : 'Aprovar'}
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
