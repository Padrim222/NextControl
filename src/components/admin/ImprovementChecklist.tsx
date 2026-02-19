import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { ClipboardList, CheckCircle2 } from 'lucide-react';
import type { ChecklistItem } from '@/types';

interface ImprovementChecklistProps {
    title: string;
    items: ChecklistItem[];
    onItemToggle?: (index: number, checked: boolean) => void;
}

export function ImprovementChecklist({ title, items, onItemToggle }: ImprovementChecklistProps) {
    const [localItems, setLocalItems] = useState<ChecklistItem[]>(items);

    const handleToggle = (index: number) => {
        const updated = [...localItems];
        updated[index] = { ...updated[index], checked: !updated[index].checked };
        setLocalItems(updated);
        onItemToggle?.(index, updated[index].checked);
    };

    const completedCount = localItems.filter(i => i.checked).length;
    const progress = localItems.length > 0 ? Math.round((completedCount / localItems.length) * 100) : 0;

    return (
        <Card className="sf-card-hover border-orange-500/20">
            <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                        <ClipboardList className="h-4 w-4 text-orange-500" />
                        {title}
                    </div>
                    <span className="text-xs text-muted-foreground">
                        {completedCount}/{localItems.length}
                    </span>
                </CardTitle>
                {/* Progress bar */}
                <div className="h-1.5 bg-muted rounded-full overflow-hidden mt-2">
                    <div
                        className="h-full bg-orange-500 rounded-full transition-all duration-500"
                        style={{ width: `${progress}%` }}
                    />
                </div>
            </CardHeader>
            <CardContent className="pt-0">
                <div className="space-y-2">
                    {localItems.map((item, index) => (
                        <div
                            key={index}
                            className={`flex items-start gap-3 p-2 rounded-md transition-colors cursor-pointer hover:bg-muted/50 ${item.checked ? 'opacity-60' : ''
                                }`}
                            onClick={() => handleToggle(index)}
                        >
                            <Checkbox
                                checked={item.checked}
                                className="mt-0.5"
                            />
                            <span className={`text-sm ${item.checked ? 'line-through text-muted-foreground' : ''}`}>
                                {item.text}
                            </span>
                        </div>
                    ))}
                </div>

                {progress === 100 && (
                    <div className="flex items-center gap-2 mt-4 p-2 bg-green-500/10 rounded-lg text-green-500 text-sm">
                        <CheckCircle2 className="h-4 w-4" />
                        <span className="font-medium">Checklist completa!</span>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
