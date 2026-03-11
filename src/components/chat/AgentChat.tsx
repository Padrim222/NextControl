import React, { useState, useRef, useEffect } from 'react';

// Um placeholder simples para Markdown, lucide-react para ícones:
// Em produção usaria react-markdown
import { Send, Image as ImageIcon, Loader2, X } from 'lucide-react';

export interface AgentChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  imageUrl?: string;
  isWarning?: boolean;
}

export interface AgentChatProps {
  messages: AgentChatMessage[];
  onSendMessage: (text: string, imageFile?: File) => void;
  isLoading: boolean;
  agentName: string;
}

export function AgentChat({ messages, onSendMessage, isLoading, agentName }: AgentChatProps) {
  const [inputText, setInputText] = useState('');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSend = () => {
    if (!inputText.trim() && !selectedImage) return;
    onSendMessage(inputText, selectedImage || undefined);
    setInputText('');
    setSelectedImage(null);
    setPreviewUrl(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    for (const item of Array.from(items)) {
      if (item.type.indexOf('image') !== -1) {
        const file = item.getAsFile();
        if (file) {
          setSelectedImage(file);
          const url = URL.createObjectURL(file);
          setPreviewUrl(url);
        }
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('image/')) {
        setSelectedImage(file);
        setPreviewUrl(URL.createObjectURL(file));
      }
    }
  };

  return (
    <div 
      className="flex flex-col h-full bg-slate-50 border border-slate-200 rounded-xl overflow-hidden shadow-sm"
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <div className="bg-slate-900 text-white p-4 font-semibold shrink-0">
        {agentName}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={scrollRef}>
        {messages.length === 0 && (
          <div className="text-center text-slate-400 mt-10">
            Envie prints de perfis ou objeções (via botão, paste ctrl+v ou arraste) e inicie a conversa.
          </div>
        )}
        
        {messages.map((msg) => (
          <div key={msg.id} className={\`flex \${msg.role === 'user' ? 'justify-end' : 'justify-start'}\`}>
            <div className={\`max-w-[75%] p-3 rounded-xl \${
              msg.role === 'user' 
              ? 'bg-blue-600 text-white rounded-br-none' 
              : msg.isWarning 
                ? 'bg-amber-100 text-amber-900 border border-amber-300 rounded-bl-none'
                : 'bg-white border text-slate-800 border-slate-200 rounded-bl-none shadow-sm'
            }\`}>
              {msg.imageUrl && (
                <img src={msg.imageUrl} alt="Anexo" className="max-w-full h-auto rounded mb-2 max-h-48 object-cover" />
              )}
              {/* Fallback de formatação: renderizaria Markdown aqui */}
              <div className="whitespace-pre-wrap text-sm">{msg.content}</div>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white border text-slate-800 border-slate-200 p-3 rounded-xl rounded-bl-none shadow-sm flex items-center space-x-2">
              <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
              <span className="text-sm text-slate-400">Analisando contexto...</span>
            </div>
          </div>
        )}
      </div>

      <div className="p-4 bg-white border-t border-slate-200 shrink-0">
        {previewUrl && (
          <div className="mb-3 relative inline-block">
            <img src={previewUrl} alt="Preview" className="h-20 w-auto rounded border shadow-sm" />
            <button 
              onClick={() => { setPreviewUrl(null); setSelectedImage(null); }}
              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow hover:bg-red-600"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        )}
        
        <div className="flex items-center space-x-2 bg-slate-50 border border-slate-300 rounded-lg p-1 pr-2">
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="p-2 text-slate-400 hover:text-slate-600 transition"
            title="Anexar print/imagem"
          >
            <ImageIcon className="w-5 h-5" />
          </button>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            accept="image/*" 
            className="hidden" 
          />
          
          <input
            type="text"
            className="flex-1 bg-transparent border-none focus:outline-none focus:ring-0 text-sm py-2 px-1"
            placeholder="Digite sua mensagem ou dê Ctrl+V em um print..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
          />
          
          <button 
            onClick={handleSend}
            disabled={(!inputText.trim() && !selectedImage) || isLoading}
            className={\`p-2 rounded-md transition \${(!inputText.trim() && !selectedImage) || isLoading ? 'text-slate-300 cursor-not-allowed' : 'text-blue-600 hover:bg-blue-50'}\`}
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
