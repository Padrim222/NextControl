-- =============================================================================
-- Migration: 20260313150000_rls_policies
-- Description: Consolidated RLS policies for all tables — client_id isolation.
--
-- RULES:
--   admin / cs — full access to everything
--   seller / closer / client — see only data belonging to their own client_id
--   Nobody sees data from another client
--
-- NOTE: ALTER TABLE ... ENABLE ROW LEVEL SECURITY is idempotent (safe to repeat).
--       All DROP POLICY IF EXISTS guards prevent duplicate-policy errors.
-- =============================================================================


-- =============================================================================
-- TABLE: users
-- Special handling: no client_id column on this table itself;
-- scoping is done via the client_id column that belongs to each user row.
-- =============================================================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_all_users"       ON public.users;
DROP POLICY IF EXISTS "user_read_self"        ON public.users;
DROP POLICY IF EXISTS "same_client_users"     ON public.users;
-- Drop legacy policies from earlier migrations
DROP POLICY IF EXISTS "users_select_own"      ON public.users;
DROP POLICY IF EXISTS "users_select_admin_cs" ON public.users;
DROP POLICY IF EXISTS "users_write_admin"     ON public.users;
DROP POLICY IF EXISTS "users_write_cs"        ON public.users;
DROP POLICY IF EXISTS "Users read own profile"   ON public.users;
DROP POLICY IF EXISTS "Users update own profile" ON public.users;

-- Admin/CS: full access to all users
CREATE POLICY "admin_all_users" ON public.users
    FOR ALL TO authenticated
    USING (
        EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role IN ('admin', 'cs'))
    )
    WITH CHECK (
        EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role IN ('admin', 'cs'))
    );

-- Any authenticated user can read their own record
CREATE POLICY "user_read_self" ON public.users
    FOR SELECT TO authenticated
    USING (id = auth.uid());

-- Users can see others who share the same client_id (team visibility)
CREATE POLICY "same_client_users" ON public.users
    FOR SELECT TO authenticated
    USING (
        client_id IS NOT NULL
        AND client_id = (SELECT u.client_id FROM public.users u WHERE u.id = auth.uid())
    );


-- =============================================================================
-- TABLE: clients
-- Clients table is identified by its own primary key (id).
-- Users with role='client' are linked via users.client_id = clients.id.
-- =============================================================================
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_all_clients"           ON public.clients;
DROP POLICY IF EXISTS "user_own_client"             ON public.clients;
-- Drop legacy policies
DROP POLICY IF EXISTS "clients_all_admin_cs"        ON public.clients;
DROP POLICY IF EXISTS "clients_select_seller"       ON public.clients;
DROP POLICY IF EXISTS "clients_select_closer"       ON public.clients;
DROP POLICY IF EXISTS "clients_select_own_client"   ON public.clients;
DROP POLICY IF EXISTS "clients_select_seller_scoped" ON public.clients;
DROP POLICY IF EXISTS "clients_select_closer_scoped" ON public.clients;

-- Admin/CS: full access to all clients
CREATE POLICY "admin_all_clients" ON public.clients
    FOR ALL TO authenticated
    USING (
        EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role IN ('admin', 'cs'))
    )
    WITH CHECK (
        EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role IN ('admin', 'cs'))
    );

-- Sellers/Closers/Clients: read only their own client record
CREATE POLICY "user_own_client" ON public.clients
    FOR SELECT TO authenticated
    USING (
        id = (SELECT u.client_id FROM public.users u WHERE u.id = auth.uid())
    );


-- =============================================================================
-- TABLE: client_materials
-- Has direct client_id column.
-- =============================================================================
ALTER TABLE public.client_materials ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_all_client_materials"              ON public.client_materials;
DROP POLICY IF EXISTS "client_scope_client_materials"           ON public.client_materials;
DROP POLICY IF EXISTS "client_scope_insert_client_materials"    ON public.client_materials;
DROP POLICY IF EXISTS "client_scope_update_client_materials"    ON public.client_materials;
-- Drop legacy policies
DROP POLICY IF EXISTS "client_materials_all_admin_cs"           ON public.client_materials;
DROP POLICY IF EXISTS "client_materials_select_seller"          ON public.client_materials;
DROP POLICY IF EXISTS "client_materials_select_closer"          ON public.client_materials;
DROP POLICY IF EXISTS "client_materials_select_own_client"      ON public.client_materials;
DROP POLICY IF EXISTS "client_materials_insert_own_client"      ON public.client_materials;
DROP POLICY IF EXISTS "client_materials_select_seller_scoped"   ON public.client_materials;
DROP POLICY IF EXISTS "client_materials_select_closer_scoped"   ON public.client_materials;

