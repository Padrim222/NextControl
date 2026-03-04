// ============================================
// Next Control — Consultoria de Bolso — TypeScript Types
// Next Control CRM + Coaching System
// Compatible with Supabase
// ============================================

// ---- CORE ENUMS ----

export type UserRole = 'admin' | 'seller' | 'closer' | 'client' | 'cs';
export type UserStatus = 'pending' | 'active' | 'suspended';
export type SellerType = 'seller' | 'closer';
export type ReportStatus = 'pending' | 'approved' | 'rejected';
export type CallOutcome = 'sale' | 'no_sale' | 'reschedule' | 'no_show';
export type AgentType = 'social_selling' | 'call_analysis' | 'metrics';
export type DeliveryStatus = 'pending' | 'approved' | 'delivered';

// ---- CORE ENTITIES ----

export interface User {
    id: string;
    email: string;
    role: UserRole;
    status: UserStatus;
    name: string;
    phone?: string;
    seller_type?: SellerType;
    cs_id?: string;
    client_id?: string;
    created_at: string;
    updated_at?: string;
}

export interface Client {
    id: string;
    name: string;
    email?: string;
    company?: string;
    assigned_seller_id?: string;
    assigned_closer_id?: string;
    created_at: string;
}

export interface ClientMaterial {
    id: string;
    client_id: string;
    title: string;
    description: string | null;
    file_url: string;
    file_type: string;
    is_rag_active: boolean;
    sent_to_client: boolean;
    created_at: string;
    created_by: string;
}

// ---- TREINADOR DE BOLSO ENTITIES ----

export interface SellerMetrics {
    followers?: number;
    conversations?: number;
    opportunities?: number;
    followups?: number;
    quality_score?: number;
    main_objections?: string[];
    approaches?: number;
    proposals?: number;
    sales?: number;
}

export interface SellerPlaybookItem {
    id: string;
    user_id: string;
    type: 'script' | 'blacklist' | 'objection_handling';
    title: string;
    content: string;
    created_at: string;
}

export interface CloserMetrics {
    calls_made: number;
    proposals_sent: number;
    sales_closed: number;
    no_shows: number;
    reschedules: number;
    main_objections: string[];
}

export interface DailySubmission {
    id: string;
    seller_id: string;
    submission_date: string;
    metrics: SellerMetrics | CloserMetrics;
    conversation_prints: string[];
    pasted_messages?: string;
    call_recording?: string;
    notes?: string;
    status: 'pending' | 'approved' | 'rejected';
    created_at: string;
}

export interface Analysis {
    id: string;
    submission_id: string;
    agent_type: AgentType;
    content: string;
    strengths: string[];
    improvements: string[];
    patterns: {
        objections?: string[];
        approach?: string;
        rapport?: string;
        discovery?: string;
        presentation?: string;
        close?: string;
    };
    next_steps: string[];
    score: number;
    created_at: string;
}

export interface Report {
    id: string;
    seller_id: string;
    submission_id?: string;
    analysis_id?: string;
    pdf_url?: string;
    status: DeliveryStatus;
    reviewed_by?: string;
    review_notes?: string;
    sent_at?: string;
    created_at: string;
}

export interface CoachInteraction {
    id: string;
    seller_id: string;
    question: string;
    answer?: string;
    context: {
        recent_scores?: number[];
        strengths?: string[];
        weaknesses?: string[];
        seller_type?: SellerType;
        tenure_months?: number;
    };
    created_at: string;
}

// ---- LEGACY ENTITIES (backward compat) ----

export interface DailyReport {
    id: string;
    seller_id: string;
    client_id: string;
    report_date: string;
    status: ReportStatus;
    chat_ativo: number;
    boas_vindas: number;
    reaquecimento: number;
    nutricao: number;
    conexoes: number;
    mapeamentos: number;
    pitchs: number;
    capturas: number;
    followups: number;
    notes?: string;
    created_at: string;
}

export interface CallLog {
    id: string;
    closer_id: string;
    client_id: string;
    call_date: string;
    transcription?: string;
    outcome: CallOutcome;
    notes?: string;
    created_at: string;
}

export interface AIFeedback {
    id: string;
    report_id: string;
    generated_by?: string;
    feedback_text: string;
    model: string;
    created_at: string;
}

