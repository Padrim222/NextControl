import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, AlertTriangle, Lightbulb, TrendingUp, TrendingDown, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

interface SandwichSection {
    title: string;
    items: string[];
}

interface SandwichAnalysisProps {
    positives: string[];
    gaps: string[];
    actions: string[];
    convertedInsights?: string[];
    lostInsights?: string[];
    overallScore?: number;
    level?: string;
}

const sectionConfig = {
    positives: {
        icon: CheckCircle,
        color: 'text-emerald-400',
        bg: 'bg-emerald-500/5',
        border: 'border-emerald-500/20',
        label: 'Pontos Positivos',
        emoji: '✅',
    },
    gaps: {
        icon: AlertTriangle,
        color: 'text-amber-400',
        bg: 'bg-amber-500/5',
        border: 'border-amber-500/20',
        label: 'Gaps Críticos',
        emoji: '⚠️',
    },
    actions: {
        icon: Lightbulb,
        color: 'text-blue-400',
        bg: 'bg-blue-500/5',
        border: 'border-blue-500/20',
        label: 'Ações Recomendadas',
        emoji: '💡',
    },
};

function SandwichLayer({
    type,
    items,
    index,
}: {
    type: 'positives' | 'gaps' | 'actions';
    items: string[];
    index: number;
}) {
    const config = sectionConfig[type];
    const Icon = config.icon;

    if (!items.length) return null;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.15 }}
        >
            <Card className={`${config.bg} border ${config.border}`}>
                <CardHeader className="pb-2">
                    <CardTitle className={`text-base flex items-center gap-2 ${config.color}`}>
                        <Icon className="h-4 w-4" />
                        {config.label}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <ul className="space-y-2.5">
                        {items.map((item, i) => (
                            <li key={i} className="flex items-start gap-2.5 text-sm">
                                <span className="mt-0.5 shrink-0">{config.emoji}</span>
                                <span className="text-muted-foreground leading-relaxed">{item}</span>
                            </li>
                        ))}
                    </ul>
                </CardContent>
            </Card>
        </motion.div>
    );
}

function ConversionComparison({
    convertedInsights,
    lostInsights,
}: {
    convertedInsights: string[];
    lostInsights: string[];
}) {
    if (!convertedInsights.length && !lostInsights.length) return null;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
        >
            {convertedInsights.length > 0 && (
                <Card className="bg-emerald-500/5 border border-emerald-500/20">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2 text-emerald-400">
                            <TrendingUp className="h-4 w-4" />
                            Conversas que Converteram
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ul className="space-y-2">
                            {convertedInsights.map((item, i) => (
                                <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                                    <ArrowRight className="h-3 w-3 text-emerald-400 mt-0.5 shrink-0" />
                                    {item}
                                </li>
                            ))}
                        </ul>
                    </CardContent>
                </Card>
            )}
            {lostInsights.length > 0 && (
                <Card className="bg-red-500/5 border border-red-500/20">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2 text-red-400">
                            <TrendingDown className="h-4 w-4" />
                            Conversas que Não Converteram
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ul className="space-y-2">
                            {lostInsights.map((item, i) => (
                                <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                                    <ArrowRight className="h-3 w-3 text-red-400 mt-0.5 shrink-0" />
                                    {item}
                                </li>
                            ))}
                        </ul>
                    </CardContent>
                </Card>
            )}
        </motion.div>
    );
}

export function SandwichAnalysisView({
    positives,
    gaps,
    actions,
    convertedInsights = [],
    lostInsights = [],
    overallScore,
    level,
}: SandwichAnalysisProps) {
    return (
        <div className="space-y-4">
            {/* Score header */}
            {overallScore !== undefined && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex items-center justify-center gap-4 py-4"
                >
                    <div className="w-20 h-20 rounded-full border-4 border-primary/20 flex items-center justify-center">
                        <span className="text-3xl font-display font-bold nc-gradient-text">
                            {overallScore}
                        </span>
                    </div>
                    {level && (
                        <div className="text-left">
                            <p className="text-xs text-muted-foreground uppercase tracking-wider">Nível</p>
                            <p className="text-lg font-semibold">{level}</p>
                        </div>
                    )}
                </motion.div>
            )}

            {/* Sandwich: Positive → Gaps → Positive (Actions) */}
            <SandwichLayer type="positives" items={positives} index={0} />

            {/* Conversion comparison */}
            <ConversionComparison
                convertedInsights={convertedInsights}
                lostInsights={lostInsights}
            />

            <SandwichLayer type="gaps" items={gaps} index={1} />
            <SandwichLayer type="actions" items={actions} index={2} />
        </div>
    );
}
