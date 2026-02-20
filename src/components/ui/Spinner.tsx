import { cn } from '@/lib/utils';

interface SpinnerProps {
    className?: string;
    size?: 'sm' | 'md' | 'lg';
}

const SIZE_MAP = {
    sm: 'h-5 w-5',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
} as const;

export function Spinner({ className, size = 'md' }: SpinnerProps) {
    return (
        <div
            className={cn(
                'animate-spin rounded-full border-2 border-muted border-t-primary',
                SIZE_MAP[size],
                className,
            )}
            role="status"
            aria-label="Carregando"
        >
            <span className="sr-only">Carregando...</span>
        </div>
    );
}
