import { ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LogOut, Sparkles } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { MobileBottomNav } from './MobileBottomNav';
import { PageTransition } from './PageTransition';
import type { UserRole } from '@/types';

const ROLE_LABELS: Record<string, string> = {
    admin: 'Admin',
    seller: 'Seller',
    closer: 'Closer',
    client: 'Cliente',
    cs: 'CS de Vendas',
};

const ROLE_HOME: Record<UserRole, string> = {
    admin: '/admin',
    seller: '/seller',
    closer: '/closer',
    client: '/client',
    cs: '/cs',
};

const NAV_LINKS: Record<string, { label: string; path: string }[]> = {
    admin: [
        { label: 'Dashboard', path: '/admin' },
        { label: 'Gestão', path: '/admin/manage' },
        { label: 'Base RAG', path: '/admin/rag' },
        { label: 'CS Inbox', path: '/cs' },
        { label: 'Treinamento', path: '/training' },
    ],
    seller: [
        { label: 'Dashboard', path: '/seller' },
        { label: 'Check-in', path: '/seller/report' },
        { label: 'Evolução', path: '/seller/evolution' },
        { label: 'Coach', path: '/training/coach' },
    ],
    closer: [
        { label: 'Dashboard', path: '/closer' },
        { label: 'Análise de Calls', path: '/closer/call-analysis' },
        { label: 'Check-in', path: '/seller/report' },
        { label: 'Evolução', path: '/seller/evolution' },
        { label: 'Coach', path: '/training/coach' },
    ],
    cs: [
        { label: 'Inbox', path: '/cs' },
        { label: 'Treinamento', path: '/training' },
    ],
    client: [
        { label: 'Dashboard', path: '/client' },
        { label: 'Coach', path: '/training/coach' },
        { label: 'Materiais', path: '/training' },
    ],
};

interface DashboardLayoutProps {
    children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
    const { user, logout } = useAuth();
    const location = useLocation();
    const navLinks = user ? NAV_LINKS[user.role] || [] : [];
    const homePath = user ? ROLE_HOME[user.role] || '/' : '/';

    return (
        <div className="min-h-screen bg-background flex flex-col">
            {/* Top Bar */}
            <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur-md">
                <div className="max-w-7xl mx-auto flex items-center justify-between h-14 px-4 sm:px-6">
                    <div className="flex items-center gap-4">
                        <Link to={homePath} className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
                            <div className="w-7 h-7 rounded-md nc-gradient flex items-center justify-center">
                                <Sparkles className="h-3.5 w-3.5 text-deep-space" />
                            </div>
                            <span className="text-lg font-display font-bold nc-gradient-text select-none">
                                Next Control
                            </span>
                        </Link>

                        {/* Nav Links — hidden on mobile, MobileBottomNav handles it */}
                        {navLinks.length > 0 && (
                            <nav className="hidden md:flex items-center gap-1 ml-4">
                                {navLinks.map((link) => {
                                    const isActive = location.pathname === link.path;
                                    return (
                                        <Link
                                            key={link.path}
                                            to={link.path}
                                            className={`px-3 py-1.5 text-sm rounded-md transition-colors ${isActive
                                                ? 'bg-primary/10 text-primary font-medium'
                                                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                                                }`}
                                        >
                                            {link.label}
                                        </Link>
                                    );
                                })}
                            </nav>
                        )}
                    </div>

                    <div className="flex items-center gap-3">
                        {user && (
                            <>
                                <span className="hidden sm:inline text-sm text-muted-foreground">
                                    {user.name}
                                </span>
                                <Badge
                                    variant="outline"
                                    className="bg-solar/15 text-solar border-solar/30 text-xs uppercase tracking-wider"
                                >
                                    {ROLE_LABELS[user.role] || user.role}
                                </Badge>
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

            {/* Content — extra bottom padding on mobile for the bottom nav */}
            <main className="flex-1 p-4 sm:p-6 pb-20 md:pb-6">
                <PageTransition>{children}</PageTransition>
            </main>

            {/* Mobile Bottom Navigation */}
            {navLinks.length > 0 && <MobileBottomNav navLinks={navLinks} />}
        </div>
    );
}
