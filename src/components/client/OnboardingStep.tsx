import { useState } from 'react'
import { ChevronRight, Briefcase, Phone, Instagram, HeadphonesIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'

const ONBOARDING_KEY = 'consultoria_onboarding_done'

const steps = [
  {
    icon: <Briefcase className="w-8 h-8 text-blue-400" />,
    title: 'Bem-vindo à Consultoria Next Control',
    body: 'Aqui você tem acesso direto à nossa base de conhecimento estratégico. Nossa equipe de consultores preparou orientações para as principais situações do seu processo comercial.',
  },
  {
    icon: <Phone className="w-8 h-8 text-violet-400" />,
    title: 'Suporte em Calls',
    body: 'Use a aba "Calls" para suporte durante reuniões de vendas. Descreva a objeção do lead ou o estágio da negociação e receba scripts e abordagens recomendadas pela nossa equipe.',
  },
  {
    icon: <Instagram className="w-8 h-8 text-blue-400" />,
    title: 'Social Selling',
    body: 'Use a aba "Social Selling" para estratégia de prospecção. Cole conversas do Instagram ou WhatsApp e receba orientações de follow-up, aquecimento de lead e diagnóstico de funil.',
  },
  {
    icon: <HeadphonesIcon className="w-8 h-8 text-emerald-400" />,
    title: 'Disponível 24/7',
    body: 'Nossa base de consultoria está disponível a qualquer hora. Quanto mais contexto você compartilhar, mais precisa será a orientação. Comece agora.',
  },
]

interface OnboardingStepProps {
  onDone: () => void
}

export function OnboardingStep({ onDone }: OnboardingStepProps) {
  const [step, setStep] = useState(0)

  const current = steps[step]
  const isLast = step === steps.length - 1

  const handleNext = () => {
    if (isLast) {
      localStorage.setItem(ONBOARDING_KEY, '1')
      onDone()
    } else {
      setStep(s => s + 1)
    }
  }

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
            onClick={handleNext}
          >
            {isLast ? 'Começar' : 'Próximo'}
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </div>
    </div>
  )
}
