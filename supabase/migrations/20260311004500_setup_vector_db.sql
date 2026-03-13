-- Habilitar a extensão pgvector
CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA public;

-- Tipo enumerado para classificar os materiais
CREATE TYPE public.material_type_enum AS ENUM ('metodologia_master', 'produto_cliente');

-- Alterar a tabela client_materials para incluir o tipo de material e metadados de processamento
ALTER TABLE public.client_materials
ADD COLUMN material_type public.material_type_enum DEFAULT 'produto_cliente',
ADD COLUMN processing_status text DEFAULT 'ready', -- 'uploading', 'chunking', 'generating_embeddings', 'ready', 'error'
ADD COLUMN file_url text;

-- Criar tabela de fragmentos (chunks) para os materiais
CREATE TABLE public.material_chunks (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    material_id uuid REFERENCES public.client_materials(id) ON DELETE CASCADE,
    content text NOT NULL,
    chunk_index integer NOT NULL,
    embedding vector(768), -- Assumindo modelo de 768 dimensões. Pode ser 1536 para OpenAI text-embedding-3-small
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Ativar Row Level Security na tabela de chunks
ALTER TABLE public.material_chunks ENABLE ROW LEVEL SECURITY;

-- Índice para a busca de similaridade ser mais rápida
CREATE INDEX ON public.material_chunks USING hnsw (embedding vector_ip_ops);

-- ============================================================
-- Políticas da tabela material_chunks (Herdam a lógica do material pai)
-- ============================================================

-- 1. Admins veem tudo
CREATE POLICY "Admins full access to chunks" ON public.material_chunks
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

-- 2. Sellers podem ver os chunks de materiais do cliente que lhes foi designado OU metodologia master
CREATE POLICY "Sellers view assigned client chunks or master" ON public.material_chunks
  FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.client_materials m
        LEFT JOIN public.clients c ON m.client_id = c.id
        WHERE m.id = material_chunks.material_id 
        AND (m.material_type = 'metodologia_master' OR c.assigned_seller_id = auth.uid())
    )
  );

-- 3. Closers podem ver os chunks de materiais do cliente que lhes foi designado OU metodologia master
CREATE POLICY "Closers view assigned client chunks or master" ON public.material_chunks
  FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.client_materials m
        LEFT JOIN public.clients c ON m.client_id = c.id
        WHERE m.id = material_chunks.material_id 
        AND (m.material_type = 'metodologia_master' OR c.assigned_closer_id = auth.uid())
    )
  );

-- 4. Clients podem gerenciar seus próprios chunks (apenas do seu material vinculado)
CREATE POLICY "Clients manage own chunks" ON public.material_chunks
  FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.client_materials m
        JOIN public.clients c ON m.client_id = c.id
        WHERE m.id = material_chunks.material_id 
        AND c.email = (SELECT email FROM public.users WHERE id = auth.uid())
    )
  );

-- Criar a função RPC de Busca de Similaridade (Match)
CREATE OR REPLACE FUNCTION match_materials (
  query_embedding vector(768),
  match_threshold float,
  match_count int,
  p_seller_id uuid
)
RETURNS TABLE (
  id uuid,
  material_id uuid,
  content text,
  material_type public.material_type_enum,
  similarity float
)
LANGUAGE sql
AS $$
  SELECT
    c.id,
    c.material_id,
    c.content,
    m.material_type,
    1 - (c.embedding <=> query_embedding) AS similarity
  FROM public.material_chunks c
  JOIN public.client_materials m ON c.material_id = m.id
  LEFT JOIN public.clients cl ON m.client_id = cl.id
  WHERE 1 - (c.embedding <=> query_embedding) > match_threshold
    -- Garante que o usuário tem acesso ao material:
    -- A) É metodogia master (acesso livre para a IA consultar)
    -- B) O seller_id mandado é o assinalado para o cliente (SS ou Closer)
    AND (
      m.material_type = 'metodologia_master' 
      OR cl.assigned_seller_id = p_seller_id 
      OR cl.assigned_closer_id = p_seller_id
    )
  ORDER BY c.embedding <=> query_embedding
  LIMIT match_count;
$$;
