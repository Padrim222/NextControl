import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Lightbulb } from '@/components/ui/icons';

interface Props {
    defaultAgentType?: 'ss' | 'closer' | 'geral';
}

const overlayStyle: React.CSSProperties = {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.40)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
    padding: '16px',
};

const dialogStyle: React.CSSProperties = {
    background: '#FFFFFF',
    borderRadius: '16px',
    boxShadow: '0 20px 60px rgba(0,0,0,0.18)',
    width: '100%',
    maxWidth: '480px',
    padding: '28px 28px 24px',
    fontFamily: 'DM Sans, system-ui, sans-serif',
};

const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '12px',
    fontWeight: 600,
    color: '#374151',
    marginBottom: '6px',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
};

const inputBase: React.CSSProperties = {
    width: '100%',
    border: '1px solid #E5E7EB',
    borderRadius: '8px',
    padding: '9px 12px',
    fontSize: '14px',
    color: '#1A1A1A',
    fontFamily: 'DM Sans, system-ui, sans-serif',
    background: '#FAFAFA',
    outline: 'none',
    boxSizing: 'border-box' as const,
    transition: 'border-color 0.15s',
};

const selectStyle: React.CSSProperties = {
    ...inputBase,
    cursor: 'pointer',
    appearance: 'none' as const,
};

const textareaStyle: React.CSSProperties = {
    ...inputBase,
    resize: 'vertical' as const,
    lineHeight: 1.5,
};

const triggerBtnStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 14px',
    borderRadius: '8px',
    border: '1px solid #E5E7EB',
    background: '#FFFFFF',
    color: '#374151',
    fontSize: '13px',
    fontWeight: 500,
    fontFamily: 'DM Sans, system-ui, sans-serif',
    cursor: 'pointer',
    transition: 'all 0.15s',
};

const submitBtnStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 16px',
    borderRadius: '8px',
    border: 'none',
    background: '#1B2B4A',
    color: '#FFFFFF',
    fontSize: '14px',
    fontWeight: 600,
    fontFamily: 'DM Sans, system-ui, sans-serif',
    cursor: 'pointer',
    transition: 'opacity 0.15s',
};

const agentLabels: Record<string, string> = {
    ss: 'Agente SS',
    closer: 'Agente Closer',
    geral: 'Geral',
};

