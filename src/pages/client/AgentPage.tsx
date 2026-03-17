import { useState, useRef, useEffect } from 'react'
import { Send, User, MessageSquare, RefreshCw, ChevronRight, Briefcase, HeadphonesIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'

type AgentMode = 'closer' | 'ss'

interface Message {
  role: 'user' | 'assistant'
  content: string
  model?: string
  rag_used?: number
}

const ONBOARDING_KEY = 'consultoria_onboarding_done'

const OnboardingWizard = ({ onDone }: { onDone: () => void }) => {
  const [step, setStep] = useState(0)

  const steps = [
    {
      icon: <Briefcase className="w-8 h-8 text-blue-400" />,
      title: 'Bem-vindo à Consultoria Next Control',
      body: 'Aqui você tem acesso direto à nossa base de conhecimento estratégico. Nossa equipe de consultores preparou respostas para as principais dúvidas sobre processos comerciais, scripts e estratégias de vendas.',
    },
    {
      icon: <HeadphonesIcon className="w-8 h-8 text-blue-400" />,
      title: 'Consultores disponíveis 24/7',
      body: 'Nossa base de consultoria está disponível a qualquer hora. Tire dúvidas sobre sua estratégia comercial, processos de vendas, abordagem com leads e muito mais — sem precisar aguardar horário comercial.',
    },
    {
      icon: <MessageSquare className="w-8 h-8 text-blue-400" />,
      title: 'Como aproveitar ao máximo',
      body: 'Descreva sua situação com detalhes. Quanto mais contexto você compartilhar, mais precisa e personalizada será a orientação. Por exemplo: "Meu lead disse que precisa pensar" — receba uma abordagem consultiva calibrada para o seu caso.',
    },
  ]

  const current = steps[step]
  const isLast = step === steps.length - 1

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-zinc-700 rounded-2xl max-w-md w-full p-6 shadow-2xl">
        <div className="flex justify-between items-center mb-5">
          <div className="flex gap-1">
            {steps.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all ${i <= step ? 'bg-blue-500 w-6' : 'bg-zinc-700 w-3'}`}
              />
            ))}
          </div>
          <span className="text-zinc-500 text-xs">{step + 1}/{steps.length}</span>
        </div>

        <div className="mb-4">{current.icon}</div>
        <h2 className="text-white font-semibold text-xl mb-2">{current.title}</h2>
        <p className="text-zinc-400 text-sm leading-relaxed whitespace-pre-line mb-6">{current.body}</p>

        <div className="flex gap-2">
          {step > 0 && (
            <Button variant="ghost" className="text-zinc-400" onClick={() => setStep(s => s - 1)}>
              Voltar
            </Button>
          )}
          <Button
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
            onClick={() => {
              if (isLast) {
                localStorage.setItem(ONBOARDING_KEY, '1')
                onDone()
              } else {
                setStep(s => s + 1)
              }
            }}
          >
            {isLast ? 'Começar' : 'Próximo'}
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </div>
    </div>
  )
}

const ConsultorAvatar = ({ size = 'sm' }: { size?: 'sm' | 'md' }) => {
  const dim = size === 'md' ? 'w-12 h-12' : 'w-7 h-7'
  const icon = size === 'md' ? 'w-6 h-6' : 'w-3.5 h-3.5'
  return (
    <div className={`${dim} rounded-full bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center flex-shrink-0`}>
      <Briefcase className={`${icon} text-white`} />
    </div>
  )
}

export default function AgentPage() {
  const { user } = useAuth()
  const [mode] = useState<AgentMode>('closer')
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

  const sendMessage = async () => {
    const text = input.trim()
    if (!text || loading) return

    const userMsg: Message = { role: 'user', content: text }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setLoading(true)

    try {
      const { data: sessionData } = await supabase!.auth.getSession()
      const token = sessionData.session?.access_token
      if (!token) throw new Error('Sessão expirada')

      const { data, error } = await supabase!.functions.invoke('agent-orchestrator', {
        body: {
          message: text,
          agent_type: mode,
          channel: 'whatsapp',
          client_id: user?.client_id ?? null,
          conversation_id: conversationId,
        },
        headers: { Authorization: `Bearer ${token}` },
      })

      if (error) throw new Error((data as any)?.error || error.message)

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
        { role: 'assistant', content: `Desculpe, ocorreu um erro: ${msg}. Tente novamente.` },
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

  return (
    <>
      {showOnboarding && <OnboardingWizard onDone={() => setShowOnboarding(false)} />}

      <div className="flex flex-col h-[calc(100vh-4rem)] max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between py-3 px-1 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <ConsultorAvatar />
            <div>
              <h1 className="text-white font-semibold text-sm">Consultoria Next Control</h1>
              <p className="text-zinc-500 text-xs">Consultores disponíveis 24/7</p>
            </div>
          </div>

          <div className="flex items-center gap-1">
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

        {/* Status indicator */}
        <div className="px-1 py-2 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
          <p className="text-xs text-zinc-600">Consultores online</p>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto space-y-4 py-2 px-1">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center gap-4 py-12">
              <ConsultorAvatar size="md" />
              <div>
                <p className="text-zinc-300 font-medium">Sua consultoria está pronta</p>
                <p className="text-zinc-600 text-sm mt-1">
                  Tire dúvidas sobre estratégia, processos de vendas ou abordagens com leads
                </p>
              </div>
              <div className="mt-2 text-xs text-zinc-700 max-w-xs">
                Descreva sua situação e receba orientação personalizada da nossa equipe.
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.role === 'assistant' && <ConsultorAvatar />}

              <div
                className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
                  msg.role === 'user'
                    ? 'bg-blue-600 text-white rounded-tr-sm'
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
              <ConsultorAvatar />
              <div className="bg-zinc-800 rounded-2xl rounded-tl-sm px-4 py-3">
                <div className="flex gap-1 items-center">
                  <span className="text-zinc-500 text-xs mr-1">Consultando</span>
                  {[0, 1, 2].map(i => (
                    <div
                      key={i}
                      className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce"
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
              placeholder="Faça sua pergunta para o consultor..."
              className="flex-1 bg-zinc-800 border-zinc-700 text-white placeholder-zinc-600 resize-none min-h-[52px] max-h-36 text-sm"
              rows={2}
            />
            <Button
              onClick={sendMessage}
              disabled={!input.trim() || loading}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-40 h-[52px] px-4"
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
