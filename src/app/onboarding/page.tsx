import React from 'react';

export default function OnboardingPage() {
  return (
    <div className="p-8 h-full overflow-y-auto bg-slate-50 text-slate-800">
      <div className="max-w-3xl mx-auto space-y-6">
        <h1 className="text-3xl font-extrabold text-slate-900 border-b pb-4 mb-8 border-slate-200">
           Seu Onboarding ao Head de Bolso v3
        </h1>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm leading-relaxed">
          <p className="mb-4">
             Bem-vindo à Metodologia <strong>NPQC</strong> do Rafael Yorik embutida em uma IA reativa (Chain of Thought).<br/>
             Você não tem mais um ChatGPT cego, e sim 2 especialistas de alto padrão separados por fase metodológica.
          </p>

          <h2 className="text-lg font-bold text-blue-800 mb-2">🥊 1. O Agente SS (O Prospector Oportunista)</h2>
          <p className="text-sm mb-4">
            A função dele é cavar oportunidades baseadas no radar social, abrindo portas usando gatilhos. Use-o para extrair perfis com prints (análise de bio e últimos posts) e quebrar a barreira inicial. Se o lead trouxer resistência primária (não confio, acho caro agora, sem tempo), jogue a objeção como texto para obter 3 reframes diretos.
          </p>

          <h2 className="text-lg font-bold text-indigo-800 mb-2">🎯 2. O Agente Closer (O Assasino Silencioso de Conversão)</h2>
          <p className="text-sm mb-4">
            Aqui acabaram-se os prints soltos de insta. O Closer precisa do contexto bruto do seu Pipeline (O Card do Lead). Ele vai engatilhar você num Radar estrito: <strong>Estrela Norte {'->'} Situação Atual {'->'} Problema {'->'} Fechamento (Pitch)</strong>.<br />
            <strong>Regra de Ouro:</strong> Nunca pule uma etapa. O Closer vai auditar seus saltos não perdoará pitches entregues sem a Dor latente mapeada.
          </p>

          <div className="mt-8 bg-amber-50 border border-amber-200 p-4 rounded-md">
            <h3 className="text-amber-900 font-bold mb-1">Dica de Produtividade</h3>
            <p className="text-amber-800 text-xs">Cole as imagens da sua área de transferência com (Ctrl+V) direto nas caixas de chat, selecione o Canal (WhatsApp/LinkedIn) para ele adequar o tom, e aperte Enter. Pronto.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
