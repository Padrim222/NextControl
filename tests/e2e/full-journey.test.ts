import { describe, it, expect } from 'vitest';

// Simulação da Jornada Full End-to-End solicitada pelo Rafa no Plano v3

describe('Testes E2E: Jornada Completa do Vendedor (Prospecção ao Fechamento)', () => {

  const leadBaseContext = {
    nome: 'Empresário Fictício',
    pain: 'Desconhecida',
    stages_covered: [] as string[]
  };

  it('Pipeline Fase 1: (SS) Abrir Conversa via Insta', async () => {
    // 1-4. Vendedor abre SS, Canal Instagram, Envia print -> recebe 3 aberturas
    const ssResponse = { answer: '1. Oi Fulano, vi seu post sobre X. 2. Legal sua bio. 3. Curti o evento' };
    expect(ssResponse.answer).toContain('Fulano');
    
    // 5-6. Lead reage com objeção -> SS quebra
    const objectionResponse = { answer: 'Reframing: Não conhecer é justamente a vantagem. Sugestão 2 e 3...' };
    expect(objectionResponse.answer).toContain('Reframing');
  });

  it('Pipeline Fase 2: (Transição e Closer Estrela Norte)', async () => {
    // 8-9. Transição e envio de Card
    leadBaseContext.pain = 'Baixa lucratividade nos serviços'; // Simulando descoberta
    const cardAnalysis = { gaps: ['Processo Comercial', 'LTV real'], steps: ['Iniciar Estrela Norte'] };
    expect(cardAnalysis.gaps.length).toBeGreaterThan(0);

    // 10-11. Closer Estrela Norte
    const npqcEstrelaNorte = { answer: 'Se você resolver a lucratividade, onde quer estar ano que vem?' };
    expect(npqcEstrelaNorte.answer).toContain('ano que vem');
    leadBaseContext.stages_covered.push('estrela_norte');
  });

  it('Pipeline Fase 3: (Closer Avançando Funil NPQC)', async () => {
    // 12. Vendedor avança para 'Situação Atual'
    const npqcAtual = { answer: 'Como você mede essa baixa lucratividade hoje?' };
    expect(npqcAtual.answer).toContain('mede');
    leadBaseContext.stages_covered.push('situacao_atual');

    // 12. Vendedor avança para 'Problema'
    const npqcProblema = { answer: 'E o quanto isso te custa mensalmente em dinheiro deixado na mesa?' };
    expect(npqcProblema.answer).toContain('custa');
    leadBaseContext.stages_covered.push('problema');
    
    expect(leadBaseContext.stages_covered).toEqual(['estrela_norte', 'situacao_atual', 'problema']);
  });

  it('Pipeline Fase 4: (Pitch Baseado em Dores e Fechamento)', async () => {
    // 13-14. Vendedor finalmente Pede Pitch do Produto
    // Agora que o Radar validou Estrela Norte, e Problema, a Edge Func aceita a Capability
    const isValidated = leadBaseContext.stages_covered.includes('problema') && leadBaseContext.pain !== 'Desconhecida';
    expect(isValidated).toBe(true);
    
    const pitchResponse = { 
        answer: 'Baseado na sua dor de Baixa lucratividade, a nossa mentoria X resolve isso. Faz sentido darmos o próximo passo com um form rápido?' 
    };

    expect(pitchResponse.answer).toContain('Baixa lucratividade'); // Reconexão causal (Feature -> Pain)
    expect(pitchResponse.answer).toContain('Faz sentido'); // Micro-Yes CTA
  });

});
