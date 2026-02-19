-- ============================================
-- TREINADOR DE BOLSO — Database Schema Migration
-- Version: 1.0 (MVP)
-- Date: 2026-02-18
-- 
-- New tables per PRD Section 5.1
-- Non-destructive: existing tables preserved
-- ============================================

-- Extend users table with seller-specific fields
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS seller_type TEXT CHECK (seller_type IN ('seller', 'closer'));
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS cs_id UUID REFERENCES public.users(id);
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- Daily Submissions (replaces daily_reports for the new flow)
CREATE TABLE IF NOT EXISTS public.daily_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID REFERENCES public.users(id) NOT NULL,
  submission_date DATE NOT NULL DEFAULT CURRENT_DATE,
  
  -- Metrics (JSONB for flexibility: sellers vs closers have different fields)
  metrics JSONB DEFAULT '{}',
  -- Seller metrics: { approaches, followups, proposals, sales }
  -- Closer metrics: { calls_made, conversion_rate, main_objections }
  
  -- Conversation prints (up to 5 image URLs)
  conversation_prints TEXT[] DEFAULT '{}',
  
  -- Call recording URL (closers only)
  call_recording TEXT,
  
  -- Free-text notes
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(seller_id, submission_date)
);

-- AI Analyses (one per submission, one per agent type)
CREATE TABLE IF NOT EXISTS public.analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID REFERENCES public.daily_submissions(id) NOT NULL,
  agent_type TEXT CHECK (agent_type IN ('social_selling', 'call_analysis', 'metrics')) NOT NULL,
  
  -- Analysis content
  content TEXT NOT NULL,
  strengths TEXT[] DEFAULT '{}',
  improvements TEXT[] DEFAULT '{}',
  patterns JSONB DEFAULT '{}',
  next_steps TEXT[] DEFAULT '{}',
  score INT CHECK (score >= 0 AND score <= 100),
  
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Reports (PDF output with approval workflow)
CREATE TABLE IF NOT EXISTS public.reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID REFERENCES public.users(id) NOT NULL,
  submission_id UUID REFERENCES public.daily_submissions(id),
  analysis_id UUID REFERENCES public.analyses(id),
  
  -- Generated PDF
  pdf_url TEXT,
  
  -- Approval workflow: pending → approved → delivered
  status TEXT CHECK (status IN ('pending', 'approved', 'delivered')) DEFAULT 'pending',
  
  -- CS review
  reviewed_by UUID REFERENCES public.users(id),
  review_notes TEXT,
  
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Coach chatbot interactions
CREATE TABLE IF NOT EXISTS public.coach_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID REFERENCES public.users(id) NOT NULL,
  
  question TEXT NOT NULL,
  answer TEXT,
  
  -- Context snapshot for personalization
  context JSONB DEFAULT '{}',
  -- { recent_scores, strengths, weaknesses, seller_type, tenure_months }
  
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_daily_submissions_seller ON public.daily_submissions(seller_id);
CREATE INDEX IF NOT EXISTS idx_daily_submissions_date ON public.daily_submissions(submission_date);
CREATE INDEX IF NOT EXISTS idx_analyses_submission ON public.analyses(submission_id);
CREATE INDEX IF NOT EXISTS idx_reports_seller ON public.reports(seller_id);
CREATE INDEX IF NOT EXISTS idx_reports_status ON public.reports(status);
CREATE INDEX IF NOT EXISTS idx_coach_interactions_seller ON public.coach_interactions(seller_id);

-- Enable RLS on new tables
ALTER TABLE public.daily_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coach_interactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Sellers can read/write their own data
CREATE POLICY "Sellers manage own submissions" ON public.daily_submissions
  FOR ALL USING (auth.uid() = seller_id);

CREATE POLICY "Sellers read own analyses" ON public.analyses
  FOR SELECT USING (
    submission_id IN (SELECT id FROM public.daily_submissions WHERE seller_id = auth.uid())
  );

CREATE POLICY "Sellers read own reports" ON public.reports
  FOR SELECT USING (auth.uid() = seller_id);

CREATE POLICY "CS manages reports" ON public.reports
  FOR ALL USING (
    auth.uid() IN (SELECT id FROM public.users WHERE role = 'admin')
  );

CREATE POLICY "Sellers manage own coach interactions" ON public.coach_interactions
  FOR ALL USING (auth.uid() = seller_id);

-- Admin/CS can read everything
CREATE POLICY "Admin reads all submissions" ON public.daily_submissions
  FOR SELECT USING (
    auth.uid() IN (SELECT id FROM public.users WHERE role = 'admin')
  );

CREATE POLICY "Admin reads all analyses" ON public.analyses
  FOR SELECT USING (
    auth.uid() IN (SELECT id FROM public.users WHERE role = 'admin')
  );