-- Admin/CS: full access
CREATE POLICY "admin_all_client_materials" ON public.client_materials
    FOR ALL TO authenticated
    USING (
        EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role IN ('admin', 'cs'))
    )
    WITH CHECK (
        EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role IN ('admin', 'cs'))
    );

-- Read: only data belonging to the user's own client_id
CREATE POLICY "client_scope_client_materials" ON public.client_materials
    FOR SELECT TO authenticated
    USING (
        client_id = (SELECT u.client_id FROM public.users u WHERE u.id = auth.uid())
    );

-- Insert: only into the user's own client bucket
CREATE POLICY "client_scope_insert_client_materials" ON public.client_materials
    FOR INSERT TO authenticated
    WITH CHECK (
        client_id = (SELECT u.client_id FROM public.users u WHERE u.id = auth.uid())
    );

-- Update: only own client's materials
CREATE POLICY "client_scope_update_client_materials" ON public.client_materials
    FOR UPDATE TO authenticated
    USING (
        client_id = (SELECT u.client_id FROM public.users u WHERE u.id = auth.uid())
    );


-- =============================================================================
-- TABLE: content_outputs
-- Has direct client_id column.
-- =============================================================================
ALTER TABLE public.content_outputs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_all_content_outputs"           ON public.content_outputs;
DROP POLICY IF EXISTS "client_scope_content_outputs"        ON public.content_outputs;
DROP POLICY IF EXISTS "client_scope_insert_content_outputs" ON public.content_outputs;
DROP POLICY IF EXISTS "client_scope_update_content_outputs" ON public.content_outputs;
-- Drop legacy policies
DROP POLICY IF EXISTS "content_outputs_all_admin_cs"            ON public.content_outputs;
DROP POLICY IF EXISTS "content_outputs_select_seller"           ON public.content_outputs;
DROP POLICY IF EXISTS "content_outputs_select_closer"           ON public.content_outputs;
DROP POLICY IF EXISTS "content_outputs_select_own_client"       ON public.content_outputs;
DROP POLICY IF EXISTS "content_outputs_select_seller_scoped"    ON public.content_outputs;
DROP POLICY IF EXISTS "content_outputs_select_closer_scoped"    ON public.content_outputs;

-- Admin/CS: full access
CREATE POLICY "admin_all_content_outputs" ON public.content_outputs
    FOR ALL TO authenticated
    USING (
        EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role IN ('admin', 'cs'))
    )
    WITH CHECK (
        EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role IN ('admin', 'cs'))
    );

-- Read: only own client's outputs
CREATE POLICY "client_scope_content_outputs" ON public.content_outputs
    FOR SELECT TO authenticated
    USING (
        client_id = (SELECT u.client_id FROM public.users u WHERE u.id = auth.uid())
    );

-- Insert: only into own client bucket
CREATE POLICY "client_scope_insert_content_outputs" ON public.content_outputs
    FOR INSERT TO authenticated
    WITH CHECK (
        client_id = (SELECT u.client_id FROM public.users u WHERE u.id = auth.uid())
    );

-- Update: only own client's outputs
CREATE POLICY "client_scope_update_content_outputs" ON public.content_outputs
    FOR UPDATE TO authenticated
    USING (
        client_id = (SELECT u.client_id FROM public.users u WHERE u.id = auth.uid())
    );


