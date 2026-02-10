# Route Validation & Dashboard Migration Plan

## 1. Route Validation
- [ ] **Verify Protection Logic**:
    - [ ] Review `RoleGuard.tsx` against new AuthContext.
    - [ ] Create a test suite `src/components/layout/RoleGuard.test.tsx` to verify redirection logic.
- [ ] **Manual Verification**:
    - [ ] Sign in as `admin`, `seller`, `closer`, `client` and verify redirection. (Simulated via tests since browser is unavailable).

## 2. Dashboard Migration (Supabase)
- [ ] **Seller Dashboard**:
    - [ ] Migrate `DailyReport` submission to use `supabase.from('daily_reports').insert()`.
    - [ ] Migrate `Client` list fetching to `supabase.from('clients').select()`.
- [ ] **Closer Dashboard**:
    - [ ] Migrate `CallLog` submission and history.
- [ ] **Client Dashboard**:
    - [ ] Migrate `ProjectTimeline` to fetch `daily_reports` with `status = 'approved'`.
    - [ ] Migrate `FunnelChart` data aggregation.

## 3. Data Cleanup
- [ ] Remove mock data calls from `src/lib/db.ts` where superseded by Supabase.
- [ ] Ensure types in `src/types/index.ts` match Supabase schema.

## 4. Verification
- [ ] Run `npm run lint`.
- [ ] Run `npm test`.
