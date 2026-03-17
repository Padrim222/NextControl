export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      admin_activity_logs: {
        Row: {
          action: string
          admin_id: string
          created_at: string | null
          details: Json | null
          id: string
          ip_address: unknown
          target_user_id: string | null
          user_agent: string | null
        }
        Insert: {
          action: string
          admin_id: string
          created_at?: string | null
          details?: Json | null
          id?: string
          ip_address?: unknown
          target_user_id?: string | null
          user_agent?: string | null
        }
        Update: {
          action?: string
          admin_id?: string
          created_at?: string | null
          details?: Json | null
          id?: string
          ip_address?: unknown
          target_user_id?: string | null
          user_agent?: string | null
        }
        Relationships: []
      }
      admin_metrics: {
        Row: {
          created_at: string | null
          id: string
          metadata: Json | null
          metric_date: string
          metric_type: string
          metric_value: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          metadata?: Json | null
          metric_date?: string
          metric_type: string
          metric_value: number
        }
        Update: {
          created_at?: string | null
          id?: string
          metadata?: Json | null
          metric_date?: string
          metric_type?: string
          metric_value?: number
        }
        Relationships: []
      }
      agent_conversations: {
        Row: {
          agent_type: string
          context: Json | null
          created_at: string
          id: string
          messages: Json
          updated_at: string
          user_id: string | null
        }
        Insert: {
          agent_type?: string
          context?: Json | null
          created_at?: string
          id?: string
          messages?: Json
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          agent_type?: string
          context?: Json | null
          created_at?: string
          id?: string
          messages?: Json
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agent_conversations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_suggestions: {
        Row: {
          admin_notes: string | null
          agent_type: string
          call_upload_id: string | null
          client_id: string | null
          content: string
          context_note: string | null
          created_at: string
          id: string
          reviewed_at: string | null
          reviewed_by: string | null
          source: string
          status: string
          suggestion_type: string
          title: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          agent_type?: string
          call_upload_id?: string | null
          client_id?: string | null
          content: string
          context_note?: string | null
          created_at?: string
          id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          source?: string
          status?: string
          suggestion_type?: string
          title?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          agent_type?: string
          call_upload_id?: string | null
          client_id?: string | null
          content?: string
          context_note?: string | null
          created_at?: string
          id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          source?: string
          status?: string
          suggestion_type?: string
          title?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_suggestions_call_upload_id_fkey"
            columns: ["call_upload_id"]
            isOneToOne: false
            referencedRelation: "call_uploads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_suggestions_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_feedback: {
        Row: {
          created_at: string
          feedback_text: string
          generated_by: string | null
          id: string
          model: string | null
          report_id: string | null
        }
        Insert: {
          created_at?: string
          feedback_text: string
          generated_by?: string | null
          id?: string
          model?: string | null
          report_id?: string | null
        }
        Update: {
          created_at?: string
          feedback_text?: string
          generated_by?: string | null
          id?: string
          model?: string | null
          report_id?: string | null
        }
        Relationships: []
      }
      analyses: {
        Row: {
          agent_type: string
          content: string
          created_at: string
          id: string
          improvements: Json
          next_steps: Json
          patterns: Json
          score: number
          strengths: Json
          submission_id: string
        }
        Insert: {
          agent_type: string
          content?: string
          created_at?: string
          id?: string
          improvements?: Json
          next_steps?: Json
          patterns?: Json
          score?: number
          strengths?: Json
          submission_id: string
        }
        Update: {
          agent_type?: string
          content?: string
          created_at?: string
          id?: string
          improvements?: Json
          next_steps?: Json
          patterns?: Json
          score?: number
          strengths?: Json
          submission_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "analyses_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "daily_submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      app_settings: {
        Row: {
          created_at: string | null
          description: string | null
          key: string
          updated_at: string | null
          value: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          key: string
          updated_at?: string | null
          value: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          key?: string
          updated_at?: string | null
          value?: string
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string
          id: number
          ip_address: string | null
          metadata: Json | null
          resource_id: string | null
          resource_type: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          id?: never
          ip_address?: string | null
          metadata?: Json | null
          resource_id?: string | null
          resource_type?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          id?: never
          ip_address?: string | null
          metadata?: Json | null
          resource_id?: string | null
          resource_type?: string | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      blocked_email_domains: {
        Row: {
          created_at: string | null
          domain: string
          reason: string | null
        }
        Insert: {
          created_at?: string | null
          domain: string
          reason?: string | null
        }
        Update: {
          created_at?: string | null
          domain?: string
          reason?: string | null
        }
        Relationships: []
      }
      call_evaluations: {
        Row: {
          acoes_recomendadas: Json
          ai_model: string | null
          call_log_id: string | null
          closer_id: string
          created_at: string
          duration_minutes: number | null
          feedback_detalhado: string
          gaps_criticos: Json
          id: string
          insights_convertidas: Json
          insights_perdidas: Json
          melhorias: Json
          nivel: string
          pontos_fortes: Json
          prospect_name: string | null
          resultado: string
          score_abertura: number
          score_apresentacao: number
          score_comunicacao: number
          score_descoberta: number
          score_fechamento: number
          score_geral: number
          score_objecoes: number
        }
        Insert: {
          acoes_recomendadas?: Json
          ai_model?: string | null
          call_log_id?: string | null
          closer_id: string
          created_at?: string
          duration_minutes?: number | null
          feedback_detalhado?: string
          gaps_criticos?: Json
          id?: string
          insights_convertidas?: Json
          insights_perdidas?: Json
          melhorias?: Json
          nivel?: string
          pontos_fortes?: Json
          prospect_name?: string | null
          resultado?: string
          score_abertura?: number
          score_apresentacao?: number
          score_comunicacao?: number
          score_descoberta?: number
          score_fechamento?: number
          score_geral?: number
          score_objecoes?: number
        }
        Update: {
          acoes_recomendadas?: Json
          ai_model?: string | null
          call_log_id?: string | null
          closer_id?: string
          created_at?: string
          duration_minutes?: number | null
          feedback_detalhado?: string
          gaps_criticos?: Json
          id?: string
          insights_convertidas?: Json
          insights_perdidas?: Json
          melhorias?: Json
          nivel?: string
          pontos_fortes?: Json
          prospect_name?: string | null
          resultado?: string
          score_abertura?: number
          score_apresentacao?: number
          score_comunicacao?: number
          score_descoberta?: number
          score_fechamento?: number
          score_geral?: number
          score_objecoes?: number
        }
        Relationships: [
          {
            foreignKeyName: "call_evaluations_call_log_id_fkey"
            columns: ["call_log_id"]
            isOneToOne: false
            referencedRelation: "call_logs"
            referencedColumns: ["id"]
          },
        ]
      }
      call_logs: {
        Row: {
          call_date: string
          client_id: string | null
          closer_id: string | null
          created_at: string
          duration_minutes: number | null
          id: string
          notes: string | null
          outcome: string | null
          prospect_name: string | null
          transcription: string | null
        }
        Insert: {
          call_date?: string
          client_id?: string | null
          closer_id?: string | null
          created_at?: string
          duration_minutes?: number | null
          id?: string
          notes?: string | null
          outcome?: string | null
          prospect_name?: string | null
          transcription?: string | null
        }
        Update: {
          call_date?: string
          client_id?: string | null
          closer_id?: string | null
          created_at?: string
          duration_minutes?: number | null
          id?: string
          notes?: string | null
          outcome?: string | null
          prospect_name?: string | null
          transcription?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "call_logs_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      call_uploads: {
        Row: {
          admin_notes: string | null
          approved_at: string | null
          approved_by: string | null
          call_date: string
          client_id: string | null
          closer_id: string | null
          created_at: string
          duration_minutes: number | null
          evaluation_id: string | null
          id: string
          mp3_url: string | null
          original_url: string | null
          prospect_name: string | null
          status: string
          transcription_text: string | null
          updated_at: string
          upload_source: string
        }
        Insert: {
          admin_notes?: string | null
          approved_at?: string | null
          approved_by?: string | null
          call_date?: string
          client_id?: string | null
          closer_id?: string | null
          created_at?: string
          duration_minutes?: number | null
          evaluation_id?: string | null
          id?: string
          mp3_url?: string | null
          original_url?: string | null
          prospect_name?: string | null
          status?: string
          transcription_text?: string | null
          updated_at?: string
          upload_source?: string
        }
        Update: {
          admin_notes?: string | null
          approved_at?: string | null
          approved_by?: string | null
          call_date?: string
          client_id?: string | null
          closer_id?: string | null
          created_at?: string
          duration_minutes?: number | null
          evaluation_id?: string | null
          id?: string
          mp3_url?: string | null
          original_url?: string | null
          prospect_name?: string | null
          status?: string
          transcription_text?: string | null
          updated_at?: string
          upload_source?: string
        }
        Relationships: [
          {
            foreignKeyName: "call_uploads_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_call_uploads_evaluation"
            columns: ["evaluation_id"]
            isOneToOne: false
            referencedRelation: "call_evaluations"
            referencedColumns: ["id"]
          },
        ]
      }
      client_materials: {
        Row: {
          agent_target: string | null
          category: string
          client_id: string
          created_at: string
          created_by: string | null
          description: string | null
          file_type: string
          file_url: string
          id: string
          is_rag_active: boolean
          sent_to_client: boolean
          title: string
        }
        Insert: {
          agent_target?: string | null
          category?: string
          client_id: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          file_type?: string
          file_url: string
          id?: string
          is_rag_active?: boolean
          sent_to_client?: boolean
          title: string
        }
        Update: {
          agent_target?: string | null
          category?: string
          client_id?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          file_type?: string
          file_url?: string
          id?: string
          is_rag_active?: boolean
          sent_to_client?: boolean
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_materials_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_materials_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      client_onboarding: {
        Row: {
          average_ticket: string | null
          brand_references: string | null
          brand_words: string | null
          client_id: string
          communication_tone: string | null
          company_history: string | null
          company_name: string | null
          competitive_differentials: string | null
          conversion_rate: string | null
          created_at: string | null
          founder_name: string | null
          icp: string | null
          id: string
          main_acquisition_channel: string | null
          main_challenge: string | null
          main_objections: string | null
          mission: string | null
          monthly_leads: string | null
          monthly_revenue_goal: string | null
          non_brand_words: string | null
          non_negotiables: string | null
          problem_solved: string | null
          process_improvements: string | null
          product_name: string | null
          product_price: string | null
          raw_data: Json | null
          sales_cycle: string | null
          sales_process: string | null
          segment: string | null
          submitted_at: string | null
          successful_message_example: string | null
          transformation: string | null
          user_id: string
          years_in_market: string | null
        }
        Insert: {
          average_ticket?: string | null
          brand_references?: string | null
          brand_words?: string | null
          client_id: string
          communication_tone?: string | null
          company_history?: string | null
          company_name?: string | null
          competitive_differentials?: string | null
          conversion_rate?: string | null
          created_at?: string | null
          founder_name?: string | null
          icp?: string | null
          id?: string
          main_acquisition_channel?: string | null
          main_challenge?: string | null
          main_objections?: string | null
          mission?: string | null
          monthly_leads?: string | null
          monthly_revenue_goal?: string | null
          non_brand_words?: string | null
          non_negotiables?: string | null
          problem_solved?: string | null
          process_improvements?: string | null
          product_name?: string | null
          product_price?: string | null
          raw_data?: Json | null
          sales_cycle?: string | null
          sales_process?: string | null
          segment?: string | null
          submitted_at?: string | null
          successful_message_example?: string | null
          transformation?: string | null
          user_id: string
          years_in_market?: string | null
        }
        Update: {
          average_ticket?: string | null
          brand_references?: string | null
          brand_words?: string | null
          client_id?: string
          communication_tone?: string | null
          company_history?: string | null
          company_name?: string | null
          competitive_differentials?: string | null
          conversion_rate?: string | null
          created_at?: string | null
          founder_name?: string | null
          icp?: string | null
          id?: string
          main_acquisition_channel?: string | null
          main_challenge?: string | null
          main_objections?: string | null
          mission?: string | null
          monthly_leads?: string | null
          monthly_revenue_goal?: string | null
          non_brand_words?: string | null
          non_negotiables?: string | null
          problem_solved?: string | null
          process_improvements?: string | null
          product_name?: string | null
          product_price?: string | null
          raw_data?: Json | null
          sales_cycle?: string | null
          sales_process?: string | null
          segment?: string | null
          submitted_at?: string | null
          successful_message_example?: string | null
          transformation?: string | null
          user_id?: string
          years_in_market?: string | null
        }
        Relationships: []
      }
      client_questions: {
        Row: {
          asked_by: string
          client_id: string | null
          created_at: string
          id: string
          question_text: string
          responded_at: string | null
          responded_by: string | null
          response_text: string | null
          status: string
        }
        Insert: {
          asked_by: string
          client_id?: string | null
          created_at?: string
          id?: string
          question_text: string
          responded_at?: string | null
          responded_by?: string | null
          response_text?: string | null
          status?: string
        }
        Update: {
          asked_by?: string
          client_id?: string | null
          created_at?: string
          id?: string
          question_text?: string
          responded_at?: string | null
          responded_by?: string | null
          response_text?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_questions_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          assigned_closer_id: string | null
          assigned_seller_id: string | null
          auth_user_id: string | null
          company: string | null
          created_at: string
          current_phase: string | null
          email: string | null
          id: string
          is_beta: boolean | null
          name: string
          next_step: string | null
          operational_processes: string | null
          phone: string | null
          project_summary: string | null
          segment: string | null
          status: string
          team_status: string | null
          updated_at: string
        }
        Insert: {
          assigned_closer_id?: string | null
          assigned_seller_id?: string | null
          auth_user_id?: string | null
          company?: string | null
          created_at?: string
          current_phase?: string | null
          email?: string | null
          id?: string
          is_beta?: boolean | null
          name: string
          next_step?: string | null
          operational_processes?: string | null
          phone?: string | null
          project_summary?: string | null
          segment?: string | null
          status?: string
          team_status?: string | null
          updated_at?: string
        }
        Update: {
          assigned_closer_id?: string | null
          assigned_seller_id?: string | null
          auth_user_id?: string | null
          company?: string | null
          created_at?: string
          current_phase?: string | null
          email?: string | null
          id?: string
          is_beta?: boolean | null
          name?: string
          next_step?: string | null
          operational_processes?: string | null
          phone?: string | null
          project_summary?: string | null
          segment?: string | null
          status?: string
          team_status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_clients_assigned_closer"
            columns: ["assigned_closer_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_clients_assigned_seller"
            columns: ["assigned_seller_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      content_outputs: {
        Row: {
          client_id: string | null
          content: string
          created_at: string
          created_by: string | null
          id: string
          status: string | null
          title: string
          type: string
          updated_at: string
        }
        Insert: {
          client_id?: string | null
          content: string
          created_at?: string
          created_by?: string | null
          id?: string
          status?: string | null
          title: string
          type: string
          updated_at?: string
        }
        Update: {
          client_id?: string | null
          content?: string
          created_at?: string
          created_by?: string | null
          id?: string
          status?: string | null
          title?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_outputs_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_outputs_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      credit_balances: {
        Row: {
          available_at: string | null
          consumption_priority: number
          created_at: string
          credit_type: string
          description: string | null
          expired: boolean | null
          expired_at: string | null
          expires_at: string | null
          id: string
          initial_amount: number
          metadata: Json | null
          remaining_amount: number
          source_id: string | null
          source_type: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          available_at?: string | null
          consumption_priority?: number
          created_at?: string
          credit_type: string
          description?: string | null
          expired?: boolean | null
          expired_at?: string | null
          expires_at?: string | null
          id?: string
          initial_amount: number
          metadata?: Json | null
          remaining_amount: number
          source_id?: string | null
          source_type?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          available_at?: string | null
          consumption_priority?: number
          created_at?: string
          credit_type?: string
          description?: string | null
          expired?: boolean | null
          expired_at?: string | null
          expires_at?: string | null
          id?: string
          initial_amount?: number
          metadata?: Json | null
          remaining_amount?: number
          source_id?: string | null
          source_type?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "credit_balances_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      credit_transactions: {
        Row: {
          amount: number
          created_at: string
          description: string | null
          id: string
          metadata: Json | null
          reference_id: string | null
          type: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          description?: string | null
          id?: string
          metadata?: Json | null
          reference_id?: string | null
          type: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string | null
          id?: string
          metadata?: Json | null
          reference_id?: string | null
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "credit_transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      credits: {
        Row: {
          available_credits: number
          subscription_expires_at: string | null
          subscription_type: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          available_credits?: number
          subscription_expires_at?: string | null
          subscription_type?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          available_credits?: number
          subscription_expires_at?: string | null
          subscription_type?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "credits_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_credit_usage: {
        Row: {
          created_at: string
          credits_used: number
          id: string
          purchase_restriction_id: string
          updated_at: string
          usage_date: string
          user_id: string
        }
        Insert: {
          created_at?: string
          credits_used?: number
          id?: string
          purchase_restriction_id: string
          updated_at?: string
          usage_date: string
          user_id: string
        }
        Update: {
          created_at?: string
          credits_used?: number
          id?: string
          purchase_restriction_id?: string
          updated_at?: string
          usage_date?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "daily_credit_usage_purchase_restriction_id_fkey"
            columns: ["purchase_restriction_id"]
            isOneToOne: false
            referencedRelation: "purchase_restrictions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daily_credit_usage_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_submissions: {
        Row: {
          call_recording: string | null
          client_id: string | null
          conversation_prints: Json
          created_at: string
          id: string
          metrics: Json
          notes: string | null
          seller_id: string
          status: string
          submission_date: string
        }
        Insert: {
          call_recording?: string | null
          client_id?: string | null
          conversation_prints?: Json
          created_at?: string
          id?: string
          metrics?: Json
          notes?: string | null
          seller_id: string
          status?: string
          submission_date?: string
        }
        Update: {
          call_recording?: string | null
          client_id?: string | null
          conversation_prints?: Json
          created_at?: string
          id?: string
          metrics?: Json
          notes?: string | null
          seller_id?: string
          status?: string
          submission_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "daily_submissions_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      device_fingerprints: {
        Row: {
          created_at: string | null
          fingerprint_hash: string
          id: string
          ip_address: unknown
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          fingerprint_hash: string
          id?: string
          ip_address?: unknown
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          fingerprint_hash?: string
          id?: string
          ip_address?: unknown
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "device_fingerprints_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      form_submissions: {
        Row: {
          client_id: string | null
          created_at: string
          data: Json
          form_type: string
          id: string
          submitted_by: string | null
        }
        Insert: {
          client_id?: string | null
          created_at?: string
          data?: Json
          form_type?: string
          id?: string
          submitted_by?: string | null
        }
        Update: {
          client_id?: string | null
          created_at?: string
          data?: Json
          form_type?: string
          id?: string
          submitted_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "form_submissions_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      fraud_signals: {
        Row: {
          created_at: string | null
          id: string
          resolved: boolean | null
          resolved_at: string | null
          resolved_by: string | null
          risk_score: number | null
          signal_type: string
          signal_value: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          resolved?: boolean | null
          resolved_at?: string | null
          resolved_by?: string | null
          risk_score?: number | null
          signal_type: string
          signal_value?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          resolved?: boolean | null
          resolved_at?: string | null
          resolved_by?: string | null
          risk_score?: number | null
          signal_type?: string
          signal_value?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fraud_signals_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      gamification_tasks: {
        Row: {
          category: string
          created_at: string
          credit_reward: number
          description: string
          icon_name: string
          id: string
          is_active: boolean
          is_repeatable: boolean
          max_lifetime: number | null
          max_per_day: number | null
          points: number
          progress_target: number
          task_type: string
          title: string
          unlock_level: number
          updated_at: string
        }
        Insert: {
          category?: string
          created_at?: string
          credit_reward?: number
          description: string
          icon_name?: string
          id?: string
          is_active?: boolean
          is_repeatable?: boolean
          max_lifetime?: number | null
          max_per_day?: number | null
          points?: number
          progress_target?: number
          task_type: string
          title: string
          unlock_level?: number
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          credit_reward?: number
          description?: string
          icon_name?: string
          id?: string
          is_active?: boolean
          is_repeatable?: boolean
          max_lifetime?: number | null
          max_per_day?: number | null
          points?: number
          progress_target?: number
          task_type?: string
          title?: string
          unlock_level?: number
          updated_at?: string
        }
        Relationships: []
      }
      pending_purchases: {
        Row: {
          created_at: string
          credits_to_add: number
          customer_email: string
          expires_at: string
          id: string
          last_retry_at: string | null
          payment_status: string | null
          processed: boolean | null
          processed_at: string | null
          product_id: string
          purchase_type: string
          retry_count: number | null
          updated_at: string
          user_id: string | null
          webhook_event: string
        }
        Insert: {
          created_at?: string
          credits_to_add: number
          customer_email: string
          expires_at?: string
          id?: string
          last_retry_at?: string | null
          payment_status?: string | null
          processed?: boolean | null
          processed_at?: string | null
          product_id: string
          purchase_type: string
          retry_count?: number | null
          updated_at?: string
          user_id?: string | null
          webhook_event: string
        }
        Update: {
          created_at?: string
          credits_to_add?: number
          customer_email?: string
          expires_at?: string
          id?: string
          last_retry_at?: string | null
          payment_status?: string | null
          processed?: boolean | null
          processed_at?: string | null
          product_id?: string
          purchase_type?: string
          retry_count?: number | null
          updated_at?: string
          user_id?: string | null
          webhook_event?: string
        }
        Relationships: [
          {
            foreignKeyName: "pending_purchases_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          has_first_purchase: boolean | null
          how_discovered: string | null
          id: string
          main_goal: string | null
          occupation: string | null
          onboarding_completed_at: string | null
          referred_by_code: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          has_first_purchase?: boolean | null
          how_discovered?: string | null
          id?: string
          main_goal?: string | null
          occupation?: string | null
          onboarding_completed_at?: string | null
          referred_by_code?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          has_first_purchase?: boolean | null
          how_discovered?: string | null
          id?: string
          main_goal?: string | null
          occupation?: string | null
          onboarding_completed_at?: string | null
          referred_by_code?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      projects: {
        Row: {
          color: string | null
          created_at: string
          description: string | null
          id: string
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          color?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_restrictions: {
        Row: {
          created_at: string
          credits_used: number
          daily_credit_limit: number
          id: string
          purchase_id: string
          restriction_end_date: string
          restriction_start_date: string
          total_credits_allocated: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          credits_used?: number
          daily_credit_limit?: number
          id?: string
          purchase_id: string
          restriction_end_date: string
          restriction_start_date: string
          total_credits_allocated: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          credits_used?: number
          daily_credit_limit?: number
          id?: string
          purchase_id?: string
          restriction_end_date?: string
          restriction_start_date?: string
          total_credits_allocated?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "purchase_restrictions_purchase_id_fkey"
            columns: ["purchase_id"]
            isOneToOne: false
            referencedRelation: "purchases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_restrictions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      purchases: {
        Row: {
          amount_paid: number | null
          can_refund: boolean | null
          created_at: string
          credits_added: number
          credits_at_refund: number | null
          id: string
          payment_status: string
          product_id: string | null
          purchase_type: string
          refund_deadline: string | null
          refund_reason: string | null
          refunded_at: string | null
          subscription_id: string | null
          user_id: string
          webhook_data: Json | null
          webhook_event: string
        }
        Insert: {
          amount_paid?: number | null
          can_refund?: boolean | null
          created_at?: string
          credits_added: number
          credits_at_refund?: number | null
          id?: string
          payment_status?: string
          product_id?: string | null
          purchase_type: string
          refund_deadline?: string | null
          refund_reason?: string | null
          refunded_at?: string | null
          subscription_id?: string | null
          user_id: string
          webhook_data?: Json | null
          webhook_event: string
        }
        Update: {
          amount_paid?: number | null
          can_refund?: boolean | null
          created_at?: string
          credits_added?: number
          credits_at_refund?: number | null
          id?: string
          payment_status?: string
          product_id?: string | null
          purchase_type?: string
          refund_deadline?: string | null
          refund_reason?: string | null
          refunded_at?: string | null
          subscription_id?: string | null
          user_id?: string
          webhook_data?: Json | null
          webhook_event?: string
        }
        Relationships: [
          {
            foreignKeyName: "purchases_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchases_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      rag_documents: {
        Row: {
          agent_type: string
          category: string
          client_id: string | null
          content: string
          created_at: string
          created_by: string | null
          id: string
          is_active: boolean
          is_rag_active: boolean
          title: string
          updated_at: string
        }
        Insert: {
          agent_type?: string
          category?: string
          client_id?: string | null
          content: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          is_rag_active?: boolean
          title: string
          updated_at?: string
        }
        Update: {
          agent_type?: string
          category?: string
          client_id?: string | null
          content?: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          is_rag_active?: boolean
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "rag_documents_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      rate_limits: {
        Row: {
          action: string
          id: number
          request_count: number
          user_id: string
          window_start: string
        }
        Insert: {
          action: string
          id?: never
          request_count?: number
          user_id: string
          window_start?: string
        }
        Update: {
          action?: string
          id?: never
          request_count?: number
          user_id?: string
          window_start?: string
        }
        Relationships: [
          {
            foreignKeyName: "rate_limits_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      referral_codes: {
        Row: {
          code: string
          created_at: string
          id: string
          total_clicks: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          total_clicks?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          total_clicks?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "referral_codes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      referral_limits: {
        Row: {
          created_at: string | null
          current_month_count: number | null
          id: string
          last_reset_at: string | null
          monthly_limit: number | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          current_month_count?: number | null
          id?: string
          last_reset_at?: string | null
          monthly_limit?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          current_month_count?: number | null
          id?: string
          last_reset_at?: string | null
          monthly_limit?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "referral_limits_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      referrals: {
        Row: {
          created_at: string
          credits_awarded: number | null
          first_purchase_at: string | null
          id: string
          referral_code: string
          referred_id: string
          referrer_id: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          credits_awarded?: number | null
          first_purchase_at?: string | null
          id?: string
          referral_code: string
          referred_id: string
          referrer_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          credits_awarded?: number | null
          first_purchase_at?: string | null
          id?: string
          referral_code?: string
          referred_id?: string
          referrer_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "referrals_referred_id_fkey"
            columns: ["referred_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referrals_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      refund_events: {
        Row: {
          created_at: string
          credits_remaining: number
          credits_removed: number
          id: string
          metadata: Json | null
          processed_by: string | null
          purchase_id: string
          refund_reason: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          credits_remaining: number
          credits_removed: number
          id?: string
          metadata?: Json | null
          processed_by?: string | null
          purchase_id: string
          refund_reason?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          credits_remaining?: number
          credits_removed?: number
          id?: string
          metadata?: Json | null
          processed_by?: string | null
          purchase_id?: string
          refund_reason?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "refund_events_purchase_id_fkey"
            columns: ["purchase_id"]
            isOneToOne: false
            referencedRelation: "purchases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "refund_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      reports: {
        Row: {
          analysis_id: string | null
          client_id: string | null
          created_at: string
          id: string
          pdf_url: string | null
          review_notes: string | null
          reviewed_by: string | null
          seller_id: string | null
          sent_at: string | null
          status: string
          submission_id: string | null
        }
        Insert: {
          analysis_id?: string | null
          client_id?: string | null
          created_at?: string
          id?: string
          pdf_url?: string | null
          review_notes?: string | null
          reviewed_by?: string | null
          seller_id?: string | null
          sent_at?: string | null
          status?: string
          submission_id?: string | null
        }
        Update: {
          analysis_id?: string | null
          client_id?: string | null
          created_at?: string
          id?: string
          pdf_url?: string | null
          review_notes?: string | null
          reviewed_by?: string | null
          seller_id?: string | null
          sent_at?: string | null
          status?: string
          submission_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reports_analysis_id_fkey"
            columns: ["analysis_id"]
            isOneToOne: false
            referencedRelation: "analyses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "daily_submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      seller_scripts: {
        Row: {
          content: string
          created_at: string
          id: string
          is_active: boolean | null
          script_type: string | null
          seller_id: string | null
          tags: string[] | null
          title: string
          type: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          script_type?: string | null
          seller_id?: string | null
          tags?: string[] | null
          title: string
          type?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          script_type?: string | null
          seller_id?: string | null
          tags?: string[] | null
          title?: string
          type?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "seller_scripts_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "seller_scripts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          cancelled_at: string | null
          created_at: string
          credits_granted_this_period: number
          current_period_end: string
          current_period_start: string
          id: string
          last_payment_date: string | null
          metadata: Json | null
          monthly_credits: number
          next_billing_date: string | null
          plan_type: string
          product_id: string | null
          started_at: string
          status: string
          updated_at: string
          upgraded_at: string | null
          user_id: string
        }
        Insert: {
          cancelled_at?: string | null
          created_at?: string
          credits_granted_this_period?: number
          current_period_end: string
          current_period_start?: string
          id?: string
          last_payment_date?: string | null
          metadata?: Json | null
          monthly_credits: number
          next_billing_date?: string | null
          plan_type: string
          product_id?: string | null
          started_at?: string
          status?: string
          updated_at?: string
          upgraded_at?: string | null
          user_id: string
        }
        Update: {
          cancelled_at?: string | null
          created_at?: string
          credits_granted_this_period?: number
          current_period_end?: string
          current_period_start?: string
          id?: string
          last_payment_date?: string | null
          metadata?: Json | null
          monthly_credits?: number
          next_billing_date?: string | null
          plan_type?: string
          product_id?: string | null
          started_at?: string
          status?: string
          updated_at?: string
          upgraded_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      task_assets: {
        Row: {
          created_at: string | null
          error_message: string | null
          id: string
          mime: string
          prompt_index: number | null
          size_bytes: number | null
          task_id: string
          type: string
          url: string
        }
        Insert: {
          created_at?: string | null
          error_message?: string | null
          id?: string
          mime: string
          prompt_index?: number | null
          size_bytes?: number | null
          task_id: string
          type: string
          url: string
        }
        Update: {
          created_at?: string | null
          error_message?: string | null
          id?: string
          mime?: string
          prompt_index?: number | null
          size_bytes?: number | null
          task_id?: string
          type?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_assets_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      task_logs: {
        Row: {
          created_at: string
          data: Json | null
          id: number
          message: string | null
          step: string
          task_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          data?: Json | null
          id?: never
          message?: string | null
          step: string
          task_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          data?: Json | null
          id?: never
          message?: string | null
          step?: string
          task_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_logs_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      task_types: {
        Row: {
          auto_complete: boolean | null
          category: string | null
          created_at: string | null
          credit_reward: number | null
          description: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          max_lifetime: number | null
          max_per_day: number | null
          requires_verification: boolean | null
          slug: string
          title: string
          updated_at: string | null
          xp_reward: number | null
        }
        Insert: {
          auto_complete?: boolean | null
          category?: string | null
          created_at?: string | null
          credit_reward?: number | null
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          max_lifetime?: number | null
          max_per_day?: number | null
          requires_verification?: boolean | null
          slug: string
          title: string
          updated_at?: string | null
          xp_reward?: number | null
        }
        Update: {
          auto_complete?: boolean | null
          category?: string | null
          created_at?: string | null
          credit_reward?: number | null
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          max_lifetime?: number | null
          max_per_day?: number | null
          requires_verification?: boolean | null
          slug?: string
          title?: string
          updated_at?: string | null
          xp_reward?: number | null
        }
        Relationships: []
      }
      tasks: {
        Row: {
          created_at: string
          current_step: string | null
          error_message: string | null
          expired_at: string | null
          expires_at: string | null
          flux_images: Json | null
          id: string
          image_completed_at: string | null
          image_generated_url: string | null
          image_poll_count: number | null
          image_size_bytes: number | null
          input_image_url: string | null
          kie_image_task_id: string | null
          kie_video_tasks: Json | null
          moderation_flagged: boolean | null
          moderation_result: Json | null
          product_description: string | null
          product_name: string
          project_id: string | null
          prompt_array: Json | null
          prompt_persona: Json | null
          prompts: Json | null
          status: string
          updated_at: string
          user_id: string
          video_assets: Json | null
          video_poll_count: number | null
          videos_completed_at: string | null
        }
        Insert: {
          created_at?: string
          current_step?: string | null
          error_message?: string | null
          expired_at?: string | null
          expires_at?: string | null
          flux_images?: Json | null
          id?: string
          image_completed_at?: string | null
          image_generated_url?: string | null
          image_poll_count?: number | null
          image_size_bytes?: number | null
          input_image_url?: string | null
          kie_image_task_id?: string | null
          kie_video_tasks?: Json | null
          moderation_flagged?: boolean | null
          moderation_result?: Json | null
          product_description?: string | null
          product_name: string
          project_id?: string | null
          prompt_array?: Json | null
          prompt_persona?: Json | null
          prompts?: Json | null
          status?: string
          updated_at?: string
          user_id: string
          video_assets?: Json | null
          video_poll_count?: number | null
          videos_completed_at?: string | null
        }
        Update: {
          created_at?: string
          current_step?: string | null
          error_message?: string | null
          expired_at?: string | null
          expires_at?: string | null
          flux_images?: Json | null
          id?: string
          image_completed_at?: string | null
          image_generated_url?: string | null
          image_poll_count?: number | null
          image_size_bytes?: number | null
          input_image_url?: string | null
          kie_image_task_id?: string | null
          kie_video_tasks?: Json | null
          moderation_flagged?: boolean | null
          moderation_result?: Json | null
          product_description?: string | null
          product_name?: string
          project_id?: string | null
          prompt_array?: Json | null
          prompt_persona?: Json | null
          prompts?: Json | null
          status?: string
          updated_at?: string
          user_id?: string
          video_assets?: Json | null
          video_poll_count?: number | null
          videos_completed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      training_materials: {
        Row: {
          category: string
          client_id: string | null
          content: string
          created_at: string
          created_by: string | null
          id: string
          is_active: boolean
          title: string
        }
        Insert: {
          category?: string
          client_id?: string | null
          content: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          title: string
        }
        Update: {
          category?: string
          client_id?: string | null
          content?: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "training_materials_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      user_rewards: {
        Row: {
          badges: string[] | null
          created_at: string | null
          id: string
          titles: string[] | null
          total_credits_earned: number | null
          total_referrals: number | null
          total_tasks_completed: number | null
          updated_at: string | null
          user_id: string | null
          xp_level: number | null
          xp_total: number | null
        }
        Insert: {
          badges?: string[] | null
          created_at?: string | null
          id?: string
          titles?: string[] | null
          total_credits_earned?: number | null
          total_referrals?: number | null
          total_tasks_completed?: number | null
          updated_at?: string | null
          user_id?: string | null
          xp_level?: number | null
          xp_total?: number | null
        }
        Update: {
          badges?: string[] | null
          created_at?: string | null
          id?: string
          titles?: string[] | null
          total_credits_earned?: number | null
          total_referrals?: number | null
          total_tasks_completed?: number | null
          updated_at?: string | null
          user_id?: string | null
          xp_level?: number | null
          xp_total?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "user_rewards_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_streaks: {
        Row: {
          best_streak: number | null
          created_at: string | null
          current_streak: number | null
          freeze_count: number | null
          id: string
          last_activity_date: string | null
          streak_multiplier: number | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          best_streak?: number | null
          created_at?: string | null
          current_streak?: number | null
          freeze_count?: number | null
          id?: string
          last_activity_date?: string | null
          streak_multiplier?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          best_streak?: number | null
          created_at?: string | null
          current_streak?: number | null
          freeze_count?: number | null
          id?: string
          last_activity_date?: string | null
          streak_multiplier?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_streaks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_tasks: {
        Row: {
          claimed_at: string | null
          completed_at: string | null
          created_at: string | null
          expires_at: string | null
          id: string
          metadata: Json | null
          progress: number | null
          progress_max: number | null
          status: string | null
          task_type_id: string | null
          user_id: string | null
        }
        Insert: {
          claimed_at?: string | null
          completed_at?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          metadata?: Json | null
          progress?: number | null
          progress_max?: number | null
          status?: string | null
          task_type_id?: string | null
          user_id?: string | null
        }
        Update: {
          claimed_at?: string | null
          completed_at?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          metadata?: Json | null
          progress?: number | null
          progress_max?: number | null
          status?: string | null
          task_type_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_tasks_task_type_id_fkey"
            columns: ["task_type_id"]
            isOneToOne: false
            referencedRelation: "task_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_tasks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          client_id: string | null
          company: string | null
          created_at: string
          email: string | null
          id: string
          name: string
          phone: string | null
          role: string
          seller_type: string | null
          status: string
          updated_at: string
        }
        Insert: {
          client_id?: string | null
          company?: string | null
          created_at?: string
          email?: string | null
          id: string
          name: string
          phone?: string | null
          role?: string
          seller_type?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          client_id?: string | null
          company?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          phone?: string | null
          role?: string
          seller_type?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "users_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      weekly_analysis_reports: {
        Row: {
          admin_approved: boolean
          call_summaries: Json
          checklist_actions: Json
          client_id: string | null
          client_visible: boolean
          created_at: string
          created_by: string | null
          highlights: Json
          id: string
          improvements: Json
          metrics_summary: Json
          overall_score: number | null
          seller_id: string | null
          week_end: string
          week_start: string
        }
        Insert: {
          admin_approved?: boolean
          call_summaries?: Json
          checklist_actions?: Json
          client_id?: string | null
          client_visible?: boolean
          created_at?: string
          created_by?: string | null
          highlights?: Json
          id?: string
          improvements?: Json
          metrics_summary?: Json
          overall_score?: number | null
          seller_id?: string | null
          week_end: string
          week_start: string
        }
        Update: {
          admin_approved?: boolean
          call_summaries?: Json
          checklist_actions?: Json
          client_id?: string | null
          client_visible?: boolean
          created_at?: string
          created_by?: string | null
          highlights?: Json
          id?: string
          improvements?: Json
          metrics_summary?: Json
          overall_score?: number | null
          seller_id?: string | null
          week_end?: string
          week_start?: string
        }
        Relationships: [
          {
            foreignKeyName: "weekly_analysis_reports_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      xp_levels: {
        Row: {
          level: number
          perks: Json | null
          title: string | null
          xp_required: number
        }
        Insert: {
          level: number
          perks?: Json | null
          title?: string | null
          xp_required: number
        }
        Update: {
          level?: number
          perks?: Json | null
          title?: string | null
          xp_required?: number
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      add_credits_with_tracking: {
        Args: {
          p_amount: number
          p_available_at?: string
          p_credit_type: string
          p_description: string
          p_expires_in_months?: number
          p_source_id: string
          p_source_type: string
          p_user_id: string
        }
        Returns: string
      }
      auto_retry_pending_purchases: { Args: never; Returns: undefined }
      calculate_daily_metrics: { Args: never; Returns: undefined }
      can_use_credits_today: {
        Args: { p_credits_needed?: number; p_user_id: string }
        Returns: boolean
      }
      cancel_subscription: { Args: { p_user_id: string }; Returns: Json }
      check_device_fingerprint: {
        Args: { p_exclude_user_id?: string; p_fingerprint_hash: string }
        Returns: {
          is_reused: boolean
          reuse_count: number
          user_ids: string[]
        }[]
      }
      check_rate_limit: {
        Args: {
          p_action: string
          p_max_requests?: number
          p_user_id: string
          p_window_minutes?: number
        }
        Returns: boolean
      }
      check_referral_limit: { Args: { p_user_id: string }; Returns: Json }
      check_subscription_status: { Args: { p_user_id: string }; Returns: Json }
      claim_task: {
        Args: { p_task_type_slug: string; p_user_id: string }
        Returns: Json
      }
      cleanup_expired_pending_purchases: { Args: never; Returns: Json }
      cleanup_system_tables: { Args: never; Returns: undefined }
      complete_task: {
        Args: { p_metadata?: Json; p_task_type_slug: string; p_user_id: string }
        Returns: Json
      }
      consume_credits: {
        Args: { p_amount: number; p_description?: string; p_user_id: string }
        Returns: Json
      }
      create_audit_log: {
        Args: {
          p_action: string
          p_ip_address?: string
          p_metadata?: Json
          p_resource_id?: string
          p_resource_type?: string
          p_user_agent?: string
          p_user_id: string
        }
        Returns: number
      }
      create_or_renew_subscription: {
        Args: {
          p_plan_type: string
          p_product_id: string
          p_purchase_id?: string
          p_user_id: string
        }
        Returns: Json
      }
      create_user_from_pending_purchase: {
        Args: { p_email: string; p_pending_purchase_id: string }
        Returns: Json
      }
      deduct_credits_with_priority: {
        Args: { p_amount: number; p_user_id: string }
        Returns: Json
      }
      enqueue_task: { Args: { task_id: string }; Returns: number }
      enqueue_task_moderation: { Args: { task_id: string }; Returns: number }
      enqueue_task_openai: { Args: { task_id: string }; Returns: number }
      enqueue_task_with_delay: {
        Args: { delay_seconds?: number; task_id: string }
        Returns: number
      }
      expire_credits: { Args: never; Returns: Json }
      expire_subscriptions: { Args: never; Returns: Json }
      generate_referral_code: { Args: never; Returns: string }
      get_credit_details: { Args: { p_user_id: string }; Returns: Json }
      get_gamification_status: { Args: { p_user_id: string }; Returns: Json }
      get_maintenance_mode: { Args: never; Returns: Json }
      get_pending_purchases_summary: {
        Args: never
        Returns: {
          expiring_soon: number
          oldest_pending: string
          total_credits_pending: number
          total_pending: number
        }[]
      }
      get_refundable_purchases: {
        Args: { p_user_id: string }
        Returns: {
          created_at: string
          credits_added: number
          days_remaining: number
          purchase_id: string
          purchase_type: string
          refund_deadline: string
        }[]
      }
      increment_referral_count: {
        Args: { p_referrer_id: string }
        Returns: boolean
      }
      initialize_user_gamification: {
        Args: { p_user_id: string }
        Returns: undefined
      }
      is_email_domain_blocked: { Args: { p_email: string }; Returns: boolean }
      log_admin_activity: {
        Args: {
          p_action: string
          p_admin_id: string
          p_details?: Json
          p_ip_address?: unknown
          p_target_user_id?: string
        }
        Returns: string
      }
      pgmq_delete: {
        Args: { msg_id: number; queue_name: string }
        Returns: boolean
      }
      pgmq_read: {
        Args: { qty: number; queue_name: string; visibility_timeout: number }
        Returns: {
          enqueued_at: string
          headers: Json
          message: Json
          msg_id: number
          read_ct: number
          vt: string
        }[]
      }
      pgmq_send_with_delay: {
        Args: { delay_seconds?: number; message: Json; queue_name: string }
        Returns: number
      }
      process_pending_purchases_for_user: {
        Args: { p_user_email: string; p_user_id: string }
        Returns: Json
      }
      process_referral_bonus_on_purchase: {
        Args: { p_purchase_amount: number; p_user_id: string }
        Returns: Json
      }
      process_refund: {
        Args: {
          p_processed_by?: string
          p_purchase_id: string
          p_refund_reason?: string
        }
        Returns: Json
      }
      record_admin_metric: {
        Args: {
          p_metadata?: Json
          p_metric_date?: string
          p_metric_type: string
          p_metric_value: number
        }
        Returns: string
      }
      record_credit_usage: {
        Args: { p_credits_used: number; p_user_id: string }
        Returns: undefined
      }
      record_device_fingerprint: {
        Args: {
          p_fingerprint_hash: string
          p_ip_address?: string
          p_user_agent?: string
          p_user_id: string
        }
        Returns: string
      }
      record_fraud_signal: {
        Args: {
          p_risk_score?: number
          p_signal_type: string
          p_signal_value?: string
          p_user_id: string
        }
        Returns: string
      }
      retry_pending_purchase: {
        Args: { p_pending_purchase_id: string }
        Returns: Json
      }
      set_worker_secret: { Args: { secret: string }; Returns: undefined }
      update_user_streak: { Args: { p_user_id: string }; Returns: Json }
      upgrade_subscription: {
        Args: {
          p_new_product_id: string
          p_purchase_id?: string
          p_user_id: string
        }
        Returns: Json
      }
      validate_signup: {
        Args: {
          p_email: string
          p_fingerprint_hash?: string
          p_ip_address?: string
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
