import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import {
    Compass,
    Lightbulb,
    Send,
    ArrowRight,
    Sparkles,
    AlertCircle,
} from 'lucide-react';

interface StrategistPanelProps {
    clientName: string;
    briefing?: string;
    onStrategySent?: (strategy: string) => void;
}

export function StrategistPanel({ clientName, briefing, onStrategySent }: StrategistPanelProps) {
    const [inputBriefing, setInputBriefing] = useState(briefing || '');
    const [isGenerating, setIsGenerating] = useState(false);
    const [aiResponse, setAiResponse] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const generatePaths = async () => {
        if (!inputBriefing.trim()) return;

        setIsGenerating(true);
        setError(null);
        setAiResponse(null);

        try {
            // 1. Fetch RAG materials for context
            let ragContext = '';
            const { data: clientObj } = await supabase.from('clients').select('id').eq('name', clientName).single();
            if (clientObj) {
                const { data: materials } = await (supabase as any)
                    .from('client_materials')
                    .select('title, description')
                    .eq('client_id', clientObj.id)
                    .eq('is_rag_active', true);

                if (materials && materials.length > 0) {
                    ragContext = "\n\n=== CONTEXTO DA BASE RAG DO CLIENTE ===\n" +
                        materials.map((m: any) => `* MATERIAL: ${m.title}\n* CONTEÚDO/RESUMO: ${m.description || 'Sem descrição detalhada'}`).join('\n\n') +
                        "\n=======================================\n\nUse estritamente as informações do contexto acima para embasar sua resposta.";
                }
            }

            // Call coach-chat edge function with strategist context
            const { data, error: fnError } = await (supabase as any).functions.invoke('coach-chat', {
                body: {
                    message: `[MODO ESTRATEGISTA YORIK — CONSULTORIA DE ELITE]\n\nCLIENTE: ${clientName}\n\nDEMANDA DO ESTRATEGISTA:\n"${inputBriefing}"\n\n${ragContext}\n\nINSTRUÇÕES PARA YORIK:\n1. Analise a demanda comparando com as regras de negócio do RAG acima.\n2. Não responda com clichês. Seja tático e cirúrgico.\n3. Gere 2-3 "Rotas de Guerra" (caminhos estratégicos).\n\nFORMATO DE CADA ROTA:\n### [Emoji] Nome da Rota\n**Diagnóstico:** 1 frase sobre o porquê desta rota (use dados do RAG se possível).\n**Plano de Ataque:** 4 passos acionáveis passo-a-passo.\n**KPI de Sucesso:** O que monitorar para saber se funcionou.\n**Prioridade:** [Alta/Média/Baixa]\n\nResponda em Markdown. Use um tom de consultor sênior da Next Control.`,
                    conversation_history: [],
                },
            });

            if (fnError) throw fnError;

            const answer = data?.answer || data?.error;
            if (data?.error) {
                throw new Error(data.error);
            }

            setAiResponse(answer);
        } catch (err: any) {
            console.error('Strategist error:', err);
            const msg = err?.message || 'Erro desconhecido';

            if (msg.includes('API Key') || msg.includes('Unauthorized') || msg.includes('not configured')) {
                setError('⚠️ API Key não configurada. Peça ao admin para configurar OPENROUTER_API_KEY nos secrets do Supabase.');
            } else {
                setError(`Erro ao gerar estratégia: ${msg}`);
            }
            toast.error('Erro ao gerar estratégia. Veja detalhes no painel.');
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <Card className="sf-card-glow border-cyan-500/20">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Compass className="h-5 w-5 text-cyan-500" />
                    Estrategista Yorik
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                    IA Estrategista — Gerar caminhos adaptados pro cliente {clientName}
                </p>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Briefing Input */}
                <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-2">
                        <Lightbulb className="h-4 w-4 text-yellow-500" />
                        Briefing / Dúvida do Cliente
                    </label>
                    <Textarea
                        value={inputBriefing}
                        onChange={(e) => setInputBriefing(e.target.value)}
                        placeholder="Ex: O time precisa melhorar a conversão de leads frios em agendamentos..."
                        rows={3}
                    />
                </div>

                <Button
                    onClick={generatePaths}
                    disabled={isGenerating || !inputBriefing.trim()}
                    className="w-full bg-cyan-600 hover:bg-cyan-700"
                >
                    {isGenerating ? (
                        <>
                            <Sparkles className="h-4 w-4 mr-2 animate-spin" />
                            Gerando caminhos com IA...
                        </>
                    ) : (
                        <>
                            <Compass className="h-4 w-4 mr-2" />
                            Gerar Possíveis Caminhos
                        </>
                    )}
                </Button>

                {/* Error Display */}
                {error && (
                    <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-sm text-destructive flex items-start gap-2">
                        <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                        <span>{error}</span>
                    </div>
                )}

                {/* AI Response */}
                {aiResponse && (
                    <div className="space-y-3 pt-4 border-t">
                        <h4 className="text-sm font-semibold flex items-center gap-2">
                            <Sparkles className="h-4 w-4 text-cyan-500" />
                            COMO FAZER — Caminhos Estratégicos (IA)
                        </h4>

                        <div className="p-4 rounded-lg bg-cyan-500/5 border border-cyan-500/20">
                            <pre className="text-sm whitespace-pre-wrap font-sans leading-relaxed">
                                {aiResponse}
                            </pre>
                        </div>

                        <Button
                            variant="outline"
                            className="w-full border-cyan-500/30 hover:bg-cyan-500/10"
                            onClick={() => {
                                onStrategySent?.(aiResponse);
                                toast.success('Estratégia enviada ao cliente!');
                            }}
                        >
                            <Send className="h-4 w-4 mr-2" />
                            Devolver Estratégia Pro Cliente
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
