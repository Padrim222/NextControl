-- Migration for Agent Conversations and Seller Scripts

-- Table: agent_conversations
CREATE TABLE public.agent_conversations (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    seller_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    agent_type text NOT NULL CHECK (agent_type IN ('ss', 'closer')),
    channel text NOT NULL CHECK (channel IN ('whatsapp', 'instagram', 'linkedin', 'call')),
    lead_context jsonb DEFAULT '{}'::jsonb,
    messages jsonb DEFAULT '[]'::jsonb,
    capability_used text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    PRIMARY KEY (id)
);

-- Table: seller_scripts
CREATE TABLE public.seller_scripts (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    seller_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name text NOT NULL,
    content text NOT NULL,
    script_type text NOT NULL CHECK (script_type IN ('dispatch', 'followup', 'closing', 'general')),
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    PRIMARY KEY (id)
);

-- Enable RLS
ALTER TABLE public.agent_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seller_scripts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for agent_conversations
-- Users can see their own conversations
CREATE POLICY "Users can view own conversations" 
ON public.agent_conversations FOR SELECT 
USING (auth.uid() = seller_id);

-- Users can insert their own conversations
CREATE POLICY "Users can insert own conversations" 
ON public.agent_conversations FOR INSERT 
WITH CHECK (auth.uid() = seller_id);

-- Admins/Managers can view all conversations
CREATE POLICY "Admins can view all conversations" 
ON public.agent_conversations FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE users.id = auth.uid() 
    AND users.role IN ('admin')
  )
);

-- RLS Policies for seller_scripts
-- Users can see their own scripts
CREATE POLICY "Users can view own scripts" 
ON public.seller_scripts FOR SELECT 
USING (auth.uid() = seller_id);

-- Users can insert their own scripts
CREATE POLICY "Users can insert own scripts" 
ON public.seller_scripts FOR INSERT 
WITH CHECK (auth.uid() = seller_id);

-- Users can update their own scripts
CREATE POLICY "Users can update own scripts" 
ON public.seller_scripts FOR UPDATE 
USING (auth.uid() = seller_id);

-- Users can delete their own scripts
CREATE POLICY "Users can delete own scripts" 
ON public.seller_scripts FOR DELETE 
USING (auth.uid() = seller_id);

-- Admins/Managers can view all scripts
CREATE POLICY "Admins can view all scripts" 
ON public.seller_scripts FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE users.id = auth.uid() 
    AND users.role IN ('admin')
  )
);

-- Trigger for updated_at on seller_scripts
CREATE OR REPLACE FUNCTION update_seller_scripts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_seller_scripts_timestamp
BEFORE UPDATE ON public.seller_scripts
FOR EACH ROW
EXECUTE FUNCTION update_seller_scripts_updated_at();