-- =============================================================================
-- TABLE: call_uploads
-- Has direct client_id column. Closers also have a closer_id column.
-- =============================================================================
ALTER TABLE public.call_uploads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_all_call_uploads"           ON public.call_uploads;
DROP POLICY IF EXISTS "client_scope_call_uploads"        ON public.call_uploads;
DROP POLICY IF EXISTS "client_scope_insert_call_uploads" ON public.call_uploads;
DROP POLICY IF EXISTS "client_scope_update_call_uploads" ON public.call_uploads;
-- Drop legacy policies
DROP POLICY IF EXISTS "call_uploads_all_admin_cs"            ON public.call_uploads;
DROP POLICY IF EXISTS "call_uploads_select_seller"           ON public.call_uploads;
DROP POLICY IF EXISTS "call_uploads_select_closer"           ON public.call_uploads;
DROP POLICY IF EXISTS "call_uploads_insert_closer"           ON public.call_uploads;
DROP POLICY IF EXISTS "call_uploads_select_own_client"       ON public.call_uploads;
DROP POLICY IF EXISTS "call_uploads_select_seller_scoped"    ON public.call_uploads;
DROP POLICY IF EXISTS "call_uploads_select_closer_scoped"    ON public.call_uploads;
DROP POLICY IF EXISTS "call_uploads_insert_closer_scoped"    ON public.call_uploads;
DROP POLICY IF EXISTS "Closer read own call_uploads"         ON public.call_uploads;
DROP POLICY IF EXISTS "Closer insert call_uploads"           ON public.call_uploads;
DROP POLICY IF EXISTS "Admin update call_uploads"            ON public.call_uploads;

-- Admin/CS: full access
CREATE POLICY "admin_all_call_uploads" ON public.call_uploads
    FOR ALL TO authenticated
    USING (
        EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role IN ('admin', 'cs'))
    )
    WITH CHECK (
        EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role IN ('admin', 'cs'))
    );

-- Read: only own client's uploads
CREATE POLICY "client_scope_call_uploads" ON public.call_uploads
    FOR SELECT TO authenticated
    USING (
        client_id = (SELECT u.client_id FROM public.users u WHERE u.id = auth.uid())
    );

-- Insert: closers can upload for their own client_id
CREATE POLICY "client_scope_insert_call_uploads" ON public.call_uploads
    FOR INSERT TO authenticated
    WITH CHECK (
        client_id = (SELECT u.client_id FROM public.users u WHERE u.id = auth.uid())
        AND EXISTS (
            SELECT 1 FROM public.users u
            WHERE u.id = auth.uid() AND u.role IN ('closer', 'admin', 'cs')
        )
    );

-- Update: within own client scope (admin/cs can always update via admin policy above)
CREATE POLICY "client_scope_update_call_uploads" ON public.call_uploads
    FOR UPDATE TO authenticated
    USING (
        client_id = (SELECT u.client_id FROM public.users u WHERE u.id = auth.uid())
    );


-- =============================================================================
-- TABLE: call_logs
-- Has direct client_id column. Also has closer_id.
-- =============================================================================
ALTER TABLE public.call_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_all_call_logs"    ON public.call_logs;
DROP POLICY IF EXISTS "client_scope_call_logs" ON public.call_logs;
-- Drop legacy policies
DROP POLICY IF EXISTS "Closer read own call_logs" ON public.call_logs;

-- Admin/CS: full access
CREATE POLICY "admin_all_call_logs" ON public.call_logs
    FOR ALL TO authenticated
    USING (
        EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role IN ('admin', 'cs'))
    )
    WITH CHECK (
        EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role IN ('admin', 'cs'))
    );

-- Sellers/Closers: read only their own client's call logs
CREATE POLICY "client_scope_call_logs" ON public.call_logs
    FOR SELECT TO authenticated
    USING (
        client_id = (SELECT u.client_id FROM public.users u WHERE u.id = auth.uid())
    );

-- Closers: insert call logs for their own client
CREATE POLICY "client_scope_insert_call_logs" ON public.call_logs
    FOR INSERT TO authenticated
    WITH CHECK (
        client_id = (SELECT u.client_id FROM public.users u WHERE u.id = auth.uid())
        AND EXISTS (
            SELECT 1 FROM public.users u
            WHERE u.id = auth.uid() AND u.role IN ('closer', 'admin', 'cs')
        )
    );


-- =============================================================================
-- TABLE: call_evaluations
-- No client_id directly — scoped via closer_id (the closer belongs to a client).
-- =============================================================================
ALTER TABLE public.call_evaluations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_all_call_evaluations"    ON public.call_evaluations;
DROP POLICY IF EXISTS "client_scope_call_evaluations" ON public.call_evaluations;
-- Drop legacy policies
DROP POLICY IF EXISTS "Closer read own evaluations" ON public.call_evaluations;