export function AgentFeedbackButton({ defaultAgentType = 'geral' }: Props) {
    const [open, setOpen] = useState(false);
    const [agentType, setAgentType] = useState<'ss' | 'closer' | 'geral'>(defaultAgentType);
    const [suggestionType, setSuggestionType] = useState('script');
    const [title, setTitle] = useState('');
    const [suggestionText, setSuggestionText] = useState('');
    const [contextNote, setContextNote] = useState('');
    const [loading, setLoading] = useState(false);

    const handleOpen = () => {
        setAgentType(defaultAgentType);
        setSuggestionType('script');
        setTitle('');
        setSuggestionText('');
        setContextNote('');
        setOpen(true);
    };

    const handleClose = () => {
        if (!loading) setOpen(false);
    };

    const handleSubmit = async () => {
        if (!title.trim()) { toast.error('Adicione um título para a sugestão'); return; }
        if (!suggestionText.trim()) { toast.error('Descreva sua sugestão'); return; }

        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Usuário não autenticado');

            const { data: userData } = await (supabase as any)
                .from('users')
                .select('client_id')
                .eq('id', user.id)
                .single();

            const titleWithType = `[${suggestionType.toUpperCase()}] ${title.trim()}`;

            const { error } = await (supabase as any).from('agent_suggestions').insert({
                client_id: userData?.client_id ?? null,
                user_id: user.id,
                agent_type: agentType,
                title: titleWithType,
                suggestion_text: suggestionText.trim(),
                context_note: contextNote.trim() || null,
                source: 'user',
            });

            if (error) throw error;

            toast.success('Sugestão enviada! O admin irá revisar em breve.');
            setOpen(false);
        } catch (e: any) {
            toast.error(e?.message || 'Erro ao enviar sugestão');
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            {/* Trigger button */}
            <button
                style={triggerBtnStyle}
                onClick={handleOpen}
                onMouseEnter={e => {
                    (e.currentTarget as HTMLButtonElement).style.background = '#F9FAFB';
                    (e.currentTarget as HTMLButtonElement).style.borderColor = '#D1D5DB';
                }}
                onMouseLeave={e => {
                    (e.currentTarget as HTMLButtonElement).style.background = '#FFFFFF';
                    (e.currentTarget as HTMLButtonElement).style.borderColor = '#E5E7EB';
                }}
            >
                <Lightbulb size={14} style={{ color: '#6D28D9' }} />
                Sugerir melhoria ao agente
            </button>

            {/* Modal */}
            {open && (
                <div style={overlayStyle} onClick={handleClose}>
                    <div
                        style={dialogStyle}
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                            <div style={{
                                width: '36px', height: '36px', borderRadius: '8px',
                                background: '#F5F3FF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                            }}>
                                <Lightbulb size={18} style={{ color: '#6D28D9' }} />
                            </div>
                            <div>
                                <p style={{ fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif', fontSize: '16px', fontWeight: 700, color: '#1A1A1A', margin: 0 }}>
                                    Sugerir melhoria ao agente
                                </p>
                                <p style={{ fontSize: '12px', color: '#9CA3AF', margin: '2px 0 0' }}>
                                    Sua sugestão será revisada pelo admin
                                </p>
                            </div>
                        </div>

                        {/* Fields */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

                            {/* Agente + Tipo em grid */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                <div>
                                    <label style={labelStyle}>Agente</label>
                                    <select
                                        style={selectStyle}
                                        value={agentType}
                                        onChange={e => setAgentType(e.target.value as 'ss' | 'closer' | 'geral')}
                                    >
                                        <option value="ss">Agente SS</option>
                                        <option value="closer">Agente Closer</option>
                                        <option value="geral">Geral</option>
                                    </select>
                                </div>
                                <div>
                                    <label style={labelStyle}>Tipo</label>
                                    <select
                                        style={selectStyle}
                                        value={suggestionType}
                                        onChange={e => setSuggestionType(e.target.value)}
                                    >
                                        <option value="script">Script</option>
                                        <option value="abordagem">Abordagem</option>
                                        <option value="pergunta">Pergunta</option>
                                        <option value="outro">Outro</option>
                                    </select>
                                </div>
                            </div>

                            {/* Title */}
                            <div>
                                <label style={labelStyle}>Título *</label>
                                <input
                                    type="text"
                                    style={inputBase}
                                    placeholder={`Ex: Melhorar resposta para objeção de preço (${agentLabels[agentType]})`}
                                    value={title}
                                    onChange={e => setTitle(e.target.value)}
                                    onFocus={e => (e.target as HTMLInputElement).style.borderColor = '#6D28D9'}
                                    onBlur={e => (e.target as HTMLInputElement).style.borderColor = '#E5E7EB'}
                                    maxLength={150}
                                />
                            </div>

                            {/* Suggestion text */}
                            <div>
                                <label style={labelStyle}>Sua sugestão *</label>
                                <textarea
                                    style={{ ...textareaStyle, minHeight: '96px' }}
                                    placeholder="Ex: Quando o cliente fala 'está caro', o agente deveria responder perguntando sobre o valor percebido antes de justificar o preço..."
                                    value={suggestionText}
                                    onChange={e => setSuggestionText(e.target.value)}
                                    onFocus={e => (e.target as HTMLTextAreaElement).style.borderColor = '#6D28D9'}
                                    onBlur={e => (e.target as HTMLTextAreaElement).style.borderColor = '#E5E7EB'}
                                    rows={4}
                                />
                            </div>

                            {/* Context note */}
                            <div>
                                <label style={labelStyle}>
                                    Contexto{' '}
                                    <span style={{ fontWeight: 400, color: '#9CA3AF', textTransform: 'none', letterSpacing: 0, fontSize: '11px' }}>
                                        (opcional)
                                    </span>
                                </label>
                                <textarea
                                    style={{ ...textareaStyle, minHeight: '56px' }}
                                    placeholder="Ex: Percebi isso durante uma call com cliente do segmento B2B que hesitou no preço..."
                                    value={contextNote}
                                    onChange={e => setContextNote(e.target.value)}
                                    onFocus={e => (e.target as HTMLTextAreaElement).style.borderColor = '#6D28D9'}
                                    onBlur={e => (e.target as HTMLTextAreaElement).style.borderColor = '#E5E7EB'}
                                    rows={2}
                                />
                            </div>

                            {/* Actions */}
                            <div style={{ display: 'flex', gap: '8px', paddingTop: '4px' }}>
                                <button
                                    style={{
                                        flex: 1,
                                        padding: '10px 16px',
                                        borderRadius: '8px',
                                        border: '1px solid #E5E7EB',
                                        background: '#FFFFFF',
                                        color: '#6B7280',
                                        fontSize: '14px',
                                        fontWeight: 500,
                                        fontFamily: 'DM Sans, system-ui, sans-serif',
                                        cursor: 'pointer',
                                    }}
                                    onClick={handleClose}
                                    disabled={loading}
                                >
                                    Cancelar
                                </button>
                                <button
                                    style={{ ...submitBtnStyle, opacity: loading ? 0.6 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}
                                    onClick={handleSubmit}
                                    disabled={loading}
                                >
                                    {loading ? 'Enviando...' : 'Enviar sugestão'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
