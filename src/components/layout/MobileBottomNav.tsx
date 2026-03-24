import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  ClipboardCheck,
  TrendingUp,
  MessageSquare,
  Phone,
  Users,
  Database,
  Inbox,
  BookOpen,
  type LucideIcon,
  Circle,
} from '@/components/ui/icons';

const NAV_ICONS: Record<string, LucideIcon> = {
  '/seller': LayoutDashboard,
  '/seller/report': ClipboardCheck,
  '/seller/evolution': TrendingUp,
  '/training/coach': MessageSquare,
  '/training': BookOpen,
  '/closer': LayoutDashboard,
  '/closer/call-analysis': Phone,
  '/admin': LayoutDashboard,
  '/admin/manage': Users,
  '/admin/rag': Database,
  '/agent': MessageSquare,
  '/cs': Inbox,
};

interface NavItem {
  label: string;
  path: string;
}

interface MobileBottomNavProps {
  navLinks: NavItem[];
}

export function MobileBottomNav({ navLinks }: MobileBottomNavProps) {
  const location = useLocation();

  // Limit to 5 items max for bottom nav
  const visibleLinks = navLinks.slice(0, 5);

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-border/50 bg-background/95 backdrop-blur-md">
      <div className="flex justify-around items-center h-16 px-2 pb-safe">
        {visibleLinks.map((link) => {
          const isActive = location.pathname === link.path;
          const Icon = NAV_ICONS[link.path] || Circle;

          return (
            <Link
              key={link.path}
              to={link.path}
              className={`flex flex-col items-center justify-center gap-0.5 min-w-[56px] min-h-[44px] rounded-lg px-2 py-1 transition-colors ${
                isActive
                  ? 'text-solar'
                  : 'text-muted-foreground'
              }`}
            >
              <div
                className={`flex items-center justify-center w-8 h-8 rounded-lg transition-colors ${
                  isActive ? 'bg-solar/15' : ''
                }`}
              >
                <Icon className="h-4.5 w-4.5" strokeWidth={isActive ? 2.5 : 2} />
              </div>
              <span className={`text-[10px] leading-tight ${isActive ? 'font-semibold' : 'font-medium'}`}>
                {link.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
