import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'jsr:@supabase/supabase-js@2'
import * as pdfjsLib from 'https://esm.sh/pdfjs-dist@4.0.379/build/pdf.mjs'

// Need to set workerSrc for pdf.js to work properly in Edge environments if it relies on web workers,
// but for simple text extraction we can just use the core library.
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://esm.sh/pdfjs-dist@4.0.379/build/pdf.worker.mjs'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ProcessRequest {
    material_id: string
}

const CHUNK_SIZE = 500; // Aproximadamente 500 palavras/tokens
const OVERLAP = 50;

// Função para quebrar o texto em chunks semânticos com overlap
function createChunks(text: string, chunkSize: number, overlap: number): string[] {
    const words = text.split(/\s+/);
    const chunks: string[] = [];

    for (let i = 0; i < words.length; i += (chunkSize - overlap)) {
        const chunk = words.slice(i, i + chunkSize).join(' ');
        if (chunk.trim().length > 10) { // Ignorar chunks estúpidos/vazios
            chunks.push(chunk);
        }
    }
    return chunks;
}

// Extrair texto do Buffer de um PDF usando PDF.js
async function extractTextFromPDF(pdfBuffer: ArrayBuffer): Promise<string> {
    const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(pdfBuffer) });
    const pdf = await loadingTask.promise;
    
    let fullText = '';
    
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();
        
        const pageText = textContent.items
            .map((item: any) => item.str)
            .join(' ');
            
        fullText += pageText + ' \n';
    }
    
    return fullText;
}

Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const authHeader = req.headers.get('Authorization')
        if (!authHeader) {
            throw new Error('Missing authorization header')
        }

        const { material_id } = await req.json() as ProcessRequest

        if (!material_id) {
            throw new Error('O ID do material é obrigatório.')
        }

        const supabase = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        // 1. Atualizar Status para "Extraindo"
        await supabase
            .from('client_materials')
            .update({ processing_status: 'chunking' })
            .eq('id', material_id)

        // 2. Buscar informações do material
        const { data: material, error: fetchError } = await supabase
            .from('client_materials')
            .select('file_url')
            .eq('id', material_id)
            .single()

        if (fetchError || !material || !material.file_url) {
            throw new Error('Material não encontrado ou sem arquivo associado.')
        }

        // 3. Fazer o download do arquivo PDF do Storage (Assumindo que file_url traz o path do storage)
        // file_url ex: 'client_materials/id/arquivo.pdf'
        const { data: fileData, error: downloadError } = await supabase.storage
            .from('materials')
            .download(material.file_url)

        if (downloadError || !fileData) {
            throw new Error(`Erro ao baixar PDF: ${downloadError?.message}`)
        }

        const arrayBuffer = await fileData.arrayBuffer()
        
        // 4. Extrair texto
        const extractedText = await extractTextFromPDF(arrayBuffer)
        
        if (!extractedText || extractedText.trim().length === 0) {
            throw new Error('Nenhum texto pôde ser extraído do PDF.')
        }

        // 5. Configurar Chunking
        await supabase
            .from('client_materials')
            .update({ processing_status: 'generating_embeddings' })
            .eq('id', material_id)

        const chunks = createChunks(extractedText, CHUNK_SIZE, OVERLAP)

        // 6. Gerar Embeddings (Via OpenAI)
        const openaiKey = Deno.env.get('OPENAI_API_KEY')
        if (!openaiKey) {
            throw new Error('OPENAI_API_KEY não configurada no Edge Functions.')
        }

        // Gerar embedding para cada chunk - Chamada em Batch para a OpenAI text-embedding-3-small
        const embeddingResponse = await fetch('https://api.openai.com/v1/embeddings', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${openaiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                input: chunks,
                model: 'text-embedding-3-small', // 1536 dimensões por padrão. Nativamente suportado por pgvector.
            })
        });

        if (!embeddingResponse.ok) {
            const errBody = await embeddingResponse.text();
            throw new Error(`OpenAI API Error: ${errBody}`);
        }

        const embeddingData = await embeddingResponse.json();
        const embeddings = embeddingData.data; // Array com os embeddings

        // 7. Salvar Chunks no Supabase pgvector
        const insertPayload = chunks.map((chunkText, index) => ({
            material_id: material_id,
            content: chunkText,
            chunk_index: index,
            embedding: embeddings[index].embedding // Vetor matemático da Inteligência!
        }))

        // O DB truncar pra 768 se a gente pedir dimensions=768 na OpenAi, mas vamos mandar normal e garantir o tipo vector() lá.
        const { error: insertError } = await supabase
            .from('material_chunks')
            .insert(insertPayload)

        if (insertError) {
            throw new Error(`Erro ao gravar vetores: ${insertError.message}`)
        }

        // 8. Finalizar Status "Pronto"
        await supabase
            .from('client_materials')
            .update({ processing_status: 'ready' })
            .eq('id', material_id)

        return new Response(
            JSON.stringify({ 
                success: true, 
                message: `O QG processou ${chunks.length} fragmentos do seu PDF no Cérebro Vetorial.` 
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

    } catch (error: any) {
        console.error('Process Material Erro:', error)

        // Se falhar de forma conhecida, avisar na UI o falha.
        // req parse para tentar pegar material_id falha se n tiver o trycatch, entao evito dupla extração
        
        return new Response(
            JSON.stringify({ error: error.message || 'Erro inesperado no pipeline OCR/RAG' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        )
    }
})
