import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface SellerScript {
  id: string;
  seller_id: string;
  name: string;
  content: string;
  script_type: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const SCRIPT_TYPES: Record<string, { label: string; color: string }> = {
  dispatch: { label: 'DISPATCH (DISPARO)', color: 'bg-indigo-100 text-indigo-800' },
  pitch: { label: 'PITCH / FECHAMENTO', color: 'bg-amber-100 text-amber-800' },
  followup: { label: 'FOLLOW-UP', color: 'bg-emerald-100 text-emerald-800' },
  objection: { label: 'OBJEÇÃO', color: 'bg-rose-100 text-rose-800' },
  other: { label: 'GERAL', color: 'bg-slate-100 text-slate-700' },
};

export default function ScriptsPage() {
  const { user } = useAuth();
  const [scripts, setScripts] = useState<SellerScript[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formName, setFormName] = useState('');
  const [formContent, setFormContent] = useState('');
  const [formType, setFormType] = useState('dispatch');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (user) fetchScripts();
  }, [user]);

  const fetchScripts = async () => {
    if (!supabase || !user) return;
    setIsLoading(true);
    try {
      const { data, error } = await (supabase as any)
        .from('seller_scripts')
        .select('*')
        .eq('seller_id', user.id)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setScripts(data || []);
    } catch (e: any) {
      toast.error('Erro ao carregar scripts');
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingId(null);
    setFormName('');
    setFormContent('');
    setFormType('dispatch');
  };

  const handleSave = async () => {
    if (!supabase || !user) return;
    if (!formName.trim() || !formContent.trim()) {
      toast.error('Preencha o nome e o conteúdo do script');
      return;
    }

    setIsSaving(true);
    try {
      if (editingId) {
        const { error } = await (supabase as any)
          .from('seller_scripts')
          .update({ name: formName, content: formContent, script_type: formType, updated_at: new Date().toISOString() })
          .eq('id', editingId);
        if (error) throw error;
        toast.success('Script atualizado');
      } else {
        const { error } = await (supabase as any)
          .from('seller_scripts')
          .insert({ seller_id: user.id, name: formName, content: formContent, script_type: formType });
        if (error) throw error;
        toast.success('Script criado');
      }
      resetForm();
      fetchScripts();
    } catch (e: any) {
      toast.error(`Erro ao salvar: ${e.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!supabase) return;
    if (!confirm('Tem certeza que deseja remover este script?')) return;

    try {
      const { error } = await (supabase as any).from('seller_scripts').delete().eq('id', id);
      if (error) throw error;
      toast.success('Script removido');
      setScripts(prev => prev.filter(s => s.id !== id));
    } catch (e: any) {
      toast.error(`Erro ao remover: ${e.message}`);
    }
  };

  const handleEdit = (script: SellerScript) => {
    setEditingId(script.id);
    setFormName(script.name);
    setFormContent(script.content);
    setFormType(script.script_type);
    setShowForm(true);
  };

  const typeConfig = (type: string) => SCRIPT_TYPES[type] || SCRIPT_TYPES.other;

  return (
    <div className="h-full bg-slate-50 overflow-y-auto p-8 text-slate-800">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Meus Modelos de Script</h1>
            <p className="text-sm text-slate-500 mt-1">
              A IA utilizará os seus scripts salvos como "DNA principal" para não perder seu tom original, melhorando as aberturas apenas com táticas validadas.
            </p>
          </div>
          <button
            onClick={() => { resetForm(); setShowForm(true); }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 font-semibold text-sm rounded-lg shadow-sm transition"
          >
            + Novo Script
          </button>
        </div>

        {/* Form */}
        {showForm && (
          <div className="bg-white border border-slate-200 rounded-xl p-5 mb-6 shadow-sm space-y-4">
            <h3 className="font-bold text-lg">{editingId ? 'Editar Script' : 'Novo Script'}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-slate-600 block mb-1">Nome</label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Ex: Contato Frio WhatsApp"
                  className="w-full border border-slate-300 rounded-md p-2 text-sm"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-600 block mb-1">Tipo</label>
                <select
                  value={formType}
                  onChange={(e) => setFormType(e.target.value)}
                  className="w-full border border-slate-300 rounded-md p-2 text-sm"
                >
                  {Object.entries(SCRIPT_TYPES).map(([k, v]) => (
                    <option key={k} value={k}>{v.label}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-600 block mb-1">Conteúdo do Script</label>
              <textarea
                value={formContent}
                onChange={(e) => setFormContent(e.target.value)}
                rows={5}
                placeholder={'Oi {nome}, estava dando uma olhada no instagram...'}
                className="w-full border border-slate-300 rounded-md p-2 text-sm"
              />
            </div>
            <div className="flex gap-3 justify-end">
              <button onClick={resetForm} className="text-slate-500 hover:text-slate-700 text-sm font-medium px-4 py-2">
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-5 py-2 font-semibold text-sm rounded-lg transition"
              >
                {isSaving ? 'Salvando...' : (editingId ? 'Atualizar' : 'Criar Script')}
              </button>
            </div>
          </div>
        )}

        {/* Scripts grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2].map(i => (
              <div key={i} className="bg-white border rounded-lg p-4 animate-pulse">
                <div className="h-4 bg-slate-200 rounded w-1/3 mb-3"></div>
                <div className="h-5 bg-slate-200 rounded w-2/3 mb-3"></div>
                <div className="h-16 bg-slate-100 rounded"></div>
              </div>
            ))}
          </div>
        ) : scripts.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <p className="text-lg mb-1">Nenhum script salvo ainda</p>
            <p className="text-sm">Clique em "+ Novo Script" para criar um modelo personalizado.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {scripts.map((script) => {
              const tc = typeConfig(script.script_type);
              return (
                <div key={script.id} className="bg-white border p-4 rounded-lg shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="flex gap-2 mb-2 items-center">
                      <span className={`uppercase px-2 py-0.5 rounded text-[10px] font-bold ${tc.color}`}>
                        {tc.label}
                      </span>
                      <span className="text-slate-400 text-xs flex-1 text-right">
                        {new Date(script.updated_at).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                    <h3 className="font-bold text-slate-700">{script.name}</h3>
                    <p className="text-slate-500 text-sm mt-3 border-l-2 border-slate-200 pl-3 line-clamp-3 italic">
                      "{script.content}"
                    </p>
                  </div>
                  <div className="mt-6 flex space-x-3 text-xs">
                    <button onClick={() => handleEdit(script)} className="text-blue-600 hover:text-blue-800 font-semibold">Editar</button>
                    <button onClick={() => handleDelete(script.id)} className="text-red-500 hover:text-red-700 font-semibold">Remover</button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
