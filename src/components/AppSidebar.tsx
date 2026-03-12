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
  Users,
} from '@/components/ui/icons';
import { Button } from '@/components/ui/button';

const AppSidebar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();

  if (!user) return null;

  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path + '/');

  const linkClass = (path: string) =>
    `flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-all group ${isActive(path)
      ? 'nc-sidebar-active'
      : 'text-slate-600 hover:text-navy hover:bg-slate-50'
    }`;

  const iconColor = (path: string) => isActive(path) ? '#E6B84D' : 'currentColor';

  return (
    <aside className="fixed left-0 top-0 h-screen w-60 border-r border-[#E5E7EB] bg-white flex flex-col z-50">
      {/* Brand */}
      <div className="p-6 border-b border-[#E5E7EB]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#E6B84D] flex items-center justify-center shadow-sm">
            <Sparkles size={20} color="#1B2B4A" />
          </div>
          <div>
            <h1 className="font-display text-lg font-bold text-[#1B2B4A] tracking-tight">Level Up</h1>
            <p className="text-[10px] text-slate-500 tracking-wider uppercase font-semibold">Consultoria IA</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        <p className="px-4 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Principal
        </p>

        {/* Admin */}
        {user.role === 'admin' && (
          <Link to="/admin" className={linkClass('/admin')}>
            <LayoutDashboard size={20} color={iconColor('/admin')} /> Dashboard
          </Link>
        )}

        {/* Seller */}
        {(user.role === 'seller') && (
          <>
            <Link to="/seller" className={linkClass('/seller')}>
              <LayoutDashboard size={20} color={iconColor('/seller')} /> Dashboard
            </Link>
          </>
        )}

        {/* Closer */}
        {user.role === 'closer' && (
          <Link to="/closer" className={linkClass('/closer')}>
            <Phone size={20} color={iconColor('/closer')} /> Dashboard
          </Link>
        )}

        {/* Client */}
        {user.role === 'client' && (
          <Link to="/client" className={linkClass('/client')}>
            <Eye size={20} color={iconColor('/client')} /> Meu Painel
          </Link>
        )}

        {/* CS */}
        {(user.role === 'admin' || user.role === 'cs') && (
          <Link to="/cs" className={linkClass('/cs')}>
            <Users size={20} color={iconColor('/cs')} /> CS Dashboard
          </Link>
        )}

        {/* Coaching & Training */}
        {(user.role === 'seller' || user.role === 'closer' || user.role === 'admin') && (
          <>
            <p className="px-4 py-2 mt-6 mb-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Desenvolvimento
            </p>
            <Link to="/training/coach" className={linkClass('/training/coach')}>
              <MessageSquare size={20} color={iconColor('/training/coach')} /> Consultoria
            </Link>
            <Link to="/training" className={linkClass('/training')}>
              <GraduationCap size={20} color={iconColor('/training')} /> Base de Conhecimento
            </Link>
          </>
        )}
      </nav>

      {/* User Footer */}
      <div className="p-4 border-t border-[#E5E7EB] bg-slate-50/50">
        <div className="flex items-center gap-3 mb-4 rounded-xl p-3 bg-white border border-[#E5E7EB] shadow-sm">
          <div className="w-10 h-10 rounded-full bg-[#E6B84D] flex items-center justify-center text-sm font-bold text-[#1B2B4A]">
            {user.name.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-[#1B2B4A] truncate">{user.name}</p>
            <p className="text-[11px] text-slate-500 font-medium uppercase tracking-wider">
              {user.role === 'cs' ? 'CS de Vendas' : user.seller_type || user.role}
            </p>
          </div>
        </div>
        <button 
          onClick={logout}
          className="w-full flex items-center justify-center gap-2 py-2.5 text-sm font-medium text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100"
        >
          <LogOut size={18} /> Encerrar Sessão
        </button>
      </div>
    </aside>
  );
};

export default AppSidebar;
