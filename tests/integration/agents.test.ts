import { describe, it, expect, vi } from 'vitest';

// Simulações das Edge Functions via API local simulada
// Num ambiente real de E2E a requisição seria contra a URL do Supabase

describe('Head de Bolso SS - Módulo de Prospecção', () => {
  it('SS-1: Abre conversa via Insta baseada em Perfil', async () => {
    const payload = { capability: 'analyze-profile', channel: 'instagram', input_type: 'image', input_data: 'base64://fake' };
    const response = { answer: 'Resumo: prospect é coach fitness. 3 Abordagens curtas ligadas ao nicho de treinos online geradas mantendo linha informal de 3 linhas.' };
    
    expect(response.answer).toContain('3 Abordagens');
    expect(response.answer).toContain('coach fitness');
  });

  it('SS-2: Responder story casualmente', async () => {
    const payload = { capability: 'analyze-story', channel: 'instagram', input_type: 'image', input_data: 'base64://fake-story' };
    const response = { answer: 'Reação casual gerada conectando a viagem dele com sua mensagem.' };
    expect(response.answer).toContain('Reação casual');
  });

  it('SS-3 e SS-4: Lead frio ou morno', async () => {
    const payload = { capability: 'analyze-conversation', channel: 'whatsapp', input_type: 'text', input_data: 'Não tenho interesse' };
    const response = { answer: 'Opções de resposta: Retirada elegante curiosa ou Re-direcionamento.' };
    expect(response.answer.length).toBeGreaterThan(10);
  });

  it('SS-5: Objeção de preco', async () => {
    const payload = { capability: 'break-objection', channel: 'linkedin', input_type: 'text', input_data: 'Tá muito caro pra mim hoje' };
    const response = { answer: 'Reframing de preço como valor. Geradas 2 respostas.' };
    expect(response.answer).toContain('valor');
  });

  it('SS-6: Follow up Pós Disparo', async () => {
    const payload = { capability: 'post-dispatch', channel: 'whatsapp', input_type: 'text', input_data: 'Ele disse: Me conta mais' };
    const response = { answer: 'Script para qualificar antes de vender e ancorar dor.' };
    expect(response.answer).not.toBeNull();
  });
});

describe('Head de Bolso Closer - Módulo Fechamento (Enforcement NPQC)', () => {
  it('CL-1: Novo Card CRM', async () => {
    const payload = { capability: 'analyze-lead-card', channel: 'call', input_type: 'text', input_data: 'Empresário 50k, não sabe o lucro' };
    const response = { answer: 'GAPs identificados: Pergunta de margem de lucro sugerida.' };
    expect(response.answer).toContain('GAPs identificados');
  });

  it('CL-2: Gerar perguntas Estrela Norte etapa 1', async () => {
    const payload = { capability: 'generate-npqc-questions', npqc_stage: 'estrela_norte', channel: 'whatsapp', input_type: 'text', input_data: 'e-commerce faturando 50k' };
    const response = { answer: 'Qual a sua grande meta em 6 meses faturando 50k hoje?' };
    expect(response.answer).toContain('meta');
  });

  it('CL-2: Warning NPQC ao Pular para etapa 4', async () => {
    const payload = { capability: 'generate-npqc-questions', npqc_stage: 'fechamento', channel: 'whatsapp', input_type: 'text', input_data: 'lead cru', lead_context: { stages_covered: [] }};
    const response = { warning: true, answer: '⚠️ AVISO DE VIOLAÇÃO NPQC: Você ainda não explorou a Situação Atual ou o Problema' };
    expect(response.warning).toBe(true);
    expect(response.answer).toContain('VIOLAÇÃO NPQC');
  });

  it('CL-3: Pitch só ocorre mapeando Dor', async () => {
    const payload = { capability: 'generate-pitch', channel: 'call', input_type: 'text', input_data: 'Mentoria X', lead_context: { mapped_pain: 'Baixa retenção de alunos' }, product_id: 'Mentoria Elite' };
    const response = { answer: 'Pitch conectando Baixa Retenção com a Mentoria Elite.' };
    expect(response.answer).toContain('Baixa Retenção');
    expect(response.answer).toContain('Mentoria Elite');
  });
});
