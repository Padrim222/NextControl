import { useState, useRef, useEffect } from 'react'
import { Send, User, MessageSquare, RefreshCw, Briefcase, Phone, Instagram } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { OnboardingStep } from '@/components/client/OnboardingStep'

type AgentMode = 'closer' | 'ss'

interface Message {
  role: 'user' | 'assistant'
  content: string
  model?: string
  rag_used?: number
}

const ONBOARDING_KEY = 'consultoria_onboarding_done'

const modeConfig: Record<AgentMode, {
  label: string
  sublabel: string
  icon: React.ReactNode
  placeholder: string
  emptyTitle: string
  emptyBody: string
  color: string
  activeColor: string
}> = {
  closer: {
    label: 'Calls',
    sublabel: 'Suporte durante reuniões de vendas',
    icon: <Phone className="w-4 h-4" />,
    placeholder: 'Descreva a situação da reunião ou objeção do lead...',
    emptyTitle: 'Suporte para suas reuniões',
    emptyBody: 'Descreva a situação do lead, objeção recebida ou estágio da negociação para receber orientação personalizada.',
    color: 'bg-violet-600',
    activeColor: 'bg-violet-600 text-white',
  },
  ss: {
    label: 'Social Selling',
    sublabel: 'Análise de DMs e estratégia de prospecção',
    icon: <Instagram className="w-4 h-4" />,
    placeholder: 'Cole a conversa do DM ou descreva o estágio do lead...',
    emptyTitle: 'Estratégia de prospecção',
    emptyBody: 'Cole uma conversa do Instagram ou WhatsApp, descreva o perfil do lead e receba orientação estratégica de abordagem.',
    color: 'bg-blue-600',
    activeColor: 'bg-blue-600 text-white',
  },
}


const ConsultorAvatar = ({ size = 'sm', mode = 'closer' }: { size?: 'sm' | 'md'; mode?: AgentMode }) => {
  const dim = size === 'md' ? 'w-12 h-12' : 'w-7 h-7'
  const icon = size === 'md' ? 'w-5 h-5' : 'w-3.5 h-3.5'
  const gradient = mode === 'closer'
    ? 'bg-gradient-to-br from-violet-600 to-violet-800'
    : 'bg-gradient-to-br from-blue-600 to-blue-800'
  return (
    <div className={`${dim} rounded-full ${gradient} flex items-center justify-center flex-shrink-0`}>
      <Briefcase className={`${icon} text-white`} />
    </div>
  )
}

