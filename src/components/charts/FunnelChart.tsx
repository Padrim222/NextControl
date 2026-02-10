import { ResponsiveContainer, FunnelChart as RechartsFunnelChart, Funnel, LabelList, Tooltip, Cell } from 'recharts';

interface FunnelDataPoint {
    name: string;
    value: number;
    fill: string;
}

interface FunnelChartProps {
    data: FunnelDataPoint[];
}

export function FunnelChart({ data }: FunnelChartProps) {
    if (!data || data.length === 0) {
        return <div className="flex items-center justify-center h-full text-muted-foreground">Sem dados para exibir</div>;
    }

    // Filter out zero values to avoid rendering issues with labels if desired, 
    // or keep them. Often funnels look weird with 0s.
    const displayData = data.filter(d => d.value > 0);

    if (displayData.length === 0) {
        return <div className="flex items-center justify-center h-full text-muted-foreground">Nenhuma atividade no funil</div>;
    }

    return (
        <ResponsiveContainer width="100%" height="100%">
            <RechartsFunnelChart>
                <Tooltip
                    contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }}
                    itemStyle={{ color: 'hsl(var(--foreground))' }}
                />
                <Funnel
                    dataKey="value"
                    data={displayData}
                    isAnimationActive
                >
                    <LabelList position="right" fill="#888" stroke="none" dataKey="name" />
                    {displayData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                </Funnel>
            </RechartsFunnelChart>
        </ResponsiveContainer>
    );
}
