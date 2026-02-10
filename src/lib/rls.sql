-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.call_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_reports ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- USERS TABLE POLICIES
-- ============================================================
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Admins can view all profiles" ON public.users;
CREATE POLICY "Admins can view all profiles" ON public.users
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Admins can update any profile" ON public.users;
CREATE POLICY "Admins can update any profile" ON public.users
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

-- Auto-create public.users profile on auth signup (SECURITY DEFINER bypasses RLS)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name, role, status)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'client'),
    'active'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
CREATE POLICY "Users can insert own profile" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- ============================================================
-- CLIENTS TABLE POLICIES
-- ============================================================
DROP POLICY IF EXISTS "Admins full access to clients" ON public.clients;
CREATE POLICY "Admins full access to clients" ON public.clients
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "Sellers view assigned clients" ON public.clients;
CREATE POLICY "Sellers view assigned clients" ON public.clients
  FOR SELECT USING (assigned_seller_id = auth.uid());

DROP POLICY IF EXISTS "Closers view assigned clients" ON public.clients;
CREATE POLICY "Closers view assigned clients" ON public.clients
  FOR SELECT USING (assigned_closer_id = auth.uid());

DROP POLICY IF EXISTS "Clients view own record" ON public.clients;
CREATE POLICY "Clients view own record" ON public.clients
  FOR SELECT USING (
    email = (SELECT email FROM public.users WHERE id = auth.uid())
  );

-- ============================================================
-- DAILY_REPORTS TABLE POLICIES
-- ============================================================
DROP POLICY IF EXISTS "Admins full access to daily_reports" ON public.daily_reports;
CREATE POLICY "Admins full access to daily_reports" ON public.daily_reports
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "Sellers view own reports" ON public.daily_reports;
CREATE POLICY "Sellers view own reports" ON public.daily_reports
  FOR SELECT USING (seller_id = auth.uid());

DROP POLICY IF EXISTS "Sellers create own reports" ON public.daily_reports;
CREATE POLICY "Sellers create own reports" ON public.daily_reports
  FOR INSERT WITH CHECK (seller_id = auth.uid());

DROP POLICY IF EXISTS "Clients view approved reports" ON public.daily_reports;
CREATE POLICY "Clients view approved reports" ON public.daily_reports
  FOR SELECT USING (
    status = 'approved' AND
    client_id IN (
      SELECT id FROM public.clients WHERE email = (SELECT email FROM public.users WHERE id = auth.uid())
    )
  );

-- ============================================================
-- CALL_LOGS TABLE POLICIES
-- ============================================================
DROP POLICY IF EXISTS "Admins full access to call_logs" ON public.call_logs;
CREATE POLICY "Admins full access to call_logs" ON public.call_logs
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "Closers view own logs" ON public.call_logs;
CREATE POLICY "Closers view own logs" ON public.call_logs
  FOR SELECT USING (closer_id = auth.uid());

DROP POLICY IF EXISTS "Closers create own logs" ON public.call_logs;
CREATE POLICY "Closers create own logs" ON public.call_logs
  FOR INSERT WITH CHECK (closer_id = auth.uid());

-- ============================================================
-- AI_FEEDBACK TABLE POLICIES
-- ============================================================
DROP POLICY IF EXISTS "Admins full access to ai_feedback" ON public.ai_feedback;
CREATE POLICY "Admins full access to ai_feedback" ON public.ai_feedback
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "Sellers view feedback for own reports" ON public.ai_feedback;
CREATE POLICY "Sellers view feedback for own reports" ON public.ai_feedback
  FOR SELECT USING (
    report_id IN (SELECT id FROM public.daily_reports WHERE seller_id = auth.uid())
  );

-- ============================================================
-- WEEKLY_REPORTS TABLE POLICIES
-- ============================================================
DROP POLICY IF EXISTS "Admins full access to weekly_reports" ON public.weekly_reports;
CREATE POLICY "Admins full access to weekly_reports" ON public.weekly_reports
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "Clients view own weekly reports" ON public.weekly_reports;
CREATE POLICY "Clients view own weekly reports" ON public.weekly_reports
  FOR SELECT USING (
    client_id IN (
      SELECT id FROM public.clients WHERE email = (SELECT email FROM public.users WHERE id = auth.uid())
    )
  );
