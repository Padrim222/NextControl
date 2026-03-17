-- Enable pgvector
CREATE EXTENSION IF NOT EXISTS vector;

-- Add embedding column to rag_documents
ALTER TABLE public.rag_documents
  ADD COLUMN IF NOT EXISTS embedding vector(1536);

-- HNSW index for fast cosine similarity (better than IVFFlat for < 1M rows)
CREATE INDEX IF NOT EXISTS rag_documents_embedding_hnsw_idx
  ON public.rag_documents
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

-- Semantic search RPC: returns top-N chunks by cosine similarity
CREATE OR REPLACE FUNCTION public.match_rag_documents(
  query_embedding vector(1536),
  match_threshold float    DEFAULT 0.45,
  match_count     int      DEFAULT 10,
  p_agent_type    text     DEFAULT NULL,
  p_client_id     uuid     DEFAULT NULL
)
RETURNS TABLE (
  id          uuid,
  title       text,
  content     text,
  category    text,
  agent_type  text,
  similarity  float
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    rd.id,
    rd.title,
    rd.content,
    rd.category,
    rd.agent_type,
    (1 - (rd.embedding <=> query_embedding))::float AS similarity
  FROM public.rag_documents rd
  WHERE
    rd.is_active = true
    AND rd.embedding IS NOT NULL
    AND (1 - (rd.embedding <=> query_embedding)) > match_threshold
    AND (p_agent_type IS NULL OR rd.agent_type = p_agent_type OR rd.agent_type = 'geral')
    AND (p_client_id IS NULL OR rd.client_id = p_client_id OR rd.client_id IS NULL)
  ORDER BY rd.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Fix agent_conversations: add missing columns
ALTER TABLE public.agent_conversations
  ADD COLUMN IF NOT EXISTS capability_used text,
  ADD COLUMN IF NOT EXISTS channel         text DEFAULT 'whatsapp',
  ADD COLUMN IF NOT EXISTS model_used      text,
  ADD COLUMN IF NOT EXISTS rag_chunks_used int  DEFAULT 0;

-- Grant execute on RPC
GRANT EXECUTE ON FUNCTION public.match_rag_documents TO authenticated;
GRANT EXECUTE ON FUNCTION public.match_rag_documents TO service_role;
