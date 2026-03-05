import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Target, TrendingUp, TrendingDown, Ban, Star } from 'lucide-react';
import { motion } from 'framer-motion';

interface StrategyEntry {
    id: string;
    strategy_description: string;
    tested_week: string;
    impact_score: number | null;
    response_rate: number | null;
    discarded: boolean;
    reason: string | null;
    source: string | null;
}

export function StrategyAnalytics() {
    const { user } = useAuth();
    const [strategies, setStrategies] = useState<StrategyEntry[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (user) fetchStrategies();
    }, [user]);

    const fetchStrategies = async () => {
        setIsLoading(true);
        const { data, error } = await (supabase as any)
            .from('strategy_log')
            .select('*')
            .eq('seller_id', user?.id)
            .order('created_at', { ascending: false })
            .limit(20);

        if (!error && data) setStrategies(data);
        setIsLoading(false);
    };

    const activeStrategies = strategies.filter(s => !s.discarded);
    const discardedStrategies = strategies.filter(s => s.discarded);
    const avgImpact = activeStrategies.length > 0
        ? (activeStrategies.reduce((sum, s) => sum + (s.impact_score || 0), 0) / activeStrategies.length).toFixed(1)
        : '—';
    const avgResponse = activeStrategies.length > 0
        ? (activeStrategies.reduce((sum, s) => sum + (s.response_rate || 0), 0) / activeStrategies.length).toFixed(1)
        : '—';

    if (isLoading) {
        return (
            <Card className="nc-card-border animate-pulse">
                <CardContent className="p-6 h-48" />
            </Card>
        );
    }

    if (strategies.length === 0) {
        return (
            <Card className="nc-card-border bg-card">
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-bold flex items-center gap-2 text-primary uppercase tracking-wider">
                        <Target className="h-4 w-4" />
                        Análise de Abordagens
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-xs text-muted-foreground text-center py-4">
                        Nenhuma estratégia registrada. Adicione abordagens testadas no check-in diário.
                    </p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="nc-card-border bg-card overflow-hidden">
            <CardHeader className="pb-2 bg-primary/5 border-b border-primary/10">
                <CardTitle className="text-sm font-bold flex items-center gap-2 text-primary uppercase tracking-wider">
                    <Target className="h-4 w-4" />
                    Análise de Abordagens (A vs B)
                </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
                {/* Summary Row */}
                <div className="grid grid-cols-3 gap-3">
                    <div className="text-center p-3 bg-muted/50 rounded-lg">
                        <p className="text-[10px] uppercase text-muted-foreground tracking-wider">Ativas</p>
                        <p className="text-xl font-bold text-nc-success">{activeStrategies.length}</p>
                    </div>
                    <div className="text-center p-3 bg-muted/50 rounded-lg">
                        <p className="text-[10px] uppercase text-muted-foreground tracking-wider">Impacto Médio</p>
                        <p className="text-xl font-bold text-primary">{avgImpact}<span className="text-xs text-muted-foreground">/10</span></p>
                    </div>
                    <div className="text-center p-3 bg-muted/50 rounded-lg">
                        <p className="text-[10px] uppercase text-muted-foreground tracking-wider">Taxa Resposta</p>
                        <p className="text-xl font-bold text-solar">{avgResponse}%</p>
                    </div>
                </div>

                {/* Top Strategies */}
                {activeStrategies.length > 0 && (
                    <div>
                        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1">
                            <TrendingUp className="h-3 w-3 text-nc-success" />
                            Top Abordagens
                        </h4>
                        <div className="space-y-2">
                            {activeStrategies
                                .sort((a, b) => (b.impact_score || 0) - (a.impact_score || 0))
                                .slice(0, 3)
                                .map((s, i) => (
                                    <motion.div
                                        key={s.id}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: i * 0.1 }}
                                        className="flex items-center justify-between p-2.5 rounded-lg bg-muted/30 border border-border/50 hover:bg-muted/60 transition-colors"
                                    >
                                        <div className="flex items-center gap-2 flex-1 min-w-0">
                                            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-nc-success/10 text-nc-success text-[10px] font-bold flex-shrink-0">
                                                {i + 1}
                                            </div>
                                            <p className="text-xs truncate">{s.strategy_description}</p>
                                        </div>
                                        <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                                            {s.impact_score && (
                                                <Badge variant="outline" className="text-[10px] bg-primary/10 border-primary/20">
                                                    <Star className="h-2.5 w-2.5 mr-0.5" /> {s.impact_score}
                                                </Badge>
                                            )}
                                            {s.response_rate != null && (
                                                <Badge variant="outline" className="text-[10px] bg-solar/10 border-solar/20 text-solar">
                                                    {s.response_rate}%
                                                </Badge>
                                            )}
                                        </div>
                                    </motion.div>
                                ))}
                        </div>
                    </div>
                )}

                {/* Discarded Blacklist */}
                {discardedStrategies.length > 0 && (
                    <div>
                        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1">
                            <Ban className="h-3 w-3 text-destructive" />
                            Blacklist ({discardedStrategies.length})
                        </h4>
                        <div className="space-y-1.5">
                            {discardedStrategies.slice(0, 3).map((s) => (
                                <div key={s.id} className="flex items-center justify-between p-2 rounded bg-destructive/5 border border-destructive/10">
                                    <div className="flex items-center gap-2 min-w-0">
                                        <TrendingDown className="h-3 w-3 text-destructive flex-shrink-0" />
                                        <p className="text-[11px] truncate text-muted-foreground line-through">{s.strategy_description}</p>
                                    </div>
                                    {s.reason && (
                                        <span className="text-[9px] text-destructive/70 ml-2 flex-shrink-0 max-w-[100px] truncate">{s.reason}</span>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
