import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Textarea } from '@/components/ui/textarea';
import {
    FileText,
    MessageSquare,
    Send,
    Loader2,
    ClipboardList,
    CheckCircle,
    Clock,
    HelpCircle,
    BookOpen,
    Brain,
    Upload,
    AlertCircle,
    Eye,
    Plus,
    Download,
    Sparkles,
    ArrowRight,
    X,
} from '@/components/ui/icons';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import type { Client } from '@/types';
import { FormPendingBanner } from '@/components/forms/FormPendingBanner';

// ── Types ──────────────────────────────────────────────────────────────────

interface ClientQuestion {
    id: string;
    question_text: string;
    status: 'pending' | 'answered' | 'escalated';
    response_text: string | null;
    created_at: string;
    responded_at: string | null;
}

interface ClientReport {
    id: string;
    status: string;
    pdf_url: string | null;
    created_at: string;
    review_notes: string | null;
}

type MaterialStatus = 'pending' | 'processing' | 'done' | 'error';

interface ClientMaterial {
    id: string;
    client_id: string | null;
    user_id: string;
    file_name: string;
    file_type: string;
    file_size: number;
    storage_path: string;
    public_url: string | null;
    status: MaterialStatus;
    notes: string | null;
    created_at: string;
}

type ContentType = 'post' | 'caption' | 'script' | 'email' | 'strategy' | 'other';
type ContentStatus = 'draft' | 'review' | 'approved' | 'published';

interface ContentOutput {
    id: string;
    client_id: string | null;
    user_id: string;
    title: string;
    content_type: ContentType;
    status: ContentStatus;
    content_body: string | null;
    preview_url: string | null;
    platform: string | null;
    material_id: string | null;
    created_at: string;
}

interface UploadingFile {
    localId: string;
    file: File;
    progress: number;
    error: string | null;
}

type Tab = 'plano' | 'materiais' | 'conteudo' | 'relatorios' | 'perguntas';

// ── Design tokens ─────────────────────────────────────────────────────────

const ds = {
    bg: '#FAFAFA',
    card: '#FFFFFF',
    border: '1px solid #E5E7EB',
    radius: '12px',
    primary: '#1B2B4A',
    accent: '#E6B84D',
    textPrimary: '#1A1A1A',
    textSecondary: '#6B7280',
    textMuted: '#9CA3AF',
    shadow: '0 1px 3px rgba(0,0,0,0.06)',
    fontDisplay: 'Plus Jakarta Sans, system-ui, sans-serif',
    fontBody: 'DM Sans, system-ui, sans-serif',
};

const cardStyle: React.CSSProperties = {
    background: ds.card,
    border: ds.border,
    borderRadius: ds.radius,
    boxShadow: ds.shadow,
    fontFamily: ds.fontBody,
};

// ── Helpers ───────────────────────────────────────────────────────────────

function formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileCategory(mimeType: string): 'image' | 'video' | 'document' {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('video/')) return 'video';
    return 'document';
}

const CONTENT_TYPE_LABELS: Record<ContentType, string> = {
    post: 'Post',
    caption: 'Legenda',
    script: 'Roteiro',
    email: 'E-mail',
    strategy: 'Estratégia',
    other: 'Outro',
};

const CONTENT_STATUS_CONFIG: Record<ContentStatus, { label: string; bg: string; color: string }> = {
    draft:     { label: 'Rascunho',  bg: '#F3F4F6', color: '#6B7280' },
    review:    { label: 'Em Revisão', bg: '#FFFBEB', color: '#D97706' },
    approved:  { label: 'Aprovado',  bg: '#ECFDF5', color: '#059669' },
    published: { label: 'Publicado', bg: '#EFF6FF', color: '#3B82F6' },
};

const MATERIAL_STATUS_CONFIG: Record<MaterialStatus, { label: string; bg: string; color: string; icon: React.ReactNode }> = {
    pending:    { label: 'Aguardando', bg: '#FFFBEB', color: '#D97706', icon: <Clock    size={12} /> },
    processing: { label: 'Processando', bg: '#EFF6FF', color: '#3B82F6', icon: <Loader2  size={12} style={{ animation: 'spin 1s linear infinite' }} /> },
    done:       { label: 'Concluído',  bg: '#ECFDF5', color: '#059669', icon: <CheckCircle size={12} /> },
    error:      { label: 'Erro',       bg: '#FEF2F2', color: '#DC2626', icon: <AlertCircle  size={12} /> },
};

// ── Component ─────────────────────────────────────────────────────────────