export default function AgentPage() {
  const { user } = useAuth()
  const [mode, setMode] = useState<AgentMode>('closer')
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [showOnboarding, setShowOnboarding] = useState(!localStorage.getItem(ONBOARDING_KEY))
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const resetChat = () => {
    setMessages([])
    setConversationId(null)
    setInput('')
  }

  const switchMode = (newMode: AgentMode) => {
    setMode(newMode)
    resetChat()
  }

  const sendMessage = async () => {
    const text = input.trim()
    if (!text || loading) return

    const userMsg: Message = { role: 'user', content: text }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setLoading(true)

    try {
      if (!supabase) {
        console.error('Supabase client not initialized');
        return;
      }
      const { data: sessionData } = await supabase.auth.getSession()
      const token = sessionData.session?.access_token
      if (!token) throw new Error('Sessão expirada')

      const { data, error } = await supabase.functions.invoke('agent-orchestrator', {
        body: {
          message: text,
          agent_type: mode,
          channel: 'web',
          client_id: user?.client_id ?? null,
          conversation_id: conversationId,
        },
        headers: { Authorization: `Bearer ${token}` },
      })

      if (error) throw new Error((data as Record<string, unknown>)?.error as string || error.message)

      const assistantMsg: Message = {
        role: 'assistant',
        content: data.answer,
        model: data.model_used,
        rag_used: data.rag_chunks_used,
      }
      setMessages(prev => [...prev, assistantMsg])
      if (data.conversation_id && !conversationId) {
        setConversationId(data.conversation_id)
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao contatar o consultor'
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: `Desculpe, ocorreu um problema: ${msg}. Tente novamente.` },
      ])
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const cfg = modeConfig[mode]

  return (
    <>
      {showOnboarding && <OnboardingStep onDone={() => setShowOnboarding(false)} />}

      <div className="flex flex-col h-[calc(100vh-4rem)] max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between py-3 px-1 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <ConsultorAvatar mode={mode} />
            <div>
              <h1 className="text-white font-semibold text-sm">Consultoria Next Control</h1>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                <p className="text-zinc-500 text-xs">Consultores online</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Mode selector */}
            <div className="flex bg-zinc-800 rounded-lg p-1 gap-1">
              {(['closer', 'ss'] as AgentMode[]).map(m => (
                <button
                  key={m}
                  onClick={() => switchMode(m)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-all ${
                    mode === m
                      ? modeConfig[m].activeColor
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  {modeConfig[m].icon}
                  {modeConfig[m].label}
                </button>
              ))}
            </div>

            <button
              onClick={resetChat}
              className="p-1.5 text-zinc-500 hover:text-zinc-300 transition-colors"
              title="Nova conversa"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            <button
              onClick={() => setShowOnboarding(true)}
              className="p-1.5 text-zinc-500 hover:text-zinc-300 transition-colors"
              title="Como funciona"
            >
              <MessageSquare className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Mode hint */}
        <div className="px-1 py-2">
          <p className="text-xs text-zinc-600">{cfg.sublabel}</p>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto space-y-4 py-2 px-1">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center gap-4 py-12">
              <ConsultorAvatar size="md" mode={mode} />
              <div>
                <p className="text-zinc-300 font-medium">{cfg.emptyTitle}</p>
                <p className="text-zinc-600 text-sm mt-1 max-w-xs mx-auto">{cfg.emptyBody}</p>
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.role === 'assistant' && <ConsultorAvatar mode={mode} />}

              <div
                className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
                  msg.role === 'user'
                    ? `${mode === 'closer' ? 'bg-violet-600' : 'bg-blue-600'} text-white rounded-tr-sm`
                    : 'bg-zinc-800 text-zinc-100 rounded-tl-sm'
                }`}
              >
                <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                {msg.role === 'assistant' && msg.rag_used !== undefined && msg.rag_used > 0 && (
                  <p className="text-zinc-600 text-[10px] mt-1.5">
                    {msg.rag_used} fontes consultadas
                  </p>
                )}
              </div>

              {msg.role === 'user' && (
                <div className="w-7 h-7 rounded-full bg-zinc-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <User className="w-3.5 h-3.5 text-zinc-300" />
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex gap-3">
              <ConsultorAvatar mode={mode} />
              <div className="bg-zinc-800 rounded-2xl rounded-tl-sm px-4 py-3">
                <div className="flex gap-1 items-center">
                  <span className="text-zinc-500 text-xs mr-1">Consultando</span>
                  {[0, 1, 2].map(i => (
                    <div
                      key={i}
                      className={`w-1.5 h-1.5 rounded-full animate-bounce ${mode === 'closer' ? 'bg-violet-400' : 'bg-blue-400'}`}
                      style={{ animationDelay: `${i * 0.15}s` }}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="pt-2 pb-1 px-1 border-t border-zinc-800">
          <div className="flex gap-2 items-end">
            <Textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={cfg.placeholder}
              className="flex-1 bg-zinc-800 border-zinc-700 text-white placeholder-zinc-600 resize-none min-h-[52px] max-h-36 text-sm"
              rows={2}
            />
            <Button
              onClick={sendMessage}
              disabled={!input.trim() || loading}
              className={`${mode === 'closer' ? 'bg-violet-600 hover:bg-violet-700' : 'bg-blue-600 hover:bg-blue-700'} disabled:opacity-40 h-[52px] px-4`}
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-zinc-700 text-[10px] mt-1 text-center">
            Enter envia · Shift+Enter nova linha
          </p>
        </div>
      </div>
    </>
  )
}
