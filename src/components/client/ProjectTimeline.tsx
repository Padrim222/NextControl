import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Clock, CalendarDays, FileText } from 'lucide-react';
import type { DailyReport } from '@/types';

interface ProjectTimelineProps {
    reports: DailyReport[];
}

export function ProjectTimeline({ reports }: ProjectTimelineProps) {
    // Sort reports by date descending
    const sortedReports = [...reports].sort((a, b) =>
        new Date(b.report_date).getTime() - new Date(a.report_date).getTime()
    );

    return (
        <Card className="h-full">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
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
                        <div className="relative border-l ml-3 space-y-8 py-2">
                            {sortedReports.map((report) => {
                                const date = new Date(report.report_date);
                                const isApproved = report.status === 'approved';

                                return (
                                    <div key={report.id} className="relative pl-6">
                                        {/* Dot */}
                                        <div className={`absolute -left-[5px] top-1 h-2.5 w-2.5 rounded-full border-2 ${isApproved ? 'bg-primary border-primary' : 'bg-background border-muted-foreground'
                                            }`} />

                                        <div className="flex flex-col gap-1">
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-semibold">
                                                    {date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' })}
                                                </span>
                                                <Badge variant={isApproved ? 'default' : 'outline'} className="text-[10px] h-5">
                                                    {isApproved ? 'Validado' : 'Em Análise'}
                                                </Badge>
                                            </div>

                                            <p className="text-xs text-muted-foreground mb-2">
                                                {date.toLocaleDateString('pt-BR', { weekday: 'long' })}
                                            </p>

                                            <div className="bg-muted/40 p-3 rounded-md text-sm">
                                                <div className="flex items-center gap-2 mb-2 text-muted-foreground">
                                                    <FileText className="h-3 w-3" />
                                                    <span>Resumo do Dia:</span>
                                                </div>
                                                <div className="grid grid-cols-2 gap-2 text-xs">
                                                    <div>Calls: <span className="font-medium">{report.pitchs}</span></div>
                                                    <div>Vendas: <span className="font-medium">{report.capturas}</span></div>
                                                </div>
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
