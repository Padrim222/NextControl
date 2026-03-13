import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, CheckCircle, XCircle } from '@/components/ui/icons';
import type { CallOutcome } from '@/types';
import { cn } from '@/lib/utils';

interface CallReportCardProps {
    clientName: string;
    companyName?: string;
    scheduledTime: string; // HH:mm
    status?: CallOutcome;
    onReport: (outcome: CallOutcome, notes?: string) => void;
}

export function CallReportCard({
    clientName,
    companyName,
    scheduledTime,
    status,
    onReport
}: CallReportCardProps) {

    return (
        <Card className={cn(
            "transition-all hover:shadow-md",
            status ? "opacity-75 bg-muted/50" : "bg-card border-l-4 border-l-primary"
        )}>
            <CardContent className="p-5">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <Clock className="h-4 w-4 text-primary" />
                            <span className="font-bold text-lg">{scheduledTime}</span>
                        </div>
                        <h3 className="font-semibold text-lg">{clientName}</h3>
                        {companyName && (
                            <p className="text-sm text-muted-foreground">{companyName}</p>
                        )}
                    </div>
                    {status && (
                        <Badge variant="secondary" className="capitalize">
                            {status.replace('_', ' ')}
                        </Badge>
                    )}
                </div>

                {!status && (
                    <div className="grid grid-cols-2 gap-2">
                        <Button
                            variant="outline"
                            className="bg-green-500/10 hover:bg-green-500/20 text-green-600 border-green-200"
                            onClick={() => onReport('sale')}
                        >
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Venda
                        </Button>
                        <Button
                            variant="outline"
                            className="bg-red-500/10 hover:bg-red-500/20 text-red-600 border-red-200"
                            onClick={() => onReport('no_sale')}
                        >
                            <XCircle className="mr-2 h-4 w-4" />
                            Não Comprou
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            className="col-span-2 text-xs"
                            onClick={() => onReport('reschedule')}
                        >
                            <Calendar className="mr-2 h-3 w-3" />
                            Reagendar
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