-- Admin/CS: full access
CREATE POLICY "admin_all_call_evaluations" ON public.call_evaluations
    FOR ALL TO authenticated
    USING (
        EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role IN ('admin', 'cs'))
    )
    WITH CHECK (
        EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role IN ('admin', 'cs'))
    );

-- Sellers/Closers: read evaluations of closers belonging to their same client
-- (closer_id references auth.users, so we join via public.users to check client_id)
CREATE POLICY "client_scope_call_evaluations" ON public.call_evaluations
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users closer_user
            WHERE closer_user.id = call_evaluations.closer_id
              AND closer_user.client_id = (SELECT u.client_id FROM public.users u WHERE u.id = auth.uid())
        )
    );


-- =============================================================================
-- TABLE: daily_submissions
-- Has direct client_id column. Also has seller_id.
-- =============================================================================
ALTER TABLE public.daily_submissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_all_daily_submissions"    ON public.daily_submissions;
DROP POLICY IF EXISTS "client_scope_daily_submissions" ON public.daily_submissions;
DROP POLICY IF EXISTS "client_scope_insert_daily_submissions" ON public.daily_submissions;
-- Drop legacy policies
DROP POLICY IF EXISTS "Seller read own submissions"  ON public.daily_submissions;
DROP POLICY IF EXISTS "Seller insert submissions"    ON public.daily_submissions;

-- Admin/CS: full access
CREATE POLICY "admin_all_daily_submissions" ON public.daily_submissions
    FOR ALL TO authenticated
    USING (
        EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role IN ('admin', 'cs'))
    )
    WITH CHECK (
        EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role IN ('admin', 'cs'))
    );

-- Read: only own client's submissions
CREATE POLICY "client_scope_daily_submissions" ON public.daily_submissions
    FOR SELECT TO authenticated
    USING (
        client_id = (SELECT u.client_id FROM public.users u WHERE u.id = auth.uid())
    );

-- Insert: sellers insert only for their own client
CREATE POLICY "client_scope_insert_daily_submissions" ON public.daily_submissions
    FOR INSERT TO authenticated
    WITH CHECK (
        seller_id = auth.uid()
        AND client_id = (SELECT u.client_id FROM public.users u WHERE u.id = auth.uid())
    );


-- =============================================================================
-- TABLE: analyses
-- No client_id directly — scoped via submission_id → daily_submissions.client_id
-- =============================================================================
ALTER TABLE public.analyses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_all_analyses"    ON public.analyses;
DROP POLICY IF EXISTS "client_scope_analyses" ON public.analyses;
-- Drop legacy policies
DROP POLICY IF EXISTS "Seller read own analyses" ON public.analyses;

-- Admin/CS: full access
CREATE POLICY "admin_all_analyses" ON public.analyses
    FOR ALL TO authenticated
    USING (
        EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role IN ('admin', 'cs'))
    )
    WITH CHECK (
        EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role IN ('admin', 'cs'))
    );

-- Sellers/Closers/Clients: read analyses scoped to their client via daily_submissions
CREATE POLICY "client_scope_analyses" ON public.analyses
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.daily_submissions ds
            WHERE ds.id = analyses.submission_id
              AND ds.client_id = (SELECT u.client_id FROM public.users u WHERE u.id = auth.uid())
        )
    );


-- =============================================================================
-- TABLE: weekly_analysis_reports
-- Has direct client_id column.
-- =============================================================================
ALTER TABLE public.weekly_analysis_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_all_weekly_reports"    ON public.weekly_analysis_reports;
DROP POLICY IF EXISTS "client_scope_weekly_reports" ON public.weekly_analysis_reports;
-- Drop legacy policies
DROP POLICY IF EXISTS "Admin read weekly reports" ON public.weekly_analysis_reports;

-- Admin/CS: full access
CREATE POLICY "admin_all_weekly_reports" ON public.weekly_analysis_reports
    FOR ALL TO authenticated
    USING (
        EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role IN ('admin', 'cs'))
    )
    WITH CHECK (
        EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role IN ('admin', 'cs'))
    );

-- Sellers/Closers/Clients: read only own client's reports (published flag respected by app layer)
CREATE POLICY "client_scope_weekly_reports" ON public.weekly_analysis_reports
    FOR SELECT TO authenticated
    USING (
        client_id = (SELECT u.client_id FROM public.users u WHERE u.id = auth.uid())
        AND client_visible = true
    );


