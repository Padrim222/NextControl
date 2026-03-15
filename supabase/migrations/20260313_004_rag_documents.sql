-- Migration: 20260313_004_rag_documents
-- Description: Tabela principal da base de conhecimento RAG dos agentes
-- Usada por: RagManager (admin), OnboardingForm (client), AgentSuggestionsPanel (admin)

CREATE TABLE IF NOT EXISTS public.rag_documents (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title           TEXT NOT NULL,
    content         TEXT NOT NULL,
    category        TEXT NOT NULL DEFAULT 'geral',
    agent_type      TEXT NOT NULL DEFAULT 'geral'
                        CHECK (agent_type IN ('ss', 'closer', 'geral')),
    client_id       UUID REFERENCES public.clients(id) ON DELETE SET NULL,
    is_active       BOOLEAN NOT NULL DEFAULT true,
    is_rag_active   BOOLEAN NOT NULL DEFAULT true,  -- alias para compatibilidade
    created_by      UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_rag_documents_agent_type ON public.rag_documents(agent_type);
CREATE INDEX IF NOT EXISTS idx_rag_documents_client_id  ON public.rag_documents(client_id);
CREATE INDEX IF NOT EXISTS idx_rag_documents_is_active  ON public.rag_documents(is_active);

ALTER TABLE public.rag_documents ENABLE ROW LEVEL SECURITY;

-- Admin/CS: full CRUD
CREATE POLICY "rag_docs_admin_cs" ON public.rag_documents
    FOR ALL TO authenticated
    USING (
        EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role IN ('admin','cs'))
    )
    WITH CHECK (
        EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role IN ('admin','cs'))
    );

-- Sellers/Closers: read documents for their client_id OR global (client_id IS NULL)
CREATE POLICY "rag_docs_seller_read" ON public.rag_documents
    FOR SELECT TO authenticated
    USING (
        is_active = true
        AND (
            client_id IS NULL
            OR EXISTS (
                SELECT 1 FROM public.users u
                WHERE u.id = auth.uid()
                  AND u.role IN ('seller', 'closer')
                  AND u.client_id = rag_documents.client_id
            )
        )
    );

-- Clients: read their own documents
CREATE POLICY "rag_docs_client_read" ON public.rag_documents
    FOR SELECT TO authenticated
    USING (
        is_active = true
        AND EXISTS (
            SELECT 1 FROM public.users u
            WHERE u.id = auth.uid()
              AND u.role = 'client'
              AND u.client_id = rag_documents.client_id
        )
    );

-- ─── client_onboarding ───────────────────────────────────────────────────────
-- Stores the briefing submitted by clients during onboarding

CREATE TABLE IF NOT EXISTS public.client_onboarding (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id       UUID REFERENCES public.clients(id) ON DELETE CASCADE,
    user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    data            JSONB NOT NULL DEFAULT '{}'::jsonb,  -- full form data
    rag_document_id UUID REFERENCES public.rag_documents(id) ON DELETE SET NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_client_onboarding_client_id ON public.client_onboarding(client_id);
CREATE INDEX IF NOT EXISTS idx_client_onboarding_user_id   ON public.client_onboarding(user_id);

ALTER TABLE public.client_onboarding ENABLE ROW LEVEL SECURITY;

-- Client: read/write own
CREATE POLICY "onboarding_client_own" ON public.client_onboarding
    FOR ALL TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- Admin/CS: full access
CREATE POLICY "onboarding_admin_cs" ON public.client_onboarding
    FOR ALL TO authenticated
    USING (
        EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role IN ('admin','cs'))
    )
    WITH CHECK (
        EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role IN ('admin','cs'))
    );

-- ─── coach_interactions ──────────────────────────────────────────────────────
-- Stores CoachChat history (used by coach-chat edge function)

CREATE TABLE IF NOT EXISTS public.coach_interactions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    seller_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    question        TEXT NOT NULL,
    answer          TEXT,
    context         JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_coach_interactions_seller_id  ON public.coach_interactions(seller_id);
CREATE INDEX IF NOT EXISTS idx_coach_interactions_created_at ON public.coach_interactions(created_at);

ALTER TABLE public.coach_interactions ENABLE ROW LEVEL SECURITY;

-- Sellers/Closers: read own
CREATE POLICY "coach_interactions_own" ON public.coach_interactions
    FOR ALL TO authenticated
    USING (seller_id = auth.uid())
    WITH CHECK (seller_id = auth.uid());

-- Admin/CS: read all
CREATE POLICY "coach_interactions_admin_cs" ON public.coach_interactions
    FOR SELECT TO authenticated
    USING (
        EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role IN ('admin','cs'))
    );
