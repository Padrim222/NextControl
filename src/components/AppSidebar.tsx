import { useAuth } from '@/contexts/AuthContext';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Phone,
  LogOut,
  Eye,
  MessageSquare,
  GraduationCap,
  Send,
  FileText,
  Users,
  TrendingUp,
  Zap,
  Settings,
  ChevronRight,
  CheckSquare,
  BookOpen,
  Inbox,
} from '@/components/ui/icons';
import { Button } from '@/components/ui/button';

const AppSidebar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();

  if (!user) return null;

  const isActive = (path: string) =>
    location.pathname === path || location.pathname.startsWith(path + '/');

  const NavItem = ({
    to,
    icon: Icon,
    label,
    hint,
    badge,
  }: {
    to: string;
    icon: React.ElementType;
    label: string;
    hint?: string;
    badge?: number;
  }) => {
    const active = isActive(to);
    return (
      <Link
        to={to}
        className={`group flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
          active
            ? 'bg-[#1B2B4A] text-white'
            : 'text-[#6B7280] hover:bg-[#F3F4F6] hover:text-[#1A1A1A]'
        }`}
        title={hint}
      >
        <Icon
          size={16}
          strokeWidth={1.5}
          className={`flex-shrink-0 ${active ? 'text-[#E6B84D]' : 'text-current'}`}
        />
        <span className="flex-1 truncate">{label}</span>
        {badge !== undefined && badge > 0 && (
          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0 ${
            active ? 'bg-white/20 text-white' : 'bg-amber-100 text-amber-700'
          }`}>
            {badge}
          </span>
        )}
        {active && !badge && (
          <ChevronRight size={12} className="text-[#E6B84D] opacity-70 flex-shrink-0" />
        )}
      </Link>
    );
  };

  const ZoneLabel = ({ children }: { children: React.ReactNode }) => (
    <p className="px-3 pt-5 pb-1.5 text-[9px] font-bold uppercase tracking-[0.12em] text-[#C4C9D4]">
      {children}
    </p>
  );

  const roleLabel = () => {
    switch (user.role) {
      case 'admin': return 'Administrador';
      case 'seller': return user.seller_type || 'Vendedor';
      case 'closer': return 'Closer';
      case 'client': return 'Cliente';
      case 'cs': return 'CS de Vendas';
      default: return user.role;
    }
  };

  const roleBadgeColor = () => {
    switch (user.role) {
      case 'admin': return 'bg-red-100 text-red-700';
      case 'seller': return 'bg-blue-100 text-blue-700';
      case 'closer': return 'bg-amber-100 text-amber-700';
      case 'client': return 'bg-purple-100 text-purple-700';
      case 'cs': return 'bg-emerald-100 text-emerald-700';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  return (
    <aside className="fixed left-0 top-0 h-screen w-60 bg-white border-r border-[#E5E7EB] flex flex-col z-50">

      {/* Logo */}
      <div className="px-5 py-4 border-b border-[#E5E7EB]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#1B2B4A] flex items-center justify-center flex-shrink-0">
            <Zap size={15} className="text-[#E6B84D]" strokeWidth={2} />
          </div>
          <div>
            <h1 className="text-[14px] font-bold text-[#1A1A1A] leading-tight"
              style={{ fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif' }}>
              Next Control
            </h1>
            <p className="text-[9px] text-[#9CA3AF] font-medium tracking-wider uppercase mt-0.5">
              Consultoria de Bolso
            </p>
          </div>
        </div>
      </div>

      {/* User */}
      <div className="px-4 py-3 border-b border-[#E5E7EB]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-[#1B2B4A] flex items-center justify-center text-[12px] font-bold text-white flex-shrink-0">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-semibold text-[#1A1A1A] truncate leading-tight">
              {user.name}
            </p>
            <span className={`inline-block text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full mt-0.5 ${roleBadgeColor()}`}>
              {roleLabel()}
            </span>
          </div>
        </div>
      </div>

      {/* Navigation — Command Center */}
      <nav className="flex-1 px-3 py-1 overflow-y-auto">

        {/* ── ADMIN ── */}
        {user.role === 'admin' && (
          <>
            <ZoneLabel>Fazer</ZoneLabel>
            <NavItem to="/admin" icon={LayoutDashboard} label="Painel Geral" hint="Ver pendências, submissões e validações" />
            <NavItem to="/admin/manage" icon={Users} label="Gerenciar Equipe" hint="Adicionar membros e clientes" />

            <ZoneLabel>Revisar</ZoneLabel>
            <NavItem to="/cs" icon={Inbox} label="CS Inbox" hint="Perguntas de clientes aguardando resposta" />
            <NavItem to="/training" icon={GraduationCap} label="Treinamentos" hint="Materiais de capacitação da equipe" />

            <ZoneLabel>Configurar</ZoneLabel>
            <NavItem to="/admin/rag" icon={BookOpen} label="Base de Conhecimento" hint="Adicionar conteúdo para a IA analisar" />
          </>
        )}

        {/* ── SELLER ── */}
        {user.role === 'seller' && (
          <>
            <ZoneLabel>Fazer</ZoneLabel>
            <NavItem to="/seller/report" icon={Send} label="Check-in do Dia" hint="Registrar suas atividades diárias" />

            <ZoneLabel>Revisar</ZoneLabel>
            <NavItem to="/seller" icon={LayoutDashboard} label="Meu Desempenho" hint="Ver score, feedback e histórico" />
            <NavItem to="/seller/evolution" icon={TrendingUp} label="Evolução Semanal" hint="Tendências e progresso ao longo do tempo" />

            <ZoneLabel>Suporte</ZoneLabel>
            <NavItem to="/training/coach" icon={MessageSquare} label="Consultoria IA" hint="Tire dúvidas estratégicas com IA" />
            <NavItem to="/training" icon={GraduationCap} label="Materiais" hint="Biblioteca de treinamento" />
          </>
        )}

        {/* ── CLOSER ── */}
        {user.role === 'closer' && (
          <>
            <ZoneLabel>Fazer</ZoneLabel>
            <NavItem to="/closer/report" icon={Phone} label="Check-in de Closer" hint="Registrar calls e fechamentos do dia" />

            <ZoneLabel>Revisar</ZoneLabel>
            <NavItem to="/closer" icon={LayoutDashboard} label="Meu Desempenho" hint="Ver score, conversão e histórico" />
            <NavItem to="/closer/call-analysis" icon={FileText} label="Análise de Calls" hint="Feedback detalhado por chamada" />

            <ZoneLabel>Suporte</ZoneLabel>
            <NavItem to="/training/coach" icon={MessageSquare} label="Consultoria IA" hint="Tire dúvidas estratégicas com IA" />
            <NavItem to="/training" icon={GraduationCap} label="Materiais" hint="Biblioteca de treinamento" />
          </>
        )}

        {/* ── CLIENT ── */}
        {user.role === 'client' && (
          <>
            <ZoneLabel>Fazer</ZoneLabel>
            <NavItem to="/client" icon={Eye} label="Meu Projeto" hint="Acompanhar plano e fases do projeto" />

            <ZoneLabel>Suporte</ZoneLabel>
            <NavItem to="/training/coach" icon={MessageSquare} label="Consultoria de Bolso" hint="Tire dúvidas estratégicas com IA" />
            <NavItem to="/training" icon={BookOpen} label="Conhecimento" hint="Materiais e treinamentos" />
          </>
        )}

        {/* ── CS ── */}
        {user.role === 'cs' && (
          <>
            <ZoneLabel>Fazer</ZoneLabel>
            <NavItem to="/cs" icon={Inbox} label="Inbox de Clientes" hint="Perguntas aguardando resposta" />

            <ZoneLabel>Revisar</ZoneLabel>
            <NavItem to="/training" icon={GraduationCap} label="Treinamentos" hint="Gerenciar materiais de capacitação" />
          </>
        )}

      </nav>

      {/* Logout */}
      <div className="px-4 py-3 border-t border-[#E5E7EB]">
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-2 text-[12px] text-[#9CA3AF] font-medium hover:bg-[#F3F4F6] hover:text-[#1A1A1A] rounded-lg"
          onClick={logout}
        >
          <LogOut size={14} strokeWidth={1.5} />
          Sair da conta
        </Button>
      </div>
    </aside>
  );
};

export default AppSidebar;
