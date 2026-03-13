-- Migration: 20260313_005_missing_tables
-- Description: Tabelas referenciadas no frontend mas ainda não criadas em migration
-- Tabelas: training_materials, client_questions, form_submissions, reports
-- (client_materials e content_outputs já existem na instância Supabase)

-- ============================================================
-- 1. training_materials  — materiais de treinamento para sellers/closers
-- ============================================================
CREATE TABLE IF NOT EXISTS public.training_materials (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title       TEXT NOT NULL,
    content     TEXT NOT NULL,
    category    TEXT NOT NULL DEFAULT 'methodology'
                    CHECK (category IN ('script', 'methodology', 'strategy', 'best_practice', 'error_pattern')),
    client_id   UUID REFERENCES public.clients(id) ON DELETE SET NULL,
    is_active   BOOLEAN NOT NULL DEFAULT true,
    created_by  UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_training_materials_category  ON public.training_materials(category);
CREATE INDEX IF NOT EXISTS idx_training_materials_client_id ON public.training_materials(client_id);
CREATE INDEX IF NOT EXISTS idx_training_materials_active    ON public.training_materials(is_active);

ALTER TABLE public.training_materials ENABLE ROW LEVEL SECURITY;

-- Admin/CS: full CRUD
CREATE POLICY "training_admin_cs" ON public.training_materials
    FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role IN ('admin','cs')))
    WITH CHECK (EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role IN ('admin','cs')));

-- Sellers/Closers/Clients: read active materials (own client or global)
CREATE POLICY "training_read_active" ON public.training_materials
    FOR SELECT TO authenticated
    USING (
        is_active = true
        AND (
            client_id IS NULL
            OR EXISTS (
                SELECT 1 FROM public.users u
                WHERE u.id = auth.uid()
                  AND u.client_id = training_materials.client_id
            )
        )
    );

-- ============================================================
-- 2. client_questions  — perguntas feitas por clientes ao CS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.client_questions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id       UUID REFERENCES public.clients(id) ON DELETE CASCADE,
    asked_by        UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    question_text   TEXT NOT NULL,
    status          TEXT NOT NULL DEFAULT 'pending'
                        CHECK (status IN ('pending', 'answered', 'escalated')),
    response_text   TEXT,
    responded_by    UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    responded_at    TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_client_questions_client_id ON public.client_questions(client_id);
CREATE INDEX IF NOT EXISTS idx_client_questions_status    ON public.client_questions(status);

ALTER TABLE public.client_questions ENABLE ROW LEVEL SECURITY;

-- Admin/CS: full access
CREATE POLICY "questions_admin_cs" ON public.client_questions
    FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role IN ('admin','cs')))
    WITH CHECK (EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role IN ('admin','cs')));

-- Client: read + insert own questions
CREATE POLICY "questions_client_insert" ON public.client_questions
    FOR INSERT TO authenticated
    WITH CHECK (asked_by = auth.uid());

CREATE POLICY "questions_client_read_own" ON public.client_questions
    FOR SELECT TO authenticated
    USING (asked_by = auth.uid());

-- ============================================================
-- 3. form_submissions  — raw form submissions from public forms
-- ============================================================
CREATE TABLE IF NOT EXISTS public.form_submissions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id       UUID REFERENCES public.clients(id) ON DELETE SET NULL,
    form_type       TEXT NOT NULL DEFAULT 'seller'
                        CHECK (form_type IN ('seller', 'closer', 'expert')),
    name            TEXT,
    email           TEXT,
    phone           TEXT,
    data            JSONB NOT NULL DEFAULT '{}'::jsonb,
    files           JSONB NOT NULL DEFAULT '[]'::jsonb,  -- array of storage URLs
    status          TEXT NOT NULL DEFAULT 'pending'
                        CHECK (status IN ('pending', 'analyzed', 'approved', 'rejected')),
    submitted_by    UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_form_submissions_client_id  ON public.form_submissions(client_id);
CREATE INDEX IF NOT EXISTS idx_form_submissions_form_type  ON public.form_submissions(form_type);
CREATE INDEX IF NOT EXISTS idx_form_submissions_status     ON public.form_submissions(status);

ALTER TABLE public.form_submissions ENABLE ROW LEVEL SECURITY;

-- Admin/CS: full access
CREATE POLICY "form_subs_admin_cs" ON public.form_submissions
    FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role IN ('admin','cs')))
    WITH CHECK (EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role IN ('admin','cs')));

-- Anyone can insert (public forms — anonymous allowed via anon key)
CREATE POLICY "form_subs_insert_any" ON public.form_submissions
    FOR INSERT
    WITH CHECK (true);

-- Sellers/Closers: read own submissions
CREATE POLICY "form_subs_read_own" ON public.form_submissions
    FOR SELECT TO authenticated
    USING (submitted_by = auth.uid());

-- ============================================================
-- 4. reports  — weekly/monthly reports visible to clients
-- ============================================================
CREATE TABLE IF NOT EXISTS public.reports (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id       UUID REFERENCES public.clients(id) ON DELETE CASCADE,
    report_type     TEXT NOT NULL DEFAULT 'weekly'
                        CHECK (report_type IN ('weekly', 'monthly')),
    title           TEXT NOT NULL,
    content         TEXT NOT NULL DEFAULT '',
    data            JSONB NOT NULL DEFAULT '{}'::jsonb,
    week_start      DATE,
    week_end        DATE,
    status          TEXT NOT NULL DEFAULT 'draft'
                        CHECK (status IN ('draft', 'published')),
    published_at    TIMESTAMPTZ,
    created_by      UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_reports_client_id   ON public.reports(client_id);
CREATE INDEX IF NOT EXISTS idx_reports_report_type ON public.reports(report_type);
CREATE INDEX IF NOT EXISTS idx_reports_status      ON public.reports(status);

ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- Admin/CS: full CRUD
CREATE POLICY "reports_admin_cs" ON public.reports
    FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role IN ('admin','cs')))
    WITH CHECK (EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role IN ('admin','cs')));

-- Client: read own published reports
CREATE POLICY "reports_client_read" ON public.reports
    FOR SELECT TO authenticated
    USING (
        status = 'published'
        AND EXISTS (
            SELECT 1 FROM public.users u
            WHERE u.id = auth.uid()
              AND u.role = 'client'
              AND u.client_id = reports.client_id
        )
    );
