CREATE TABLE IF NOT EXISTS public.seller_playbooks (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) NOT NULL,
        type TEXT CHECK (type IN ('script', 'blacklist', 'objection_handling')) NOT NULL,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for faster queries per user
CREATE INDEX IF NOT EXISTS idx_seller_playbooks_user ON public.seller_playbooks(user_id);
