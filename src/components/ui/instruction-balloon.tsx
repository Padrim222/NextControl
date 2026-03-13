
import { HelpCircle, Lightbulb } from '@/components/ui/icons';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface InstructionBalloonProps {
    title?: string;
    children: React.ReactNode;
    variant?: 'help' | 'tip';
    className?: string;
    side?: 'top' | 'right' | 'bottom' | 'left';
}

export function InstructionBalloon({
    title,
    children,
    variant = 'help',
    className,
    side = 'top',
}: InstructionBalloonProps) {
    const Icon = variant === 'help' ? HelpCircle : Lightbulb;
    const colorClass = variant === 'help' ? 'text-muted-foreground hover:text-foreground' : 'text-yellow-500 hover:text-yellow-400';

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className={cn("h-6 w-6 rounded-full p-0 flex-shrink-0 transition-transform hover:scale-110", colorClass, className)}
                    aria-label={title || "Mais informações"}
                >
                    <Icon className="h-4 w-4" />
                </Button>
            </PopoverTrigger>
            <PopoverContent side={side} className="w-80 p-4 shadow-lg border-primary/20 bg-card/95 backdrop-blur">
                <div className="space-y-2">
                    {title && (
                        <h4 className="font-semibold text-sm flex items-center gap-2 text-primary">
                            <Icon className="h-4 w-4" />
                            {title}
                        </h4>
                    )}
                    <div className="text-sm text-muted-foreground leading-relaxed">
                        {children}
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    );
}
