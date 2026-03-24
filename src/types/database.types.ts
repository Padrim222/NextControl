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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      agent_conversations: {
        Row: {
          agent_type: string
          capability_used: string | null
          channel: string
          created_at: string
          id: string
          lead_context: Json | null
          messages: Json | null
          model_used: string | null
          rag_chunks_used: number | null
          seller_id: string
        }
        Insert: {
          agent_type: string
          capability_used?: string | null
          channel: string
          created_at?: string
          id?: string
          lead_context?: Json | null
          messages?: Json | null
          model_used?: string | null
          rag_chunks_used?: number | null
          seller_id: string
        }
        Update: {
          agent_type?: string
          capability_used?: string | null
          channel?: string
          created_at?: string
          id?: string
          lead_context?: Json | null
          messages?: Json | null
          model_used?: string | null
          rag_chunks_used?: number | null
          seller_id?: string
        }
        Relationships: []
      }
      agent_suggestions: {
        Row: {
          agent_type: string
          call_upload_id: string | null
          client_id: string | null
          context_note: string | null
          created_at: string
          id: string
          reviewed_at: string | null
          reviewed_by: string | null
          source: string
          status: string
          suggestion_text: string
          title: string
          user_id: string
        }
        Insert: {
          agent_type: string
          call_upload_id?: string | null
          client_id?: string | null
          context_note?: string | null
          created_at?: string
          id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          source?: string
          status?: string
          suggestion_text: string
          title: string
          user_id: string
        }
        Update: {
          agent_type?: string
          call_upload_id?: string | null
          client_id?: string | null
          context_note?: string | null
          created_at?: string
          id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          source?: string
          status?: string
          suggestion_text?: string
          title?: string
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
          created_at: string | null
          feedback_text: string
          generated_by: string | null
          id: string
          model: string | null
          report_id: string
        }
        Insert: {
          created_at?: string | null
          feedback_text: string
          generated_by?: string | null
          id?: string
          model?: string | null
          report_id: string
        }
        Update: {
          created_at?: string | null
          feedback_text?: string
          generated_by?: string | null
          id?: string
          model?: string | null
          report_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_feedback_generated_by_fkey"
            columns: ["generated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_feedback_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "daily_reports"
            referencedColumns: ["id"]
          },
        ]
      }
      analyses: {
        Row: {
          agent_type: string
          content: string
          created_at: string | null
          id: string
          improvements: string[] | null
          next_steps: string[] | null
          patterns: Json | null
          score: number | null
          strengths: string[] | null
          submission_id: string
        }
        Insert: {
          agent_type: string
          content: string
          created_at?: string | null
          id?: string
          improvements?: string[] | null
          next_steps?: string[] | null
          patterns?: Json | null
          score?: number | null
          strengths?: string[] | null
          submission_id: string
        }
        Update: {
          agent_type?: string
          content?: string
          created_at?: string | null
          id?: string
          improvements?: string[] | null
          next_steps?: string[] | null
          patterns?: Json | null
          score?: number | null
          strengths?: string[] | null
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
      call_evaluations: {
        Row: {
          ai_model: string | null
          call_log_id: string | null
          closer_id: string | null
          created_at: string | null
          duration_minutes: number | null
          feedback_detalhado: string | null
          id: string
          melhorias: string[] | null
          nivel: string | null
          pontos_fortes: string[] | null
          prospect_name: string | null
          resultado: string | null
          score_abertura: number | null
          score_apresentacao: number | null
          score_comunicacao: number | null
          score_descoberta: number | null
          score_fechamento: number | null
          score_geral: number | null
          score_objecoes: number | null
        }
        Insert: {
          ai_model?: string | null
          call_log_id?: string | null
          closer_id?: string | null
          created_at?: string | null
          duration_minutes?: number | null
          feedback_detalhado?: string | null
          id?: string
          melhorias?: string[] | null
          nivel?: string | null
          pontos_fortes?: string[] | null
          prospect_name?: string | null
          resultado?: string | null
          score_abertura?: number | null
          score_apresentacao?: number | null
          score_comunicacao?: number | null
          score_descoberta?: number | null
          score_fechamento?: number | null
          score_geral?: number | null
          score_objecoes?: number | null
        }
        Update: {
          ai_model?: string | null
          call_log_id?: string | null
          closer_id?: string | null
          created_at?: string | null
          duration_minutes?: number | null
          feedback_detalhado?: string | null
          id?: string
          melhorias?: string[] | null
          nivel?: string | null
          pontos_fortes?: string[] | null
          prospect_name?: string | null
          resultado?: string | null
          score_abertura?: number | null
          score_apresentacao?: number | null
          score_comunicacao?: number | null
          score_descoberta?: number | null
          score_fechamento?: number | null
          score_geral?: number | null
          score_objecoes?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "call_evaluations_call_log_id_fkey"
            columns: ["call_log_id"]
            isOneToOne: false
            referencedRelation: "call_logs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "call_evaluations_closer_id_fkey"
            columns: ["closer_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      call_logs: {
        Row: {
          audio_url: string | null
          call_date: string
          client_id: string
          closer_id: string
          created_at: string | null
          duration_minutes: number | null
          id: string
          notes: string | null
          outcome: string | null
          prospect_name: string | null
          transcription: string | null
        }
        Insert: {
          audio_url?: string | null
          call_date: string
          client_id: string
          closer_id: string
          created_at?: string | null
          duration_minutes?: number | null
          id?: string
          notes?: string | null
          outcome?: string | null
          prospect_name?: string | null
          transcription?: string | null
        }
        Update: {
          audio_url?: string | null
          call_date?: string
          client_id?: string
          closer_id?: string
          created_at?: string | null
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
          {
            foreignKeyName: "call_logs_closer_id_fkey"
            columns: ["closer_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      call_uploads: {
        Row: {
          admin_notes: string | null
          approved_at: string | null
          approved_by: string | null
          call_date: string | null
          client_id: string | null
          closer_id: string | null
          created_at: string | null
          duration_minutes: number | null
          evaluation_id: string | null
          folder_path: string | null
          id: string
          mp3_url: string | null
          original_url: string | null
          prospect_name: string | null
          status: string | null
          transcription_text: string | null
          upload_source: string | null
        }
        Insert: {
          admin_notes?: string | null
          approved_at?: string | null
          approved_by?: string | null
          call_date?: string | null
          client_id?: string | null
          closer_id?: string | null
          created_at?: string | null
          duration_minutes?: number | null
          evaluation_id?: string | null
          folder_path?: string | null
          id?: string
          mp3_url?: string | null
          original_url?: string | null
          prospect_name?: string | null
          status?: string | null
          transcription_text?: string | null
          upload_source?: string | null
        }
        Update: {
          admin_notes?: string | null
          approved_at?: string | null
          approved_by?: string | null
          call_date?: string | null
          client_id?: string | null
          closer_id?: string | null
          created_at?: string | null
          duration_minutes?: number | null
          evaluation_id?: string | null
          folder_path?: string | null
          id?: string
          mp3_url?: string | null
          original_url?: string | null
          prospect_name?: string | null
          status?: string | null
          transcription_text?: string | null
          upload_source?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "call_uploads_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      client_agent_configs: {
        Row: {
          agent_type: string
          client_id: string
          created_at: string
          created_by: string | null
          id: string
          is_active: boolean
          system_prompt: string
          updated_at: string
        }
        Insert: {
          agent_type: string
          client_id: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          system_prompt: string
          updated_at?: string
        }
        Update: {
          agent_type?: string
          client_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          system_prompt?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_agent_configs_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      client_materials: {
        Row: {
          agent_target: string | null
          category: string | null
          client_id: string
          created_at: string | null
          created_by: string | null
          description: string | null
          file_type: string | null
          file_url: string | null
          id: string
          is_rag_active: boolean | null
          material_type:
            | Database["public"]["Enums"]["material_type_enum"]
            | null
          processing_status: string | null
          sent_to_client: boolean | null
          title: string
        }
        Insert: {
          agent_target?: string | null
          category?: string | null
          client_id: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          file_type?: string | null
          file_url?: string | null
          id?: string
          is_rag_active?: boolean | null
          material_type?:
            | Database["public"]["Enums"]["material_type_enum"]
            | null
          processing_status?: string | null
          sent_to_client?: boolean | null
          title: string
        }
        Update: {
          agent_target?: string | null
          category?: string | null
          client_id?: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          file_type?: string | null
          file_url?: string | null
          id?: string
          is_rag_active?: boolean | null
          material_type?:
            | Database["public"]["Enums"]["material_type_enum"]
            | null
          processing_status?: string | null
          sent_to_client?: boolean | null
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
          created_at: string
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
          rag_document_id: string | null
          raw_data: Json
          sales_cycle: string | null
          sales_process: string | null
          segment: string | null
          submitted_at: string
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
          created_at?: string
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
          rag_document_id?: string | null
          raw_data?: Json
          sales_cycle?: string | null
          sales_process?: string | null
          segment?: string | null
          submitted_at?: string
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
          created_at?: string
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
          rag_document_id?: string | null
          raw_data?: Json
          sales_cycle?: string | null
          sales_process?: string | null
          segment?: string | null
          submitted_at?: string
          successful_message_example?: string | null
          transformation?: string | null
          user_id?: string
          years_in_market?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "client_onboarding_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_onboarding_rag_document_id_fkey"
            columns: ["rag_document_id"]
            isOneToOne: false
            referencedRelation: "client_materials"
            referencedColumns: ["id"]
          },
        ]
      }
      client_questions: {
        Row: {
          asked_by: string
          client_id: string
          created_at: string | null
          escalated_to: string | null
          id: string
          question_text: string
          responded_at: string | null
          responded_by: string | null
          response_text: string | null
          status: string | null
        }
        Insert: {
          asked_by: string
          client_id: string
          created_at?: string | null
          escalated_to?: string | null
          id?: string
          question_text: string
          responded_at?: string | null
          responded_by?: string | null
          response_text?: string | null
          status?: string | null
        }
        Update: {
          asked_by?: string
          client_id?: string
          created_at?: string | null
          escalated_to?: string | null
          id?: string
          question_text?: string
          responded_at?: string | null
          responded_by?: string | null
          response_text?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "client_questions_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_questions_responded_by_fkey"
            columns: ["responded_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          assigned_closer_id: string | null
          assigned_seller_id: string | null
          company: string | null
          created_at: string | null
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
          status: string | null
          team_status: string | null
        }
        Insert: {
          assigned_closer_id?: string | null
          assigned_seller_id?: string | null
          company?: string | null
          created_at?: string | null
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
          status?: string | null
          team_status?: string | null
        }
        Update: {
          assigned_closer_id?: string | null
          assigned_seller_id?: string | null
          company?: string | null
          created_at?: string | null
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
          status?: string | null
          team_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clients_assigned_closer_id_fkey"
            columns: ["assigned_closer_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clients_assigned_seller_id_fkey"
            columns: ["assigned_seller_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      coach_interactions: {
        Row: {
          answer: string | null
          context: Json | null
          created_at: string | null
          id: string
          question: string
          seller_id: string
        }
        Insert: {
          answer?: string | null
          context?: Json | null
          created_at?: string | null
          id?: string
          question: string
          seller_id: string
        }
        Update: {
          answer?: string | null
          context?: Json | null
          created_at?: string | null
          id?: string
          question?: string
          seller_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "coach_interactions_seller_id_fkey"
            columns: ["seller_id"]
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
      daily_reports: {
        Row: {
          boas_vindas: number | null
          capturas: number | null
          chat_ativo: number | null
          client_id: string
          conexoes: number | null
          created_at: string | null
          followups: number | null
          id: string
          mapeamentos: number | null
          notes: string | null
          nutricao: number | null
          pitchs: number | null
          reaquecimento: number | null
          report_date: string
          seller_id: string
          status: string | null
        }
        Insert: {
          boas_vindas?: number | null
          capturas?: number | null
          chat_ativo?: number | null
          client_id: string
          conexoes?: number | null
          created_at?: string | null
          followups?: number | null
          id?: string
          mapeamentos?: number | null
          notes?: string | null
          nutricao?: number | null
          pitchs?: number | null
          reaquecimento?: number | null
          report_date: string
          seller_id: string
          status?: string | null
        }
        Update: {
          boas_vindas?: number | null
          capturas?: number | null
          chat_ativo?: number | null
          client_id?: string
          conexoes?: number | null
          created_at?: string | null
          followups?: number | null
          id?: string
          mapeamentos?: number | null
          notes?: string | null
          nutricao?: number | null
          pitchs?: number | null
          reaquecimento?: number | null
          report_date?: string
          seller_id?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "daily_reports_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daily_reports_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_submissions: {
        Row: {
          call_recording: string | null
          conversation_prints: string[] | null
          created_at: string | null
          id: string
          metrics: Json | null
          notes: string | null
          pasted_messages: string | null
          seller_id: string
          status: string | null
          submission_date: string
        }
        Insert: {
          call_recording?: string | null
          conversation_prints?: string[] | null
          created_at?: string | null
          id?: string
          metrics?: Json | null
          notes?: string | null
          pasted_messages?: string | null
          seller_id: string
          status?: string | null
          submission_date?: string
        }
        Update: {
          call_recording?: string | null
          conversation_prints?: string[] | null
          created_at?: string | null
          id?: string
          metrics?: Json | null
          notes?: string | null
          pasted_messages?: string | null
          seller_id?: string
          status?: string | null
          submission_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "daily_submissions_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      feature_flags: {
        Row: {
          client_ids: string[] | null
          created_at: string | null
          description: string | null
          flag_key: string
          id: string
          is_enabled: boolean | null
          updated_at: string | null
        }
        Insert: {
          client_ids?: string[] | null
          created_at?: string | null
          description?: string | null
          flag_key: string
          id?: string
          is_enabled?: boolean | null
          updated_at?: string | null
        }
        Update: {
          client_ids?: string[] | null
          created_at?: string | null
          description?: string | null
          flag_key?: string
          id?: string
          is_enabled?: boolean | null
          updated_at?: string | null
        }
        Relationships: []
      }
      form_submissions: {
        Row: {
          ai_analysis_id: string | null
          ai_score: number | null
          ai_status: string | null
          attachments: string[] | null
          client_id: string | null
          created_at: string | null
          data: Json
          form_type: Database["public"]["Enums"]["form_type"]
          id: string
          submission_date: string
          submitter_email: string | null
          submitter_name: string
          submitter_phone: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          ai_analysis_id?: string | null
          ai_score?: number | null
          ai_status?: string | null
          attachments?: string[] | null
          client_id?: string | null
          created_at?: string | null
          data?: Json
          form_type: Database["public"]["Enums"]["form_type"]
          id?: string
          submission_date?: string
          submitter_email?: string | null
          submitter_name: string
          submitter_phone?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          ai_analysis_id?: string | null
          ai_score?: number | null
          ai_status?: string | null
          attachments?: string[] | null
          client_id?: string | null
          created_at?: string | null
          data?: Json
          form_type?: Database["public"]["Enums"]["form_type"]
          id?: string
          submission_date?: string
          submitter_email?: string | null
          submitter_name?: string
          submitter_phone?: string | null
          updated_at?: string | null
          user_id?: string | null
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
      head_agent_analysis: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          call_log_id: string | null
          correct_product_offered: boolean | null
          created_at: string | null
          errors_identified: string | null
          id: string
          methodology_followed: boolean | null
          new_strategies: string | null
          operational_notes: string | null
          organization_score: number | null
          report_id: string | null
          response_time_score: number | null
          script_adherence_score: number | null
          sent_at: string | null
          sent_via_whatsapp: boolean | null
          status: string | null
          suggested_scripts: string | null
          tactical_notes: string | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          call_log_id?: string | null
          correct_product_offered?: boolean | null
          created_at?: string | null
          errors_identified?: string | null
          id?: string
          methodology_followed?: boolean | null
          new_strategies?: string | null
          operational_notes?: string | null
          organization_score?: number | null
          report_id?: string | null
          response_time_score?: number | null
          script_adherence_score?: number | null
          sent_at?: string | null
          sent_via_whatsapp?: boolean | null
          status?: string | null
          suggested_scripts?: string | null
          tactical_notes?: string | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          call_log_id?: string | null
          correct_product_offered?: boolean | null
          created_at?: string | null
          errors_identified?: string | null
          id?: string
          methodology_followed?: boolean | null
          new_strategies?: string | null
          operational_notes?: string | null
          organization_score?: number | null
          report_id?: string | null
          response_time_score?: number | null
          script_adherence_score?: number | null
          sent_at?: string | null
          sent_via_whatsapp?: boolean | null
          status?: string | null
          suggested_scripts?: string | null
          tactical_notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "head_agent_analysis_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "head_agent_analysis_call_log_id_fkey"
            columns: ["call_log_id"]
            isOneToOne: false
            referencedRelation: "call_logs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "head_agent_analysis_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "daily_reports"
            referencedColumns: ["id"]
          },
        ]
      }
      improvement_checklists: {
        Row: {
          analysis_id: string
          closer_id: string | null
          created_at: string | null
          id: string
          items: Json
          seller_id: string | null
          title: string
        }
        Insert: {
          analysis_id: string
          closer_id?: string | null
          created_at?: string | null
          id?: string
          items?: Json
          seller_id?: string | null
          title: string
        }
        Update: {
          analysis_id?: string
          closer_id?: string | null
          created_at?: string | null
          id?: string
          items?: Json
          seller_id?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "improvement_checklists_analysis_id_fkey"
            columns: ["analysis_id"]
            isOneToOne: false
            referencedRelation: "head_agent_analysis"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "improvement_checklists_closer_id_fkey"
            columns: ["closer_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "improvement_checklists_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      material_chunks: {
        Row: {
          chunk_index: number
          content: string
          created_at: string
          embedding: string | null
          id: string
          material_id: string | null
        }
        Insert: {
          chunk_index: number
          content: string
          created_at?: string
          embedding?: string | null
          id?: string
          material_id?: string | null
        }
        Update: {
          chunk_index?: number
          content?: string
          created_at?: string
          embedding?: string | null
          id?: string
          material_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "material_chunks_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "client_materials"
            referencedColumns: ["id"]
          },
        ]
      }
      rag_documents: {
        Row: {
          agent_type: string | null
          category: string
          client_id: string | null
          content: string
          created_at: string | null
          created_by: string | null
          embedding: string | null
          id: string
          is_active: boolean | null
          metadata: Json | null
          title: string
          updated_at: string | null
        }
        Insert: {
          agent_type?: string | null
          category: string
          client_id?: string | null
          content: string
          created_at?: string | null
          created_by?: string | null
          embedding?: string | null
          id?: string
          is_active?: boolean | null
          metadata?: Json | null
          title: string
          updated_at?: string | null
        }
        Update: {
          agent_type?: string | null
          category?: string
          client_id?: string | null
          content?: string
          created_at?: string | null
          created_by?: string | null
          embedding?: string | null
          id?: string
          is_active?: boolean | null
          metadata?: Json | null
          title?: string
          updated_at?: string | null
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
      reports: {
        Row: {
          analysis_id: string | null
          created_at: string | null
          id: string
          pdf_url: string | null
          review_notes: string | null
          reviewed_by: string | null
          seller_id: string
          sent_at: string | null
          status: string | null
          submission_id: string | null
        }
        Insert: {
          analysis_id?: string | null
          created_at?: string | null
          id?: string
          pdf_url?: string | null
          review_notes?: string | null
          reviewed_by?: string | null
          seller_id: string
          sent_at?: string | null
          status?: string | null
          submission_id?: string | null
        }
        Update: {
          analysis_id?: string | null
          created_at?: string | null
          id?: string
          pdf_url?: string | null
          review_notes?: string | null
          reviewed_by?: string | null
          seller_id?: string
          sent_at?: string | null
          status?: string | null
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
          name: string
          script_type: string
          seller_id: string
          type: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          name: string
          script_type: string
          seller_id: string
          type?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          name?: string
          script_type?: string
          seller_id?: string
          type?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "seller_scripts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      strategy_log: {
        Row: {
          created_at: string | null
          discarded: boolean | null
          id: string
          impact_score: number | null
          reason: string | null
          response_rate: number | null
          seller_id: string
          source: string | null
          strategy_description: string
          tested_week: string | null
        }
        Insert: {
          created_at?: string | null
          discarded?: boolean | null
          id?: string
          impact_score?: number | null
          reason?: string | null
          response_rate?: number | null
          seller_id: string
          source?: string | null
          strategy_description: string
          tested_week?: string | null
        }
        Update: {
          created_at?: string | null
          discarded?: boolean | null
          id?: string
          impact_score?: number | null
          reason?: string | null
          response_rate?: number | null
          seller_id?: string
          source?: string | null
          strategy_description?: string
          tested_week?: string | null
        }
        Relationships: []
      }
      training_materials: {
        Row: {
          category: string
          content: string
          created_at: string | null
          id: string
          is_active: boolean | null
          source_analysis_id: string | null
          target_role: string | null
          title: string
        }
        Insert: {
          category: string
          content: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          source_analysis_id?: string | null
          target_role?: string | null
          title: string
        }
        Update: {
          category?: string
          content?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          source_analysis_id?: string | null
          target_role?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "training_materials_source_analysis_id_fkey"
            columns: ["source_analysis_id"]
            isOneToOne: false
            referencedRelation: "head_agent_analysis"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          client_id: string | null
          company: string | null
          created_at: string | null
          cs_id: string | null
          email: string
          id: string
          name: string
          phone: string | null
          role: string
          seller_type: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          client_id?: string | null
          company?: string | null
          created_at?: string | null
          cs_id?: string | null
          email: string
          id?: string
          name: string
          phone?: string | null
          role: string
          seller_type?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          client_id?: string | null
          company?: string | null
          created_at?: string | null
          cs_id?: string | null
          email?: string
          id?: string
          name?: string
          phone?: string | null
          role?: string
          seller_type?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "users_cs_id_fkey"
            columns: ["cs_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      weekly_analysis_reports: {
        Row: {
          admin_approved: boolean | null
          call_summaries: Json | null
          checklist_actions: Json | null
          client_id: string | null
          client_visible: boolean | null
          created_at: string | null
          created_by: string | null
          highlights: string[] | null
          id: string
          improvements: string[] | null
          metrics_summary: Json | null
          overall_score: number | null
          pdf_url: string | null
          seller_id: string | null
          week_end: string
          week_start: string
        }
        Insert: {
          admin_approved?: boolean | null
          call_summaries?: Json | null
          checklist_actions?: Json | null
          client_id?: string | null
          client_visible?: boolean | null
          created_at?: string | null
          created_by?: string | null
          highlights?: string[] | null
          id?: string
          improvements?: string[] | null
          metrics_summary?: Json | null
          overall_score?: number | null
          pdf_url?: string | null
          seller_id?: string | null
          week_end: string
          week_start: string
        }
        Update: {
          admin_approved?: boolean | null
          call_summaries?: Json | null
          checklist_actions?: Json | null
          client_id?: string | null
          client_visible?: boolean | null
          created_at?: string | null
          created_by?: string | null
          highlights?: string[] | null
          id?: string
          improvements?: string[] | null
          metrics_summary?: Json | null
          overall_score?: number | null
          pdf_url?: string | null
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
      weekly_reports: {
        Row: {
          client_id: string
          conv_bv_to_conexao: number | null
          conv_conexao_to_map: number | null
          conv_map_to_pitch: number | null
          conv_pitch_to_captura: number | null
          created_at: string | null
          id: string
          summary: string | null
          total_boas_vindas: number | null
          total_capturas: number | null
          total_chat_ativo: number | null
          total_conexoes: number | null
          total_mapeamentos: number | null
          total_pitchs: number | null
          week_end: string
          week_start: string
        }
        Insert: {
          client_id: string
          conv_bv_to_conexao?: number | null
          conv_conexao_to_map?: number | null
          conv_map_to_pitch?: number | null
          conv_pitch_to_captura?: number | null
          created_at?: string | null
          id?: string
          summary?: string | null
          total_boas_vindas?: number | null
          total_capturas?: number | null
          total_chat_ativo?: number | null
          total_conexoes?: number | null
          total_mapeamentos?: number | null
          total_pitchs?: number | null
          week_end: string
          week_start: string
        }
        Update: {
          client_id?: string
          conv_bv_to_conexao?: number | null
          conv_conexao_to_map?: number | null
          conv_map_to_pitch?: number | null
          conv_pitch_to_captura?: number | null
          created_at?: string | null
          id?: string
          summary?: string | null
          total_boas_vindas?: number | null
          total_capturas?: number | null
          total_chat_ativo?: number | null
          total_conexoes?: number | null
          total_mapeamentos?: number | null
          total_pitchs?: number | null
          week_end?: string
          week_start?: string
        }
        Relationships: [
          {
            foreignKeyName: "weekly_reports_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_my_client_id: { Args: never; Returns: string }
      get_my_role: { Args: never; Returns: string }
      get_seller_daily_delta: {
        Args: { p_seller_id: string }
        Returns: {
          delta: Json
          today_metrics: Json
          yesterday_metrics: Json
        }[]
      }
      match_documents: {
        Args: {
          filter_category?: string
          match_count?: number
          match_threshold?: number
          query_embedding: string
        }
        Returns: {
          category: string
          content: string
          id: string
          metadata: Json
          similarity: number
          title: string
        }[]
      }
      match_materials: {
        Args: {
          match_count: number
          match_threshold: number
          p_seller_id: string
          query_embedding: string
        }
        Returns: {
          content: string
          id: string
          material_id: string
          material_type: Database["public"]["Enums"]["material_type_enum"]
          similarity: number
        }[]
      }
      match_rag_documents: {
        Args: {
          match_count?: number
          match_threshold?: number
          p_agent_type?: string
          p_client_id?: string
          query_embedding: string
        }
        Returns: {
          agent_type: string
          category: string
          content: string
          id: string
          similarity: number
          title: string
        }[]
      }
    }
    Enums: {
      form_type: "expert_weekly" | "seller_daily" | "closer_daily"
      material_type_enum: "metodologia_master" | "produto_cliente"
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
    Enums: {
      form_type: ["expert_weekly", "seller_daily", "closer_daily"],
      material_type_enum: ["metodologia_master", "produto_cliente"],
    },
  },
} as const
