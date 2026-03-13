-- =============================================================================
-- Migration: 20260313_fix_rls_client_materials
-- Description: Creates core Next Control tables (users, clients, client_materials,
--              content_outputs, call_uploads) with RLS enabled and proper policies.
--
-- CONTEXT: None of these tables existed in the DB. This migration creates them
--          from scratch with RLS ON from day one.
--
-- ROLES:
--   admin  — full read/write on everything
--   cs     — full read/write on everything (customer success)
--   seller — read-only on all client data (staff)
--   closer — read-only on all client data + owns their call_uploads
--   client — read/write only on their own records (scoped by clients.auth_user_id)
-- =============================================================================

-- -----------------------------------------------
-- 1. USERS TABLE (app-level, separate from auth.users)
--    Stores role and status for every authenticated user.
-- -----------------------------------------------
CREATE TABLE IF NOT EXISTS public.users (
    id          UUID    PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email       TEXT    NOT NULL,
    name        TEXT    NOT NULL,
    role        TEXT    NOT NULL CHECK (role IN ('admin', 'seller', 'closer', 'client', 'cs')),
    status      TEXT    NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'suspended')),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Users can read their own record
DROP POLICY IF EXISTS "users_select_own" ON public.users;
CREATE POLICY "users_select_own" ON public.users
    FOR SELECT TO authenticated
    USING (auth.uid() = id);

-- Admins and CS can read all users
DROP POLICY IF EXISTS "users_select_admin_cs" ON public.users;
CREATE POLICY "users_select_admin_cs" ON public.users
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users u
            WHERE u.id = auth.uid() AND u.role IN ('admin', 'cs')
        )
    );

-- Admins have full write access to users
DROP POLICY IF EXISTS "users_write_admin" ON public.users;
CREATE POLICY "users_write_admin" ON public.users
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users u
            WHERE u.id = auth.uid() AND u.role = 'admin'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users u
            WHERE u.id = auth.uid() AND u.role = 'admin'
        )
    );

-- -----------------------------------------------
-- 2. CLIENTS TABLE
--    Represents a client business. auth_user_id links the client's login.
-- -----------------------------------------------
CREATE TABLE IF NOT EXISTS public.clients (
    id                  UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
    name                TEXT    NOT NULL,
    email               TEXT,
    company             TEXT,
    assigned_seller_id  UUID    REFERENCES public.users(id),
    assigned_closer_id  UUID    REFERENCES public.users(id),
    auth_user_id        UUID    REFERENCES auth.users(id),  -- set when client has a login
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

-- Admins and CS: full access to all clients
DROP POLICY IF EXISTS "clients_all_admin_cs" ON public.clients;
CREATE POLICY "clients_all_admin_cs" ON public.clients
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users u
            WHERE u.id = auth.uid() AND u.role IN ('admin', 'cs')
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users u
            WHERE u.id = auth.uid() AND u.role IN ('admin', 'cs')
        )
    );

-- Sellers: read their assigned clients only
DROP POLICY IF EXISTS "clients_select_seller" ON public.clients;
CREATE POLICY "clients_select_seller" ON public.clients
    FOR SELECT TO authenticated
    USING (assigned_seller_id = auth.uid());

-- Closers: read their assigned clients only
DROP POLICY IF EXISTS "clients_select_closer" ON public.clients;
CREATE POLICY "clients_select_closer" ON public.clients
    FOR SELECT TO authenticated
    USING (assigned_closer_id = auth.uid());

-- Clients: read only their own record
DROP POLICY IF EXISTS "clients_select_own_client" ON public.clients;
CREATE POLICY "clients_select_own_client" ON public.clients
    FOR SELECT TO authenticated
    USING (auth_user_id = auth.uid());

