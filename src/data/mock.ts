import { User, Client, DailyReport, CallTranscript, WeeklyReport, FunnelData } from '@/types/crm';

export const mockUsers: User[] = [
  { id: 'u1', name: 'Carlos Admin', email: 'admin@socialfunnels.com', role: 'admin' },
  { id: 'u2', name: 'Ana Seller', email: 'ana@socialfunnels.com', role: 'seller' },
  { id: 'u3', name: 'João Closer', email: 'joao@socialfunnels.com', role: 'closer' },
  { id: 'u4', name: 'Maria Seller', email: 'maria@socialfunnels.com', role: 'seller' },
];

export const mockClients: Client[] = [
  { id: 'c1', name: 'Dra. Beatriz Bandeira', company: 'Clínica Bandeira', sellerId: 'u2', closerId: 'u3', createdAt: '2026-01-15' },
  { id: 'c2', name: 'Dr. Rafael Menezes', company: 'Instituto Menezes', sellerId: 'u2', closerId: 'u3', createdAt: '2026-01-20' },
  { id: 'c3', name: 'Fernanda Costa', company: 'Costa Estética', sellerId: 'u4', closerId: 'u3', createdAt: '2026-02-01' },
];

const funnel1: FunnelData = {
  chatAtivo: 190, boasVindas: 237, reaquecimento: 62, nutricao: 0,
  respostasConexao: 148, mapeamentos: 67, pitchs: 25, capturaContato: 18, followUp: 20,
};

const funnel2: FunnelData = {
  chatAtivo: 120, boasVindas: 150, reaquecimento: 40, nutricao: 15,
  respostasConexao: 95, mapeamentos: 42, pitchs: 18, capturaContato: 12, followUp: 10,
};

export const mockDailyReports: DailyReport[] = [
  { id: 'r1', sellerId: 'u2', sellerName: 'Ana Seller', clientId: 'c1', clientName: 'Dra. Beatriz Bandeira', date: '2026-02-05', funnel: funnel1, status: 'pending', createdAt: '2026-02-05T10:00:00' },
  { id: 'r2', sellerId: 'u2', sellerName: 'Ana Seller', clientId: 'c1', clientName: 'Dra. Beatriz Bandeira', date: '2026-02-04', funnel: funnel2, status: 'approved', createdAt: '2026-02-04T09:30:00' },
  { id: 'r3', sellerId: 'u4', sellerName: 'Maria Seller', clientId: 'c3', clientName: 'Fernanda Costa', date: '2026-02-05', funnel: { chatAtivo: 80, boasVindas: 100, reaquecimento: 30, nutricao: 10, respostasConexao: 60, mapeamentos: 30, pitchs: 12, capturaContato: 8, followUp: 5 }, status: 'pending', createdAt: '2026-02-05T11:00:00' },
];

export const mockCallTranscripts: CallTranscript[] = [
  { id: 't1', closerId: 'u3', closerName: 'João Closer', clientId: 'c1', clientName: 'Dra. Beatriz Bandeira', date: '2026-02-05', transcript: 'Transcrição da call de venda com a Dra. Beatriz...', result: 'sold', status: 'pending', createdAt: '2026-02-05T14:00:00' },
  { id: 't2', closerId: 'u3', closerName: 'João Closer', clientId: 'c2', clientName: 'Dr. Rafael Menezes', date: '2026-02-04', transcript: 'Transcrição da call com Dr. Rafael...', result: 'rescheduled', status: 'approved', createdAt: '2026-02-04T15:00:00' },
];

export const mockWeeklyReport: WeeklyReport = {
  id: 'w1', clientId: 'c1', clientName: 'Dra. Beatriz Bandeira',
  period: '02 — 05 Fev 2026', startDate: '2026-02-02', endDate: '2026-02-05', durationDays: 4,
  funnel: funnel1, shareToken: 'abc123xyz',
};
