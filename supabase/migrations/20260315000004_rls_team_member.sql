-- RLS policies for team_member role
-- team_member shares the same client_id as the client who created them.
-- They can access data scoped to that client_id.

-- Helper function: get current user's client_id
CREATE OR REPLACE FUNCTION public.get_my_client_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT client_id FROM public.users WHERE id = auth.uid();
$$;

-- daily_submissions: team_member can INSERT and SELECT their client's data
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'daily_submissions') THEN
    -- SELECT: team_member can see submissions for their client
    CREATE POLICY "team_member_select_submissions"
      ON public.daily_submissions FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM public.users u
          WHERE u.id = auth.uid()
            AND u.role = 'team_member'
            AND u.client_id IS NOT NULL
            AND daily_submissions.client_id = u.client_id
        )
      );

    -- INSERT: team_member can create submissions for their client
    CREATE POLICY "team_member_insert_submissions"
      ON public.daily_submissions FOR INSERT
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.users u
          WHERE u.id = auth.uid()
            AND u.role = 'team_member'
            AND u.client_id IS NOT NULL
            AND daily_submissions.client_id = u.client_id
        )
      );
  END IF;
END $$;

-- agent_conversations: team_member can do ALL on their own rows
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'agent_conversations') THEN
    CREATE POLICY "team_member_own_conversations"
      ON public.agent_conversations FOR ALL
      USING (user_id = auth.uid())
      WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

-- client_materials: team_member can SELECT materials for their client
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'client_materials') THEN
    CREATE POLICY "team_member_select_materials"
      ON public.client_materials FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM public.users u
          WHERE u.id = auth.uid()
            AND u.role = 'team_member'
            AND u.client_id IS NOT NULL
            AND client_materials.client_id = u.client_id
        )
      );
  END IF;
END $$;

-- users: team_member can read their own profile
DO $$
BEGIN
  -- Only create if the policy doesn't exist already
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'team_member_read_own_profile' AND tablename = 'users'
  ) THEN
    CREATE POLICY "team_member_read_own_profile"
      ON public.users FOR SELECT
      USING (id = auth.uid());
  END IF;
END $$;
