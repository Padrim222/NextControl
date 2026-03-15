-- Next Control CRM Schema
-- Compatible with Neon Postgres and Supabase

-- Users with roles
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT CHECK (role IN ('admin', 'seller', 'closer', 'client')) NOT NULL,
  status TEXT CHECK (status IN ('pending', 'active', 'suspended')) DEFAULT 'pending',
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()

);

ALTER TABLE public.users DROP COLUMN IF EXISTS password_hash;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS status TEXT CHECK (status IN ('pending', 'active', 'suspended')) DEFAULT 'pending';

-- Clients (companies being managed)
CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT, -- Link to User account
  company TEXT,
  assigned_seller_id UUID REFERENCES users(id),
  assigned_closer_id UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Safely add email column if it doesn't exist (handle migration)
ALTER TABLE clients ADD COLUMN IF NOT EXISTS email TEXT;

-- Daily reports from sellers
CREATE TABLE IF NOT EXISTS daily_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID REFERENCES users(id) NOT NULL,
  client_id UUID REFERENCES clients(id) NOT NULL,
  report_date DATE NOT NULL,
  status TEXT CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',

  -- Funnel metrics
  chat_ativo INT DEFAULT 0,
  boas_vindas INT DEFAULT 0,
  reaquecimento INT DEFAULT 0,
  nutricao INT DEFAULT 0,
  conexoes INT DEFAULT 0,
  mapeamentos INT DEFAULT 0,
  pitchs INT DEFAULT 0,
  capturas INT DEFAULT 0,
  followups INT DEFAULT 0,

  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(seller_id, client_id, report_date)
);

-- Call transcriptions from closers
CREATE TABLE IF NOT EXISTS call_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  closer_id UUID REFERENCES users(id) NOT NULL,
  client_id UUID REFERENCES clients(id) NOT NULL,
  call_date DATE NOT NULL,
  transcription TEXT,
  outcome TEXT CHECK (outcome IN ('sale', 'no_sale', 'reschedule', 'no_show')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- AI-generated feedback
CREATE TABLE IF NOT EXISTS ai_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID REFERENCES daily_reports(id) NOT NULL,
  generated_by UUID REFERENCES users(id),
  feedback_text TEXT NOT NULL,
  model TEXT DEFAULT 'gpt-4o',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Weekly consolidated reports (for clients)
CREATE TABLE IF NOT EXISTS weekly_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) NOT NULL,
  week_start DATE NOT NULL,
  week_end DATE NOT NULL,

  -- Aggregated metrics
  total_chat_ativo INT DEFAULT 0,
  total_boas_vindas INT DEFAULT 0,
  total_conexoes INT DEFAULT 0,
  total_mapeamentos INT DEFAULT 0,
  total_pitchs INT DEFAULT 0,
  total_capturas INT DEFAULT 0,

  -- Conversion rates (calculated)
  conv_bv_to_conexao DECIMAL(5,2),
  conv_conexao_to_map DECIMAL(5,2),
  conv_map_to_pitch DECIMAL(5,2),
  conv_pitch_to_captura DECIMAL(5,2),

  summary TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(client_id, week_start)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_daily_reports_seller ON daily_reports(seller_id);
CREATE INDEX IF NOT EXISTS idx_daily_reports_client ON daily_reports(client_id);
CREATE INDEX IF NOT EXISTS idx_daily_reports_date ON daily_reports(report_date);
CREATE INDEX IF NOT EXISTS idx_daily_reports_status ON daily_reports(status);
CREATE INDEX IF NOT EXISTS idx_call_logs_closer ON call_logs(closer_id);
CREATE INDEX IF NOT EXISTS idx_call_logs_client ON call_logs(client_id);
CREATE INDEX IF NOT EXISTS idx_weekly_reports_client ON weekly_reports(client_id);
