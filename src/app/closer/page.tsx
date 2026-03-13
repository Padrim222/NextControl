import React, { useState } from 'react';
import { AgentChat, AgentChatMessage } from '../../components/chat/AgentChat';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export default function CloserAgentPage() {
  const [messages, setMessages] = useState<AgentChatMessage[]>([
    {
      id: 'welcome_closer',
      role: 'assistant',
      content: 'Sou o Head de Bolso Closer. Me envie a dor do lead mapeada e avançaremos pelas etapas cruciais NPQC.',
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [channel, setChannel] = useState<'whatsapp' | 'call'>('whatsapp');
  const [capability, setCapability] = useState<'analyze-lead-card' | 'generate-npqc-questions' | 'generate-pitch' | 'improve-script'>('analyze-lead-card');
  const [npqcStage, setNpqcStage] = useState<'estrela_norte' | 'situacao_atual' | 'problema' | 'fechamento'>('estrela_norte');
  const [stagesCovered, setStagesCovered] = useState<string[]>([]);

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const handleSendMessage = async (text: string, imageFile?: File) => {
    if (!supabase) {
      toast.error('Supabase não conectado');
      return;
    }

    const pushMsg = (msg: AgentChatMessage) => setMessages(prev => [...prev, msg]);

    let base64Image = '';
    if (imageFile) base64Image = await fileToBase64(imageFile);

    pushMsg({
      id: Math.random().toString(36).substring(7),
      role: 'user',
      content: text,
      imageUrl: base64Image ? URL.createObjectURL(imageFile!) : undefined
    });

    setIsLoading(true);

    try {
      const { data, error } = await (supabase as any).functions.invoke('closer-agent', {
        body: {
          capability,
          channel,
          input_type: imageFile ? 'image' : 'text',
          input_data: imageFile ? base64Image : text,
          npqc_stage: npqcStage,
          lead_context: { stages_covered: stagesCovered, mapped_pain: '' }
        }
      });

      if (error) throw error;

      const isWarning = data.warning || false;

      if (!isWarning && capability === 'generate-npqc-questions' && !stagesCovered.includes(npqcStage)) {
        setStagesCovered(prev => [...prev, npqcStage]);
      }

      pushMsg({
        id: Math.random().toString(36).substring(7),
        role: 'assistant',
        content: data.answer,
        isWarning,
      });
    } catch (e: any) {
      console.error('Closer Agent Error:', e);
      pushMsg({ id: 'error', role: 'assistant', content: `Erro no Closer: ${e.message || 'Tente novamente.'}`, isWarning: true });
    } finally {
      setIsLoading(false);
    }
  };

  const getStageColor = (stageKey: string) => {
    if (npqcStage === stageKey) return 'bg-amber-400 text-amber-900 border-amber-600 animate-pulse';
    if (stagesCovered.includes(stageKey)) return 'bg-emerald-500 text-white border-emerald-600';
    return 'bg-slate-200 text-slate-500 border-slate-300';
  };

  return (
    <div className="flex h-screen bg-slate-100 p-4 gap-4">
      <div className="w-1/3 bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col space-y-4">
        <h2 className="text-xl font-bold text-slate-800">Mapeamento Lead (Closer)</h2>
        
        <div className="bg-slate-50 p-3 rounded-xl border border-slate-300">
            <h3 className="text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide">Radar de Viabilidade (NPQC)</h3>
            <div className="flex flex-col space-y-2">
                {[
                  {k: 'estrela_norte', l: '1. Estrela Norte (Meta)'},
                  {k: 'situacao_atual', l: '2. Situação Atual (Hoje)'},
                  {k: 'problema', l: '3. Problema (Dor Crítica)'},
                  {k: 'fechamento', l: '4. Fechamento (Proposta)'}
                ].map((s) => (
                    <button 
                        key={s.k}
                        onClick={() => { setNpqcStage(s.k as any); setCapability('generate-npqc-questions'); }}
                        className={`text-left text-sm px-3 py-2 rounded-lg border font-semibold transition ${getStageColor(s.k)}`}
                    >
                        {s.l}
                    </button>
                ))}
            </div>
            <p className="text-[10px] text-slate-400 mt-2 text-center">Somente acesse (4) Fechamento após a IA convalidar o (3).</p>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-600 block">Canal Base e Ação Forçada:</label>
          <div className="flex gap-2">
            <button
                onClick={() => setChannel('whatsapp')}
                className={`px-3 py-1 rounded-full text-xs font-semibold ${channel === 'whatsapp' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}
              >WPP DM</button>
              <button
                onClick={() => setChannel('call')}
                className={`px-3 py-1 rounded-full text-xs font-semibold ${channel === 'call' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'}`}
              >VOZ / CALL</button>
          </div>
          <select 
            className="w-full text-sm mt-3 border-slate-300 rounded-md p-2 bg-slate-50"
            value={capability}
            onChange={(e) => setCapability(e.target.value as any)}
          >
            <option value="analyze-lead-card">Raio-X do CRM</option>
            <option value="generate-npqc-questions">Gerar Preguntas (Baseado no Radar NPQC)</option>
            <option value="generate-pitch">Gerar Fechamento Direto (Com Pitch)</option>
            <option value="improve-script">Auditar Meu Script Pessoal</option>
          </select>
        </div>
      </div>

      <div className="w-2/3 h-full pb-4">
         <AgentChat 
            agentName="Head de Bolso (Closer) — Encerramento Cirúrgico"
            messages={messages} 
            isLoading={isLoading} 
            onSendMessage={handleSendMessage} 
         />
      </div>
    </div>
  );
}
