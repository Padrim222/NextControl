import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronRight } from '@/components/ui/icons';
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

        const scoreBg = score == null ? '' : score >= 70 ? '#ECFDF5' : score >= 40 ? '#FFFBEB' : '#FEF2F2';
        const scoreColor = score == null ? '' : score >= 70 ? '#059669' : score >= 40 ? '#D97706' : '#DC2626';

        return (
          <button
            key={sub.id}
            type="button"
            onClick={() => onItemClick?.(sub)}
            className="w-full flex items-center justify-between py-3 px-3 rounded-lg text-left group transition-colors"
            style={{ fontFamily: 'DM Sans, sans-serif' }}
            onMouseEnter={(e) => (e.currentTarget.style.background = '#F9FAFB')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          >
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full shrink-0" style={{ background: '#1B2B4A' }} />
              <span className="text-[13px] font-medium" style={{ color: '#1A1A1A' }}>
                {formatSubmissionDate(sub.submission_date)}
              </span>
              <span className="text-[12px]" style={{ color: '#9CA3AF' }}>
                {printsCount} {printsCount === 1 ? 'print' : 'prints'}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-3 text-[12px]" style={{ color: '#9CA3AF' }}>
                {metrics?.approaches != null && (
                  <span className="hidden sm:inline">{String(metrics.approaches)} abordagens</span>
                )}
                {metrics?.calls_made != null && (
                  <span className="hidden sm:inline">{String(metrics.calls_made)} calls</span>
                )}
              </div>
              {score != null && (
                <span
                  className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
                  style={{ background: scoreBg, color: scoreColor, fontFamily: 'Plus Jakarta Sans, sans-serif' }}
                >
                  {score}
                </span>
              )}
              <ChevronRight size={14} strokeWidth={1.5} style={{ color: '#D1D5DB' }} className="group-hover:text-[#9CA3AF] transition-colors" />
            </div>
          </button>
        );
      })}
    </div>
  );
}