export interface WeeklyReport {
    id: string;
    client_id: string;
    week_start: string;
    week_end: string;
    total_chat_ativo: number;
    total_boas_vindas: number;
    total_conexoes: number;
    total_mapeamentos: number;
    total_pitchs: number;
    total_capturas: number;
    conv_bv_to_conexao?: number;
    conv_conexao_to_map?: number;
    conv_map_to_pitch?: number;
    conv_pitch_to_captura?: number;
    summary?: string;
    created_at: string;
}

// ---- CONSELHO RY ENTITIES ----

export type QuestionStatus = 'pending' | 'answered' | 'escalated';
export type AnalysisStatus = 'draft' | 'approved' | 'rejected' | 'sent';
export type TrainingCategory = 'process_optimization' | 'approach_technique' | 'sales_pitch' | 'objection_handling' | 'methodology' | 'best_practice';
export type TrainingTargetRole = 'seller' | 'closer' | 'both';

export interface ClientQuestion {
    id: string;
    client_id: string;
    asked_by: string;
    question_text: string;
    status: QuestionStatus;
    response_text?: string;
    responded_by?: string;
    escalated_to?: 'yorik' | 'head';
    created_at: string;
    responded_at?: string;
}

export interface HeadAgentAnalysis {
    id: string;
    report_id?: string;
    call_log_id?: string;
    response_time_score?: number;
    script_adherence_score?: number;
    organization_score?: number;
    operational_notes?: string;
    correct_product_offered?: boolean;
    methodology_followed?: boolean;
    tactical_notes?: string;
    suggested_scripts?: string;
    new_strategies?: string;
    errors_identified?: string;
    status: AnalysisStatus;
    approved_by?: string;
    approved_at?: string;
    sent_via_whatsapp: boolean;
    sent_at?: string;
    created_at: string;
}

export interface ChecklistItem {
    text: string;
    checked: boolean;
}

export interface ImprovementChecklist {
    id: string;
    analysis_id: string;
    seller_id?: string;
    closer_id?: string;
    title: string;
    items: ChecklistItem[];
    created_at: string;
}

export interface TrainingMaterial {
    id: string;
    title: string;
    content: string;
    category: TrainingCategory;
    target_role: TrainingTargetRole;
    source_analysis_id?: string;
    is_active: boolean;
    created_at: string;
}

// ---- FUNNEL METRICS (Legacy) ----

export const FUNNEL_METRICS = [
    'chat_ativo',
    'boas_vindas',
    'reaquecimento',
    'nutricao',
    'conexoes',
    'mapeamentos',
    'pitchs',
    'capturas',
    'followups',
] as const;

export type FunnelMetricKey = typeof FUNNEL_METRICS[number];

export const FUNNEL_LABELS: Record<FunnelMetricKey, { label: string; emoji: string }> = {
    chat_ativo: { label: 'Chat Ativo', emoji: '💬' },
    boas_vindas: { label: 'Boas-vindas', emoji: '🤝' },
    reaquecimento: { label: 'Reaquecimento', emoji: '🔥' },
    nutricao: { label: 'Nutrição', emoji: '🌱' },
    conexoes: { label: 'Conexões', emoji: '🔗' },
    mapeamentos: { label: 'Mapeamentos', emoji: '🎯' },
    pitchs: { label: 'Pitchs', emoji: '☎️' },
    capturas: { label: 'Capturas', emoji: '✅' },
    followups: { label: 'Follow-up', emoji: '👀' },
};

// ---- SELLER SUBMISSION METRICS ----

export const SELLER_METRICS_FIELDS = [
    { key: 'followers', label: 'Novos Seguidores', emoji: '👥' },
    { key: 'conversations', label: 'Conversas Iniciadas', emoji: '💬' },
    { key: 'opportunities', label: 'Oportunidades (Pitches)', emoji: '🎯' },
    { key: 'followups', label: 'Follow-ups', emoji: '🔄' },
    { key: 'quality_score', label: 'Qualidade do Dia', emoji: '⭐' },
] as const;

export const CLOSER_METRICS_FIELDS = [
    { key: 'calls_made', label: 'Calls Realizadas', emoji: '📞' },
    { key: 'proposals_sent', label: 'Propostas Enviadas', emoji: '📋' },
    { key: 'sales_closed', label: 'Vendas Fechadas', emoji: '🎯' },
    { key: 'no_shows', label: 'No-Shows', emoji: '❌' },
    { key: 'reschedules', label: 'Reagendamentos', emoji: '📅' },
] as const;
