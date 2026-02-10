// Database schema types for Next Control CRM
// Compatible with Neon Postgres and future Supabase migration

export type UserRole = 'admin' | 'seller' | 'closer' | 'client';

export type UserStatus = 'pending' | 'active' | 'suspended';

export type ReportStatus = 'pending' | 'approved' | 'rejected';

export type CallOutcome = 'sale' | 'no_sale' | 'reschedule' | 'no_show';

export interface User {
    id: string;
    email: string;
    role: UserRole;
    status: UserStatus;
    name: string;
    created_at: string;
}

export interface Client {
    id: string;
    name: string;
    email?: string; // Link to User account
    company?: string;
    assigned_seller_id?: string;
    assigned_closer_id?: string;
    created_at: string;
}

export interface DailyReport {
    id: string;
    seller_id: string;
    client_id: string;
    report_date: string;
    status: ReportStatus;

    // Funnel metrics
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

    // Aggregated metrics
    total_chat_ativo: number;
    total_boas_vindas: number;
    total_conexoes: number;
    total_mapeamentos: number;
    total_pitchs: number;
    total_capturas: number;

    // Conversion rates (calculated)
    conv_bv_to_conexao?: number;
    conv_conexao_to_map?: number;
    conv_map_to_pitch?: number;
    conv_pitch_to_captura?: number;

    summary?: string;
    created_at: string;
}

// Funnel metrics keys for form handling
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

// Labels for UI display
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
