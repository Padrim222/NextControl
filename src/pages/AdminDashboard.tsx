import { useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { mockDailyReports, mockCallTranscripts, mockClients, mockUsers } from '@/data/mock';
import { FUNNEL_FIELDS } from '@/types/crm';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';
import { Check, X, Users, FileText, Phone, ClipboardList } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const AdminDashboard = () => {
  const [selectedReport, setSelectedReport] = useState<string | null>(null);
  const [selectedTranscript, setSelectedTranscript] = useState<string | null>(null);
  const [comment, setComment] = useState('');

  const pendingReports = mockDailyReports.filter((r) => r.status === 'pending');
  const pendingTranscripts = mockCallTranscripts.filter((t) => t.status === 'pending');
  const report = mockDailyReports.find((r) => r.id === selectedReport);
  const transcript = mockCallTranscripts.find((t) => t.id === selectedTranscript);

  const stats = [
    { label: 'Sellers', value: mockUsers.filter((u) => u.role === 'seller').length, icon: Users, color: 'text-sf-info' },
    { label: 'Closers', value: mockUsers.filter((u) => u.role === 'closer').length, icon: Phone, color: 'text-sf-success' },
    { label: 'Clientes', value: mockClients.length, icon: FileText, color: 'text-primary' },
    { label: 'Pendentes', value: pendingReports.length + pendingTranscripts.length, icon: ClipboardList, color: 'text-sf-warning' },
  ];

  const handleApprove = (type: 'report' | 'transcript') => {
    toast({ title: `${type === 'report' ? 'Relatório' : 'Transcrição'} aprovado!` });
    setSelectedReport(null);
    setSelectedTranscript(null);
    setComment('');
  };

  const handleReject = (type: 'report' | 'transcript') => {
    if (!comment.trim()) {
      toast({ title: 'Adicione um comentário para rejeitar', variant: 'destructive' });
      return;
    }
    toast({ title: `${type === 'report' ? 'Relatório' : 'Transcrição'} rejeitado.` });
    setSelectedReport(null);
    setSelectedTranscript(null);
    setComment('');
  };

  return (
    <DashboardLayout>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <h2 className="font-display text-2xl font-bold mb-1">Dashboard Admin</h2>
        <p className="text-muted-foreground mb-6">Visão geral do sistema</p>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((s) => (
            <Card key={s.label} className="sf-card-hover border-border/50">
              <CardContent className="p-5 flex items-center gap-4">
                <s.icon className={`${s.color}`} size={24} />
                <div>
                  <p className="text-2xl font-bold font-display">{s.value}</p>
                  <p className="text-sm text-muted-foreground">{s.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs defaultValue="reports" className="space-y-4">
          <TabsList>
            <TabsTrigger value="reports">Relatórios Seller ({pendingReports.length})</TabsTrigger>
            <TabsTrigger value="transcripts">Transcrições Closer ({pendingTranscripts.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="reports" className="space-y-3">
            {pendingReports.length === 0 && <p className="text-muted-foreground text-sm">Nenhum relatório pendente.</p>}
            {pendingReports.map((r) => (
              <Card key={r.id} className="border-border/50 sf-card-hover cursor-pointer" onClick={() => setSelectedReport(r.id)}>
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium">{r.clientName}</p>
                    <p className="text-sm text-muted-foreground">{r.sellerName} · {new Date(r.date).toLocaleDateString('pt-BR')}</p>
                  </div>
                  <Badge className="bg-sf-warning/20 text-sf-warning">Pendente</Badge>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="transcripts" className="space-y-3">
            {pendingTranscripts.length === 0 && <p className="text-muted-foreground text-sm">Nenhuma transcrição pendente.</p>}
            {pendingTranscripts.map((t) => (
              <Card key={t.id} className="border-border/50 sf-card-hover cursor-pointer" onClick={() => setSelectedTranscript(t.id)}>
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium">{t.clientName}</p>
                    <p className="text-sm text-muted-foreground">{t.closerName} · {new Date(t.date).toLocaleDateString('pt-BR')}</p>
                  </div>
                  <Badge className="bg-sf-warning/20 text-sf-warning">Pendente</Badge>
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        </Tabs>

        {/* Report detail dialog */}
        <Dialog open={!!selectedReport} onOpenChange={() => { setSelectedReport(null); setComment(''); }}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Relatório — {report?.clientName}</DialogTitle>
            </DialogHeader>
            {report && (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">{report.sellerName} · {new Date(report.date).toLocaleDateString('pt-BR')}</p>
                <div className="grid grid-cols-3 gap-3">
                  {FUNNEL_FIELDS.map((f) => (
                    <div key={f.key} className="bg-secondary rounded-lg p-3 text-center">
                      <span className="text-lg">{f.emoji}</span>
                      <p className="text-xl font-bold font-display">{report.funnel[f.key]}</p>
                      <p className="text-xs text-muted-foreground">{f.label}</p>
                    </div>
                  ))}
                </div>
                <Textarea placeholder="Comentário (obrigatório para rejeição)" value={comment} onChange={(e) => setComment(e.target.value)} />
              </div>
            )}
            <DialogFooter className="gap-2">
              <Button variant="outline" className="gap-2 text-destructive" onClick={() => handleReject('report')}><X size={16} /> Rejeitar</Button>
              <Button className="gap-2 sf-gradient text-primary-foreground" onClick={() => handleApprove('report')}><Check size={16} /> Aprovar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Transcript detail dialog */}
        <Dialog open={!!selectedTranscript} onOpenChange={() => { setSelectedTranscript(null); setComment(''); }}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Transcrição — {transcript?.clientName}</DialogTitle>
            </DialogHeader>
            {transcript && (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">{transcript.closerName} · {new Date(transcript.date).toLocaleDateString('pt-BR')}</p>
                <div className="bg-secondary rounded-lg p-4">
                  <p className="text-sm whitespace-pre-wrap">{transcript.transcript}</p>
                </div>
                <Badge className="bg-sf-info/20 text-sf-info capitalize">{transcript.result.replace('_', ' ')}</Badge>
                <Textarea placeholder="Comentário (obrigatório para rejeição)" value={comment} onChange={(e) => setComment(e.target.value)} />
              </div>
            )}
            <DialogFooter className="gap-2">
              <Button variant="outline" className="gap-2 text-destructive" onClick={() => handleReject('transcript')}><X size={16} /> Rejeitar</Button>
              <Button className="gap-2 sf-gradient text-primary-foreground" onClick={() => handleApprove('transcript')}><Check size={16} /> Aprovar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </motion.div>
    </DashboardLayout>
  );
};

export default AdminDashboard;
