import { ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';

const ROLE_LABELS: Record<string, string> = {
    admin: 'Admin',
    seller: 'Seller',
    closer: 'Closer',
    client: 'Cliente',
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
                    <span className="text-lg font-bold sf-gradient-text select-none">
                        Next Control
                    </span>

                    <div className="flex items-center gap-3">
                        {user && (
                            <>
                                <span className="hidden sm:inline text-sm text-muted-foreground">
                                    {user.name}
                                </span>
                                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary">
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
            <main className="flex-1">{children}</main>
        </div>
    );
}
