import { useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { mockClients, mockCallTranscripts } from '@/data/mock';
import { useAuth } from '@/contexts/AuthContext';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';
import { Send } from 'lucide-react';

const CloserDashboard = () => {
  const { user } = useAuth();
  const [clientId, setClientId] = useState('');
  const [transcript, setTranscript] = useState('');
  const [result, setResult] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const myClients = mockClients.filter((c) => c.closerId === user?.id);
  const myTranscripts = mockCallTranscripts.filter((t) => t.closerId === user?.id);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientId || !transcript.trim() || !result) {
      toast({ title: 'Preencha todos os campos', variant: 'destructive' });
      return;
    }
    toast({ title: 'Transcrição enviada!', description: 'Aguardando aprovação do admin.' });
    setClientId('');
    setTranscript('');
    setResult('');
  };

  const statusColor = (s: string) => s === 'approved' ? 'bg-sf-success/20 text-sf-success' : s === 'rejected' ? 'bg-destructive/20 text-destructive' : 'bg-sf-warning/20 text-sf-warning';
  const statusLabel = (s: string) => s === 'approved' ? 'Aprovado' : s === 'rejected' ? 'Rejeitado' : 'Pendente';
  const resultLabel = (r: string) => ({ sold: 'Vendido', no_sale: 'Sem venda', rescheduled: 'Reagendado', no_show: 'No-show' }[r] || r);

  return (
    <DashboardLayout>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <h2 className="font-display text-2xl font-bold mb-1">Nova Transcrição de Call</h2>
        <p className="text-muted-foreground mb-6">Registre a transcrição da call de venda</p>

        <Card className="border-border/50 mb-8">
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Cliente</Label>
                  <Select value={clientId} onValueChange={setClientId}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      {myClients.map((c) => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Data</Label>
                  <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Resultado</Label>
                  <Select value={result} onValueChange={setResult}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sold">Vendido</SelectItem>
                      <SelectItem value="no_sale">Sem venda</SelectItem>
                      <SelectItem value="rescheduled">Reagendado</SelectItem>
                      <SelectItem value="no_show">No-show</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Transcrição da Call</Label>
                <Textarea value={transcript} onChange={(e) => setTranscript(e.target.value)} placeholder="Cole a transcrição da call aqui..." className="min-h-[200px]" />
              </div>
              <Button type="submit" className="sf-gradient text-primary-foreground gap-2 font-semibold">
                <Send size={16} /> Enviar Transcrição
              </Button>
            </form>
          </CardContent>
        </Card>

        <h3 className="font-display text-lg font-semibold mb-4">Histórico de Transcrições</h3>
        <div className="space-y-3">
          {myTranscripts.map((t) => (
            <Card key={t.id} className="border-border/50">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="font-medium">{t.clientName}</p>
                  <p className="text-sm text-muted-foreground">{new Date(t.date).toLocaleDateString('pt-BR')} · {resultLabel(t.result)}</p>
                </div>
                <Badge className={statusColor(t.status)}>{statusLabel(t.status)}</Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      </motion.div>
    </DashboardLayout>
  );
};

export default CloserDashboard;