export default function ClientDashboard() {
    const { user } = useAuth();
    const navigate = useNavigate();

    const [client, setClient] = useState<Client | null>(null);
    const [questions, setQuestions] = useState<ClientQuestion[]>([]);
    const [reports, setReports] = useState<ClientReport[]>([]);
    const [materials, setMaterials] = useState<ClientMaterial[]>([]);
    const [contentOutputs, setContentOutputs] = useState<ContentOutput[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<Tab>('plano');
    const [newQuestion, setNewQuestion] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
    const [expandedOutputId, setExpandedOutputId] = useState<string | null>(null);
    const [hasOnboarding, setHasOnboarding] = useState<boolean | null>(null);
    const [onboardingBannerDismissed, setOnboardingBannerDismissed] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (!user) return;
        fetchData();
        checkOnboarding();
    }, [user]);

    const checkOnboarding = async () => {
        if (!supabase || !user) return;
        const clientId = user.client_id ?? user.id;
        try {
            const { data } = await (supabase as any)
                .from('client_onboarding')
                .select('id')
                .eq('client_id', clientId)
                .limit(1);
            setHasOnboarding(!!(data && data.length > 0));
        } catch {
            setHasOnboarding(false);
        }
    };

    const fetchData = async () => {
        if (!supabase || !user) { setIsLoading(false); return; }
        setIsLoading(true);
        try {
            // user.client_id comes directly from the users table via AuthContext
            const clientId = user.client_id;

            if (!clientId) {
                setIsLoading(false);
                return;
            }

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const sb = supabase as any;
            const [clientRes, questionsRes, reportsRes, materialsRes, outputsRes] = await Promise.all([
                sb.from('clients').select('*').eq('id', clientId).single(),
                sb.from('client_questions')
                    .select('id, question_text, status, response_text, created_at, responded_at')
                    .eq('client_id', clientId)
                    .order('created_at', { ascending: false }),
                sb.from('reports')
                    .select('id, status, pdf_url, created_at, review_notes')
                    .eq('status', 'delivered')
                    .order('created_at', { ascending: false })
                    .limit(20),
                sb.from('client_materials')
                    .select('*')
                    .eq('user_id', user.id)
                    .order('created_at', { ascending: false }),
                sb.from('content_outputs')
                    .select('*')
                    .eq('user_id', user.id)
                    .order('created_at', { ascending: false }),
            ]);

            if (clientRes.data) setClient(clientRes.data as Client);
            if (questionsRes.data) setQuestions(questionsRes.data as ClientQuestion[]);
            if (reportsRes.data) setReports(reportsRes.data as ClientReport[]);
            if (materialsRes.data) setMaterials(materialsRes.data as ClientMaterial[]);
            if (outputsRes.data) setContentOutputs(outputsRes.data as ContentOutput[]);
        } catch (error) {
            console.error('Error fetching client data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSendQuestion = async () => {
        if (!newQuestion.trim() || !client || !supabase) return;
        setIsSending(true);
        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { error } = await (supabase as any)
                .from('client_questions')
                .insert({
                    client_id: client.id,
                    asked_by: user?.name || user?.email || 'Client',
                    question_text: newQuestion.trim(),
                    status: 'pending',
                });

            if (error) throw error;
            toast.success('Pergunta enviada! Responderemos em breve.');
            setNewQuestion('');
            fetchData();
        } catch {
            toast.error('Erro ao enviar pergunta. Tente novamente.');
        } finally {
            setIsSending(false);
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files ?? []);
        if (files.length === 0) return;
        files.forEach(file => handleUploadFile(file));
        // reset so same file can be re-selected
        e.target.value = '';
    };

    const handleUploadFile = async (file: File) => {
        if (!supabase || !user) return;

        const MAX_SIZE = 100 * 1024 * 1024; // 100 MB
        if (file.size > MAX_SIZE) {
            toast.error(`Arquivo "${file.name}" é muito grande (máx. 100 MB).`);
            return;
        }

        const localId = `${Date.now()}-${Math.random()}`;
        setUploadingFiles(prev => [...prev, { localId, file, progress: 0, error: null }]);

        try {
            const ext = file.name.split('.').pop() ?? 'bin';
            const storagePath = `${user.id}/${localId}.${ext}`;

            const { error: uploadError } = await supabase.storage
                .from('client-materials')
                .upload(storagePath, file, {
                    cacheControl: '3600',
                    upsert: false,
                });

            if (uploadError) throw uploadError;

            setUploadingFiles(prev =>
                prev.map(u => u.localId === localId ? { ...u, progress: 80 } : u)
            );

            const { data: urlData } = supabase.storage
                .from('client-materials')
                .getPublicUrl(storagePath);

            const publicUrl = urlData?.publicUrl ?? null;
            const clientId = user.client_id ?? null;

            const { error: dbError } = await supabase
                .from('client_materials')
                .insert({
                    client_id: clientId,
                    user_id: user.id,
                    file_name: file.name,
                    file_type: file.type || 'application/octet-stream',
                    file_size: file.size,
                    storage_path: storagePath,
                    public_url: publicUrl,
                    status: 'pending',
                });

            if (dbError) throw dbError;

            setUploadingFiles(prev =>
                prev.map(u => u.localId === localId ? { ...u, progress: 100 } : u)
            );

            toast.success(`"${file.name}" enviado com sucesso!`);
            // remove from uploading list after brief pause, then refresh
            setTimeout(() => {
                setUploadingFiles(prev => prev.filter(u => u.localId !== localId));
                fetchData();
            }, 1000);
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'Erro desconhecido';
            setUploadingFiles(prev =>
                prev.map(u => u.localId === localId ? { ...u, error: msg, progress: 0 } : u)
            );
            toast.error(`Erro ao enviar "${file.name}".`);
        }
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        const files = Array.from(e.dataTransfer.files);
        files.forEach(file => handleUploadFile(file));
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
    };

    // ── Loading skeleton ──────────────────────────────────────────────────

    if (isLoading) {
        return (
            <div style={{ maxWidth: '900px', margin: '0 auto', padding: '0 0 32px', fontFamily: ds.fontBody }}>
                <div style={{ marginBottom: '24px' }}>
                    <div style={{ height: '32px', width: '260px', borderRadius: '8px', background: '#E5E7EB', animation: 'pulse 1.5s ease-in-out infinite', marginBottom: '8px' }} />
                    <div style={{ height: '16px', width: '180px', borderRadius: '8px', background: '#F3F4F6', animation: 'pulse 1.5s ease-in-out infinite' }} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px' }}>
                    {[0, 1].map(i => (
                        <div key={i} style={{ ...cardStyle, height: '80px', animation: 'pulse 1.5s ease-in-out infinite' }} />
                    ))}
                </div>
                <div style={{ ...cardStyle, height: '300px', animation: 'pulse 1.5s ease-in-out infinite' }} />
                <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.5} } @keyframes spin { to{transform:rotate(360deg)} }`}</style>
            </div>
        );
    }

    // ── No client yet ─────────────────────────────────────────────────────

    if (!client) {
        return (
            <div style={{ maxWidth: '700px', margin: '0 auto', padding: '0 0 32px', fontFamily: ds.fontBody }}>
                <div style={{ textAlign: 'center', padding: '48px 0 32px' }}>
                    <div style={{
                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                        width: '64px', height: '64px', borderRadius: '16px',
                        background: '#FEF9EC', marginBottom: '16px'
                    }}>
                        <Clock size={28} strokeWidth={1.5} style={{ color: ds.primary }} />
                    </div>
                    <h1 style={{ fontFamily: ds.fontDisplay, fontSize: '26px', fontWeight: 700, color: ds.textPrimary, margin: '0 0 8px' }}>
                        Bem-vindo ao <span style={{ color: ds.primary }}>Next Control</span>!
                    </h1>
                    <p style={{ fontSize: '14px', color: ds.textSecondary, maxWidth: '440px', margin: '0 auto 32px', lineHeight: 1.6 }}>
                        Sua conta está ativa. O time de CS está configurando seu projeto — em breve você terá acesso completo ao painel.
                    </p>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px' }}>
                    <div
                        style={{ ...cardStyle, padding: '24px', textAlign: 'center', cursor: 'pointer', transition: 'all 0.15s' }}
                        onClick={() => navigate('/training/coach')}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 12px rgba(0,0,0,0.10)'; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLElement).style.boxShadow = ds.shadow; }}
                    >
                        <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '48px', height: '48px', borderRadius: '12px', background: '#EFF6FF', marginBottom: '12px' }}>
                            <Brain size={22} strokeWidth={1.5} style={{ color: '#3B82F6' }} />
                        </div>
                        <h3 style={{ fontFamily: ds.fontDisplay, fontSize: '15px', fontWeight: 700, color: ds.textPrimary, margin: '0 0 4px' }}>Consultoria de Bolso</h3>
                        <p style={{ fontSize: '13px', color: ds.textSecondary, margin: 0 }}>Tire dúvidas estratégicas com IA enquanto seu projeto é configurado</p>
                    </div>
                    <div
                        style={{ ...cardStyle, padding: '24px', textAlign: 'center', cursor: 'pointer', transition: 'all 0.15s' }}
                        onClick={() => navigate('/training')}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 12px rgba(0,0,0,0.10)'; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLElement).style.boxShadow = ds.shadow; }}
                    >
                        <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '48px', height: '48px', borderRadius: '12px', background: '#FFFBEB', marginBottom: '12px' }}>
                            <BookOpen size={22} strokeWidth={1.5} style={{ color: '#D97706' }} />
                        </div>
                        <h3 style={{ fontFamily: ds.fontDisplay, fontSize: '15px', fontWeight: 700, color: ds.textPrimary, margin: '0 0 4px' }}>Base de Conhecimento</h3>
                        <p style={{ fontSize: '13px', color: ds.textSecondary, margin: 0 }}>Explore materiais e treinamentos disponíveis</p>
                    </div>
                </div>
                <p style={{ fontSize: '12px', color: ds.textMuted, textAlign: 'center' }}>
                    Dúvidas? Fale com o time:{' '}
                    <span style={{ color: ds.primary, fontWeight: 600 }}>suporte@nextcontrol.com</span>
                </p>
            </div>
        );
    }

    // ── Tabs config ───────────────────────────────────────────────────────

    const tabs: { key: Tab; label: string; icon: React.ComponentType<{ size?: number; strokeWidth?: number; style?: React.CSSProperties }>; count?: number }[] = [
        { key: 'plano',      label: 'Meu Plano',  icon: ClipboardList },
        { key: 'materiais',  label: 'Materiais',  icon: Upload,       count: materials.length },
        { key: 'conteudo',   label: 'Conteúdo',   icon: Sparkles,     count: contentOutputs.length },
        { key: 'relatorios', label: 'Relatórios', icon: FileText,     count: reports.length },
        { key: 'perguntas',  label: 'Perguntas',  icon: MessageSquare, count: questions.length },
    ];

    const pendingQuestions = questions.filter(q => q.status === 'pending').length;

    const primaryBtnStyle: React.CSSProperties = {
        display: 'inline-flex', alignItems: 'center', gap: '6px',
        padding: '8px 20px', borderRadius: '8px', border: 'none',
        background: ds.primary, color: '#FFFFFF', fontSize: '14px',
        fontWeight: 600, fontFamily: ds.fontBody, cursor: 'pointer', transition: 'all 0.15s',
    };

    const primaryBtnDisabledStyle: React.CSSProperties = {
        ...primaryBtnStyle, opacity: 0.5, cursor: 'not-allowed',
    };

    // ── Render ─────────────────────────────────────────────────────────────

    return (
        <div style={{ maxWidth: '900px', margin: '0 auto', padding: '0 0 48px', fontFamily: ds.fontBody }}>
            <style>{`
                @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.5} }
                @keyframes spin { to{transform:rotate(360deg)} }
                .nc-upload-zone:hover { border-color: #1B2B4A !important; background: #F8FAFC !important; }
                .nc-tab-btn:hover { background: #F3F4F6 !important; }
                .nc-material-row:hover { background: #F9FAFB !important; }
                .nc-output-card:hover { box-shadow: 0 4px 16px rgba(0,0,0,0.10) !important; transform: translateY(-1px); }
                @media (max-width: 640px) {
                    .nc-tabs { flex-wrap: wrap !important; }
                    .nc-tab-btn { flex: 1 1 40% !important; }
                    .nc-quick-grid { grid-template-columns: 1fr !important; }
                    .nc-plan-grid { grid-template-columns: 1fr !important; }
                    .nc-outputs-grid { grid-template-columns: 1fr !important; }
                }
            `}</style>

            {/* Header */}
            <div style={{ marginBottom: '24px' }}>
                <h1 style={{ fontFamily: ds.fontDisplay, fontSize: '26px', fontWeight: 700, color: ds.textPrimary, margin: '0 0 4px' }}>
                    Bem-vindo, <span style={{ color: ds.primary }}>{client.name}</span>
                </h1>
                <p style={{ fontSize: '14px', color: ds.textSecondary, margin: 0 }}>
                    {client.company ? `Projeto: ${client.company}` : 'Acompanhe seu projeto em tempo real.'}
                </p>
            </div>

            {/* Onboarding Banner */}
            {hasOnboarding === false && !onboardingBannerDismissed && (
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '12px',
                        padding: '16px 20px',
                        borderRadius: '12px',
                        background: 'linear-gradient(135deg, #1B2B4A 0%, #243654 100%)',
                        border: '1px solid #2D3E5E',
                        marginBottom: '16px',
                        boxShadow: '0 2px 8px rgba(27,43,74,0.18)',
                        fontFamily: ds.fontBody,
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px', minWidth: 0 }}>
                        <div
                            style={{
                                width: 40, height: 40, borderRadius: '10px',
                                background: 'rgba(230,184,77,0.15)',
                                border: '1px solid rgba(230,184,77,0.3)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                            }}
                        >
                            <ClipboardList size={20} style={{ color: '#E6B84D' }} />
                        </div>
                        <div style={{ minWidth: 0 }}>
                            <p style={{ fontFamily: ds.fontDisplay, fontWeight: 700, fontSize: '14px', color: '#FFFFFF', margin: '0 0 2px' }}>
                                Configure seu Agente Personalizado
                            </p>
                            <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.65)', margin: 0, lineHeight: 1.4 }}>
                                Preencha o briefing da sua empresa para que seu agente IA seja personalizado para você. (15–20 min)
                            </p>
                        </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                        <button
                            onClick={() => navigate('/client/onboarding')}
                            style={{
                                display: 'inline-flex', alignItems: 'center', gap: '6px',
                                padding: '8px 16px', borderRadius: '8px', border: 'none',
                                background: '#E6B84D', color: '#1B2B4A',
                                fontSize: '13px', fontWeight: 700, fontFamily: ds.fontBody,
                                cursor: 'pointer', whiteSpace: 'nowrap', transition: 'opacity 0.15s',
                            }}
                            onMouseEnter={e => (e.currentTarget.style.opacity = '0.88')}
                            onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
                        >
                            Preencher Briefing
                            <ArrowRight size={14} />
                        </button>
                        <button
                            onClick={() => setOnboardingBannerDismissed(true)}
                            style={{
                                background: 'transparent', border: 'none', cursor: 'pointer',
                                color: 'rgba(255,255,255,0.5)', padding: '4px', lineHeight: 0,
                                transition: 'color 0.15s',
                            }}
                            onMouseEnter={e => ((e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.9)')}
                            onMouseLeave={e => ((e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.5)')}
                            aria-label="Fechar"
                        >
                            <X size={16} />
                        </button>
                    </div>
                </div>
            )}

            {/* Pending Form Banner */}
            <FormPendingBanner formType="expert_weekly" />

            {/* Quick Action Cards */}
            <div className="nc-quick-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px' }}>
                <div
                    style={{ ...cardStyle, padding: '20px', display: 'flex', alignItems: 'center', gap: '16px', cursor: 'pointer', transition: 'all 0.15s' }}
                    onClick={() => navigate('/training/coach')}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 12px rgba(0,0,0,0.10)'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLElement).style.boxShadow = ds.shadow; }}
                >
                    <div style={{ padding: '12px', borderRadius: '12px', background: '#EFF6FF', flexShrink: 0 }}>
                        <Brain size={22} strokeWidth={1.5} style={{ color: '#3B82F6', display: 'block' }} />
                    </div>
                    <div>
                        <div style={{ fontFamily: ds.fontDisplay, fontSize: '15px', fontWeight: 700, color: ds.textPrimary, marginBottom: '2px' }}>Consultoria de Bolso</div>
                        <div style={{ fontSize: '13px', color: ds.textSecondary }}>Tire dúvidas estratégicas com IA</div>
                    </div>
                </div>
                <div
                    style={{ ...cardStyle, padding: '20px', display: 'flex', alignItems: 'center', gap: '16px', cursor: 'pointer', transition: 'all 0.15s' }}
                    onClick={() => navigate('/training')}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 12px rgba(0,0,0,0.10)'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLElement).style.boxShadow = ds.shadow; }}
                >
                    <div style={{ padding: '12px', borderRadius: '12px', background: '#FFFBEB', flexShrink: 0 }}>
                        <BookOpen size={22} strokeWidth={1.5} style={{ color: '#D97706', display: 'block' }} />
                    </div>
                    <div>
                        <div style={{ fontFamily: ds.fontDisplay, fontSize: '15px', fontWeight: 700, color: ds.textPrimary, marginBottom: '2px' }}>Base de Conhecimento</div>
                        <div style={{ fontSize: '13px', color: ds.textSecondary }}>Materiais e treinamentos</div>
                    </div>
                </div>
            </div>

            {/* Pill Tab Navigation */}
            <div className="nc-tabs" style={{
                ...cardStyle,
                display: 'flex', gap: '4px', padding: '4px',
                marginBottom: '16px', flexWrap: 'nowrap', overflowX: 'auto',
            }}>
                {tabs.map(tab => (
                    <button
                        key={tab.key}
                        className="nc-tab-btn"
                        onClick={() => setActiveTab(tab.key)}
                        style={{
                            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                            padding: '9px 12px', borderRadius: '9px', border: 'none', cursor: 'pointer',
                            fontSize: '13px', fontWeight: 600, fontFamily: ds.fontBody, whiteSpace: 'nowrap',
                            transition: 'all 0.15s',
                            background: activeTab === tab.key ? ds.primary : 'transparent',
                            color: activeTab === tab.key ? '#FFFFFF' : ds.textSecondary,
                        }}
                    >
                        <tab.icon size={15} strokeWidth={1.5} />
                        {tab.label}
                        {tab.count !== undefined && tab.count > 0 && (
                            <span style={{
                                background: activeTab === tab.key ? 'rgba(255,255,255,0.25)' : '#F3F4F6',
                                color: activeTab === tab.key ? '#FFFFFF' : ds.textMuted,
                                borderRadius: '999px', fontSize: '11px', fontWeight: 700,
                                padding: '1px 7px', marginLeft: '2px',
                            }}>
                                {tab.count}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* ── Tab: Meu Plano ── */}
            {activeTab === 'plano' && (
                <div style={cardStyle}>
                    <div style={{ padding: '20px 20px 12px', borderBottom: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <ClipboardList size={17} strokeWidth={1.5} style={{ color: ds.primary }} />
                        <div>
                            <div style={{ fontFamily: ds.fontDisplay, fontSize: '16px', fontWeight: 700, color: ds.textPrimary }}>Meu Plano Personalizado</div>
                            <div style={{ fontSize: '13px', color: ds.textSecondary }}>Estratégia desenhada para o seu negócio</div>
                        </div>
                    </div>
                    <div style={{ padding: '20px' }}>
                        <div style={{ padding: '16px', borderRadius: '10px', background: '#F9FAFB', border: '1px solid #E5E7EB', marginBottom: '16px' }}>
                            <div style={{ fontFamily: ds.fontDisplay, fontSize: '14px', fontWeight: 700, color: ds.textPrimary, marginBottom: '8px' }}>Resumo do Projeto</div>
                            <p style={{ fontSize: '14px', color: ds.textSecondary, lineHeight: 1.7, margin: 0 }}>
                                {client.company
                                    ? `Projeto focado em escalar as vendas e otimizar a operação de "${client.company}". Trabalhamos com aquisição perpétua — um modelo que cresce semana a semana, sem depender de campanhas pontuais.`
                                    : 'Seu plano personalizado está sendo preparado. Em breve, você terá acesso completo à estratégia desenhada para o seu negócio.'
                                }
                            </p>
                        </div>
                        <div className="nc-plan-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                            <div style={{ padding: '14px', borderRadius: '10px', background: '#ECFDF5', border: '1px solid #A7F3D0' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                                    <CheckCircle size={15} strokeWidth={1.5} style={{ color: '#059669' }} />
                                    <span style={{ fontSize: '13px', fontWeight: 600, color: ds.textPrimary }}>Fase Atual</span>
                                </div>
                                <p style={{ fontSize: '13px', color: ds.textSecondary, margin: 0 }}>Diagnóstico e Configuração</p>
                            </div>
                            <div style={{ padding: '14px', borderRadius: '10px', background: '#EFF6FF', border: '1px solid #BFDBFE' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                                    <Clock size={15} strokeWidth={1.5} style={{ color: '#3B82F6' }} />
                                    <span style={{ fontSize: '13px', fontWeight: 600, color: ds.textPrimary }}>Próxima Etapa</span>
                                </div>
                                <p style={{ fontSize: '13px', color: ds.textSecondary, margin: 0 }}>Implementação da Máquina de Vendas</p>
                            </div>
                            <div style={{ padding: '14px', borderRadius: '10px', background: '#FFFBEB', border: '1px solid #FDE68A' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                                    <HelpCircle size={15} strokeWidth={1.5} style={{ color: '#D97706' }} />
                                    <span style={{ fontSize: '13px', fontWeight: 600, color: ds.textPrimary }}>Dúvidas?</span>
                                </div>
                                <button
                                    onClick={() => setActiveTab('perguntas')}
                                    style={{ background: 'none', border: 'none', padding: 0, fontSize: '13px', color: ds.primary, fontWeight: 600, cursor: 'pointer', fontFamily: ds.fontBody }}
                                >
                                    Envie uma pergunta →
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Tab: Materiais ── */}
            {activeTab === 'materiais' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {/* Upload zone */}
                    <div style={cardStyle}>
                        <div style={{ padding: '20px 20px 12px', borderBottom: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Upload size={17} strokeWidth={1.5} style={{ color: ds.primary }} />
                                <div>
                                    <div style={{ fontFamily: ds.fontDisplay, fontSize: '16px', fontWeight: 700, color: ds.textPrimary }}>Upload de Materiais</div>
                                    <div style={{ fontSize: '13px', color: ds.textSecondary }}>Imagens, vídeos e documentos para geração de conteúdo</div>
                                </div>
                            </div>
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                style={{ ...primaryBtnStyle, padding: '7px 14px', fontSize: '13px' }}
                            >
                                <Plus size={14} /> Adicionar
                            </button>
                        </div>
                        <div style={{ padding: '20px' }}>
                            {/* Hidden file input */}
                            <input
                                ref={fileInputRef}
                                type="file"
                                multiple
                                accept="image/*,video/*,.pdf,.doc,.docx,.txt,.pptx,.xlsx"
                                style={{ display: 'none' }}
                                onChange={handleFileSelect}
                            />

                            {/* Drop zone */}
                            <div
                                className="nc-upload-zone"
                                onDrop={handleDrop}
                                onDragOver={handleDragOver}
                                onClick={() => fileInputRef.current?.click()}
                                style={{
                                    border: '2px dashed #D1D5DB',
                                    borderRadius: '10px',
                                    padding: '32px 20px',
                                    textAlign: 'center',
                                    cursor: 'pointer',
                                    transition: 'all 0.15s',
                                    marginBottom: uploadingFiles.length > 0 || materials.length > 0 ? '16px' : '0',
                                }}
                            >
                                <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '48px', height: '48px', borderRadius: '12px', background: '#F3F4F6', marginBottom: '12px' }}>
                                    <Upload size={22} style={{ color: ds.textMuted }} />
                                </div>
                                <p style={{ fontFamily: ds.fontDisplay, fontSize: '15px', fontWeight: 600, color: ds.textPrimary, margin: '0 0 4px' }}>
                                    Arraste arquivos ou clique para selecionar
                                </p>
                                <p style={{ fontSize: '12px', color: ds.textMuted, margin: 0 }}>
                                    Suporta imagens, vídeos, PDF, Word, PowerPoint — até 100 MB por arquivo
                                </p>
                            </div>

                            {/* Uploading in-progress files */}
                            {uploadingFiles.length > 0 && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: materials.length > 0 ? '16px' : '0' }}>
                                    {uploadingFiles.map(u => (
                                        <div key={u.localId} style={{
                                            padding: '12px 14px', borderRadius: '10px',
                                            border: u.error ? '1px solid #FECACA' : '1px solid #BFDBFE',
                                            background: u.error ? '#FEF2F2' : '#EFF6FF',
                                        }}>
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: u.error ? '0' : '8px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    {u.error
                                                        ? <AlertCircle size={15} style={{ color: '#DC2626', flexShrink: 0 }} />
                                                        : <Loader2 size={15} style={{ color: '#3B82F6', flexShrink: 0, animation: 'spin 1s linear infinite' }} />
                                                    }
                                                    <span style={{ fontSize: '13px', fontWeight: 500, color: ds.textPrimary }}>{u.file.name}</span>
                                                </div>
                                                <span style={{ fontSize: '12px', color: ds.textSecondary, flexShrink: 0 }}>
                                                    {formatBytes(u.file.size)}
                                                </span>
                                            </div>
                                            {!u.error && (
                                                <div style={{ height: '4px', borderRadius: '999px', background: '#BFDBFE', overflow: 'hidden' }}>
                                                    <div style={{
                                                        height: '100%', borderRadius: '999px', background: '#3B82F6',
                                                        width: `${u.progress}%`, transition: 'width 0.3s ease',
                                                    }} />
                                                </div>
                                            )}
                                            {u.error && (
                                                <p style={{ fontSize: '12px', color: '#DC2626', margin: '4px 0 0' }}>{u.error}</p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Uploaded materials list */}
                            {materials.length > 0 && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    <div style={{ fontSize: '12px', fontWeight: 600, color: ds.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>
                                        Arquivos enviados ({materials.length})
                                    </div>
                                    {materials.map(mat => {
                                        const cat = getFileCategory(mat.file_type);
                                        const statusCfg = MATERIAL_STATUS_CONFIG[mat.status];
                                        return (
                                            <div
                                                key={mat.id}
                                                className="nc-material-row"
                                                style={{
                                                    display: 'flex', alignItems: 'center', gap: '12px',
                                                    padding: '12px 14px', borderRadius: '10px',
                                                    border: '1px solid #E5E7EB', transition: 'background 0.12s',
                                                }}
                                            >
                                                {/* Icon */}
                                                <div style={{
                                                    width: '36px', height: '36px', borderRadius: '8px', flexShrink: 0,
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    background: cat === 'image' ? '#F0FDF4' : cat === 'video' ? '#FFF7ED' : '#F5F3FF',
                                                }}>
                                                    {cat === 'image' && <Eye size={16} style={{ color: '#16A34A' }} />}
                                                    {cat === 'video' && <Upload size={16} style={{ color: '#EA580C' }} />}
                                                    {cat === 'document' && <FileText size={16} style={{ color: '#7C3AED' }} />}
                                                </div>

                                                {/* Info */}
                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                    <div style={{ fontSize: '13px', fontWeight: 600, color: ds.textPrimary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                        {mat.file_name}
                                                    </div>
                                                    <div style={{ fontSize: '11px', color: ds.textMuted, marginTop: '2px' }}>
                                                        {formatBytes(mat.file_size)} · {new Date(mat.created_at).toLocaleDateString('pt-BR')}
                                                        {mat.notes && ` · ${mat.notes}`}
                                                    </div>
                                                </div>

                                                {/* Status badge */}
                                                <span style={{
                                                    display: 'inline-flex', alignItems: 'center', gap: '4px',
                                                    background: statusCfg.bg, color: statusCfg.color,
                                                    borderRadius: '999px', fontSize: '11px', fontWeight: 700,
                                                    padding: '3px 10px', flexShrink: 0,
                                                }}>
                                                    {statusCfg.icon}
                                                    {statusCfg.label}
                                                </span>

                                                {/* Download link */}
                                                {mat.public_url && (
                                                    <a
                                                        href={mat.public_url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        style={{
                                                            display: 'inline-flex', alignItems: 'center', gap: '4px',
                                                            padding: '5px 10px', borderRadius: '7px',
                                                            border: '1px solid #E5E7EB', background: '#FFFFFF',
                                                            color: ds.textSecondary, fontSize: '12px', fontWeight: 500,
                                                            fontFamily: ds.fontBody, textDecoration: 'none',
                                                            transition: 'all 0.15s', flexShrink: 0,
                                                        }}
                                                    >
                                                        <Download size={13} /> Ver
                                                    </a>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            {/* Empty state */}
                            {materials.length === 0 && uploadingFiles.length === 0 && (
                                <div style={{ textAlign: 'center', padding: '24px 0 8px', color: ds.textMuted, fontSize: '13px' }}>
                                    Nenhum arquivo enviado ainda. Arraste arquivos acima para começar.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* ── Tab: Conteúdo Gerado ── */}
            {activeTab === 'conteudo' && (
                <div style={cardStyle}>
                    <div style={{ padding: '20px 20px 12px', borderBottom: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Sparkles size={17} strokeWidth={1.5} style={{ color: ds.accent }} />
                        <div>
                            <div style={{ fontFamily: ds.fontDisplay, fontSize: '16px', fontWeight: 700, color: ds.textPrimary }}>Conteúdo Gerado</div>
                            <div style={{ fontSize: '13px', color: ds.textSecondary }}>Posts, legendas, roteiros e estratégias criados pela IA para o seu projeto</div>
                        </div>
                    </div>
                    <div style={{ padding: '20px' }}>
                        {contentOutputs.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '56px 0' }}>
                                <div style={{
                                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                    width: '56px', height: '56px', borderRadius: '14px',
                                    background: '#FFFBEB', marginBottom: '16px',
                                }}>
                                    <Sparkles size={26} style={{ color: ds.accent }} />
                                </div>
                                <div style={{ fontFamily: ds.fontDisplay, fontSize: '16px', fontWeight: 700, color: ds.textPrimary, marginBottom: '8px' }}>
                                    Nenhum conteúdo gerado ainda
                                </div>
                                <p style={{ fontSize: '13px', color: ds.textSecondary, margin: '0 auto 20px', maxWidth: '360px', lineHeight: 1.6 }}>
                                    Quando o time gerar posts, legendas, roteiros ou estratégias para o seu projeto, eles aparecerão aqui.
                                </p>
                                <button
                                    onClick={() => setActiveTab('materiais')}
                                    style={{ ...primaryBtnStyle, fontSize: '13px', padding: '8px 16px' }}
                                >
                                    <Upload size={14} /> Enviar Materiais
                                </button>
                            </div>
                        ) : (
                            <div className="nc-outputs-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '14px' }}>
                                {contentOutputs.map(output => {
                                    const statusCfg = CONTENT_STATUS_CONFIG[output.status];
                                    const isExpanded = expandedOutputId === output.id;
                                    const preview = output.content_body
                                        ? output.content_body.slice(0, isExpanded ? undefined : 120)
                                        : null;
                                    const isLong = (output.content_body?.length ?? 0) > 120;

                                    return (
                                        <div
                                            key={output.id}
                                            className="nc-output-card"
                                            style={{
                                                border: '1px solid #E5E7EB', borderRadius: '12px',
                                                overflow: 'hidden', transition: 'all 0.18s',
                                                background: '#FFFFFF',
                                            }}
                                        >
                                            {/* Card header strip */}
                                            <div style={{
                                                padding: '12px 14px',
                                                background: `linear-gradient(135deg, ${ds.primary}08, ${ds.primary}03)`,
                                                borderBottom: '1px solid #F3F4F6',
                                                display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px',
                                            }}>
                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                    <div style={{ fontFamily: ds.fontDisplay, fontSize: '14px', fontWeight: 700, color: ds.textPrimary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                        {output.title}
                                                    </div>
                                                    <div style={{ fontSize: '11px', color: ds.textMuted, marginTop: '2px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                        <span style={{
                                                            background: '#F3F4F6', color: ds.textSecondary,
                                                            borderRadius: '999px', padding: '1px 7px', fontWeight: 600,
                                                        }}>
                                                            {CONTENT_TYPE_LABELS[output.content_type]}
                                                        </span>
                                                        {output.platform && (
                                                            <span style={{ color: ds.textMuted }}>{output.platform}</span>
                                                        )}
                                                    </div>
                                                </div>
                                                <span style={{
                                                    background: statusCfg.bg, color: statusCfg.color,
                                                    borderRadius: '999px', fontSize: '11px', fontWeight: 700,
                                                    padding: '3px 10px', flexShrink: 0,
                                                }}>
                                                    {statusCfg.label}
                                                </span>
                                            </div>

                                            {/* Content preview */}
                                            <div style={{ padding: '14px' }}>
                                                {preview ? (
                                                    <>
                                                        <p style={{ fontSize: '13px', color: ds.textSecondary, lineHeight: 1.65, margin: 0, whiteSpace: 'pre-wrap' }}>
                                                            {preview}{!isExpanded && isLong && '…'}
                                                        </p>
                                                        {isLong && (
                                                            <button
                                                                onClick={() => setExpandedOutputId(isExpanded ? null : output.id)}
                                                                style={{
                                                                    background: 'none', border: 'none', padding: '6px 0 0',
                                                                    fontSize: '12px', color: ds.primary, fontWeight: 600,
                                                                    cursor: 'pointer', fontFamily: ds.fontBody,
                                                                }}
                                                            >
                                                                {isExpanded ? 'Ver menos ↑' : 'Ver mais ↓'}
                                                            </button>
                                                        )}
                                                    </>
                                                ) : (
                                                    <p style={{ fontSize: '13px', color: ds.textMuted, margin: 0, fontStyle: 'italic' }}>
                                                        Conteúdo sendo preparado…
                                                    </p>
                                                )}

                                                {/* Footer row */}
                                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #F3F4F6' }}>
                                                    <span style={{ fontSize: '11px', color: ds.textMuted }}>
                                                        {new Date(output.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                    </span>
                                                    <div style={{ display: 'flex', gap: '6px' }}>
                                                        {output.preview_url && (
                                                            <a
                                                                href={output.preview_url}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                style={{
                                                                    display: 'inline-flex', alignItems: 'center', gap: '4px',
                                                                    padding: '5px 10px', borderRadius: '7px',
                                                                    border: '1px solid #E5E7EB', background: '#FFFFFF',
                                                                    color: ds.textSecondary, fontSize: '12px', fontWeight: 500,
                                                                    fontFamily: ds.fontBody, textDecoration: 'none',
                                                                }}
                                                            >
                                                                <Eye size={12} /> Preview
                                                            </a>
                                                        )}
                                                        {output.content_body && (
                                                            <button
                                                                onClick={() => {
                                                                    navigator.clipboard.writeText(output.content_body ?? '');
                                                                    toast.success('Copiado!');
                                                                }}
                                                                style={{
                                                                    display: 'inline-flex', alignItems: 'center', gap: '4px',
                                                                    padding: '5px 10px', borderRadius: '7px',
                                                                    border: `1px solid ${ds.primary}30`,
                                                                    background: `${ds.primary}08`,
                                                                    color: ds.primary, fontSize: '12px', fontWeight: 600,
                                                                    fontFamily: ds.fontBody, cursor: 'pointer',
                                                                }}
                                                            >
                                                                Copiar
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ── Tab: Relatórios ── */}
            {activeTab === 'relatorios' && (
                <div style={cardStyle}>
                    <div style={{ padding: '20px 20px 12px', borderBottom: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <FileText size={17} strokeWidth={1.5} style={{ color: ds.primary }} />
                        <div>
                            <div style={{ fontFamily: ds.fontDisplay, fontSize: '16px', fontWeight: 700, color: ds.textPrimary }}>Relatórios</div>
                            <div style={{ fontSize: '13px', color: ds.textSecondary }}>Relatórios de performance gerados pela equipe</div>
                        </div>
                    </div>
                    <div style={{ padding: '20px' }}>
                        {reports.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '48px 0' }}>
                                <FileText size={44} strokeWidth={1} style={{ color: '#D1D5DB', margin: '0 auto 12px', display: 'block' }} />
                                <div style={{ fontFamily: ds.fontDisplay, fontSize: '15px', fontWeight: 600, color: ds.textSecondary, marginBottom: '4px' }}>Nenhum relatório ainda</div>
                                <p style={{ fontSize: '13px', color: ds.textMuted, margin: 0 }}>Quando o time gerar e entregar relatórios, eles aparecerão aqui.</p>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                {reports.map(report => (
                                    <div
                                        key={report.id}
                                        className="nc-material-row"
                                        style={{
                                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                            padding: '14px 16px', borderRadius: '10px',
                                            border: '1px solid #E5E7EB', transition: 'background 0.12s',
                                        }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <div style={{ padding: '8px', borderRadius: '8px', background: '#ECFDF5' }}>
                                                <FileText size={16} strokeWidth={1.5} style={{ color: '#059669', display: 'block' }} />
                                            </div>
                                            <div>
                                                <div style={{ fontSize: '14px', fontWeight: 600, color: ds.textPrimary }}>
                                                    Relatório — {new Date(report.created_at).toLocaleDateString('pt-BR')}
                                                </div>
                                                {report.review_notes && (
                                                    <div style={{ fontSize: '12px', color: ds.textSecondary, marginTop: '2px' }}>{report.review_notes}</div>
                                                )}
                                            </div>
                                        </div>
                                        {report.pdf_url && (
                                            <a
                                                href={report.pdf_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                style={{
                                                    display: 'inline-flex', alignItems: 'center', gap: '6px',
                                                    padding: '6px 14px', borderRadius: '8px',
                                                    border: '1px solid #E5E7EB', background: '#FFFFFF',
                                                    color: ds.textPrimary, fontSize: '13px', fontWeight: 500,
                                                    fontFamily: ds.fontBody, textDecoration: 'none', cursor: 'pointer',
                                                    transition: 'all 0.15s',
                                                }}
                                            >
                                                <Download size={13} /> Baixar PDF
                                            </a>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ── Tab: Perguntas ── */}
            {activeTab === 'perguntas' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {/* Ask a Question */}
                    <div style={cardStyle}>
                        <div style={{ padding: '20px 20px 12px', borderBottom: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Send size={17} strokeWidth={1.5} style={{ color: ds.primary }} />
                            <div>
                                <div style={{ fontFamily: ds.fontDisplay, fontSize: '16px', fontWeight: 700, color: ds.textPrimary }}>Enviar Pergunta</div>
                                <div style={{ fontSize: '13px', color: ds.textSecondary }}>Tire suas dúvidas diretamente com a equipe</div>
                            </div>
                        </div>
                        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <Textarea
                                placeholder="Escreva sua pergunta aqui... (ex: Como está a performance de tráfego dessa semana?)"
                                value={newQuestion}
                                onChange={e => setNewQuestion(e.target.value)}
                                rows={3}
                                style={{
                                    resize: 'none', fontFamily: ds.fontBody, fontSize: '14px',
                                    border: '1px solid #E5E7EB', borderRadius: '10px', padding: '12px 14px',
                                    color: ds.textPrimary, outline: 'none', width: '100%', boxSizing: 'border-box' as const,
                                }}
                            />
                            <div>
                                <button
                                    onClick={handleSendQuestion}
                                    disabled={!newQuestion.trim() || isSending}
                                    style={!newQuestion.trim() || isSending ? primaryBtnDisabledStyle : primaryBtnStyle}
                                >
                                    {isSending ? (
                                        <><Loader2 size={15} strokeWidth={1.5} style={{ animation: 'spin 1s linear infinite' }} /> Enviando...</>
                                    ) : (
                                        <><Send size={15} strokeWidth={1.5} /> Enviar Pergunta</>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Question History */}
                    <div style={cardStyle}>
                        <div style={{ padding: '20px 20px 12px', borderBottom: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <MessageSquare size={17} strokeWidth={1.5} style={{ color: ds.primary }} />
                            <div style={{ fontFamily: ds.fontDisplay, fontSize: '16px', fontWeight: 700, color: ds.textPrimary }}>
                                Histórico
                            </div>
                            {pendingQuestions > 0 && (
                                <span style={{
                                    background: '#FFFBEB', color: '#D97706',
                                    borderRadius: '999px', fontSize: '11px', fontWeight: 700,
                                    padding: '2px 8px', marginLeft: '4px'
                                }}>
                                    {pendingQuestions} pendente{pendingQuestions > 1 ? 's' : ''}
                                </span>
                            )}
                        </div>
                        <div style={{ padding: '20px' }}>
                            {questions.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '32px 0' }}>
                                    <MessageSquare size={36} strokeWidth={1} style={{ color: '#D1D5DB', margin: '0 auto 10px', display: 'block' }} />
                                    <p style={{ fontSize: '13px', color: ds.textMuted, margin: 0 }}>Nenhuma pergunta enviada ainda.</p>
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    {questions.map(q => (
                                        <div key={q.id} style={{ padding: '14px 16px', borderRadius: '10px', border: '1px solid #E5E7EB' }}>
                                            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', marginBottom: '6px' }}>
                                                <p style={{ fontSize: '14px', fontWeight: 500, color: ds.textPrimary, margin: 0, flex: 1, lineHeight: 1.5 }}>
                                                    {q.question_text}
                                                </p>
                                                <span style={
                                                    q.status === 'answered'
                                                        ? { background: '#ECFDF5', color: '#059669', borderRadius: '999px', fontSize: '11px', fontWeight: 700, padding: '3px 10px', whiteSpace: 'nowrap' as const, flexShrink: 0 }
                                                        : q.status === 'pending'
                                                            ? { background: '#FFFBEB', color: '#D97706', borderRadius: '999px', fontSize: '11px', fontWeight: 700, padding: '3px 10px', whiteSpace: 'nowrap' as const, flexShrink: 0 }
                                                            : { background: '#F3F4F6', color: '#9CA3AF', borderRadius: '999px', fontSize: '11px', fontWeight: 700, padding: '3px 10px', whiteSpace: 'nowrap' as const, flexShrink: 0 }
                                                }>
                                                    {q.status === 'pending' && 'Pendente'}
                                                    {q.status === 'answered' && 'Respondida'}
                                                    {q.status === 'escalated' && 'Encaminhada'}
                                                </span>
                                            </div>
                                            <p style={{ fontSize: '12px', color: ds.textMuted, margin: '0 0 0' }}>
                                                {new Date(q.created_at).toLocaleDateString('pt-BR', {
                                                    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                                                })}
                                            </p>
                                            {q.response_text && (
                                                <div style={{
                                                    marginTop: '12px', padding: '12px 14px',
                                                    borderRadius: '8px', background: '#F9FAFB',
                                                    borderLeft: `3px solid ${ds.primary}`,
                                                }}>
                                                    <p style={{ fontSize: '13px', color: ds.textPrimary, margin: 0, lineHeight: 1.6 }}>{q.response_text}</p>
                                                    {q.responded_at && (
                                                        <p style={{ fontSize: '11px', color: ds.textMuted, margin: '6px 0 0' }}>
                                                            Respondida em {new Date(q.responded_at).toLocaleDateString('pt-BR')}
                                                        </p>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
