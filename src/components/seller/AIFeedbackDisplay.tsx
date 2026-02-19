import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { CheckCircle2, AlertCircle, BarChart3, Lightbulb } from 'lucide-react';

interface FeedbackData {
    operational_analysis: string;
    tactical_analysis: string;
    recommendations: string[];
    score: number;
}

interface AIFeedbackDisplayProps {
    feedback: FeedbackData | null;
    isLoading: boolean;
}

export function AIFeedbackDisplay({ feedback, isLoading }: AIFeedbackDisplayProps) {
    if (isLoading) {
        return (
            <Card className="w-full mt-6 border-primary/20 animate-pulse">
                <CardHeader>
                    <div className="h-6 w-1/3 bg-muted rounded mb-2"></div>
                    <div className="h-4 w-1/2 bg-muted rounded"></div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="h-20 bg-muted rounded"></div>
                    <div className="h-20 bg-muted rounded"></div>
                </CardContent>
            </Card>
        );
    }

    if (!feedback) return null;

    return (
        <Card className="w-full mt-6 border-primary/30 shadow-lg bg-card/50 backdrop-blur-sm">
            <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-primary/10 rounded-full">
                            <BarChart3 className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <CardTitle className="text-xl">Análise Consultoria de Bolso</CardTitle>
                            <CardDescription>Feedback gerado por IA sobre sua performance diária</CardDescription>
                        </div>
                    </div>
                    <Badge
                        variant="outline"
                        className={`text-lg px-3 py-1 ${feedback.score >= 7 ? "bg-green-500/10 text-green-600 border-green-200" : "bg-yellow-500/10 text-yellow-600 border-yellow-200"}`}
                    >
                        Nota: {feedback.score}/10
                    </Badge>
                </div>
            </CardHeader>
            <CardContent className="space-y-6 pt-4">
                <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <h4 className="font-semibold flex items-center gap-2 text-primary">
                            <AlertCircle className="h-4 w-4" />
                            Análise Operacional
                        </h4>
                        <p className="text-sm text-muted-foreground leading-relaxed bg-muted/30 p-3 rounded-md">
                            {feedback.operational_analysis}
                        </p>
                    </div>
                    <div className="space-y-2">
                        <h4 className="font-semibold flex items-center gap-2 text-primary">
                            <CheckCircle2 className="h-4 w-4" />
                            Análise Tática
                        </h4>
                        <p className="text-sm text-muted-foreground leading-relaxed bg-muted/30 p-3 rounded-md">
                            {feedback.tactical_analysis}
                        </p>
                    </div>
                </div>

                <Separator />

                <div className="space-y-3">
                    <h4 className="font-semibold flex items-center gap-2 text-yellow-500">
                        <Lightbulb className="h-4 w-4" />
                        Recomendações de Melhoria
                    </h4>
                    <ul className="grid gap-2">
                        {feedback.recommendations.map((rec, index) => (
                            <li key={index} className="flex items-start gap-2 text-sm bg-yellow-500/5 p-2 rounded border border-yellow-500/10">
                                <span className="font-bold text-yellow-600 min-w-[1.5rem]">{index + 1}.</span>
                                <span>{rec}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            </CardContent>
        </Card>
    );
}
