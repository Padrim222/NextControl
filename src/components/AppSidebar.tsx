import { useAuth } from '@/contexts/AuthContext';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Phone,
  LogOut,
  Eye,
  MessageSquare,
  GraduationCap,
  Sparkles,
  Send,
  FileText,
  Users,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const AppSidebar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();

  if (!user) return null;

  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path + '/');

  const linkClass = (path: string) =>
    `flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all relative ${isActive(path)
      ? 'nc-sidebar-active text-foreground'
      : 'text-muted-foreground nc-sidebar-hover hover:text-foreground'
    }`;

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 border-r border-border bg-sidebar flex flex-col z-50">
      {/* Brand */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg nc-gradient flex items-center justify-center">
            <Sparkles className="h-4 w-4 text-deep-space" />
          </div>
          <div>
            <h1 className="font-display text-base font-bold nc-gradient-text">Next Control</h1>
            <p className="text-[10px] text-muted-foreground tracking-wider uppercase">Consultoria de Bolso</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-0.5">
        <p className="px-4 py-2 text-[10px] font-medium text-muted-foreground uppercase tracking-widest">
          Principal
        </p>

        {/* Admin */}
        {user.role === 'admin' && (
          <Link to="/admin" className={linkClass('/admin')}>
            <LayoutDashboard size={18} /> Dashboard
          </Link>
        )}

        {/* Seller */}
        {(user.role === 'seller') && (
          <>
            <Link to="/seller" className={linkClass('/seller')}>
              <LayoutDashboard size={18} /> Dashboard
            </Link>
          </>
        )}

        {/* Closer */}
        {user.role === 'closer' && (
          <Link to="/closer" className={linkClass('/closer')}>
            <Phone size={18} /> Dashboard
          </Link>
        )}

        {/* Client */}
        {user.role === 'client' && (
          <Link to="/client" className={linkClass('/client')}>
            <Eye size={18} /> Meu Painel
          </Link>
        )}

        {/* CS */}
        {(user.role === 'admin' || user.role === 'cs') && (
          <Link to="/cs" className={linkClass('/cs')}>
            <Users size={18} /> CS Dashboard
          </Link>
        )}

        {/* Coaching & Training */}
        {(user.role === 'seller' || user.role === 'closer' || user.role === 'admin') && (
          <>
            <p className="px-4 py-2 mt-4 text-[10px] font-medium text-muted-foreground uppercase tracking-widest">
              Coaching
            </p>
            <Link to="/training/coach" className={linkClass('/training/coach')}>
              <MessageSquare size={18} /> Consultoria
            </Link>
            <Link to="/training" className={linkClass('/training')}>
              <GraduationCap size={18} /> Materiais
            </Link>
          </>
        )}
      </nav>

      {/* User Footer */}
      <div className="p-4 border-t border-border">
        <div className="flex items-center gap-3 mb-3 px-2">
          <div className="w-8 h-8 rounded-full nc-gradient flex items-center justify-center text-xs font-bold text-primary-foreground">
            {user.name.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user.name}</p>
            <p className="text-xs text-muted-foreground capitalize">
              {user.role === 'cs' ? 'CS de Vendas' : user.seller_type || user.role}
            </p>
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
