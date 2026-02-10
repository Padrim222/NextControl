
export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export interface Database {
    public: {
        Tables: {
            users: {
                Row: {
                    id: string
                    email: string
                    role: 'admin' | 'seller' | 'closer' | 'client'
                    status: 'pending' | 'active' | 'suspended'
                    name: string
                    created_at: string
                }
                Insert: {
                    id?: string
                    email: string
                    role: 'admin' | 'seller' | 'closer' | 'client'
                    status?: 'pending' | 'active' | 'suspended'
                    name: string
                    created_at?: string
                }
                Update: {
                    id?: string
                    email?: string
                    role?: 'admin' | 'seller' | 'closer' | 'client'
                    status?: 'pending' | 'active' | 'suspended'
                    name?: string
                    created_at?: string
                }
                Relationships: []
            }
            clients: {
                Row: {
                    id: string
                    name: string
                    email: string | null
                    company: string | null
                    assigned_seller_id: string | null
                    assigned_closer_id: string | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    name: string
                    email?: string | null
                    company?: string | null
                    assigned_seller_id?: string | null
                    assigned_closer_id?: string | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    name?: string
                    email?: string | null
                    company?: string | null
                    assigned_seller_id?: string | null
                    assigned_closer_id?: string | null
                    created_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "clients_assigned_seller_id_fkey"
                        columns: ["assigned_seller_id"]
                        isOneToOne: false
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "clients_assigned_closer_id_fkey"
                        columns: ["assigned_closer_id"]
                        isOneToOne: false
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    }
                ]
            }
            daily_reports: {
                Row: {
                    id: string
                    seller_id: string
                    client_id: string
                    report_date: string
                    status: 'pending' | 'approved' | 'rejected'
                    chat_ativo: number
                    boas_vindas: number
                    reaquecimento: number
                    nutricao: number
                    conexoes: number
                    mapeamentos: number
                    pitchs: number
                    capturas: number
                    followups: number
                    notes: string | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    seller_id: string
                    client_id: string
                    report_date: string
                    status?: 'pending' | 'approved' | 'rejected'
                    chat_ativo?: number
                    boas_vindas?: number
                    reaquecimento?: number
                    nutricao?: number
                    conexoes?: number
                    mapeamentos?: number
                    pitchs?: number
                    capturas?: number
                    followups?: number
                    notes?: string | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    seller_id?: string
                    client_id?: string
                    report_date?: string
                    status?: 'pending' | 'approved' | 'rejected'
                    chat_ativo?: number
                    boas_vindas?: number
                    reaquecimento?: number
                    nutricao?: number
                    conexoes?: number
                    mapeamentos?: number
                    pitchs?: number
                    capturas?: number
                    followups?: number
                    notes?: string | null
                    created_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "daily_reports_seller_id_fkey"
                        columns: ["seller_id"]
                        isOneToOne: false
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "daily_reports_client_id_fkey"
                        columns: ["client_id"]
                        isOneToOne: false
                        referencedRelation: "clients"
                        referencedColumns: ["id"]
                    }
                ]
            }
            call_logs: {
                Row: {
                    id: string
                    closer_id: string
                    client_id: string
                    call_date: string
                    transcription: string | null
                    outcome: 'sale' | 'no_sale' | 'reschedule' | 'no_show'
                    notes: string | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    closer_id: string
                    client_id: string
                    call_date: string
                    transcription?: string | null
                    outcome: 'sale' | 'no_sale' | 'reschedule' | 'no_show'
                    notes?: string | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    closer_id?: string
                    client_id?: string
                    call_date?: string
                    transcription?: string | null
                    outcome?: 'sale' | 'no_sale' | 'reschedule' | 'no_show'
                    notes?: string | null
                    created_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "call_logs_closer_id_fkey"
                        columns: ["closer_id"]
                        isOneToOne: false
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "call_logs_client_id_fkey"
                        columns: ["client_id"]
                        isOneToOne: false
                        referencedRelation: "clients"
                        referencedColumns: ["id"]
                    }
                ]
            }
            ai_feedback: {
                Row: {
                    id: string
                    report_id: string
                    generated_by: string | null
                    feedback_text: string
                    model: string
                    created_at: string
                }
                Insert: {
                    id?: string
                    report_id: string
                    generated_by?: string | null
                    feedback_text: string
                    model?: string
                    created_at?: string
                }
                Update: {
                    id?: string
                    report_id?: string
                    generated_by?: string | null
                    feedback_text?: string
                    model?: string
                    created_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "ai_feedback_report_id_fkey"
                        columns: ["report_id"]
                        isOneToOne: false
                        referencedRelation: "daily_reports"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "ai_feedback_generated_by_fkey"
                        columns: ["generated_by"]
                        isOneToOne: false
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    }
                ]
            }
            weekly_reports: {
                Row: {
                    id: string
                    client_id: string
                    week_start: string
                    week_end: string
                    total_chat_ativo: number
                    total_boas_vindas: number
                    total_conexoes: number
                    total_mapeamentos: number
                    total_pitchs: number
                    total_capturas: number
                    conv_bv_to_conexao: number | null
                    conv_conexao_to_map: number | null
                    conv_map_to_pitch: number | null
                    conv_pitch_to_captura: number | null
                    summary: string | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    client_id: string
                    week_start: string
                    week_end: string
                    total_chat_ativo?: number
                    total_boas_vindas?: number
                    total_conexoes?: number
                    total_mapeamentos?: number
                    total_pitchs?: number
                    total_capturas?: number
                    conv_bv_to_conexao?: number | null
                    conv_conexao_to_map?: number | null
                    conv_map_to_pitch?: number | null
                    conv_pitch_to_captura?: number | null
                    summary?: string | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    client_id?: string
                    week_start?: string
                    week_end?: string
                    total_chat_ativo?: number
                    total_boas_vindas?: number
                    total_conexoes?: number
                    total_mapeamentos?: number
                    total_pitchs?: number
                    total_capturas?: number
                    conv_bv_to_conexao?: number | null
                    conv_conexao_to_map?: number | null
                    conv_map_to_pitch?: number | null
                    conv_pitch_to_captura?: number | null
                    summary?: string | null
                    created_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "weekly_reports_client_id_fkey"
                        columns: ["client_id"]
                        isOneToOne: false
                        referencedRelation: "clients"
                        referencedColumns: ["id"]
                    }
                ]
            }
        }
        Views: {
            [_ in never]: never
        }
        Functions: {
            [_ in never]: never
        }
        Enums: {
            [_ in never]: never
        }
        CompositeTypes: {
            [_ in never]: never
        }
    }
}
