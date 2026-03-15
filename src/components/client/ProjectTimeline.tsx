import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Clock, CalendarDays, FileText } from '@/components/ui/icons';
import type { DailySubmission, SellerMetrics, CloserMetrics } from '@/types';

interface ProjectTimelineProps {
    reports: DailySubmission[];
}

export function ProjectTimeline({ reports }: ProjectTimelineProps) {
    const sortedReports = [...reports].sort((a, b) =>
        new Date(b.submission_date).getTime() - new Date(a.submission_date).getTime()
    );

    return (
        <Card className="h-full nc-card-border">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                    <CalendarDays className="h-5 w-5 text-primary" />
                    Linha do Tempo
                </CardTitle>
            </CardHeader>
            <CardContent>
                <ScrollArea className="h-[400px] pr-4">
                    {sortedReports.length === 0 ? (
                        <div className="text-center text-muted-foreground py-8">
                            <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                            <p>Ainda não há atividades registradas.</p>
                        </div>
                    ) : (
                        <div className="relative border-l ml-6 space-y-8 pl-6 border-muted-foreground/20">
                            {sortedReports.map((report) => {
                                const date = new Date(report.submission_date);
                                const isApproved = report.status === 'approved';

                                // Determine metrics to show
                                const metrics = report.metrics as any;
                                const isCloser = metrics.calls_made !== undefined;

                                return (
                                    <div key={report.id} className="relative">
                                        {/* Dot */}
                                        <div className={`absolute -left-[30px] top-1.5 h-3 w-3 rounded-full border-2 ${isApproved ? 'bg-primary border-primary' : 'bg-background border-muted-foreground'
                                            }`} />

                                        <div className="flex flex-col gap-1 mb-6">
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-semibold">
                                                    {date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' })}
                                                </span>
                                                <Badge variant={isApproved ? 'default' : 'outline'} className="text-[10px] h-5">
                                                    {isApproved ? 'Validado' : 'Em Análise'}
                                                </Badge>
                                            </div>

                                            <p className="text-xs text-muted-foreground mb-2 capitalize">
                                                {date.toLocaleDateString('pt-BR', { weekday: 'long' })}
                                            </p>

                                            <div className="bg-muted/30 p-3 rounded-lg text-sm border border-border/50">
                                                <div className="flex items-center gap-2 mb-2 text-muted-foreground border-b border-border/50 pb-2">
                                                    <FileText className="h-3 w-3" />
                                                    <span className="font-semibold text-xs uppercase tracking-wider">
                                                        {isCloser ? 'Closer Report' : 'Seller Report'}
                                                    </span>
                                                </div>
                                                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                                                    {isCloser ? (
                                                        <>
                                                            <div className="flex justify-between">Calls: <span className="font-medium text-foreground">{metrics.calls_made}</span></div>
                                                            <div className="flex justify-between">Conv.: <span className="font-medium text-foreground">{metrics.conversion_rate}%</span></div>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <div className="flex justify-between">Abordagens: <span className="font-medium text-foreground">{metrics.approaches}</span></div>
                                                            <div className="flex justify-between">Vendas: <span className="font-medium text-foreground">{metrics.sales}</span></div>
                                                        </>
                                                    )}
                                                </div>
                                                {report.notes && (
                                                    <p className="text-xs text-muted-foreground mt-2 italic line-clamp-2">
                                                        "{report.notes}"
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </ScrollArea>
            </CardContent>
        </Card>
    );
}
