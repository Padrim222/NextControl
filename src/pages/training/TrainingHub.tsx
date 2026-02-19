import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
    GraduationCap,
    MessageSquare,
    Sparkles,
    BookOpen,
    Target,
    Lightbulb,
    Shield,
    AlertTriangle,
    FileText,
    ChevronRight,
    ArrowRight,
} from 'lucide-react';
import type { TrainingMaterial, TrainingCategory } from '@/types';

const categoryConfig: Record<TrainingCategory, { label: string; icon: React.ElementType; color: string }> = {
    script: { label: 'Scripts', icon: FileText, color: 'text-solar' },
    methodology: { label: 'Metodologia', icon: BookOpen, color: 'text-nc-info' },
    strategy: { label: 'Estratégia', icon: Target, color: 'text-nc-success' },
    best_practice: { label: 'Boas Práticas', icon: Lightbulb, color: 'text-nc-warning' },
    error_pattern: { label: 'Erros Comuns', icon: AlertTriangle, color: 'text-nc-error' },
};

const fallbackMaterials: TrainingMaterial[] = [
    {
        id: 'fb-1', title: 'Script de Abordagem Fria', content: 'Técticas comprovadas para iniciar conversas com leads frios. Personalize antes de abordar, traga valor primeiro, use perguntas abertas.', category: 'script', target_role: 'seller', is_active: true, created_at: '',
    },
    {
        id: 'fb-2', title: 'Metodologia SPIN Selling', content: 'Quatro tipos de perguntas: Situação, Problema, Implicação, Necessidade de Solução. Estruture suas conversas para descobrir dores reais.', category: 'methodology', target_role: 'both', is_active: true, created_at: '',
    },
    {
        id: 'fb-3', title: 'Contornando "Tá Caro"', content: 'Nunca desconte direto. Isole a objeção, reframe para ROI, use social proof e parcele o valor para diminuir a percepção.', category: 'strategy', target_role: 'closer', is_active: true, created_at: '',
    },
    {
        id: 'fb-4', title: 'Follow-up Eficiente (2-5-12)', content: 'Regra de ouro: 2 dias após contato, 5 dias se sem resposta, 12 dias para último follow-up. Sempre traga algo novo, nunca "só passando".', category: 'best_practice', target_role: 'seller', is_active: true, created_at: '',
    },
    {
        id: 'fb-5', title: 'Erros em Calls de Fechamento', content: 'Falar demais, não fazer perguntas, pular qualificação, apresentar antes de entender o problema, não pedir o fechamento.', category: 'error_pattern', target_role: 'closer', is_active: true, created_at: '',
    },
    {
        id: 'fb-6', title: 'Roteiro de Call Vencedora', content: 'Abertura (30s), Qualificação SPIN (2min), Apresentação conectada ao problema (3min), Objeções (2min), Fechamento (1min).', category: 'script', target_role: 'closer', is_active: true, created_at: '',
    },
];

