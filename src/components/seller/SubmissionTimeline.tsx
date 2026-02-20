import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronRight } from 'lucide-react';
import type { DailySubmission } from '@/types';

interface SubmissionTimelineProps {
  submissions: DailySubmission[];
  maxItems?: number;
  scoreMap?: Map<string, number>;
  onItemClick?: (submission: DailySubmission) => void;
}

function formatSubmissionDate(dateStr: string): string {
  try {
    return format(parseISO(dateStr), "dd 'de' MMM", { locale: ptBR });
  } catch {
    return dateStr;
  }
}

export function SubmissionTimeline({
  submissions,
  maxItems = 5,
  scoreMap,
  onItemClick,
}: SubmissionTimelineProps) {
  const visible = submissions.slice(0, maxItems);

  if (visible.length === 0) return null;

  return (
    <div className="space-y-0.5">
      {visible.map((sub) => {
        const metrics = sub.metrics as unknown as Record<string, unknown>;
        const score = scoreMap?.get(sub.id);
        const printsCount = sub.conversation_prints?.length || 0;

        return (
          <button
            key={sub.id}
            type="button"
            onClick={() => onItemClick?.(sub)}
            className="w-full flex items-center justify-between py-3 px-3 rounded-lg hover:bg-secondary/50 transition-colors min-h-[44px] text-left group"
          >
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-solar shrink-0" />
              <span className="text-sm font-mono">
                {formatSubmissionDate(sub.submission_date)}
              </span>
              <span className="text-xs text-muted-foreground">
                {printsCount} {printsCount === 1 ? 'print' : 'prints'}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                {metrics?.approaches != null && (
                  <span className="font-mono hidden sm:inline">{String(metrics.approaches)} abordagens</span>
                )}
                {metrics?.calls_made != null && (
                  <span className="font-mono hidden sm:inline">{String(metrics.calls_made)} calls</span>
                )}
              </div>
              {score != null && (
                <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
                  score >= 70
                    ? 'bg-nc-success/10 text-nc-success'
                    : score >= 40
                      ? 'bg-nc-warning/10 text-nc-warning'
                      : 'bg-nc-error/10 text-nc-error'
                }`}>
                  {score}
                </span>
              )}
              <ChevronRight className="h-4 w-4 text-muted-foreground/50 group-hover:text-muted-foreground transition-colors" />
            </div>
          </button>
        );
      })}
    </div>
  );
}
