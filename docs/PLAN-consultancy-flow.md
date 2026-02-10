# 📋 Plan: Consultancy Flow Enhancement (4-Tiers)

## Goal
Implement a streamlined 4-tier workflow (Seller, Closer, Admin, Client) focused on reducing decision fatigue and improving UX using chunking and clear hierarchies.

## 🏗️ Architecture

### Database (Supabase)
- **Users Table**: Add `status` column (pending, active) to control access.
- **Call Logs**: Already exists, need to ensure correct RLS.
- **Daily Reports**: Existing, ensure validation logic.

### Frontend (React/Tailwind)
- **Seller**: Daily Check-in Wizard (Chunking).
- **Closer**: Call Report Cards (Simplification).
- **Admin**: Validation Inbox & PDF Generator.
- **Client**: Project Timeline & Simplified Dashboard.

## 🤖 Agent Assignments

### 1. Backend Specialist (`backend-specialist`)
- [ ] **Schema Update**: Add `status` column to `users` table in `src/lib/schema.sql`.
- [ ] **Type Definitions**: Update `src/types/database.types.ts` to include `status` and `CallLog` types.
- [ ] **RLS Policies**: Ensure pending users can't access full app.

### 2. Frontend Specialist (`frontend-specialist`)
- [ ] **Auth Flow**: Update `Register.tsx` to handle "pending approval" state.
- [ ] **Seller Wizard**: Create `src/components/seller/DailyCheckinWizard.tsx`.
- [ ] **Closer Cards**: Create `src/components/closer/CallReportCard.tsx`.
- [ ] **Admin Inbox**: Refactor `AdminDashboard.tsx` to use a clean "Validation Inbox" UI.
- [ ] **Client Timeline**: Add visual timeline to `ClientDashboard.tsx`.

### 3. Testing Engineer (`testing-engineer`)
- [ ] **Unit Tests**: Test the Wizard component state transitions.
- [ ] **Integration Tests**: Test the "Register -> Admin Approve -> Login" flow.

## 📅 Execution Steps

1.  **Backend**: Update schema and types.
2.  **Frontend**: Implement UI components and workflows.
3.  **Integration**: Connect UI to DB.
4.  **Verification**: Manual and automated testing.

## 🔍 Verification Checklist
- [ ] New user registers -> sees "Pending" message.
- [ ] Admin approves user -> user can log in.
- [ ] Seller completes daily report via Wizard.
- [ ] Closer logs call outcome via Card.
- [ ] Admin sees pending reports and approves them.
- [ ] Client sees updated data on dashboard.
