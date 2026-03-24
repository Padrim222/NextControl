import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'jsr:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    const { id } = await req.json()
    if (!id) {
      throw new Error('Form submission ID is required')
    }

    // 1. Fetch form submission
    const { data: form, error: formError } = await supabase
      .from('form_submissions')
      .select('*')
      .eq('id', id)
      .single()

    if (formError || !form) {
      throw new Error('Form submission not found')
    }

    // 2. --- RAG CONTEXT FETCH ---
    let ragContext = "";
    if (form.client_id) {
      const { data: materials } = await supabase
        .from('client_materials')
        .select('title, description')
        .eq('client_id', form.client_id)
        .eq('is_rag_active', true);

      if (materials && materials.length > 0) {
        const { data: clientData } = await supabase
          .from('clients')
          .select('name')
          .eq('id', form.client_id)
          .single();

        ragContext = "\n\n=== CONTEXTO DE CONHECIMENTO DO CLIENTE (" + (clientData?.name || "N/A") + ") ===\n" +
          materials.map((m: any) => `* MATERIAL: ${m.title}\n* CONTEÚDO/REGRAS: ${m.description || 'Sem descrição'}`).join('\n\n') +
          "\n=======================================\n\nUse este contexto para validar se os dados enviados seguem o playbook e as regras do cliente.";
      }
    }
    // -------------------------

    // 3. Prepare Prompt based on form type
    let systemPrompt = `Você é um Estrategista de Vendas e Consultor de Negócios Sênior.\nSua missão é analisar as métricas enviadas pelo cliente/vendedor e retornar um feedback direto e acionável em Markdown.\nRetorne SOMENTE um JSON válido com a seguinte estrutura:\n{ "score": <0-100>, "analysis": "<texto markdown com o feedback completo e dicas práticas>" } \nNão inclua nada além do JSON!`

    const openAiMessages = [
      { role: 'system', content: systemPrompt },
      {
        role: 'user',
        content: `Formulário respondido por: ${form.submitter_name}\nTipo do formulário: ${form.form_type}\nDados enviados: ${JSON.stringify(form.data)}\n${ragContext}\n\nAnalise e de o score e feedback:`,
      }
    ]

    // 3. Call OpenRouter
    const apiKey = Deno.env.get('OPENROUTER_API_KEY')
    if (!apiKey) {
      throw new Error('OpenRouter API Key not configured')
    }

    const aiResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': 'https://nextcontrol.app',
        'X-Title': 'Consultoria Form',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.0-flash-001',
        messages: openAiMessages,
        temperature: 0.5,
        response_format: { type: 'json_object' },
      }),
    })

    if (!aiResponse.ok) {
      throw new Error('AI analysis service temporarily unavailable')
    }

    const aiData = await aiResponse.json()
    const rawContent = aiData.choices?.[0]?.message?.content || '{}'
    const analysis = JSON.parse(rawContent.replace(/```json\n?|\n?```/g, ''))

    const score = Math.min(100, Math.max(0, analysis.score || 0))

    // 4. Update the form_submission
    const { error: saveError } = await supabase
      .from('form_submissions')
      .update({
        ai_status: 'done',
        ai_score: score,
        // store analysis inside data for MVP, or we can just create an analysis record, but form_submissions has no direct analysis relation except ai_analysis_id
        // Since this is MVP to fix the UI, let's update data column to include the analysis 
        data: { ...form.data, ai_analysis: analysis.analysis }
      })
      .eq('id', id)

    if (saveError) {
      console.error('Failed to update form:', saveError)
      throw new Error('Failed to update form submission')
    }

    return new Response(
      JSON.stringify({ success: true, score }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('Analyze form error:', message)
    return new Response(
      JSON.stringify({ error: message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