-- =============================================================================
-- TABLE: ai_feedback
-- No client_id or direct scoping column — references daily_reports (legacy table).
-- Access: admin/cs full, sellers read own via generated_by.
-- =============================================================================
ALTER TABLE public.ai_feedback ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_all_ai_feedback"    ON public.ai_feedback;
DROP POLICY IF EXISTS "user_scope_ai_feedback"   ON public.ai_feedback;

-- Admin/CS: full access
CREATE POLICY "admin_all_ai_feedback" ON public.ai_feedback
    FOR ALL TO authenticated
    USING (
        EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role IN ('admin', 'cs'))
    )
    WITH CHECK (
        EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role IN ('admin', 'cs'))
    );

-- Users: read feedback generated for them (generated_by = auth.uid() or report_id matches their reports)
CREATE POLICY "user_scope_ai_feedback" ON public.ai_feedback
    FOR SELECT TO authenticated
    USING (generated_by = auth.uid());


-- =============================================================================
-- TABLE: agent_suggestions
-- Has direct client_id column. Also has user_id.
-- =============================================================================
ALTER TABLE public.agent_suggestions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_all_agent_suggestions"    ON public.agent_suggestions;
DROP POLICY IF EXISTS "client_scope_agent_suggestions" ON public.agent_suggestions;
DROP POLICY IF EXISTS "client_scope_insert_agent_suggestions" ON public.agent_suggestions;
-- Drop legacy policies
DROP POLICY IF EXISTS "suggestions_admin_cs"   ON public.agent_suggestions;
DROP POLICY IF EXISTS "suggestions_insert_own" ON public.agent_suggestions;
DROP POLICY IF EXISTS "suggestions_select_own" ON public.agent_suggestions;

-- Admin/CS: full access
CREATE POLICY "admin_all_agent_suggestions" ON public.agent_suggestions
    FOR ALL TO authenticated
    USING (
        EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role IN ('admin', 'cs'))
    )
    WITH CHECK (
        EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role IN ('admin', 'cs'))
    );

-- Read: only own client's suggestions
CREATE POLICY "client_scope_agent_suggestions" ON public.agent_suggestions
    FOR SELECT TO authenticated
    USING (
        client_id = (SELECT u.client_id FROM public.users u WHERE u.id = auth.uid())
    );

-- Insert: only for own client
CREATE POLICY "client_scope_insert_agent_suggestions" ON public.agent_suggestions
    FOR INSERT TO authenticated
    WITH CHECK (
        user_id = auth.uid()
        AND client_id = (SELECT u.client_id FROM public.users u WHERE u.id = auth.uid())
    );


-- =============================================================================
-- TABLE: rag_documents
-- Has direct client_id column (nullable — NULL means global/shared).
-- =============================================================================
ALTER TABLE public.rag_documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_all_rag_documents"    ON public.rag_documents;
DROP POLICY IF EXISTS "client_scope_rag_documents" ON public.rag_documents;
-- Drop legacy policies
DROP POLICY IF EXISTS "rag_docs_admin_cs"      ON public.rag_documents;
DROP POLICY IF EXISTS "rag_docs_seller_read"   ON public.rag_documents;
DROP POLICY IF EXISTS "rag_docs_client_read"   ON public.rag_documents;

-- Admin/CS: full CRUD
CREATE POLICY "admin_all_rag_documents" ON public.rag_documents
    FOR ALL TO authenticated
    USING (
        EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role IN ('admin', 'cs'))
    )
    WITH CHECK (
        EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role IN ('admin', 'cs'))
    );

-- Sellers/Closers/Clients: read active docs for their client OR global docs (client_id IS NULL)
CREATE POLICY "client_scope_rag_documents" ON public.rag_documents
    FOR SELECT TO authenticated
    USING (
        is_active = true
        AND (
            client_id IS NULL
            OR client_id = (SELECT u.client_id FROM public.users u WHERE u.id = auth.uid())
        )
    );


-- =============================================================================
-- TABLE: client_onboarding
-- Has direct client_id column. Also has user_id.
-- =============================================================================
ALTER TABLE public.client_onboarding ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_all_client_onboarding"    ON public.client_onboarding;
DROP POLICY IF EXISTS "client_scope_client_onboarding" ON public.client_onboarding;
DROP POLICY IF EXISTS "client_scope_insert_client_onboarding" ON public.client_onboarding;
-- Drop legacy policies
DROP POLICY IF EXISTS "onboarding_client_own" ON public.client_onboarding;
DROP POLICY IF EXISTS "onboarding_admin_cs"   ON public.client_onboarding;

