import { useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { mockClients, mockDailyReports } from '@/data/mock';
import { useAuth } from '@/contexts/AuthContext';
import { FUNNEL_FIELDS, FunnelData } from '@/types/crm';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';
import { ArrowLeft, Send } from 'lucide-react';

const SellerDashboard = () => {
  const { user } = useAuth();
  const [selectedClient, setSelectedClient] = useState<string | null>(null);
  const [formData, setFormData] = useState<FunnelData>({
    chatAtivo: 0, boasVindas: 0, reaquecimento: 0, nutricao: 0,
    respostasConexao: 0, mapeamentos: 0, pitchs: 0, capturaContato: 0, followUp: 0,
  });

  const myClients = mockClients.filter((c) => c.sellerId === user?.id);
  const client = myClients.find((c) => c.id === selectedClient);
  const myReports = mockDailyReports.filter((r) => r.sellerId === user?.id);

  const handleSubmit = () => {
    toast({ title: 'Relatório enviado!', description: 'Aguardando aprovação do admin.' });
    setSelectedClient(null);
  };

  const statusColor = (s: string) => s === 'approved' ? 'bg-sf-success/20 text-sf-success' : s === 'rejected' ? 'bg-destructive/20 text-destructive' : 'bg-sf-warning/20 text-sf-warning';
  const statusLabel = (s: string) => s === 'approved' ? 'Aprovado' : s === 'rejected' ? 'Rejeitado' : 'Pendente';

  if (selectedClient && client) {
    return (
      <DashboardLayout>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <Button variant="ghost" className="mb-4 gap-2" onClick={() => setSelectedClient(null)}>
            <ArrowLeft size={16} /> Voltar
          </Button>
          <h2 className="font-display text-2xl font-bold mb-1">Relatório Diário</h2>
          <p className="text-muted-foreground mb-6">{client.name} — {new Date().toLocaleDateString('pt-BR')}</p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {FUNNEL_FIELDS.map((f) => (
              <Card key={f.key} className="sf-card-hover border-border/50">
                <CardContent className="p-4">
                  <Label className="text-sm flex items-center gap-2 mb-2">
                    <span className="text-lg">{f.emoji}</span> {f.label}
                  </Label>
                  <Input
                    type="number" min={0}
                    value={formData[f.key] || ''}
                    onChange={(e) => setFormData((prev) => ({ ...prev, [f.key]: parseInt(e.target.value) || 0 }))}
                    className="text-lg font-semibold"
                  />
                </CardContent>
              </Card>
            ))}
          </div>
          <Button onClick={handleSubmit} className="sf-gradient text-primary-foreground gap-2 font-semibold">
            <Send size={16} /> Enviar Relatório
          </Button>
        </motion.div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <h2 className="font-display text-2xl font-bold mb-1">Meus Clientes</h2>
        <p className="text-muted-foreground mb-6">Selecione um cliente para preencher o relatório diário</p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {myClients.map((c) => (
            <Card key={c.id} className="sf-card-hover border-border/50 cursor-pointer" onClick={() => setSelectedClient(c.id)}>
              <CardContent className="p-5">
                <p className="font-semibold text-lg">{c.name}</p>
                <p className="text-sm text-muted-foreground">{c.company}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <h3 className="font-display text-lg font-semibold mb-4">Histórico de Relatórios</h3>
        <div className="space-y-3">
          {myReports.map((r) => (
            <Card key={r.id} className="border-border/50">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="font-medium">{r.clientName}</p>
                  <p className="text-sm text-muted-foreground">{new Date(r.date).toLocaleDateString('pt-BR')}</p>
                </div>
                <Badge className={statusColor(r.status)}>{statusLabel(r.status)}</Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      </motion.div>
    </DashboardLayout>
  );
};

export default SellerDashboard;
