-- ================================================
-- Migration: Conselho RY Mind Map Features
-- Date: 2026-02-11
-- Description: Adds tables for CS Inbox, Head Agent Analysis,
--              Improvement Checklists, and Training Materials
-- ================================================

-- Client Questions (CS Inbox - "Cliente mandou dúvida")
CREATE TABLE IF NOT EXISTS client_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) NOT NULL,
  asked_by TEXT NOT NULL, -- Name of person who asked
  question_text TEXT NOT NULL,
  status TEXT CHECK (status IN ('pending', 'answered', 'escalated')) DEFAULT 'pending',
  response_text TEXT,
  responded_by UUID REFERENCES users(id),
  escalated_to TEXT, -- 'yorik' or 'head'
  created_at TIMESTAMPTZ DEFAULT now(),
  responded_at TIMESTAMPTZ
);

-- Head Agent Analysis ("AGENTE HEAD AUTOMATIZADO")
CREATE TABLE IF NOT EXISTS head_agent_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID REFERENCES daily_reports(id),
  call_log_id UUID REFERENCES call_logs(id),

  -- Operational Analysis
  response_time_score INT CHECK (response_time_score BETWEEN 1 AND 10),
  script_adherence_score INT CHECK (script_adherence_score BETWEEN 1 AND 10),
  organization_score INT CHECK (organization_score BETWEEN 1 AND 10),
  operational_notes TEXT,

  -- Tactical Analysis
  correct_product_offered BOOLEAN,
  methodology_followed BOOLEAN,
  tactical_notes TEXT,

  -- Generated Recommendations
  suggested_scripts TEXT,
  new_strategies TEXT,
  errors_identified TEXT,

  -- Status
  status TEXT CHECK (status IN ('draft', 'approved', 'rejected', 'sent')) DEFAULT 'draft',
  approved_by UUID REFERENCES users(id),
  approved_at TIMESTAMPTZ,
  sent_via_whatsapp BOOLEAN DEFAULT false,
  sent_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT now()
);

-- Improvement Checklists (Checklist de Melhoria)
CREATE TABLE IF NOT EXISTS improvement_checklists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_id UUID REFERENCES head_agent_analysis(id) NOT NULL,
  seller_id UUID REFERENCES users(id),
  closer_id UUID REFERENCES users(id),

  title TEXT NOT NULL,
  items JSONB NOT NULL DEFAULT '[]', -- Array of {text: string, checked: boolean}

  created_at TIMESTAMPTZ DEFAULT now()
);

-- Training Materials ("AGENTE Head treinamento 24/7")
CREATE TABLE IF NOT EXISTS training_materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT CHECK (category IN ('script', 'methodology', 'strategy', 'best_practice', 'error_pattern')) NOT NULL,
  target_role TEXT CHECK (target_role IN ('seller', 'closer', 'both')) DEFAULT 'both',

  -- Auto-generated from analysis
  source_analysis_id UUID REFERENCES head_agent_analysis(id),

  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_client_questions_client ON client_questions(client_id);
CREATE INDEX IF NOT EXISTS idx_client_questions_status ON client_questions(status);
CREATE INDEX IF NOT EXISTS idx_head_agent_analysis_report ON head_agent_analysis(report_id);
CREATE INDEX IF NOT EXISTS idx_head_agent_analysis_status ON head_agent_analysis(status);
CREATE INDEX IF NOT EXISTS idx_improvement_checklists_analysis ON improvement_checklists(analysis_id);
CREATE INDEX IF NOT EXISTS idx_training_materials_role ON training_materials(target_role);
CREATE INDEX IF NOT EXISTS idx_training_materials_category ON training_materials(category);
