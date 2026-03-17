-- Migration: Colunas faltantes em tabelas existentes
-- Adiciona campos usados no código mas ausentes no schema atual.
-- Data: 2026-03-15
-- IMPORTANTE: Usa ADD COLUMN IF NOT EXISTS — idempotente e seguro.

-- =============================================================
-- TABELA: clients
-- Campos de projeto visíveis no painel do cliente e usados
-- pelo AdminDashboard para atribuição de equipe.
-- =============================================================
ALTER TABLE public.clients
    ADD COLUMN IF NOT EXISTS is_beta                BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS project_summary        TEXT,
    ADD COLUMN IF NOT EXISTS current_phase          TEXT,
    ADD COLUMN IF NOT EXISTS next_step              TEXT,
    ADD COLUMN IF NOT EXISTS team_status            TEXT,
    ADD COLUMN IF NOT EXISTS operational_processes  TEXT,
    ADD COLUMN IF NOT EXISTS assigned_seller_id     UUID REFERENCES public.users(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS assigned_closer_id     UUID REFERENCES public.users(id) ON DELETE SET NULL;

-- =============================================================
-- TABELA: users
-- Campos necessários para autenticação por role, vinculação
-- ao cliente e dados de contato.
-- =============================================================
ALTER TABLE public.users
    ADD COLUMN IF NOT EXISTS client_id  UUID REFERENCES public.clients(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS role       TEXT DEFAULT 'client'
                                            CHECK (role IN ('admin', 'seller', 'closer', 'client', 'cs')),
    ADD COLUMN IF NOT EXISTS name       TEXT,
    ADD COLUMN IF NOT EXISTS email      TEXT,
    ADD COLUMN IF NOT EXISTS company    TEXT,
    ADD COLUMN IF NOT EXISTS phone      TEXT,
    ADD COLUMN IF NOT EXISTS status     TEXT DEFAULT 'pending'
                                            CHECK (status IN ('pending', 'active', 'suspended'));

-- Índice para busca de usuários por client_id (N+1 prevention)
CREATE INDEX IF NOT EXISTS idx_users_client_id
    ON public.users(client_id);

-- Índice para busca por role (usado em AdminDashboard para filtrar equipe)
CREATE INDEX IF NOT EXISTS idx_users_role
    ON public.users(role);

-- =============================================================
-- TABELA: seller_scripts
-- A migration anterior (20260310224500) criou esta tabela com
-- script_type CHECK restrito ('dispatch','followup','closing','general').
-- O código em SellerPlaybook.tsx usa os campos `type` e `user_id`
-- (alias de seller_id) e valores como 'script','blacklist','objection_handling'.
-- O ScriptsPage também usa 'pitch' e 'objection'.
-- Solução: adicionar coluna `type` para o Playbook e expandir
-- o CHECK via DROP CONSTRAINT + ADD CONSTRAINT.
-- =============================================================

-- Adiciona coluna `type` usada pelo SellerPlaybook (distinto de script_type)
ALTER TABLE public.seller_scripts
    ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'script'
                                    CHECK (type IN ('script', 'blacklist', 'objection_handling'));

-- Adiciona coluna `user_id` como alias de seller_id para compatibilidade
-- com SellerPlaybook que faz .eq('user_id', user.id)
ALTER TABLE public.seller_scripts
    ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES public.users(id) ON DELETE CASCADE;

-- Remove o CHECK restrito do script_type para acomodar 'pitch' e 'objection'
-- usados em ScriptsPage, sem quebrar dados existentes.
ALTER TABLE public.seller_scripts
    DROP CONSTRAINT IF EXISTS seller_scripts_script_type_check;

ALTER TABLE public.seller_scripts
    ADD CONSTRAINT seller_scripts_script_type_check
    CHECK (script_type IN ('dispatch', 'followup', 'closing', 'general', 'pitch', 'objection', 'other'));
