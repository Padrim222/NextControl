import React, { useState } from 'react';

export default function ScriptsPage() {
    return (
        <div className="h-full bg-slate-50 overflow-y-auto p-8 text-slate-800">
            <div className="max-w-4xl mx-auto">
                <div className="mb-6 flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">Meus Modelos de Script</h1>
                        <p className="text-sm text-slate-500 mt-1">
                            A IA utilizará os seus scripts salvos como "DNA principal" para não perder seu tom original, melhorando as aberturas apenas com táticas validadas.
                        </p>
                    </div>
                    <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 font-semibold text-sm rounded-lg shadow-sm transition">
                        + Novo Script
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white border p-4 rounded-lg shadow-sm flex flex-col justify-between">
                        <div>
                            <div className="flex gap-2 mb-2 items-center">
                                <span className="bg-indigo-100 text-indigo-800 uppercase px-2 py-0.5 rounded text-[10px] font-bold">DISPATCH (DISPARO)</span>
                                <span className="text-slate-400 text-xs flex-1 text-right">Criado ontem</span>
                            </div>
                            <h3 className="font-bold text-slate-700">Contato Frio WhatsApp (Serviço Local)</h3>
                            <p className="text-slate-500 text-sm mt-3 border-l-2 border-slate-200 pl-3 line-clamp-3 italic">
                                "Oi {`{nome}`}, estava dando uma olhada no instagram da clínica. Vi que vocês fizeram um evento recente sobre {`{assunto_nicho}`}. Vocês quem rodaram os próprios ads até ele ou fecharam com agência terceirizada?"
                            </p>
                        </div>
                        <div className="mt-6 flex space-x-3 text-xs">
                            <button className="text-blue-600 hover:text-blue-800 font-semibold">Editar</button>
                            <button className="text-red-500 hover:text-red-700 font-semibold">Remover</button>
                        </div>
                    </div>

                    <div className="bg-white border p-4 rounded-lg shadow-sm flex flex-col justify-between">
                        <div>
                            <div className="flex gap-2 mb-2 items-center">
                                <span className="bg-amber-100 text-amber-800 uppercase px-2 py-0.5 rounded text-[10px] font-bold">PITCH / FECHAMENTO</span>
                                <span className="text-slate-400 text-xs flex-1 text-right">Usado 3x hoje</span>
                            </div>
                            <h3 className="font-bold text-slate-700">Ponte para SLA (Tíquete Alto)</h3>
                            <p className="text-slate-500 text-sm mt-3 border-l-2 border-slate-200 pl-3 line-clamp-3 italic">
                                "Baseado nessas dores de {`{DOR_CRITICA}`}, a nossa Mentoria se adequa perfeitamente por resolver {`{feature_01}`}. A ideia é reduzir aquele gargalo inicial. Faz sentido darmos o próximo passo com um formulário rápido de intenção?"
                            </p>
                        </div>
                        <div className="mt-6 flex space-x-3 text-xs">
                            <button className="text-blue-600 hover:text-blue-800 font-semibold">Editar</button>
                            <button className="text-red-500 hover:text-red-700 font-semibold">Remover</button>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