-- -----------------------------------------------
-- 3. CLIENT_MATERIALS TABLE
--    THE CRITICAL SECURITY GAP: RLS ENABLED HERE.
--    Stores raw materials uploaded by or on behalf of clients.
-- -----------------------------------------------
CREATE TABLE IF NOT EXISTS public.client_materials (
    id              UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id       UUID    NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    uploaded_by     UUID    REFERENCES auth.users(id),
    material_type   TEXT    NOT NULL CHECK (material_type IN ('photo', 'video', 'text', 'audio', 'document')),
    title           TEXT,
    description     TEXT,
    file_url        TEXT,
    file_path       TEXT,
    storage_bucket  TEXT,
    raw_text        TEXT,
    status          TEXT    NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'processed', 'error')),
    metadata        JSONB   NOT NULL DEFAULT '{}'::jsonb,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_client_materials_client_id ON public.client_materials(client_id);
CREATE INDEX IF NOT EXISTS idx_client_materials_status   ON public.client_materials(status);

-- RLS: ON — this is the fix for the critical security gap
ALTER TABLE public.client_materials ENABLE ROW LEVEL SECURITY;

-- Admins and CS: full access to all materials
DROP POLICY IF EXISTS "client_materials_all_admin_cs" ON public.client_materials;
CREATE POLICY "client_materials_all_admin_cs" ON public.client_materials
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users u
            WHERE u.id = auth.uid() AND u.role IN ('admin', 'cs')
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users u
            WHERE u.id = auth.uid() AND u.role IN ('admin', 'cs')
        )
    );

-- Sellers: read all materials (staff visibility)
DROP POLICY IF EXISTS "client_materials_select_seller" ON public.client_materials;
CREATE POLICY "client_materials_select_seller" ON public.client_materials
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users u
            WHERE u.id = auth.uid() AND u.role = 'seller'
        )
    );

-- Closers: read all materials (staff visibility)
DROP POLICY IF EXISTS "client_materials_select_closer" ON public.client_materials;
CREATE POLICY "client_materials_select_closer" ON public.client_materials
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users u
            WHERE u.id = auth.uid() AND u.role = 'closer'
        )
    );

-- Clients: read only their own materials (client_id → clients.auth_user_id)
DROP POLICY IF EXISTS "client_materials_select_own_client" ON public.client_materials;
CREATE POLICY "client_materials_select_own_client" ON public.client_materials
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.clients c
            WHERE c.id = client_materials.client_id
              AND c.auth_user_id = auth.uid()
        )
    );

-- Clients: insert only into their own client bucket
DROP POLICY IF EXISTS "client_materials_insert_own_client" ON public.client_materials;
CREATE POLICY "client_materials_insert_own_client" ON public.client_materials
    FOR INSERT TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.clients c
            WHERE c.id = client_materials.client_id
              AND c.auth_user_id = auth.uid()
        )
    );

-- -----------------------------------------------
-- 4. CONTENT_OUTPUTS TABLE (AI-generated content)
--    Output produced by the AI pipeline for each client.
-- -----------------------------------------------
CREATE TABLE IF NOT EXISTS public.content_outputs (
    id              UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id       UUID    NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    material_id     UUID    REFERENCES public.client_materials(id) ON DELETE SET NULL,
    output_type     TEXT    NOT NULL CHECK (output_type IN ('post', 'caption', 'script', 'report', 'summary', 'other')),
    title           TEXT,
    content_text    TEXT,
    content_json    JSONB   NOT NULL DEFAULT '{}'::jsonb,
    ai_model        TEXT,
    status          TEXT    NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'approved', 'delivered', 'archived')),
    delivered_at    TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_content_outputs_client_id ON public.content_outputs(client_id);
CREATE INDEX IF NOT EXISTS idx_content_outputs_status    ON public.content_outputs(status);

ALTER TABLE public.content_outputs ENABLE ROW LEVEL SECURITY;

-- Admins and CS: full access
DROP POLICY IF EXISTS "content_outputs_all_admin_cs" ON public.content_outputs;
CREATE POLICY "content_outputs_all_admin_cs" ON public.content_outputs
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users u
            WHERE u.id = auth.uid() AND u.role IN ('admin', 'cs')
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users u
            WHERE u.id = auth.uid() AND u.role IN ('admin', 'cs')
        )
    );