export default function TrainingHub() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [materials, setMaterials] = useState<TrainingMaterial[]>(fallbackMaterials);
    const [filter, setFilter] = useState<TrainingCategory | 'all'>('all');
    const [selectedMaterial, setSelectedMaterial] = useState<TrainingMaterial | null>(null);

    useEffect(() => {
        fetchMaterials();
    }, []);

    const fetchMaterials = async () => {
        if (!supabase) return;
        try {
            const { data, error } = await (supabase as any)
                .from('training_materials')
                .select('*')
                .eq('is_active', true)
                .order('created_at', { ascending: false });
            if (data?.length) setMaterials(data);
        } catch {
            // fallback materials already set
        }
    };

    const filtered = filter === 'all'
        ? materials
        : materials.filter(m => m.category === filter);

    const categories: (TrainingCategory | 'all')[] = ['all', 'script', 'methodology', 'strategy', 'best_practice', 'error_pattern'];

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            {/* Header */}
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
                <h1 className="font-display text-2xl font-bold">
                    <span className="nc-gradient-text">Materiais</span> de Treinamento
                </h1>
                <p className="text-muted-foreground text-sm mt-1">
                    Scripts, metodologias e boas práticas do time
                </p>
            </motion.div>

            {/* Coach CTA */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
                <Card
                    className="nc-card-border nc-card-hover bg-card cursor-pointer overflow-hidden relative"
                    onClick={() => navigate('/training/coach')}
                >
                    <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-solar/40 via-solar to-solar/40" />
                    <CardContent className="py-5 flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl nc-gradient flex items-center justify-center shrink-0">
                            <Sparkles className="h-6 w-6 text-deep-space" />
                        </div>
                        <div className="flex-1">
                            <h3 className="font-semibold">Consultoria de Bolso</h3>
                            <p className="text-sm text-muted-foreground">
                                Converse com seu coach IA personalizado em tempo real
                            </p>
                        </div>
                        <ArrowRight className="h-5 w-5 text-solar" />
                    </CardContent>
                </Card>
            </motion.div>

            {/* Category Filter */}
            <div className="flex flex-wrap gap-2">
                {categories.map(cat => {
                    const config = cat === 'all' ? null : categoryConfig[cat];
                    return (
                        <button
                            key={cat}
                            onClick={() => setFilter(cat)}
                            className={`text-xs px-3 py-1.5 rounded-full transition-colors ${filter === cat
                                ? 'nc-gradient text-deep-space font-semibold'
                                : 'nc-card-border bg-card hover:bg-solar/10 hover:text-solar text-muted-foreground'
                                }`}
                        >
                            {cat === 'all' ? 'Todos' : config?.label}
                        </button>
                    );
                })}
            </div>

            {/* Materials Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {filtered.map((material, i) => {
                    const config = categoryConfig[material.category];
                    const Icon = config?.icon || BookOpen;
                    return (
                        <motion.div
                            key={material.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.05 }}
                        >
                            <Card
                                className="nc-card-border nc-card-hover bg-card cursor-pointer h-full"
                                onClick={() => setSelectedMaterial(material)}
                            >
                                <CardContent className="pt-4 pb-4 px-4">
                                    <div className="flex items-start gap-3">
                                        <div className={`w-8 h-8 rounded-lg bg-card flex items-center justify-center shrink-0 ${config?.color}`}>
                                            <Icon className="h-4 w-4" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <h3 className="text-sm font-semibold truncate">{material.title}</h3>
                                            </div>
                                            <p className="text-xs text-muted-foreground line-clamp-2">{material.content}</p>
                                            <div className="flex items-center gap-2 mt-2">
                                                <Badge variant="outline" className={`text-[10px] ${config?.color}`}>
                                                    {config?.label}
                                                </Badge>
                                                <Badge variant="outline" className="text-[10px] text-muted-foreground">
                                                    {material.target_role === 'both' ? 'Todos' : material.target_role}
                                                </Badge>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    );
                })}
            </div>

            {/* Material Detail Modal */}
            {selectedMaterial && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-deep-space/80 backdrop-blur-sm p-4"
                    onClick={() => setSelectedMaterial(null)}
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-card nc-card-border rounded-xl max-w-lg w-full p-6"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="flex items-center gap-3 mb-4">
                            {(() => {
                                const config = categoryConfig[selectedMaterial.category];
                                const Icon = config?.icon || BookOpen;
                                return (
                                    <div className={`w-10 h-10 rounded-lg bg-solar/10 flex items-center justify-center ${config?.color}`}>
                                        <Icon className="h-5 w-5" />
                                    </div>
                                );
                            })()}
                            <div>
                                <h2 className="font-display text-lg font-bold">{selectedMaterial.title}</h2>
                                <Badge variant="outline" className="text-xs mt-1">{categoryConfig[selectedMaterial.category]?.label}</Badge>
                            </div>
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                            {selectedMaterial.content}
                        </p>
                        <div className="mt-6 flex justify-end">
                            <Button onClick={() => setSelectedMaterial(null)} variant="outline" className="nc-btn-ghost">
                                Fechar
                            </Button>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
}
