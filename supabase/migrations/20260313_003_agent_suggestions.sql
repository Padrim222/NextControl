CREATE TABLE IF NOT EXISTS public.agent_suggestions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id       UUID REFERENCES public.clients(id) ON DELETE CASCADE,
    user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    agent_type      TEXT NOT NULL CHECK (agent_type IN ('ss', 'closer', 'geral')),
    title           TEXT NOT NULL,
    suggestion_text TEXT NOT NULL,
    context_note    TEXT,  -- what triggered this suggestion (e.g., "ICP XYZ não converte")
    source          TEXT NOT NULL DEFAULT 'user' CHECK (source IN ('user', 'call_analysis')),
    call_upload_id  UUID REFERENCES public.call_uploads(id) ON DELETE SET NULL,
    status          TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    reviewed_by     UUID REFERENCES auth.users(id),
    reviewed_at     TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_agent_suggestions_status    ON public.agent_suggestions(status);
CREATE INDEX IF NOT EXISTS idx_agent_suggestions_client_id ON public.agent_suggestions(client_id);
CREATE INDEX IF NOT EXISTS idx_agent_suggestions_user_id   ON public.agent_suggestions(user_id);

ALTER TABLE public.agent_suggestions ENABLE ROW LEVEL SECURITY;

-- Admin/CS: full access
CREATE POLICY "suggestions_admin_cs" ON public.agent_suggestions
    FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role IN ('admin','cs')))
    WITH CHECK (EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role IN ('admin','cs')));

-- Sellers/Closers: insert own, read own
CREATE POLICY "suggestions_insert_own" ON public.agent_suggestions
    FOR INSERT TO authenticated
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "suggestions_select_own" ON public.agent_suggestions
    FOR SELECT TO authenticated
    USING (user_id = auth.uid());
