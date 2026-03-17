CREATE TABLE IF NOT EXISTS public.client_agent_configs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    agent_type text NOT NULL CHECK (agent_type IN ('ss', 'closer', 'geral')),
    system_prompt text NOT NULL,
    is_active boolean NOT NULL DEFAULT true,
    created_by uuid REFERENCES auth.users(id),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (client_id, agent_type)
);

ALTER TABLE public.client_agent_configs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_cs_manage_configs" ON public.client_agent_configs
    FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin','cs')))
    WITH CHECK (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin','cs')));

CREATE POLICY "client_read_own_configs" ON public.client_agent_configs
    FOR SELECT TO authenticated
    USING (client_id IN (SELECT client_id FROM public.users WHERE id = auth.uid()));