-- Admin/CS: full access
CREATE POLICY "admin_all_client_onboarding" ON public.client_onboarding
    FOR ALL TO authenticated
    USING (
        EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role IN ('admin', 'cs'))
    )
    WITH CHECK (
        EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role IN ('admin', 'cs'))
    );

-- Read: only own client's onboarding data
CREATE POLICY "client_scope_client_onboarding" ON public.client_onboarding
    FOR SELECT TO authenticated
    USING (
        client_id = (SELECT u.client_id FROM public.users u WHERE u.id = auth.uid())
    );

-- Insert/Update: client can only submit for their own client
CREATE POLICY "client_scope_insert_client_onboarding" ON public.client_onboarding
    FOR INSERT TO authenticated
    WITH CHECK (
        user_id = auth.uid()
        AND client_id = (SELECT u.client_id FROM public.users u WHERE u.id = auth.uid())
    );

CREATE POLICY "client_scope_update_client_onboarding" ON public.client_onboarding
    FOR UPDATE TO authenticated
    USING (
        user_id = auth.uid()
        AND client_id = (SELECT u.client_id FROM public.users u WHERE u.id = auth.uid())
    );


-- =============================================================================
-- TABLE: coach_interactions
-- No client_id directly — scoped by seller_id (the seller belongs to a client).
-- =============================================================================
ALTER TABLE public.coach_interactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_all_coach_interactions"    ON public.coach_interactions;
DROP POLICY IF EXISTS "client_scope_coach_interactions" ON public.coach_interactions;
-- Drop legacy policies
DROP POLICY IF EXISTS "coach_interactions_own"      ON public.coach_interactions;
DROP POLICY IF EXISTS "coach_interactions_admin_cs" ON public.coach_interactions;

-- Admin/CS: full access
CREATE POLICY "admin_all_coach_interactions" ON public.coach_interactions
    FOR ALL TO authenticated
    USING (
        EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role IN ('admin', 'cs'))
    )
    WITH CHECK (
        EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role IN ('admin', 'cs'))
    );

-- Sellers/Closers: read interactions from users in their own client team
-- (scoped by checking that the interaction's seller_id belongs to the same client)
CREATE POLICY "client_scope_coach_interactions" ON public.coach_interactions
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users seller_user
            WHERE seller_user.id = coach_interactions.seller_id
              AND seller_user.client_id = (SELECT u.client_id FROM public.users u WHERE u.id = auth.uid())
        )
    );

-- Each user can only insert/update their own interactions
CREATE POLICY "own_insert_coach_interactions" ON public.coach_interactions
    FOR INSERT TO authenticated
    WITH CHECK (seller_id = auth.uid());

CREATE POLICY "own_update_coach_interactions" ON public.coach_interactions
    FOR UPDATE TO authenticated
    USING (seller_id = auth.uid());


-- =============================================================================
-- TABLE: training_materials
-- Has direct client_id column (nullable — NULL means global/shared).
-- =============================================================================
ALTER TABLE public.training_materials ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_all_training_materials"    ON public.training_materials;
DROP POLICY IF EXISTS "client_scope_training_materials" ON public.training_materials;
-- Drop legacy policies
DROP POLICY IF EXISTS "training_admin_cs"    ON public.training_materials;
DROP POLICY IF EXISTS "training_read_active" ON public.training_materials;

-- Admin/CS: full CRUD
CREATE POLICY "admin_all_training_materials" ON public.training_materials
    FOR ALL TO authenticated
    USING (
        EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role IN ('admin', 'cs'))
    )
    WITH CHECK (
        EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role IN ('admin', 'cs'))
    );

-- Sellers/Closers/Clients: read active materials for their client OR global (client_id IS NULL)
CREATE POLICY "client_scope_training_materials" ON public.training_materials
    FOR SELECT TO authenticated
    USING (
        is_active = true
        AND (
            client_id IS NULL
            OR client_id = (SELECT u.client_id FROM public.users u WHERE u.id = auth.uid())
        )
    );


