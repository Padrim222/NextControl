import { ReactNode, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    LogOut,
    Sparkles,
    LayoutDashboard,
    Users,
    Phone,
    Database,
    Inbox,
    BookOpen,
    MessageSquare,
    TrendingUp,
    ClipboardCheck,
    BarChart3,
    Lightbulb,
    HelpCircle,
    PanelLeftClose,
    PanelLeftOpen,
    type LucideIcon,
    FlaskConical,
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { MobileBottomNav } from './MobileBottomNav';
import { PageTransition } from './PageTransition';
import { AppNavigator } from './AppNavigator';
import { OnboardingWizard } from '../wizard/OnboardingWizard';
import type { UserRole } from '@/types';

const ROLE_LABELS: Record<string, string> = {
    admin: 'Admin',
    seller: 'Seller',
    closer: 'Closer',
    client: 'Cliente',
    cs: 'CS de Vendas',
    team_member: 'Time',
};

const ROLE_HOME: Record<UserRole, string> = {
    admin: '/admin',
    seller: '/seller',
    closer: '/closer',
    client: '/client',
    cs: '/cs',
    team_member: '/seller',
};

interface NavItem {
    label: string;
    path: string;
    icon: LucideIcon;
}

const NAV_CONFIG: Record<string, NavItem[]> = {
    admin: [
        { label: 'Dashboard', path: '/admin', icon: LayoutDashboard },
        { label: 'Clientes', path: '/admin/manage', icon: Users },
        { label: 'Pipeline de Calls', path: '/training/coach', icon: Phone },
        { label: 'Formulários', path: '/seller/report', icon: ClipboardCheck },
        { label: 'Base RAG', path: '/admin/rag', icon: Database },
        { label: 'Beta', path: '/training', icon: FlaskConical },
    ],
    seller: [
        { label: 'Dashboard', path: '/seller', icon: LayoutDashboard },
        { label: 'Relatório Diário', path: '/seller/report', icon: ClipboardCheck },
        { label: 'Evolução Semanal', path: '/seller/evolution', icon: TrendingUp },
        { label: 'Consultoria de Bolso', path: '/training/coach', icon: MessageSquare },
    ],
    closer: [
        { label: 'Dashboard', path: '/closer', icon: LayoutDashboard },
        { label: 'Análise de Call', path: '/closer/call-analysis', icon: Phone },
        { label: 'Insights', path: '/seller/evolution', icon: Lightbulb },
    ],
    client: [
        { label: 'Meu Plano', path: '/client', icon: LayoutDashboard },
        { label: 'Conteúdos IA', path: '/training', icon: BookOpen },
        { label: 'Calls', path: '/training/coach', icon: Phone },
        { label: 'Relatórios', path: '/seller/evolution', icon: BarChart3 },
        { label: 'Perguntas', path: '/client', icon: HelpCircle },
    ],
    cs: [
        { label: 'Inbox', path: '/cs', icon: Inbox },
    ],
    team_member: [
        { label: 'Consultoria de Bolso', path: '/training/coach', icon: MessageSquare },
        { label: 'Check-in Diário', path: '/seller/report', icon: ClipboardCheck },
        { label: 'Análise de Call', path: '/closer/call-analysis', icon: Phone },
    ],
};

// Legacy nav links for MobileBottomNav compatibility
const NAV_LINKS: Record<string, { label: string; path: string }[]> = Object.fromEntries(
    Object.entries(NAV_CONFIG).map(([role, items]) => [
        role,
        items.map(({ label, path }) => ({ label, path })),
    ]),
);

interface DashboardLayoutProps {
    children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
    const { user, logout } = useAuth();
    const location = useLocation();
    const [collapsed, setCollapsed] = useState(false);

    const navItems = user ? NAV_CONFIG[user.role] || [] : [];
    const navLinks = user ? NAV_LINKS[user.role] || [] : [];
    const homePath = user ? ROLE_HOME[user.role] || '/' : '/';

    return (
        <div className="min-h-screen bg-background flex">
            {/* ─── Desktop Sidebar ─── */}
            <aside
                className={`hidden md:flex flex-col fixed top-0 left-0 h-screen z-50 border-r border-border/50 bg-card transition-all duration-300 ${
                    collapsed ? 'w-16' : 'w-64'
                }`}
            >
                {/* Logo */}
                <div className="flex items-center justify-between h-14 px-3 border-b border-border/50 shrink-0">
                    <Link to={homePath} className="flex items-center gap-2.5 hover:opacity-80 transition-opacity overflow-hidden">
                        <div className="w-8 h-8 rounded-md nc-gradient flex items-center justify-center shrink-0">
                            <Sparkles className="h-4 w-4 text-deep-space" />
                        </div>
                        {!collapsed && (
                            <span className="text-lg font-display font-bold nc-gradient-text select-none whitespace-nowrap">
                                Next Control
                            </span>
                        )}
                    </Link>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 shrink-0 text-muted-foreground hover:text-foreground"
                        onClick={() => setCollapsed(v => !v)}
                    >
                        {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
                    </Button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-1">
                    {navItems.map((item) => {
                        const isActive = location.pathname === item.path;
                        const Icon = item.icon;
                        return (
                            <Link
                                key={item.path + item.label}
                                to={item.path}
                                title={collapsed ? item.label : undefined}
                                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group ${
                                    isActive
                                        ? 'bg-solar/15 text-solar'
                                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                                }`}
                            >
                                <Icon
                                    className={`h-[18px] w-[18px] shrink-0 transition-colors ${
                                        isActive ? 'text-solar' : 'text-muted-foreground group-hover:text-foreground'
                                    }`}
                                    strokeWidth={isActive ? 2.5 : 2}
                                />
                                {!collapsed && (
                                    <span className="whitespace-nowrap">{item.label}</span>
                                )}
                                {isActive && !collapsed && (
                                    <div className="ml-auto w-1.5 h-1.5 rounded-full bg-solar" />
                                )}
                            </Link>
                        );
                    })}
                </nav>

                {/* User info + Logout */}
                <div className="border-t border-border/50 p-3 shrink-0 space-y-2">
                    {user && !collapsed && (
                        <div className="flex items-center gap-2 px-1">
                            <div className="w-8 h-8 rounded-full bg-solar/10 flex items-center justify-center text-solar font-bold text-xs shrink-0">
                                {user.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="overflow-hidden">
                                <p className="text-sm font-medium truncate">{user.name}</p>
                                <Badge
                                    variant="outline"
                                    className="bg-solar/15 text-solar border-solar/30 text-[10px] uppercase tracking-wider"
                                >
                                    {ROLE_LABELS[user.role] || user.role}
                                </Badge>
                            </div>
                        </div>
                    )}
                    {user && collapsed && (
                        <div className="flex justify-center">
                            <div className="w-8 h-8 rounded-full bg-solar/10 flex items-center justify-center text-solar font-bold text-xs">
                                {user.name.charAt(0).toUpperCase()}
                            </div>
                        </div>
                    )}
                    <Button
                        variant="ghost"
                        size={collapsed ? 'icon' : 'sm'}
                        onClick={logout}
                        className={`text-muted-foreground hover:text-destructive ${
                            collapsed ? 'w-full justify-center' : 'w-full justify-start'
                        }`}
                        title="Sair"
                    >
                        <LogOut className="h-4 w-4" />
                        {!collapsed && <span className="ml-2">Sair</span>}
                    </Button>
                </div>
            </aside>

            {/* ─── Main Content ─── */}
            <main
                className={`flex-1 min-h-screen transition-all duration-300 pb-20 md:pb-6 ${
                    collapsed ? 'md:ml-16' : 'md:ml-64'
                }`}
            >
                {/* Mobile top bar (simplified — just logo + user) */}
                <header className="md:hidden sticky top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur-md">
                    <div className="flex items-center justify-between h-14 px-4">
                        <Link to={homePath} className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-md nc-gradient flex items-center justify-center">
                                <Sparkles className="h-3.5 w-3.5 text-deep-space" />
                            </div>
                            <span className="text-lg font-display font-bold nc-gradient-text select-none">
                                Next Control
                            </span>
                        </Link>
                        <div className="flex items-center gap-2">
                            {user && (
                                <Badge
                                    variant="outline"
                                    className="bg-solar/15 text-solar border-solar/30 text-xs uppercase tracking-wider"
                                >
                                    {ROLE_LABELS[user.role] || user.role}
                                </Badge>
                            )}
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={logout}
                                className="text-muted-foreground hover:text-destructive"
                            >
                                <LogOut className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </header>

                <div className="p-4 sm:p-6">
                    <PageTransition>{children}</PageTransition>
                </div>
            </main>

            {/* ─── Mobile Bottom Nav ─── */}
            {navLinks.length > 0 && <MobileBottomNav navLinks={navLinks} />}

            {/* ─── Global overlays ─── */}
            <AppNavigator />
            <OnboardingWizard />
        </div>
    );
}
