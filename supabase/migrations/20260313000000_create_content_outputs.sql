-- Create content_outputs table
CREATE TABLE IF NOT EXISTS public.content_outputs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    type TEXT NOT NULL, -- e.g., 'script', 'post', 'email', 'copy'
    content TEXT NOT NULL,
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'review', 'approved', 'rejected')),
    created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Active RLS
ALTER TABLE public.content_outputs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Admins can manage all content outputs"
    ON public.content_outputs
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid() AND users.role = 'admin'
        )
    );

CREATE POLICY "CS can manage all content outputs"
    ON public.content_outputs
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid() AND users.role = 'cs'
        )
    );

CREATE POLICY "Sellers can view content outputs for their clients"
    ON public.content_outputs
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.clients
            WHERE clients.id = content_outputs.client_id
            AND clients.assigned_seller_id = auth.uid()
        )
    );

CREATE POLICY "Closers can view content outputs for their clients"
    ON public.content_outputs
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.clients
            WHERE clients.id = content_outputs.client_id
            AND clients.assigned_closer_id = auth.uid()
        )
    );

CREATE POLICY "Clients can view their own content outputs"
    ON public.content_outputs
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid()
            AND users.client_id = content_outputs.client_id
        )
    );

-- Function to handle updated_at
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.content_outputs
    FOR EACH ROW EXECUTE PROCEDURE moddatetime (updated_at);
