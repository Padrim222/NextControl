-- =============================================================================
-- Migration: 20260313_002_team_rls_scoping
-- Description: Atualiza RLS para arquitetura de times.
--
-- ARQUITETURA DE USUÁRIOS (definida com Rafa):
--   1. admin  — equipe NextControl, acesso total
--   2. cs     — Head de Vendas (ex: Jô), gerencia clientes e times
--   3. client — Expert/dono do negócio, acesso ao próprio painel
--   4. seller — Time de Vendas compartilhado, acessa apenas os dados do seu cliente
--   5. closer — Time de Vendas (closers), acessa apenas os dados do seu cliente
--
-- MUDANÇA CHAVE: seller e closer agora ficam SCOPED ao seu client_id.
-- O time inteiro de um cliente compartilha as mesmas credenciais de login
-- (um usuário seller + um usuário closer por cliente).
-- =============================================================================

-- -----------------------------------------------
-- Adicionar client_id ao users se não existir
-- (pipeline migration já deve ter adicionado, mas garantindo)
-- -----------------------------------------------
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name   = 'users'
          AND column_name  = 'client_id'
    ) THEN
        ALTER TABLE public.users
            ADD COLUMN client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL;
    END IF;
END $$;

-- -----------------------------------------------
-- REATUALIZAR POLICIES de client_materials
-- Sellers e closers: apenas materiais do SEU client_id
-- -----------------------------------------------

-- Remove políticas antigas que davam acesso total a sellers/closers
DROP POLICY IF EXISTS "client_materials_select_seller" ON public.client_materials;
DROP POLICY IF EXISTS "client_materials_select_closer" ON public.client_materials;

-- Sellers: ver apenas materiais do cliente ao qual estão vinculados
CREATE POLICY "client_materials_select_seller_scoped" ON public.client_materials
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users u
            WHERE u.id = auth.uid()
              AND u.role = 'seller'
              AND u.client_id = client_materials.client_id
        )
    );

-- Closers: ver apenas materiais do cliente ao qual estão vinculados
CREATE POLICY "client_materials_select_closer_scoped" ON public.client_materials
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users u
            WHERE u.id = auth.uid()
              AND u.role = 'closer'
              AND u.client_id = client_materials.client_id
        )
    );

-- -----------------------------------------------
-- REATUALIZAR POLICIES de content_outputs
-- -----------------------------------------------

DROP POLICY IF EXISTS "content_outputs_select_seller" ON public.content_outputs;
DROP POLICY IF EXISTS "content_outputs_select_closer" ON public.content_outputs;

CREATE POLICY "content_outputs_select_seller_scoped" ON public.content_outputs
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users u
            WHERE u.id = auth.uid()
              AND u.role = 'seller'
              AND u.client_id = content_outputs.client_id
        )
    );

CREATE POLICY "content_outputs_select_closer_scoped" ON public.content_outputs
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users u
            WHERE u.id = auth.uid()
              AND u.role = 'closer'
              AND u.client_id = content_outputs.client_id
        )
    );

-- -----------------------------------------------
-- REATUALIZAR POLICIES de call_uploads
-- -----------------------------------------------

DROP POLICY IF EXISTS "call_uploads_select_seller" ON public.call_uploads;
DROP POLICY IF EXISTS "call_uploads_select_closer" ON public.call_uploads;
DROP POLICY IF EXISTS "call_uploads_insert_closer" ON public.call_uploads;

-- Sellers: ver calls do seu cliente
CREATE POLICY "call_uploads_select_seller_scoped" ON public.call_uploads
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users u
            WHERE u.id = auth.uid()
              AND u.role = 'seller'
              AND u.client_id = call_uploads.client_id
        )
    );

-- Closers: ver + inserir calls do seu cliente
CREATE POLICY "call_uploads_select_closer_scoped" ON public.call_uploads
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users u
            WHERE u.id = auth.uid()
              AND u.role = 'closer'
              AND u.client_id = call_uploads.client_id
        )
    );

CREATE POLICY "call_uploads_insert_closer_scoped" ON public.call_uploads
    FOR INSERT TO authenticated
    WITH CHECK (
        uploaded_by = auth.uid()
        AND EXISTS (
            SELECT 1 FROM public.users u
            WHERE u.id = auth.uid()
              AND u.role = 'closer'
              AND u.client_id = call_uploads.client_id
        )
    );

-- -----------------------------------------------
-- POLICIES de clients: sellers/closers veem apenas o SEU cliente
-- -----------------------------------------------

DROP POLICY IF EXISTS "clients_select_seller" ON public.clients;
DROP POLICY IF EXISTS "clients_select_closer" ON public.clients;

CREATE POLICY "clients_select_seller_scoped" ON public.clients
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users u
            WHERE u.id = auth.uid()
              AND u.role = 'seller'
              AND u.client_id = clients.id
        )
    );

CREATE POLICY "clients_select_closer_scoped" ON public.clients
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users u
            WHERE u.id = auth.uid()
              AND u.role = 'closer'
              AND u.client_id = clients.id
        )
    );

-- -----------------------------------------------
-- POLICY: CS (Head de Vendas) pode ver e atualizar users do seu time
-- CS já tem acesso total via clients_all_admin_cs, mas garantir em users
-- -----------------------------------------------

DROP POLICY IF EXISTS "users_write_cs" ON public.users;
CREATE POLICY "users_write_cs" ON public.users
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
