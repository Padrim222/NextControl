export type UserRole = 'admin' | 'seller' | 'closer';
export type ReportStatus = 'pending' | 'approved' | 'rejected';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
}

export interface Client {
  id: string;
  name: string;
  company?: string;
  sellerId: string;
  closerId?: string;
  createdAt: string;
}

export interface FunnelData {
  chatAtivo: number;
  boasVindas: number;
  reaquecimento: number;
  nutricao: number;
  respostasConexao: number;
  mapeamentos: number;
  pitchs: number;
  capturaContato: number;
  followUp: number;
}

export interface DailyReport {
  id: string;
  sellerId: string;
  sellerName: string;
  clientId: string;
  clientName: string;
  date: string;
  funnel: FunnelData;
  status: ReportStatus;
  adminComment?: string;
  createdAt: string;
}

export interface CallTranscript {
  id: string;
  closerId: string;
  closerName: string;
  clientId: string;
  clientName: string;
  date: string;
  transcript: string;
  result: 'sold' | 'no_sale' | 'rescheduled' | 'no_show';
  status: ReportStatus;
  adminComment?: string;
  createdAt: string;
}

export interface WeeklyReport {
  id: string;
  clientId: string;
  clientName: string;
  period: string;
  startDate: string;
  endDate: string;
  durationDays: number;
  funnel: FunnelData;
  shareToken: string;
}

export const FUNNEL_FIELDS: { key: keyof FunnelData; label: string; emoji: string }[] = [
  { key: 'chatAtivo', label: 'Chat Ativo', emoji: '💬' },
  { key: 'boasVindas', label: 'Boas-vindas', emoji: '🤝' },
  { key: 'reaquecimento', label: 'Reaquecimento', emoji: '🔥' },
  { key: 'nutricao', label: 'Nutrição', emoji: '🌱' },
  { key: 'respostasConexao', label: 'Respostas / Conexão', emoji: '🔗' },
  { key: 'mapeamentos', label: 'Mapeamentos', emoji: '🎯' },
  { key: 'pitchs', label: 'Pitchs', emoji: '☎️' },
  { key: 'capturaContato', label: 'Captura de Contato', emoji: '✅' },
  { key: 'followUp', label: 'Follow-up', emoji: '👀' },
];
