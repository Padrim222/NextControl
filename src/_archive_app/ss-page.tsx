import React, { useState } from 'react';
import { AgentChat, AgentChatMessage } from '../../components/chat/AgentChat';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export default function SSAgentPage() {
  const [messages, setMessages] = useState<AgentChatMessage[]>([
    {
      id: 'welcome_ss',
      role: 'assistant',
      content: 'Sou o Head de Bolso SS. Cole o print do Instagram do Lead, ou uma objeção do chat para eu analisar e triturar.',
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [channel, setChannel] = useState<'whatsapp' | 'instagram' | 'linkedin'>('whatsapp');
  const [capability, setCapability] = useState<'analyze-profile' | 'analyze-story' | 'analyze-conversation' | 'break-objection' | 'post-dispatch'>('analyze-profile');

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
    if (imageFile) {
      base64Image = await fileToBase64(imageFile);
    }

    pushMsg({
      id: Math.random().toString(36).substring(7),
      role: 'user',
      content: text,
      imageUrl: base64Image ? URL.createObjectURL(imageFile!) : undefined
    });

    setIsLoading(true);

    try {
      let activeCapability = capability;
      const lowerText = text.toLowerCase();
      if (imageFile && lowerText.includes('objeção')) activeCapability = 'break-objection';
      else if (lowerText.includes('objeção') || lowerText.includes('caro ') || lowerText.includes('não tenho ')) activeCapability = 'break-objection';
      else if (lowerText.includes('disparo')) activeCapability = 'post-dispatch';

      const { data, error } = await (supabase as any).functions.invoke('ss-agent', {
        body: {
          capability: activeCapability,
          channel,
          input_type: imageFile ? 'image' : 'text',
          input_data: imageFile ? base64Image : text,
        }
      });

      if (error) throw error;

      pushMsg({
        id: Math.random().toString(36).substring(7),
        role: 'assistant',
        content: data.answer,
        isWarning: data.warning || false,
      });
    } catch (e: any) {
      console.error('SS Agent Error:', e);
      pushMsg({ id: 'error', role: 'assistant', content: `Erro ao processar: ${e.message || 'Tente novamente.'}`, isWarning: true });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-slate-100 p-4 gap-4">
      <div className="w-1/3 bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col space-y-4">
        <h2 className="text-xl font-bold text-slate-800">Contexto (SS)</h2>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-600 block">Canal Base:</label>
          <div className="flex gap-2">
            {(['whatsapp', 'instagram', 'linkedin'] as const).map(c => (
              <button
                key={c}
                onClick={() => setChannel(c)}
                className={`px-3 py-1 rounded-full text-xs font-semibold ${channel === c ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}
              >
                {c.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-600 block">Forçar Capability Ativa:</label>
          <select
            className="w-full text-sm border-slate-300 rounded-md p-2 bg-slate-50"
            value={capability}
            onChange={(e) => setCapability(e.target.value as any)}
          >
            <option value="analyze-profile">Analisar Perfil Insta</option>
            <option value="analyze-story">Responder Story Casual</option>
            <option value="analyze-conversation">Direcionar Conversa (Temperatura)</option>
            <option value="break-objection">Quebrar Objeção</option>
            <option value="post-dispatch">Condução Pós-Disparo</option>
          </select>
        </div>

        <div className="mt-8 p-3 bg-blue-50 text-blue-800 text-xs rounded-xl border border-blue-200">
          <strong>Lembrete do Mestre:</strong> O SS prospecta. Respeite as restrições de formatação do LinkedIn e WhatsApp para não soar como robô.
        </div>
      </div>

      <div className="w-2/3 h-full pb-4">
         <AgentChat
            agentName="Head de Bolso (SS) — Prospecção Ativa"
            messages={messages}
            isLoading={isLoading}
            onSendMessage={handleSendMessage}
         />
      </div>
    </div>
  );
}
