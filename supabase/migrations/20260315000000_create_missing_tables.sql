-- Migration: Criação das tabelas faltantes
-- Tabelas usadas extensivamente no código mas ausentes no banco.
-- Data: 2026-03-15

-- =============================================================
-- TABELA: client_materials
-- Materiais enviados por admins ou clientes (PDFs, links, vídeos)
-- que alimentam o RAG e ficam visíveis no painel do cliente.
-- =============================================================
CREATE TABLE IF NOT EXISTS public.client_materials (
    id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    client_id   UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    title       TEXT NOT NULL,
    description TEXT,
    file_url    TEXT NOT NULL,
    file_type   TEXT NOT NULL DEFAULT 'link'
                    CHECK (file_type IN ('link', 'pdf', 'video', 'doc')),
    category    TEXT NOT NULL DEFAULT 'methodology'
                    CHECK (category IN (
                        'process_optimization',
                        'approach_technique',
                        'sales_pitch',
                        'methodology',
                        'objection_handling'
                    )),
    is_rag_active   BOOLEAN NOT NULL DEFAULT TRUE,
    sent_to_client  BOOLEAN NOT NULL DEFAULT TRUE,
    created_by      UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at  TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL
);

-- Índices de acesso frequente
CREATE INDEX IF NOT EXISTS idx_client_materials_client_id
    ON public.client_materials(client_id);

CREATE INDEX IF NOT EXISTS idx_client_materials_sent_to_client
    ON public.client_materials(client_id, sent_to_client)
    WHERE sent_to_client = TRUE;

-- RLS
ALTER TABLE public.client_materials ENABLE ROW LEVEL SECURITY;

-- Admins têm acesso total
CREATE POLICY "Admins full access to client_materials"
    ON public.client_materials FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid() AND users.role = 'admin'
        )
    );

-- CS têm acesso total
CREATE POLICY "CS full access to client_materials"
    ON public.client_materials FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid() AND users.role = 'cs'
        )
    );

-- Sellers veem materiais dos seus clientes designados
CREATE POLICY "Sellers view assigned client materials"
    ON public.client_materials FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.clients
            WHERE clients.id = client_materials.client_id
              AND clients.assigned_seller_id = auth.uid()
        )
    );

-- Closers veem materiais dos seus clientes designados
CREATE POLICY "Closers view assigned client materials"
    ON public.client_materials FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.clients
            WHERE clients.id = client_materials.client_id
              AND clients.assigned_closer_id = auth.uid()
        )
    );

-- O cliente vê e gerencia os próprios materiais (via users.client_id)
CREATE POLICY "Clients manage own materials"
    ON public.client_materials FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid()
              AND users.client_id = client_materials.client_id
        )
    );


-- =============================================================
-- TABELA: reports
-- Relatórios gerados pela equipe para sellers/clientes,
-- com PDF para download e notas de revisão.
-- =============================================================
CREATE TABLE IF NOT EXISTS public.reports (
    id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    seller_id       UUID REFERENCES public.users(id) ON DELETE SET NULL,
    client_id       UUID REFERENCES public.clients(id) ON DELETE SET NULL,
    submission_id   UUID REFERENCES public.daily_submissions(id) ON DELETE SET NULL,
    analysis_id     UUID REFERENCES public.analyses(id) ON DELETE SET NULL,
    pdf_url         TEXT,
    status          TEXT NOT NULL DEFAULT 'pending'
                        CHECK (status IN ('pending', 'approved', 'delivered', 'rejected')),
    reviewed_by     UUID REFERENCES public.users(id) ON DELETE SET NULL,
    review_notes    TEXT,
    sent_at         TIMESTAMP WITH TIME ZONE,
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_reports_seller_id
    ON public.reports(seller_id);

CREATE INDEX IF NOT EXISTS idx_reports_client_id
    ON public.reports(client_id);

CREATE INDEX IF NOT EXISTS idx_reports_status
    ON public.reports(status);

-- RLS
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- Admins têm acesso total
CREATE POLICY "Admins full access to reports"
    ON public.reports FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid() AND users.role = 'admin'
        )
    );

-- CS têm acesso total
CREATE POLICY "CS full access to reports"
    ON public.reports FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid() AND users.role = 'cs'
        )
    );

-- Sellers veem os próprios relatórios
CREATE POLICY "Sellers view own reports"
    ON public.reports FOR SELECT
    USING (seller_id = auth.uid());

-- Clientes veem relatórios entregues vinculados ao seu client_id
CREATE POLICY "Clients view delivered reports"
    ON public.reports FOR SELECT
    USING (
        status = 'delivered'
        AND EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid()
              AND users.client_id = reports.client_id
        )
    );
