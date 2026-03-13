import { ReactNode, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LogOut, Sparkles, Menu, X, ChevronRight } from '@/components/ui/icons';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
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

const ROLE_COLORS: Record<string, string> = {
    admin: 'bg-red-500/15 text-red-400 border-red-500/30',
    seller: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
    closer: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    client: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
    cs: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
};

const ROLE_HOME: Record<UserRole, string> = {
    admin: '/admin',
    seller: '/seller',
    closer: '/closer',
    client: '/client',
    cs: '/cs',
};

interface NavGroup {
    label: string;
    items: { label: string; path: string; icon?: string }[];
}

const NAV_GROUPS: Record<string, NavGroup[]> = {
    admin: [
        {
            label: 'FAZER',
            items: [
                { label: 'Painel Geral', path: '/admin' },
                { label: 'Gestão da Equipe', path: '/admin/manage' },
            ],
        },
        {
            label: 'REVISAR',
            items: [
                { label: 'CS Inbox', path: '/cs' },
                { label: 'Treinamentos', path: '/training' },
                { label: 'Análise de Calls', path: '/closer/call-analysis' },
            ],
        },
        {
            label: 'CONFIGURAR',
            items: [
                { label: 'Base de Conhecimento', path: '/admin/rag' },
            ],
        },
    ],
    seller: [
        {
            label: 'FAZER',
            items: [
                { label: 'Dashboard', path: '/seller' },
                { label: 'Check-in do Dia', path: '/seller/report' },
            ],
        },
        {
            label: 'REVISAR',
            items: [
                { label: 'Meu Desempenho', path: '/seller/evolution' },
                { label: 'Histórico', path: '/seller' },
            ],
        },
        {
            label: 'SUPORTE',
            items: [
                { label: 'Consultoria IA', path: '/training/coach' },
                { label: 'Treinamentos', path: '/training' },
            ],
        },
    ],
    closer: [
        {
            label: 'FAZER',
            items: [
                { label: 'Dashboard', path: '/closer' },
                { label: 'Check-in do Dia', path: '/seller/report' },
            ],
        },
        {
            label: 'REVISAR',
            items: [
                { label: 'Análise de Calls', path: '/closer/call-analysis' },
                { label: 'Evolução', path: '/seller/evolution' },
            ],
        },
        {
            label: 'SUPORTE',
            items: [
                { label: 'Consultoria IA', path: '/training/coach' },
                { label: 'Treinamentos', path: '/training' },
            ],
        },
    ],
    cs: [
        {
            label: 'FAZER',
            items: [
                { label: 'CS Inbox', path: '/cs' },
            ],
        },
        {
            label: 'REVISAR',
            items: [
                { label: 'Treinamentos', path: '/training' },
            ],
        },
    ],
    client: [
        {
            label: 'FAZER',
            items: [
                { label: 'Meu Projeto', path: '/client' },
                { label: 'Preencher Briefing', path: '/client/onboarding' },
            ],
        },
        {
            label: 'SUPORTE',
            items: [
                { label: 'Consultoria IA', path: '/training/coach' },
                { label: 'Materiais', path: '/training' },
            ],
        },
    ],
};

