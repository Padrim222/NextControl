-- ============================================
-- Next Control — Public Forms Migration
-- Creates form_submissions table for public form links
-- ============================================

-- Enum for form types
DO $$ BEGIN
    CREATE TYPE public.form_type AS ENUM ('expert_weekly', 'seller_daily', 'closer_daily');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Main table
CREATE TABLE IF NOT EXISTS public.form_submissions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    form_type public.form_type NOT NULL,

    -- Identification (no auth required)
    submitter_name TEXT NOT NULL,
    submitter_email TEXT,
    submitter_phone TEXT,

    -- Optional link to existing user/client
    user_id UUID REFERENCES auth.users(id),
    client_id UUID REFERENCES public.clients(id),

    -- Form data (polymorphic JSONB — schema varies by form_type)
    data JSONB NOT NULL DEFAULT '{}',

    -- Attached file URLs from Supabase Storage
    attachments TEXT[] DEFAULT '{}',

    -- Metadata
    submission_date DATE NOT NULL DEFAULT CURRENT_DATE,

    -- AI Analysis tracking
    ai_analysis_id UUID,
    ai_score INTEGER,
    ai_status TEXT DEFAULT 'pending' CHECK (ai_status IN ('pending', 'processing', 'done', 'error')),

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_form_submissions_type ON public.form_submissions(form_type);
CREATE INDEX IF NOT EXISTS idx_form_submissions_date ON public.form_submissions(submission_date);
CREATE INDEX IF NOT EXISTS idx_form_submissions_name ON public.form_submissions(submitter_name);
CREATE INDEX IF NOT EXISTS idx_form_submissions_client ON public.form_submissions(client_id);
CREATE INDEX IF NOT EXISTS idx_form_submissions_ai ON public.form_submissions(ai_status);

-- RLS
ALTER TABLE public.form_submissions ENABLE ROW LEVEL SECURITY;

-- Anyone can submit (anonymous insert)
CREATE POLICY "Anyone can submit forms" ON public.form_submissions
    FOR INSERT TO anon, authenticated WITH CHECK (true);

-- Authenticated users can read
CREATE POLICY "Authenticated users read submissions" ON public.form_submissions
    FOR SELECT TO authenticated USING (true);

-- Admin full access
CREATE POLICY "Admin manages all form submissions" ON public.form_submissions
    FOR ALL TO authenticated USING (
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
    );