-- =============================================================================
-- TABLE: client_questions
-- Has direct client_id column. Also has asked_by (the submitter).
-- =============================================================================
ALTER TABLE public.client_questions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_all_client_questions"    ON public.client_questions;
DROP POLICY IF EXISTS "client_scope_client_questions" ON public.client_questions;
DROP POLICY IF EXISTS "client_scope_insert_client_questions" ON public.client_questions;
-- Drop legacy policies
DROP POLICY IF EXISTS "questions_admin_cs"         ON public.client_questions;
DROP POLICY IF EXISTS "questions_client_insert"    ON public.client_questions;
DROP POLICY IF EXISTS "questions_client_read_own"  ON public.client_questions;

-- Admin/CS: full access
CREATE POLICY "admin_all_client_questions" ON public.client_questions
    FOR ALL TO authenticated
    USING (
        EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role IN ('admin', 'cs'))
    )
    WITH CHECK (
        EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role IN ('admin', 'cs'))
    );

-- Read: only own client's questions
CREATE POLICY "client_scope_client_questions" ON public.client_questions
    FOR SELECT TO authenticated
    USING (
        client_id = (SELECT u.client_id FROM public.users u WHERE u.id = auth.uid())
    );

-- Insert: only for own client
CREATE POLICY "client_scope_insert_client_questions" ON public.client_questions
    FOR INSERT TO authenticated
    WITH CHECK (
        asked_by = auth.uid()
        AND client_id = (SELECT u.client_id FROM public.users u WHERE u.id = auth.uid())
    );


-- =============================================================================
-- TABLE: form_submissions
-- Has direct client_id column (nullable — can be anonymous/public submissions).
-- =============================================================================
ALTER TABLE public.form_submissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_all_form_submissions"    ON public.form_submissions;
DROP POLICY IF EXISTS "client_scope_form_submissions" ON public.form_submissions;
DROP POLICY IF EXISTS "anon_insert_form_submissions"  ON public.form_submissions;
-- Drop legacy policies
DROP POLICY IF EXISTS "form_subs_admin_cs"    ON public.form_submissions;
DROP POLICY IF EXISTS "form_subs_insert_any"  ON public.form_submissions;
DROP POLICY IF EXISTS "form_subs_read_own"    ON public.form_submissions;

-- Admin/CS: full access
CREATE POLICY "admin_all_form_submissions" ON public.form_submissions
    FOR ALL TO authenticated
    USING (
        EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role IN ('admin', 'cs'))
    )
    WITH CHECK (
        EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role IN ('admin', 'cs'))
    );

-- Read: only own client's submissions (for authenticated team members)
CREATE POLICY "client_scope_form_submissions" ON public.form_submissions
    FOR SELECT TO authenticated
    USING (
        client_id IS NOT NULL
        AND client_id = (SELECT u.client_id FROM public.users u WHERE u.id = auth.uid())
    );

-- Anonymous + authenticated insert allowed (public intake forms)
CREATE POLICY "anon_insert_form_submissions" ON public.form_submissions
    FOR INSERT
    WITH CHECK (true);


-- =============================================================================
-- TABLE: reports
-- Has direct client_id column.
-- =============================================================================
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_all_reports"    ON public.reports;
DROP POLICY IF EXISTS "client_scope_reports" ON public.reports;
-- Drop legacy policies
DROP POLICY IF EXISTS "reports_admin_cs"    ON public.reports;
DROP POLICY IF EXISTS "reports_client_read" ON public.reports;

-- Admin/CS: full CRUD
CREATE POLICY "admin_all_reports" ON public.reports
    FOR ALL TO authenticated
    USING (
        EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role IN ('admin', 'cs'))
    )
    WITH CHECK (
        EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role IN ('admin', 'cs'))
    );

-- Sellers/Closers/Clients: read only own client's published reports
CREATE POLICY "client_scope_reports" ON public.reports
    FOR SELECT TO authenticated
    USING (
        status = 'published'
        AND client_id = (SELECT u.client_id FROM public.users u WHERE u.id = auth.uid())
    );


-- =============================================================================
-- TABLE: users_role_config  (from 20260211 migration)
-- No client_id column — scoped by user_id (each user owns their config row).
-- =============================================================================
ALTER TABLE public.users_role_config ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_all_users_role_config" ON public.users_role_config;
DROP POLICY IF EXISTS "user_own_role_config"         ON public.users_role_config;
-- Drop legacy policies
DROP POLICY IF EXISTS "Users can read own role config" ON public.users_role_config;

