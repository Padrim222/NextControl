-- Add agent_target column to separate materials by agent (SS vs Closer)
ALTER TABLE public.client_materials
  ADD COLUMN IF NOT EXISTS agent_target TEXT DEFAULT 'both'
  CHECK (agent_target IN ('ss', 'closer', 'both'));
