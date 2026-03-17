-- Add team_member to users.role constraint
-- team_member = shared login per client for their sales team

-- Drop the existing CHECK constraint on role (name may vary)
DO $$
BEGIN
  -- Try to drop by common constraint names
  ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_role_check;
  ALTER TABLE public.users DROP CONSTRAINT IF EXISTS check_role;
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

-- Re-add with team_member included
ALTER TABLE public.users
  ADD CONSTRAINT users_role_check
  CHECK (role IN ('admin', 'seller', 'closer', 'client', 'cs', 'team_member'));
