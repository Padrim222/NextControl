-- Ativa RLS para a tabela client_materials
ALTER TABLE public.client_materials ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- Políticas para client_materials
-- ============================================================

-- 1. Admins têm acesso total a todos os materiais
DROP POLICY IF EXISTS "Admins full access to client_materials" ON public.client_materials;
CREATE POLICY "Admins full access to client_materials" ON public.client_materials
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

-- 2. Sellers podem ver os materiais apenas dos clientes que lhes foram designados
DROP POLICY IF EXISTS "Sellers view assigned client materials" ON public.client_materials;
CREATE POLICY "Sellers view assigned client materials" ON public.client_materials
  FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.clients 
        WHERE id = client_materials.client_id 
        AND assigned_seller_id = auth.uid()
    )
  );

-- 3. Closers podem ver os materiais apenas dos clientes que lhes foram designados
DROP POLICY IF EXISTS "Closers view assigned client materials" ON public.client_materials;
CREATE POLICY "Closers view assigned client materials" ON public.client_materials
  FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.clients 
        WHERE id = client_materials.client_id 
        AND assigned_closer_id = auth.uid()
    )
  );

-- 4. O próprio cliente pode ver, inserir, atualizar e deletar seus materiais
DROP POLICY IF EXISTS "Clients manage own materials" ON public.client_materials;
CREATE POLICY "Clients manage own materials" ON public.client_materials
  FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.clients 
        WHERE id = client_materials.client_id 
        AND email = (SELECT email FROM public.users WHERE id = auth.uid())
    )
  );
