import { useParams } from 'react-router-dom';
import { mockWeeklyReport } from '@/data/mock';
import { FUNNEL_FIELDS } from '@/types/crm';
import { Card, CardContent } from '@/components/ui/card';
import { motion } from 'framer-motion';

const HIGHLIGHT_FIELDS = ['chatAtivo', 'boasVindas', 'mapeamentos', 'pitchs', 'capturaContato'] as const;

const ClientReport = () => {
  const { token } = useParams();
  const report = mockWeeklyReport; // In production, fetch by token

  if (!report) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Relatório não encontrado.</p>
      </div>
    );
  }

  const conversions = [
    { from: 'Boas-vindas', to: 'Conexão', rate: report.funnel.respostasConexao / report.funnel.boasVindas * 100 },
    { from: 'Conexão', to: 'Mapeamento', rate: report.funnel.mapeamentos / report.funnel.respostasConexao * 100 },
    { from: 'Mapeamento', to: 'Pitch', rate: report.funnel.pitchs / report.funnel.mapeamentos * 100 },
    { from: 'Pitch', to: 'Captura', rate: report.funnel.capturaContato / report.funnel.pitchs * 100 },
  ];

  const funnelSteps = [
    { label: 'Boas-vindas', value: report.funnel.boasVindas },
    { label: 'Conexão', value: report.funnel.respostasConexao },
    { label: 'Mapeamento', value: report.funnel.mapeamentos },
    { label: 'Pitch', value: report.funnel.pitchs },
    { label: 'Captura', value: report.funnel.capturaContato },
  ];
  const maxVal = Math.max(...funnelSteps.map((s) => s.value));

  return (
    <div className="min-h-screen bg-background dark">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
          <h1 className="font-display text-2xl font-bold sf-gradient-text mb-1">Social Funnels™</h1>
          <p className="text-xs text-muted-foreground tracking-widest uppercase mb-6">Relatório Confidencial</p>
          <div className="flex items-center justify-center gap-8 text-sm">
            <div className="text-center">
              <p className="text-xs text-muted-foreground mb-1">Relatório Semanal</p>
              <p className="font-medium text-muted-foreground">Perfil</p>
              <p className="font-display font-bold text-lg">{report.clientName}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground mb-1">Período</p>
              <p className="font-display font-bold">{report.period}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground mb-1">Duração</p>
              <p className="font-display font-bold">{report.durationDays} dias</p>
            </div>
          </div>
        </motion.div>

        {/* Highlight metrics */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 mb-8">
          {FUNNEL_FIELDS.filter((f) => HIGHLIGHT_FIELDS.includes(f.key as any)).map((f) => (
            <Card key={f.key} className="sf-card-glow border-border/50 text-center">
              <CardContent className="p-4">
                <span className="text-2xl">{f.emoji}</span>
                <p className="text-xs text-muted-foreground mt-1">{f.label}</p>
                <p className="text-2xl font-display font-bold mt-1">{report.funnel[f.key]}</p>
              </CardContent>
            </Card>
          ))}
        </motion.div>

        {/* Full funnel consolidado */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
          <h2 className="font-display text-lg font-semibold mb-4">Consolidado — Ações do Funil</h2>
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 mb-8">
            {FUNNEL_FIELDS.map((f) => (
              <Card key={f.key} className="border-border/50">
                <CardContent className="p-3 text-center">
                  <span className="text-lg">{f.emoji}</span>
                  <p className="text-xs text-muted-foreground mt-1">{f.label}</p>
                  <p className="text-xl font-display font-bold">{report.funnel[f.key] || '—'}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </motion.div>

        {/* Conversion rates */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
          <h2 className="font-display text-lg font-semibold mb-4">Performance — Taxas de Conversão</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
            {conversions.map((c) => (
              <Card key={c.from} className="border-border/50">
                <CardContent className="p-4 text-center">
                  <p className="text-xs text-muted-foreground">{c.from} → {c.to}</p>
                  <p className="text-3xl font-display font-bold sf-gradient-text mt-1">{c.rate.toFixed(1)}<span className="text-lg">%</span></p>
                </CardContent>
              </Card>
            ))}
          </div>
        </motion.div>

        {/* Funnel chart */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
          <h2 className="font-display text-lg font-semibold mb-4">Visão Geral — Funil de Conversão</h2>
          <Card className="border-border/50 sf-card-glow">
            <CardContent className="p-6 space-y-3">
              {funnelSteps.map((step, i) => (
                <div key={step.label} className="flex items-center gap-4">
                  <p className="text-sm w-28 text-right text-muted-foreground">{step.label}</p>
                  <div className="flex-1 h-10 bg-secondary rounded-lg overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(step.value / maxVal) * 100}%` }}
                      transition={{ delay: 0.5 + i * 0.1, duration: 0.6 }}
                      className="h-full sf-gradient rounded-lg flex items-center justify-end pr-3"
                    >
                      <span className="text-sm font-bold text-primary-foreground">{step.value}</span>
                    </motion.div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>

        {/* Footer */}
        <div className="text-center mt-10 pb-8">
          <p className="font-display text-sm font-semibold sf-gradient-text">Social Funnels™</p>
          <p className="text-xs text-muted-foreground mt-1">Semana {report.period}</p>
        </div>
      </div>
    </div>
  );
};

export default ClientReport;
