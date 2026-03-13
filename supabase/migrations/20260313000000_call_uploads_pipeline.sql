-- Migration: call_uploads pipeline + supporting tables
-- Description: Creates all tables required for the call upload → transcribe → analyze pipeline
-- that has never completed end-to-end.
--
-- Tables created:
--   clients, users, call_uploads, call_evaluations, call_logs,
--   daily_submissions, analyses, ai_feedback, weekly_analysis_reports
--
-- NOTE: The `content_outputs` and `client_materials` tables already exist.

-- ============================================================
-- 1. clients
-- ============================================================
CREATE TABLE IF NOT EXISTS public.clients (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        TEXT NOT NULL,
    company     TEXT,
    email       TEXT,
    phone       TEXT,
    status      TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'churned')),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_clients_status ON public.clients(status);

-- ============================================================
-- 2. users (app-level profile, extends auth.users)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.users (
    id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name        TEXT NOT NULL,
    email       TEXT,
    role        TEXT NOT NULL DEFAULT 'seller' CHECK (role IN ('admin', 'client', 'seller', 'closer', 'cs', 'strategist')),
    client_id   UUID REFERENCES public.clients(id) ON DELETE SET NULL,
    seller_type TEXT CHECK (seller_type IN ('seller', 'closer')),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_users_role      ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_users_client_id ON public.users(client_id);

-- ============================================================
-- 3. call_uploads  — core pipeline table
-- Status flow: uploaded → transcribing → ready → analyzing → analyzed → approved | rejected
-- ============================================================
CREATE TABLE IF NOT EXISTS public.call_uploads (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id           UUID REFERENCES public.clients(id) ON DELETE SET NULL,
    closer_id           UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    upload_source       TEXT NOT NULL DEFAULT 'manual' CHECK (upload_source IN ('drive', 'manual')),
    original_url        TEXT,
    mp3_url             TEXT,
    transcription_text  TEXT,
    status              TEXT NOT NULL DEFAULT 'uploaded'
                            CHECK (status IN ('uploaded','converting','transcribing','ready','analyzing','analyzed','approved','rejected')),
    admin_notes         TEXT,
    approved_by         UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    approved_at         TIMESTAMPTZ,
    call_date           DATE NOT NULL DEFAULT CURRENT_DATE,
    prospect_name       TEXT,
    duration_minutes    INT,
    evaluation_id       UUID,   -- FK added below after call_evaluations is created
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_call_uploads_closer_id  ON public.call_uploads(closer_id);
CREATE INDEX IF NOT EXISTS idx_call_uploads_client_id  ON public.call_uploads(client_id);
CREATE INDEX IF NOT EXISTS idx_call_uploads_status     ON public.call_uploads(status);
CREATE INDEX IF NOT EXISTS idx_call_uploads_call_date  ON public.call_uploads(call_date);

-- ============================================================
-- 4. call_logs
-- ============================================================
CREATE TABLE IF NOT EXISTS public.call_logs (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    closer_id        UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    client_id        UUID REFERENCES public.clients(id) ON DELETE SET NULL,
    call_date        DATE NOT NULL DEFAULT CURRENT_DATE,
    transcription    TEXT,
    outcome          TEXT CHECK (outcome IN ('sale', 'no_sale', 'reschedule')),
    prospect_name    TEXT,
    duration_minutes INT,
    notes            TEXT,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_call_logs_closer_id  ON public.call_logs(closer_id);
CREATE INDEX IF NOT EXISTS idx_call_logs_client_id  ON public.call_logs(client_id);
CREATE INDEX IF NOT EXISTS idx_call_logs_call_date  ON public.call_logs(call_date);

-- ============================================================
-- 5. call_evaluations  — AI analysis output
-- ============================================================
CREATE TABLE IF NOT EXISTS public.call_evaluations (
    id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    call_log_id           UUID REFERENCES public.call_logs(id) ON DELETE SET NULL,
    closer_id             UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    prospect_name         TEXT,
    duration_minutes      INT,
    score_abertura        NUMERIC(4,1) NOT NULL DEFAULT 0,
    score_descoberta      NUMERIC(4,1) NOT NULL DEFAULT 0,
    score_apresentacao    NUMERIC(4,1) NOT NULL DEFAULT 0,
    score_objecoes        NUMERIC(4,1) NOT NULL DEFAULT 0,
    score_fechamento      NUMERIC(4,1) NOT NULL DEFAULT 0,
    score_comunicacao     NUMERIC(4,1) NOT NULL DEFAULT 0,
    score_geral           NUMERIC(4,1) NOT NULL DEFAULT 0,
    pontos_fortes         JSONB NOT NULL DEFAULT '[]'::jsonb,
    gaps_criticos         JSONB NOT NULL DEFAULT '[]'::jsonb,
    acoes_recomendadas    JSONB NOT NULL DEFAULT '[]'::jsonb,
    melhorias             JSONB NOT NULL DEFAULT '[]'::jsonb,
    insights_convertidas  JSONB NOT NULL DEFAULT '[]'::jsonb,
    insights_perdidas     JSONB NOT NULL DEFAULT '[]'::jsonb,
    resultado             TEXT NOT NULL DEFAULT 'perdeu' CHECK (resultado IN ('vendeu', 'perdeu', 'follow-up')),
    feedback_detalhado    TEXT NOT NULL DEFAULT '',
    nivel                 TEXT NOT NULL DEFAULT 'Iniciante'
                              CHECK (nivel IN ('Iniciante', 'Intermediário', 'Avançado', 'Expert')),
    ai_model              TEXT,
    created_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_call_evaluations_closer_id ON public.call_evaluations(closer_id);
CREATE INDEX IF NOT EXISTS idx_call_evaluations_created_at ON public.call_evaluations(created_at);

-- Add FK from call_uploads.evaluation_id → call_evaluations.id
ALTER TABLE public.call_uploads
    ADD CONSTRAINT fk_call_uploads_evaluation
    FOREIGN KEY (evaluation_id) REFERENCES public.call_evaluations(id) ON DELETE SET NULL;

-- ============================================================
-- 6. daily_submissions  (seller daily check-in)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.daily_submissions (
    id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    seller_id            UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    client_id            UUID REFERENCES public.clients(id) ON DELETE SET NULL,
    submission_date      DATE NOT NULL DEFAULT CURRENT_DATE,
    metrics              JSONB NOT NULL DEFAULT '{}'::jsonb,
    notes                TEXT,
    conversation_prints  JSONB NOT NULL DEFAULT '[]'::jsonb,  -- array of image URLs
    call_recording       TEXT,                                 -- URL to audio file
    status               TEXT NOT NULL DEFAULT 'pending'
                             CHECK (status IN ('pending', 'analyzed', 'approved')),
    created_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_daily_submissions_seller_id ON public.daily_submissions(seller_id);
CREATE INDEX IF NOT EXISTS idx_daily_submissions_date      ON public.daily_submissions(submission_date);

-- ============================================================
-- 7. analyses  (AI analysis of daily submissions)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.analyses (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submission_id UUID NOT NULL REFERENCES public.daily_submissions(id) ON DELETE CASCADE,
    agent_type    TEXT NOT NULL,  -- 'social_selling' | 'call_analysis' | 'metrics'
    content       TEXT NOT NULL DEFAULT '',
    strengths     JSONB NOT NULL DEFAULT '[]'::jsonb,
    improvements  JSONB NOT NULL DEFAULT '[]'::jsonb,
    patterns      JSONB NOT NULL DEFAULT '{}'::jsonb,
    next_steps    JSONB NOT NULL DEFAULT '[]'::jsonb,
    score         INT NOT NULL DEFAULT 0 CHECK (score BETWEEN 0 AND 100),
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_analyses_submission_id ON public.analyses(submission_id);

-- ============================================================
-- 8. ai_feedback  (head-agent feedback on daily reports)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.ai_feedback (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id     UUID,          -- references daily_reports if that table exists
    feedback_text TEXT NOT NULL,
    model         TEXT,
    generated_by  UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 9. weekly_analysis_reports
-- ============================================================
CREATE TABLE IF NOT EXISTS public.weekly_analysis_reports (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id        UUID REFERENCES public.clients(id) ON DELETE SET NULL,
    seller_id        UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    week_start       DATE NOT NULL,
    week_end         DATE NOT NULL,
    call_summaries   JSONB NOT NULL DEFAULT '[]'::jsonb,
    checklist_actions JSONB NOT NULL DEFAULT '[]'::jsonb,
    metrics_summary  JSONB NOT NULL DEFAULT '{}'::jsonb,
    overall_score    INT,
    highlights       JSONB NOT NULL DEFAULT '[]'::jsonb,
    improvements     JSONB NOT NULL DEFAULT '[]'::jsonb,
    admin_approved   BOOLEAN NOT NULL DEFAULT false,
    client_visible   BOOLEAN NOT NULL DEFAULT false,
    created_by       UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_weekly_reports_client_id  ON public.weekly_analysis_reports(client_id);
CREATE INDEX IF NOT EXISTS idx_weekly_reports_week_start ON public.weekly_analysis_reports(week_start);

-- ============================================================
-- 10. Add is_rag_active column to client_materials if missing
--     (referenced by analyze-call RAG context fetch)
-- ============================================================
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name   = 'client_materials'
          AND column_name  = 'is_rag_active'
    ) THEN
        ALTER TABLE public.client_materials ADD COLUMN is_rag_active BOOLEAN NOT NULL DEFAULT false;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name   = 'client_materials'
          AND column_name  = 'description'
    ) THEN
        ALTER TABLE public.client_materials ADD COLUMN description TEXT;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name   = 'client_materials'
          AND column_name  = 'title'
    ) THEN
        ALTER TABLE public.client_materials ADD COLUMN title TEXT NOT NULL DEFAULT '';
    END IF;
END $$;

-- ============================================================
-- 11. Enable RLS on all new tables
-- ============================================================
ALTER TABLE public.clients              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.call_uploads         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.call_logs            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.call_evaluations     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_submissions    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analyses             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_feedback          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_analysis_reports ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 12. RLS Policies
-- ============================================================

-- users: own record
DROP POLICY IF EXISTS "Users read own profile" ON public.users;
CREATE POLICY "Users read own profile" ON public.users
    FOR SELECT TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users update own profile" ON public.users;
CREATE POLICY "Users update own profile" ON public.users
    FOR UPDATE TO authenticated USING (auth.uid() = id);

-- call_uploads: closers see own, admins see all
DROP POLICY IF EXISTS "Closer read own call_uploads" ON public.call_uploads;
CREATE POLICY "Closer read own call_uploads" ON public.call_uploads
    FOR SELECT TO authenticated
    USING (
        closer_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role IN ('admin', 'cs')
        )
    );

DROP POLICY IF EXISTS "Closer insert call_uploads" ON public.call_uploads;
CREATE POLICY "Closer insert call_uploads" ON public.call_uploads
    FOR INSERT TO authenticated WITH CHECK (closer_id = auth.uid());

DROP POLICY IF EXISTS "Admin update call_uploads" ON public.call_uploads;
CREATE POLICY "Admin update call_uploads" ON public.call_uploads
    FOR UPDATE TO authenticated
    USING (
        closer_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role IN ('admin', 'cs')
        )
    );

-- call_evaluations: closers see own
DROP POLICY IF EXISTS "Closer read own evaluations" ON public.call_evaluations;
CREATE POLICY "Closer read own evaluations" ON public.call_evaluations
    FOR SELECT TO authenticated
    USING (
        closer_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role IN ('admin', 'cs')
        )
    );

-- call_logs: closers see own
DROP POLICY IF EXISTS "Closer read own call_logs" ON public.call_logs;
CREATE POLICY "Closer read own call_logs" ON public.call_logs
    FOR SELECT TO authenticated USING (closer_id = auth.uid());

-- daily_submissions: sellers see own
DROP POLICY IF EXISTS "Seller read own submissions" ON public.daily_submissions;
CREATE POLICY "Seller read own submissions" ON public.daily_submissions
    FOR SELECT TO authenticated
    USING (
        seller_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role IN ('admin', 'cs')
        )
    );

DROP POLICY IF EXISTS "Seller insert submissions" ON public.daily_submissions;
CREATE POLICY "Seller insert submissions" ON public.daily_submissions
    FOR INSERT TO authenticated WITH CHECK (seller_id = auth.uid());

-- analyses: sellers read own submission analyses
DROP POLICY IF EXISTS "Seller read own analyses" ON public.analyses;
CREATE POLICY "Seller read own analyses" ON public.analyses
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.daily_submissions
            WHERE daily_submissions.id = analyses.submission_id
              AND daily_submissions.seller_id = auth.uid()
        )
        OR EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role IN ('admin', 'cs')
        )
    );

-- weekly_analysis_reports: admin/cs read all, client reads own
DROP POLICY IF EXISTS "Admin read weekly reports" ON public.weekly_analysis_reports;
CREATE POLICY "Admin read weekly reports" ON public.weekly_analysis_reports
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role IN ('admin', 'cs')
        )
        OR (
            client_visible = true
            AND EXISTS (
                SELECT 1 FROM public.users
                WHERE id = auth.uid() AND client_id = weekly_analysis_reports.client_id
            )
        )
    );
