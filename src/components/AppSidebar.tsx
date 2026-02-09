import { useAuth } from '@/contexts/AuthContext';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, FileText, Users, LogOut, ClipboardList, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';

const AppSidebar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();

  if (!user) return null;

  const linkClass = (path: string) =>
    `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
      location.pathname === path
        ? 'bg-primary/10 text-primary sf-card-glow'
        : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
    }`;

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 border-r border-border bg-sidebar flex flex-col z-50">
      <div className="p-6 border-b border-border">
        <h1 className="font-display text-lg font-bold sf-gradient-text">Social Funnels™</h1>
        <p className="text-xs text-muted-foreground mt-1">CRM Platform</p>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {user.role === 'admin' && (
          <>
            <Link to="/admin" className={linkClass('/admin')}>
              <LayoutDashboard size={18} /> Dashboard
            </Link>
            <Link to="/admin/approvals" className={linkClass('/admin/approvals')}>
              <ClipboardList size={18} /> Aprovações
            </Link>
            <Link to="/admin/users" className={linkClass('/admin/users')}>
              <Users size={18} /> Usuários
            </Link>
          </>
        )}
        {user.role === 'seller' && (
          <>
            <Link to="/seller" className={linkClass('/seller')}>
              <LayoutDashboard size={18} /> Meus Clientes
            </Link>
            <Link to="/seller/reports" className={linkClass('/seller/reports')}>
              <FileText size={18} /> Relatórios
            </Link>
          </>
        )}
        {user.role === 'closer' && (
          <>
            <Link to="/closer" className={linkClass('/closer')}>
              <Phone size={18} /> Calls
            </Link>
            <Link to="/closer/history" className={linkClass('/closer/history')}>
              <FileText size={18} /> Histórico
            </Link>
          </>
        )}
      </nav>

      <div className="p-4 border-t border-border">
        <div className="flex items-center gap-3 mb-3 px-2">
          <div className="w-8 h-8 rounded-full sf-gradient flex items-center justify-center text-xs font-bold text-primary-foreground">
            {user.name.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user.name}</p>
            <p className="text-xs text-muted-foreground capitalize">{user.role}</p>
          </div>
        </div>
        <Button variant="ghost" size="sm" className="w-full justify-start gap-2 text-muted-foreground" onClick={logout}>
          <LogOut size={16} /> Sair
        </Button>
      </div>
    </aside>
  );
};

export default AppSidebar;
