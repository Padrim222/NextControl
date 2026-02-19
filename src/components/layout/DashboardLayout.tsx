import { ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { LogOut, Sparkles } from 'lucide-react';

const ROLE_LABELS: Record<string, string> = {
    admin: 'Admin',
    seller: 'Seller',
    closer: 'Closer',
    client: 'Cliente',
    cs: 'CS de Vendas',
};

interface DashboardLayoutProps {
    children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
    const { user, logout } = useAuth();

    return (
        <div className="min-h-screen bg-background flex flex-col">
            {/* Top Bar */}
            <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur-md">
                <div className="max-w-7xl mx-auto flex items-center justify-between h-14 px-6">
                    <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-md nc-gradient flex items-center justify-center">
                            <Sparkles className="h-3.5 w-3.5 text-deep-space" />
                        </div>
                        <span className="text-lg font-display font-bold nc-gradient-text select-none">
                            Next Control
                        </span>
                    </div>

                    <div className="flex items-center gap-3">
                        {user && (
                            <>
                                <span className="hidden sm:inline text-sm text-muted-foreground">
                                    {user.name}
                                </span>
                                <span className="nc-badge">
                                    {ROLE_LABELS[user.role] || user.role}
                                </span>
                            </>
                        )}
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={logout}
                            className="text-muted-foreground hover:text-destructive"
                        >
                            <LogOut className="h-4 w-4 mr-1" />
                            <span className="hidden sm:inline">Sair</span>
                        </Button>
                    </div>
                </div>
            </header>

            {/* Content */}
            <main className="flex-1 p-6">{children}</main>
        </div>
    );
}
