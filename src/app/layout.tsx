import React from 'react';

// Um placeholder simples que emula um layout com navegação lateral e transição.
// Numa app Next real as âncoras seriam <Link href="..."> 

export default function Layout({ children }: { children: React.ReactNode }) {
  const [activeTab, setActiveTab] = React.useState('ss');

  return (
    <div className="flex h-screen bg-slate-100 font-sans">
      <div className="w-64 bg-slate-900 text-slate-300 flex flex-col p-4 shadow-xl z-10 shrink-0">
        <h1 className="text-white text-xl font-bold tracking-tight mb-8">NextControl<span className="text-blue-500 text-xs uppercase align-top ml-1">AI Coach</span></h1>

        <nav className="flex flex-col space-y-2 flex-1">
          <div className="text-[10px] font-bold tracking-wider text-slate-500 uppercase mb-2">Agentes Vendedores</div>
          <button 
            onClick={() => { setActiveTab('ss'); window.location.href = '#ss'; }}
            className={\`px-3 text-left py-2 rounded-lg flex items-center shadow-none transition \${activeTab === 'ss' ? 'bg-blue-600 text-white font-semibold shadow-md' : 'hover:bg-slate-800'}\`}
          >
             🥊 SS (Prospecção)
             <span className="ml-auto bg-slate-700 text-[10px] px-2 rounded-full h-4 leading-4 font-bold">+2</span>
          </button>
          
          <button 
            onClick={() => { setActiveTab('closer'); window.location.href = '#closer'; }}
            className={\`px-3 text-left py-2 rounded-lg flex shadow-none items-center transition \${activeTab === 'closer' ? 'bg-indigo-600 text-white font-semibold shadow-md' : 'hover:bg-slate-800'}\`}
          >
             🎯 Closer (Fechamento)
          </button>

          <div className="mt-8 text-[10px] font-bold tracking-wider text-slate-500 uppercase mb-2">Configurações Base</div>
          <button 
            onClick={() => { setActiveTab('scripts'); window.location.href = '#scripts'; }}
            className={\`px-3 text-left py-2 rounded-lg flex items-center transition \${activeTab === 'scripts' ? 'bg-slate-800 text-white' : 'hover:bg-slate-800'}\`}
          >
             ✒️ Meus Textos / Roteiros
          </button>
          <button 
            onClick={() => { setActiveTab('onboarding'); window.location.href = '#onboarding'; }}
            className={\`px-3 text-left py-2 rounded-lg flex items-center transition \${activeTab === 'onboarding' ? 'bg-slate-800 text-white' : 'hover:bg-slate-800'}\`}
          >
             📚 Como Usar (Teoria)
          </button>
        </nav>
        
        <div className="mt-auto border-t border-slate-700 pt-4 flex flex-col items-center">
             <div className="h-8 w-8 rounded-full bg-slate-600 mb-2" />
             <span className="text-xs font-semibold text-slate-400">Vendedor Online</span>
        </div>
      </div>

      <main className="flex-1 h-full overflow-hidden bg-white">
        {/* Placeholder rendering until standard next/router injects content */}
        {children}
      </main>
    </div>
  );
}