-- Admin/CS: full access
CREATE POLICY "admin_all_users_role_config" ON public.users_role_config
    FOR ALL TO authenticated
    USING (
        EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role IN ('admin', 'cs'))
    )
    WITH CHECK (
        EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role IN ('admin', 'cs'))
    );

-- Each user manages only their own config row
CREATE POLICY "user_own_role_config" ON public.users_role_config
    FOR ALL TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());


-- =============================================================================
-- TABLE: consultancy_templates  (from 20260211 migration)
-- No client_id — global configuration managed by admins.
-- =============================================================================
ALTER TABLE public.consultancy_templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_all_consultancy_templates" ON public.consultancy_templates;
DROP POLICY IF EXISTS "auth_read_consultancy_templates" ON public.consultancy_templates;
-- Drop legacy policies
DROP POLICY IF EXISTS "Auth users can read templates" ON public.consultancy_templates;

-- Admin/CS: full CRUD
CREATE POLICY "admin_all_consultancy_templates" ON public.consultancy_templates
    FOR ALL TO authenticated
    USING (
        EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role IN ('admin', 'cs'))
    )
    WITH CHECK (
        EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role IN ('admin', 'cs'))
    );

-- All authenticated users can read templates (needed to render forms)
CREATE POLICY "auth_read_consultancy_templates" ON public.consultancy_templates
    FOR SELECT TO authenticated
    USING (true);


-- =============================================================================
-- TABLE: daily_reports  (from 20260211 migration)
-- Has client_id column (nullable) and seller_id.
-- =============================================================================
ALTER TABLE public.daily_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_all_daily_reports"    ON public.daily_reports;
DROP POLICY IF EXISTS "client_scope_daily_reports" ON public.daily_reports;
DROP POLICY IF EXISTS "client_scope_insert_daily_reports" ON public.daily_reports;
-- Drop legacy policies
DROP POLICY IF EXISTS "Sellers can insert reports" ON public.daily_reports;
DROP POLICY IF EXISTS "Users view own reports"     ON public.daily_reports;

-- Admin/CS: full access
CREATE POLICY "admin_all_daily_reports" ON public.daily_reports
    FOR ALL TO authenticated
    USING (
        EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role IN ('admin', 'cs'))
    )
    WITH CHECK (
        EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role IN ('admin', 'cs'))
    );

-- Read: scoped to own client_id (or own seller_id if client_id is NULL)
CREATE POLICY "client_scope_daily_reports" ON public.daily_reports
    FOR SELECT TO authenticated
    USING (
        (
            client_id IS NOT NULL
            AND client_id = (SELECT u.client_id FROM public.users u WHERE u.id = auth.uid())
        )
        OR seller_id = auth.uid()
    );

-- Insert: seller can only insert their own reports
CREATE POLICY "client_scope_insert_daily_reports" ON public.daily_reports
    FOR INSERT TO authenticated
    WITH CHECK (seller_id = auth.uid());


-- =============================================================================
-- TABLE: strategic_analysis  (from 20260211 migration)
-- No client_id — scoped via report_id → daily_reports.client_id
-- =============================================================================
ALTER TABLE public.strategic_analysis ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_all_strategic_analysis"    ON public.strategic_analysis;
DROP POLICY IF EXISTS "client_scope_strategic_analysis" ON public.strategic_analysis;
-- Drop legacy policies
DROP POLICY IF EXISTS "Users view analysis of own reports" ON public.strategic_analysis;

-- Admin/CS: full access
CREATE POLICY "admin_all_strategic_analysis" ON public.strategic_analysis
    FOR ALL TO authenticated
    USING (
        EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role IN ('admin', 'cs'))
    )
    WITH CHECK (
        EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role IN ('admin', 'cs'))
    );

-- Sellers: read analysis of reports belonging to their client
CREATE POLICY "client_scope_strategic_analysis" ON public.strategic_analysis
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.daily_reports dr
            WHERE dr.id = strategic_analysis.report_id
              AND (
                  dr.seller_id = auth.uid()
                  OR (
                      dr.client_id IS NOT NULL
                      AND dr.client_id = (SELECT u.client_id FROM public.users u WHERE u.id = auth.uid())
                  )
              )
        )
    );
