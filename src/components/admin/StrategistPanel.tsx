import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
    Compass,
    Lightbulb,
    Send,
    ArrowRight,
    Sparkles,
} from 'lucide-react';

interface StrategistPanelProps {
    clientName: string;
    briefing?: string;
    onStrategySent?: (strategy: string) => void;
}

interface StrategyPath {
    title: string;
    description: string;
    steps: string[];
    priority: 'high' | 'medium' | 'low';
}

export function StrategistPanel({ clientName, briefing, onStrategySent }: StrategistPanelProps) {
    const [inputBriefing, setInputBriefing] = useState(briefing || '');
    const [isGenerating, setIsGenerating] = useState(false);
    const [paths, setPaths] = useState<StrategyPath[] | null>(null);

    const generatePaths = () => {
        if (!inputBriefing.trim()) return;

        setIsGenerating(true);

        // Simulate AI strategy generation
        setTimeout(() => {
            const generatedPaths = generateStrategicPaths(inputBriefing);
            setPaths(generatedPaths);
            setIsGenerating(false);
        }, 2000);
    };

    const generateStrategicPaths = (brief: string): StrategyPath[] => {
        // Rule-based strategy generation using keyword analysis
        const lowerBrief = brief.toLowerCase();
        const strategies: StrategyPath[] = [];

        if (lowerBrief.includes('venda') || lowerBrief.includes('conversão') || lowerBrief.includes('fechar')) {
            strategies.push({
                title: '🎯 Caminho de Conversão Direta',
                description: 'Foco em otimizar o funil de vendas com abordagem consultiva',
                steps: [
                    'Mapear objeções mais comuns do lead',
                    'Preparar contra-argumentos específicos',
                    'Agendar call de descoberta com framework SPIN',
                    'Follow-up em 24h com proposta personalizada',
                ],
                priority: 'high',
            });
        }

        if (lowerBrief.includes('lead') || lowerBrief.includes('prospecção') || lowerBrief.includes('captação')) {
            strategies.push({
                title: '🌱 Caminho de Nutrição de Leads',
                description: 'Estratégia de aquecimento gradual com conteúdo de valor',
                steps: [
                    'Segmentar base de leads por estágio',
                    'Criar sequência de 5 conteúdos de valor',
                    'Mensagens personalizadas no Instagram/WhatsApp',
                    'Trigger de call quando lead atingir engagement score',
                ],
                priority: 'high',
            });
        }

        if (lowerBrief.includes('script') || lowerBrief.includes('abordagem') || lowerBrief.includes('comunicação')) {
            strategies.push({
                title: '📝 Caminho de Otimização de Script',
                description: 'Refinar a comunicação para aumentar engajamento',
                steps: [
                    'Auditar scripts atuais (gravar 5 calls)',
                    'Identificar pontos de drop-off na conversa',
                    'Reescrever gatilhos de abertura e fechamento',
                    'Treinar equipe: roleplay com novo script',
                ],
                priority: 'medium',
            });
        }

        // Always add a general strategy
        strategies.push({
            title: '🔄 Caminho de Diagnóstico Completo',
            description: 'Análise 360° para identificar gargalos e oportunidades',
            steps: [
                `Analisar métricas atuais do cliente ${clientName}`,
                'Benchmark contra melhores performers da carteira',
                'Identificar 3 quick wins implementáveis esta semana',
                'Propor plano de ação de 30 dias com KPIs claros',
            ],
            priority: 'medium',
        });

        return strategies;
    };

    const priorityColors = {
        high: { bg: 'bg-red-500/5', border: 'border-red-500/20', text: 'text-red-500' },
        medium: { bg: 'bg-yellow-500/5', border: 'border-yellow-500/20', text: 'text-yellow-500' },
        low: { bg: 'bg-blue-500/5', border: 'border-blue-500/20', text: 'text-blue-500' },
    };

    return (
        <Card className="sf-card-glow border-cyan-500/20">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Compass className="h-5 w-5 text-cyan-500" />
                    Estrategista Yorik
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                    Humano {'>'} IA Estrategista — Gerar caminhos adaptados pro cliente
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
                            Gerando caminhos...
                        </>
                    ) : (
                        <>
                            <Compass className="h-4 w-4 mr-2" />
                            Gerar Possíveis Caminhos
                        </>
                    )}
                </Button>

                {/* Generated Paths */}
                {paths && (
                    <div className="space-y-3 pt-4 border-t">
                        <h4 className="text-sm font-semibold flex items-center gap-2">
                            <Sparkles className="h-4 w-4 text-cyan-500" />
                            COMO FAZER — Possíveis Caminhos Adaptados Pro Cliente
                        </h4>

                        {paths.map((path, idx) => {
                            const colors = priorityColors[path.priority];
                            return (
                                <div
                                    key={idx}
                                    className={`p-4 rounded-lg border ${colors.bg} ${colors.border}`}
                                >
                                    <div className="flex items-start justify-between mb-2">
                                        <h5 className="font-medium text-sm">{path.title}</h5>
                                        <span className={`text-xs px-2 py-0.5 rounded-full ${colors.bg} ${colors.text} border ${colors.border}`}>
                                            {path.priority === 'high' ? 'Alta' : path.priority === 'medium' ? 'Média' : 'Baixa'}
                                        </span>
                                    </div>
                                    <p className="text-xs text-muted-foreground mb-3">{path.description}</p>
                                    <div className="space-y-1.5">
                                        {path.steps.map((step, i) => (
                                            <div key={i} className="flex items-start gap-2 text-xs">
                                                <ArrowRight className="h-3 w-3 mt-0.5 shrink-0 text-muted-foreground" />
                                                <span>{step}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}

                        <Button
                            variant="outline"
                            className="w-full border-cyan-500/30 hover:bg-cyan-500/10"
                            onClick={() => {
                                const strategyText = paths.map(p =>
                                    `${p.title}\n${p.steps.map((s, i) => `${i + 1}. ${s}`).join('\n')}`
                                ).join('\n\n');
                                onStrategySent?.(strategyText);
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
