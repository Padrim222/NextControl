// Database client for Neon Postgres
// Compatible with future Supabase migration

import type {
    User,
    Client,
    DailyReport,
    CallLog,
    AIFeedback,
    WeeklyReport,
    UserRole,
    ReportStatus,
    UserStatus
} from '@/types';

// For MVP: Using localStorage as mock database
// Will be replaced with Neon/Supabase client

const STORAGE_KEYS = {
    users: 'sf_users',
    clients: 'sf_clients',
    dailyReports: 'sf_daily_reports',
    callLogs: 'sf_call_logs',
    aiFeedback: 'sf_ai_feedback',
    weeklyReports: 'sf_weekly_reports',
} as const;

// Generic CRUD helpers
function getCollection<T>(key: string): T[] {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
}

function setCollection<T>(key: string, data: T[]): void {
    localStorage.setItem(key, JSON.stringify(data));
}

function generateId(): string {
    return crypto.randomUUID();
}

// User operations
export const db = {
    // Users
    users: {
        findAll: (): User[] => getCollection<User>(STORAGE_KEYS.users),

        findById: (id: string): User | undefined =>
            getCollection<User>(STORAGE_KEYS.users).find(u => u.id === id),

        findByEmail: (email: string): User | undefined =>
            getCollection<User>(STORAGE_KEYS.users).find(u => u.email === email),

        findByRole: (role: UserRole): User[] =>
            getCollection<User>(STORAGE_KEYS.users).filter(u => u.role === role),

        create: (data: Omit<User, 'id' | 'created_at' | 'status'> & { status?: UserStatus }): User => {
            const users = getCollection<User>(STORAGE_KEYS.users);
            const newUser: User = {
                status: 'pending', // Default
                ...data,
                id: generateId(),
                created_at: new Date().toISOString(),
            };
            users.push(newUser);
            setCollection(STORAGE_KEYS.users, users);
            return newUser;
        },

        update: (id: string, data: Partial<User>): User | undefined => {
            const users = getCollection<User>(STORAGE_KEYS.users);
            const index = users.findIndex(u => u.id === id);
            if (index === -1) return undefined;

            users[index] = { ...users[index], ...data };
            setCollection(STORAGE_KEYS.users, users);
            return users[index];
        },
    },

    // Clients
    clients: {
        findAll: (): Client[] => getCollection<Client>(STORAGE_KEYS.clients),

        findById: (id: string): Client | undefined =>
            getCollection<Client>(STORAGE_KEYS.clients).find(c => c.id === id),

        findBySeller: (sellerId: string): Client[] =>
            getCollection<Client>(STORAGE_KEYS.clients).filter(c => c.assigned_seller_id === sellerId),

        create: (data: Omit<Client, 'id' | 'created_at'>): Client => {
            const clients = getCollection<Client>(STORAGE_KEYS.clients);
            const newClient: Client = {
                ...data,
                id: generateId(),
                created_at: new Date().toISOString(),
            };
            clients.push(newClient);
            setCollection(STORAGE_KEYS.clients, clients);
            return newClient;
        },
    },

    // Daily Reports
    dailyReports: {
        findAll: (): DailyReport[] => getCollection<DailyReport>(STORAGE_KEYS.dailyReports),

        findById: (id: string): DailyReport | undefined =>
            getCollection<DailyReport>(STORAGE_KEYS.dailyReports).find(r => r.id === id),

        findByStatus: (status: ReportStatus): DailyReport[] =>
            getCollection<DailyReport>(STORAGE_KEYS.dailyReports).filter(r => r.status === status),

        findBySeller: (sellerId: string): DailyReport[] =>
            getCollection<DailyReport>(STORAGE_KEYS.dailyReports).filter(r => r.seller_id === sellerId),

        findByClient: (clientId: string): DailyReport[] =>
            getCollection<DailyReport>(STORAGE_KEYS.dailyReports).filter(r => r.client_id === clientId),

        create: (data: Omit<DailyReport, 'id' | 'created_at' | 'status'>): DailyReport => {
            const reports = getCollection<DailyReport>(STORAGE_KEYS.dailyReports);
            const newReport: DailyReport = {
                ...data,
                id: generateId(),
                status: 'pending',
                created_at: new Date().toISOString(),
            };
            reports.push(newReport);
            setCollection(STORAGE_KEYS.dailyReports, reports);
            return newReport;
        },

        updateStatus: (id: string, status: ReportStatus): DailyReport | undefined => {
            const reports = getCollection<DailyReport>(STORAGE_KEYS.dailyReports);
            const index = reports.findIndex(r => r.id === id);
            if (index === -1) return undefined;
            reports[index].status = status;
            setCollection(STORAGE_KEYS.dailyReports, reports);
            return reports[index];
        },
    },

    // Call Logs
    callLogs: {
        findAll: (): CallLog[] => getCollection<CallLog>(STORAGE_KEYS.callLogs),

        findByCloser: (closerId: string): CallLog[] =>
            getCollection<CallLog>(STORAGE_KEYS.callLogs).filter(c => c.closer_id === closerId),

        create: (data: Omit<CallLog, 'id' | 'created_at'>): CallLog => {
            const logs = getCollection<CallLog>(STORAGE_KEYS.callLogs);
            const newLog: CallLog = {
                ...data,
                id: generateId(),
                created_at: new Date().toISOString(),
            };
            logs.push(newLog);
            setCollection(STORAGE_KEYS.callLogs, logs);
            return newLog;
        },
    },

    // AI Feedback
    aiFeedback: {
        findByReport: (reportId: string): AIFeedback | undefined =>
            getCollection<AIFeedback>(STORAGE_KEYS.aiFeedback).find(f => f.report_id === reportId),

        create: (data: Omit<AIFeedback, 'id' | 'created_at'>): AIFeedback => {
            const feedback = getCollection<AIFeedback>(STORAGE_KEYS.aiFeedback);
            const newFeedback: AIFeedback = {
                ...data,
                id: generateId(),
                created_at: new Date().toISOString(),
            };
            feedback.push(newFeedback);
            setCollection(STORAGE_KEYS.aiFeedback, feedback);
            return newFeedback;
        },
    },

    // Weekly Reports
    weeklyReports: {
        findByClient: (clientId: string): WeeklyReport[] =>
            getCollection<WeeklyReport>(STORAGE_KEYS.weeklyReports)
                .filter(r => r.client_id === clientId)
                .sort((a, b) => new Date(b.week_start).getTime() - new Date(a.week_start).getTime()),

        create: (data: Omit<WeeklyReport, 'id' | 'created_at'>): WeeklyReport => {
            const reports = getCollection<WeeklyReport>(STORAGE_KEYS.weeklyReports);
            const newReport: WeeklyReport = {
                ...data,
                id: generateId(),
                created_at: new Date().toISOString(),
            };
            reports.push(newReport);
            setCollection(STORAGE_KEYS.weeklyReports, reports);
            return newReport;
        },
    },

    // Seed data for development
    seed: () => {
        // Check if already seeded
        if (getCollection<User>(STORAGE_KEYS.users).length > 0) return;

        // Create demo users
        const admin = db.users.create({ email: 'admin@socialfunnels.com', role: 'admin', name: 'Admin Head' });
        admin.status = 'active'; // Admin is always active

        const seller = db.users.create({ email: 'seller@socialfunnels.com', role: 'seller', name: 'Carlos Seller' });
        seller.status = 'active';

        const closer = db.users.create({ email: 'closer@socialfunnels.com', role: 'closer', name: 'Ana Closer' });
        closer.status = 'active';

        const client = db.users.create({ email: 'cliente@empresa.com', role: 'client', name: 'Dra. Beatriz Bandeira' });
        client.status = 'active';

        // Update storage with active status
        const users = [admin, seller, closer, client];
        setCollection(STORAGE_KEYS.users, users);

        // Create demo client
        db.clients.create({
            name: 'Dra. Beatriz Bandeira',
            email: 'cliente@empresa.com', // Links to user
            company: 'Clínica Bandeira',
            assigned_seller_id: seller.id,
            assigned_closer_id: closer.id,
        });


    },
};

// Auto-seed on import (dev only)
if (typeof window !== 'undefined') {
    db.seed();
}
