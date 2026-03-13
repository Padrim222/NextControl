import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { ArrowLeft, Zap } from "lucide-react";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error("404:", location.pathname);
  }, [location.pathname]);

  return (
    <div
      className="flex min-h-screen items-center justify-center"
      style={{ background: '#FAFAFA', fontFamily: 'DM Sans, system-ui, sans-serif' }}
    >
      <div className="text-center max-w-sm px-6">
        <div className="w-14 h-14 rounded-2xl bg-[#1B2B4A] flex items-center justify-center mx-auto mb-6">
          <Zap size={22} style={{ color: '#E6B84D' }} strokeWidth={2} />
        </div>
        <div
          className="text-[80px] font-bold leading-none mb-3"
          style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', color: '#1A1A1A' }}
        >
          404
        </div>
        <p className="text-[17px] font-semibold mb-2" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', color: '#1A1A1A' }}>
          Página não encontrada
        </p>
        <p className="text-[14px] mb-8" style={{ color: '#6B7280' }}>
          O caminho <code className="text-[13px] bg-[#F3F4F6] px-1.5 py-0.5 rounded">{location.pathname}</code> não existe.
        </p>
        <button
          onClick={() => navigate('/')}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-[14px] font-semibold text-white transition-opacity hover:opacity-90"
          style={{ background: '#1B2B4A' }}
        >
          <ArrowLeft size={15} /> Voltar ao início
        </button>
      </div>
    </div>
  );
};

export default NotFound;
