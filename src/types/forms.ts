// ============================================
// Next Control — Public Forms TypeScript Types
// ============================================

export type FormType = 'expert_weekly' | 'seller_daily' | 'closer_daily';

export type AIStatus = 'pending' | 'processing' | 'done' | 'error';

// ---- FORM-SPECIFIC DATA SCHEMAS ----

export interface ExpertWeeklyData {
    leads_range: '0-10' | '10-30' | '30-60' | '60+';
    opportunities_opened: number;
    sales_closed: number;
    revenue: number;
    top_channel: 'inbound_organic' | 'inbound_paid' | 'outbound' | 'referral' | 'other';

    lead_volume_status: 'below' | 'expected' | 'above';
    lead_quality: 'low' | 'medium' | 'high';
    bottleneck: 'acquisition' | 'qualification' | 'conduction' | 'closing' | 'delivery';

    content_generated_leads: boolean;
    content_problems: string;
    brand_clarity_score: number;
    strategic_notes: string;
}

export interface SellerDailyData {
    new_qualified_followers: number;
    conversations_started: number;
    conversations_to_opportunity: number;
    followups_done: number;
    common_objection: string;
    conversation_quality_score: number;
    crm_screenshots: string[];
}

export interface CloserDailyData {
    calls_made: number;
    sales_closed: number;
    conversion_rate: number;
    main_objection: string;
    avoidable_loss: boolean;
    avoidable_loss_reason: string;
    self_score: number;
    call_recording_url: string;
}

export type FormData = ExpertWeeklyData | SellerDailyData | CloserDailyData;

// ---- FORM SUBMISSION ----

export interface FormSubmission {
    id: string;
    form_type: FormType;
    submitter_name: string;
    submitter_email?: string;
    submitter_phone?: string;
    user_id?: string;
    client_id?: string;
    data: FormData;
    attachments: string[];
    submission_date: string;
    ai_analysis_id?: string;
    ai_score?: number;
    ai_status: AIStatus;
    created_at: string;
    updated_at?: string;
}

// ---- FORM CONFIG ----

export const FORM_CONFIG: Record<FormType, {
    title: string;
    subtitle: string;
    frequency: string;
    estimatedTime: string;
    emoji: string;
}> = {
    expert_weekly: {
        title: 'Relatório Expert / Empresa',
        subtitle: 'Visão estratégica do seu funil e posicionamento',
        frequency: '2x por semana',
        estimatedTime: '10–15 min',
        emoji: '🎯',
    },
    seller_daily: {
        title: 'Check-in Social Seller',
        subtitle: 'Registro diário de métricas e evidências',
        frequency: 'Diário',
        estimatedTime: '5–8 min',
        emoji: '💬',
    },
    closer_daily: {
        title: 'Check-in Closer',
        subtitle: 'Registro diário de calls e conversão',
        frequency: 'Diário',
        estimatedTime: '5–10 min',
        emoji: '📞',
    },
};

// ---- EXPERT FORM OPTIONS ----

export const LEAD_RANGES = [
    { value: '0-10', label: '0–10' },
    { value: '10-30', label: '10–30' },
    { value: '30-60', label: '30–60' },
    { value: '60+', label: '60+' },
] as const;

export const CHANNEL_OPTIONS = [
    { value: 'inbound_organic', label: 'Inbound Orgânico' },
    { value: 'inbound_paid', label: 'Inbound Pago' },
    { value: 'outbound', label: 'Outbound' },
    { value: 'referral', label: 'Indicação' },
    { value: 'other', label: 'Outro' },
] as const;

export const VOLUME_STATUS_OPTIONS = [
    { value: 'below', label: 'Abaixo do esperado' },
    { value: 'expected', label: 'Dentro do esperado' },
    { value: 'above', label: 'Acima do esperado' },
] as const;

export const QUALITY_OPTIONS = [
    { value: 'low', label: 'Ruim' },
    { value: 'medium', label: 'Média' },
    { value: 'high', label: 'Alta' },
] as const;

export const BOTTLENECK_OPTIONS = [
    { value: 'acquisition', label: 'Aquisição' },
    { value: 'qualification', label: 'Qualificação' },
    { value: 'conduction', label: 'Condução' },
    { value: 'closing', label: 'Fechamento' },
    { value: 'delivery', label: 'Entrega' },
] as const;
