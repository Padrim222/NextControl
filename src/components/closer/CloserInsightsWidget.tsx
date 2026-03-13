import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bell, Calendar, ChevronRight, UserCheck } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';

interface FollowupItem {
    id: string;
    prospect_name: string;
    call_date: string;
    outcome: string;
    notes: string;
}

export function CloserInsightsWidget() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [followups, setFollowups] = useState<FollowupItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (user) fetchFollowups();
    }, [user]);

    const fetchFollowups = async () => {
        setIsLoading(true);
        const { data, error } = await (supabase as any)
            .from('call_logs')
            .select('id, prospect_name, call_date, outcome, notes')
            .eq('closer_id', user?.id)
            .in('outcome', ['reschedule', 'no_sale'])
            .order('call_date', { ascending: false })
            .limit(5);

        if (!error && data) {
            const today = new Date();
            const filtered = data.filter((call: any) => {
                const days = differenceInDays(today, new Date(call.call_date));
                return days >= 2 && days <= 15;
            });
            setFollowups(filtered);
        }
        setIsLoading(false);
    };

    if (isLoading || followups.length === 0) return null;

    return (
        <Card className="nc-card-border border-solar/20 bg-solar/5 overflow-hidden fade-in">
            <CardHeader className="pb-2 bg-solar/10 px-4 py-3 border-b border-solar/10">
                <CardTitle className="text-sm font-bold flex items-center gap-2 text-solar uppercase tracking-wider">
                    <Bell className="h-4 w-4 animate-pulse" />
                    Insights de Follow-up
                </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
                <div className="divide-y divide-solar/10">
                    {followups.map((item) => {
                        const daysAgo = differenceInDays(new Date(), new Date(item.call_date));
                        return (
                            <div key={item.id} className="p-4 flex items-center justify-between group hover:bg-black/20 transition-colors">
                                <div className="flex gap-3 items-start">
                                    <div className="p-2 rounded-lg bg-black/40 text-solar">
                                        <UserCheck className="h-4 w-4" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold">
                                            Hora de FUP: <span className="text-solar">{item.prospect_name}</span>
                                        </p>
                                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                                            <Calendar className="h-3 w-3" />
                                            Conversa em {format(new Date(item.call_date), "dd 'de' MMMM", { locale: ptBR })}
                                            <span className="text-[10px] ml-1 opacity-70">({daysAgo}d atrás)</span>
                                        </p>
                                    </div>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 px-2 text-xs border border-solar/20 hover:bg-solar hover:text-deep-space"
                                    onClick={() => navigate(`/seller/report?followup=${encodeURIComponent(item.prospect_name)}`)}
                                >
                                    Agendar <ChevronRight className="h-3.5 w-3.5 ml-1" />
                                </Button>
                            </div>
                        );
                    })}
                </div>
            </CardContent>
        </Card>
    );
}