// Flat nav for mobile bottom nav
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
        { label: 'Coach', path: '/training/coach' },
    ],
    cs: [
        { label: 'Inbox', path: '/cs' },
        { label: 'Treinamento', path: '/training' },
    ],
    client: [
        { label: 'Dashboard', path: '/client' },
        { label: 'Briefing', path: '/client/onboarding' },
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
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const navGroups = user ? NAV_GROUPS[user.role] || [] : [];
    const navLinks = user ? NAV_LINKS[user.role] || [] : [];
    const homePath = user ? ROLE_HOME[user.role as UserRole] || '/' : '/';

    const isActive = (path: string) => location.pathname === path;

    const SidebarContent = () => (
        <div className="flex flex-col h-full">
            {/* Logo */}
            <div className="h-14 flex items-center px-4 border-b border-border/50 flex-shrink-0">
                <Link
                    to={homePath}
                    className="flex items-center gap-2.5 hover:opacity-80 transition-opacity"
                    onClick={() => setSidebarOpen(false)}
                >
                    <div className="w-7 h-7 rounded-md nc-gradient flex items-center justify-center flex-shrink-0">
                        <Sparkles className="h-3.5 w-3.5 text-deep-space" />
                    </div>
                    <span className="text-lg font-display font-bold nc-gradient-text select-none">
                        Next Control
                    </span>
                </Link>
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto px-2 py-4 space-y-6">
                {navGroups.map((group) => (
                    <div key={group.label}>
                        <p className="text-[10px] font-bold tracking-widest text-muted-foreground/60 px-3 mb-1.5 uppercase">
                            {group.label}
                        </p>
                        <div className="space-y-0.5">
                            {group.items.map((item) => (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    onClick={() => setSidebarOpen(false)}
                                    className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-all group ${
                                        isActive(item.path)
                                            ? 'bg-primary/10 text-primary font-medium'
                                            : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                                    }`}
                                >
                                    <span>{item.label}</span>
                                    {isActive(item.path) && (
                                        <ChevronRight className="h-3.5 w-3.5 text-primary/60" />
                                    )}
                                </Link>
                            ))}
                        </div>
                    </div>
                ))}
            </nav>

            {/* User + Logout */}
            {user && (
                <div className="px-3 py-3 border-t border-border/50 flex-shrink-0">
                    <div className="flex items-center gap-2.5 mb-2">
                        <div className="w-8 h-8 rounded-full bg-solar/15 flex items-center justify-center flex-shrink-0">
                            <span className="text-solar text-xs font-bold">
                                {user.name?.charAt(0)?.toUpperCase()}
                            </span>
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium truncate">{user.name}</p>
                            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                        </div>
                    </div>
                    <div className="flex items-center justify-between">
                        <Badge
                            variant="outline"
                            className={`text-xs uppercase tracking-wider ${ROLE_COLORS[user.role] || ''}`}
                        >
                            {ROLE_LABELS[user.role] || user.role}
                        </Badge>
                        <div className="flex items-center gap-1">
                            <ThemeToggle />
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={logout}
                                className="text-muted-foreground hover:text-destructive h-7 px-2 text-xs"
                            >
                                <LogOut className="h-3.5 w-3.5 mr-1" />
                                Sair
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );

    return (
        <div className="min-h-screen bg-background flex">
            {/* Desktop Sidebar */}
            <aside className="hidden md:flex flex-col w-56 lg:w-60 border-r border-border/50 bg-card/50 flex-shrink-0 sticky top-0 h-screen">
                <SidebarContent />
            </aside>

            {/* Mobile Overlay Sidebar */}
            {sidebarOpen && (
                <div className="md:hidden fixed inset-0 z-50 flex">
                    <div
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={() => setSidebarOpen(false)}
                    />
                    <aside className="relative w-64 h-full bg-background border-r border-border/50 flex flex-col z-10">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="absolute top-3 right-3 h-8 w-8"
                            onClick={() => setSidebarOpen(false)}
                        >
                            <X className="h-4 w-4" />
                        </Button>
                        <SidebarContent />
                    </aside>
                </div>
            )}

            {/* Main content */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Mobile top bar */}
                <header className="md:hidden sticky top-0 z-40 w-full border-b border-border/50 bg-background/80 backdrop-blur-md">
                    <div className="flex items-center justify-between h-14 px-4">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9"
                            onClick={() => setSidebarOpen(true)}
                        >
                            <Menu className="h-5 w-5" />
                        </Button>
                        <Link to={homePath} className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-md nc-gradient flex items-center justify-center">
                                <Sparkles className="h-3 w-3 text-deep-space" />
                            </div>
                            <span className="font-display font-bold nc-gradient-text text-base">Next Control</span>
                        </Link>
                        {user && (
                            <Badge
                                variant="outline"
                                className={`text-xs uppercase tracking-wider ${ROLE_COLORS[user.role] || ''}`}
                            >
                                {ROLE_LABELS[user.role] || user.role}
                            </Badge>
                        )}
                    </div>
                </header>

                {/* Page content */}
                <main className="flex-1 p-4 sm:p-6 pb-20 md:pb-6 overflow-auto">
                    <PageTransition>{children}</PageTransition>
                </main>
            </div>

            {/* Mobile Bottom Navigation */}
            {navLinks.length > 0 && <MobileBottomNav navLinks={navLinks} />}
        </div>
    );
}