-- Sellers: read all outputs (staff)
DROP POLICY IF EXISTS "content_outputs_select_seller" ON public.content_outputs;
CREATE POLICY "content_outputs_select_seller" ON public.content_outputs
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users u
            WHERE u.id = auth.uid() AND u.role = 'seller'
        )
    );

-- Closers: read all outputs (staff)
DROP POLICY IF EXISTS "content_outputs_select_closer" ON public.content_outputs;
CREATE POLICY "content_outputs_select_closer" ON public.content_outputs
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users u
            WHERE u.id = auth.uid() AND u.role = 'closer'
        )
    );

-- Clients: read only their own outputs
DROP POLICY IF EXISTS "content_outputs_select_own_client" ON public.content_outputs;
CREATE POLICY "content_outputs_select_own_client" ON public.content_outputs
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.clients c
            WHERE c.id = content_outputs.client_id
              AND c.auth_user_id = auth.uid()
        )
    );

-- -----------------------------------------------
-- 5. CALL_UPLOADS TABLE
--    Video/audio uploads for the call analysis pipeline.
-- -----------------------------------------------
CREATE TABLE IF NOT EXISTS public.call_uploads (
    id               UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id        UUID    REFERENCES public.clients(id) ON DELETE SET NULL,
    uploaded_by      UUID    REFERENCES auth.users(id),
    file_url         TEXT,
    file_path        TEXT,
    storage_bucket   TEXT,
    file_type        TEXT    CHECK (file_type IN ('audio', 'video')),
    duration_seconds INTEGER,
    transcription    TEXT,
    analysis_json    JSONB   NOT NULL DEFAULT '{}'::jsonb,
    status           TEXT    NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'transcribing', 'analyzing', 'done', 'error')),
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_call_uploads_client_id   ON public.call_uploads(client_id);
CREATE INDEX IF NOT EXISTS idx_call_uploads_uploaded_by ON public.call_uploads(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_call_uploads_status      ON public.call_uploads(status);

ALTER TABLE public.call_uploads ENABLE ROW LEVEL SECURITY;

-- Admins and CS: full access
DROP POLICY IF EXISTS "call_uploads_all_admin_cs" ON public.call_uploads;
CREATE POLICY "call_uploads_all_admin_cs" ON public.call_uploads
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users u
            WHERE u.id = auth.uid() AND u.role IN ('admin', 'cs')
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users u
            WHERE u.id = auth.uid() AND u.role IN ('admin', 'cs')
        )
    );

-- Sellers: read all call uploads (staff)
DROP POLICY IF EXISTS "call_uploads_select_seller" ON public.call_uploads;
CREATE POLICY "call_uploads_select_seller" ON public.call_uploads
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users u
            WHERE u.id = auth.uid() AND u.role = 'seller'
        )
    );

-- Closers: read all + insert/update their own uploads
DROP POLICY IF EXISTS "call_uploads_select_closer" ON public.call_uploads;
CREATE POLICY "call_uploads_select_closer" ON public.call_uploads
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users u
            WHERE u.id = auth.uid() AND u.role = 'closer'
        )
    );

DROP POLICY IF EXISTS "call_uploads_insert_closer" ON public.call_uploads;
CREATE POLICY "call_uploads_insert_closer" ON public.call_uploads
    FOR INSERT TO authenticated
    WITH CHECK (
        uploaded_by = auth.uid()
        AND EXISTS (
            SELECT 1 FROM public.users u
            WHERE u.id = auth.uid() AND u.role = 'closer'
        )
    );

-- Clients: read only their own call uploads
DROP POLICY IF EXISTS "call_uploads_select_own_client" ON public.call_uploads;
CREATE POLICY "call_uploads_select_own_client" ON public.call_uploads
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.clients c
            WHERE c.id = call_uploads.client_id
              AND c.auth_user_id = auth.uid()
        )
    );
