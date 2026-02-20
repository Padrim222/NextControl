# Seller UX Redesign Plan

> **Context:** UX/UI designer reviewed Seller Dashboard, found 23 issues. 13 already fixed by designer. This plan covers the remaining 10 issues + next page reviews.

## Project Type: WEB (React + Vite + shadcn + Tailwind v3)
## Primary Agent: `frontend-specialist`

---

## ✅ Already Fixed by Designer (13/23)

| # | Issue | Status |
|---|-------|--------|
| 1 | Mobile navigation (Critical) — `MobileBottomNav.tsx` created | ✅ Done |
| 2 | Loading skeleton — Skeleton state in SellerDashboard | ✅ Done |
| 3 | Error handling — toast with retry action | ✅ Done |
| 4 | Conflicting button styling — `variant="ghost"` + `nc-btn-ghost` | ✅ Done |
| 5 | Double-click CTA — Card onClick removed | ✅ Done |
| 6 | Raw ISO dates — `SubmissionTimeline` with date-fns pt-BR | ✅ Done |
| 7 | Non-interactive timeline — clickable with chevron | ✅ Done |
| 9 | nc-badge → shadcn Badge | ✅ Done |
| 11 | Header buttons overflow — hidden on mobile | ✅ Done |
| 12 | Feedback grid responsive — `grid-cols-1 sm:grid-cols-2` | ✅ Done |
| 13 | Card class consistency — unified pattern | ✅ Done |
| 18 | Touch targets — `min-h-[44px]` on timeline | ✅ Done |
| 21 | Logo linked — `<Link to={homePath}>` | ✅ Done |

---

## 🔧 Remaining Issues (10/23) — Sprint 2 & 3

### Sprint 2: Medium Priority (Seller Pages Consistency)

#### Task 2.1: Standardize heading font-family (Issue #10)
- **Agent:** `frontend-specialist`
- **File:** [DailyReport.tsx](file:///c:/Users/Fabricio%20Padrin/OneDrive/Documentos/leadflow-navigator/src/pages/seller/DailyReport.tsx#L131)
- **INPUT:** DailyReport h1 uses default sans, SellerDashboard uses `font-display`
- **OUTPUT:** DailyReport h1 uses `font-display` class
- **VERIFY:** Visual consistency between pages
- **Effort:** 2 min

#### Task 2.2: Standardize back navigation pattern (Issue #14)
- **Agent:** `frontend-specialist`
- **Files:**
  - [WeeklyEvolution.tsx](file:///c:/Users/Fabricio%20Padrin/OneDrive/Documentos/leadflow-navigator/src/pages/seller/WeeklyEvolution.tsx#L113) — icon-only back button
  - [DailyReport.tsx](file:///c:/Users/Fabricio%20Padrin/OneDrive/Documentos/leadflow-navigator/src/pages/seller/DailyReport.tsx#L122) — text "Voltar" button
- **INPUT:** Two different back button patterns
- **OUTPUT:** Both use icon-only `size="icon"` ghost back button (WeeklyEvolution pattern — cleaner on mobile)
- **VERIFY:** Both pages have identical back button style

#### Task 2.3: Replace hardcoded chart colors with design tokens (Issue #15)
- **Agent:** `frontend-specialist`
- **File:** [WeeklyEvolution.tsx](file:///c:/Users/Fabricio%20Padrin/OneDrive/Documentos/leadflow-navigator/src/pages/seller/WeeklyEvolution.tsx#L190-L194)
- **INPUT:** Inline hex colors `#22c55e`, `#eab308`, `#ef4444`
- **OUTPUT:** CSS custom properties from theme (`hsl(var(--nc-success))`, etc.) or Tailwind token values
- **VERIFY:** Colors match the design system and adapt to potential theme changes
- **Note:** Since these are inline styles for gradients, extract CSS vars from `index.css` or use computed values

#### Task 2.4: Extract shared Spinner component (Issue #16)
- **Agent:** `frontend-specialist`
- **Files affected:**
  - [RoleGuard.tsx](file:///c:/Users/Fabricio%20Padrin/OneDrive/Documentos/leadflow-navigator/src/components/layout/RoleGuard.tsx#L19)
  - [DailyReport.tsx](file:///c:/Users/Fabricio%20Padrin/OneDrive/Documentos/leadflow-navigator/src/pages/seller/DailyReport.tsx#L112)
  - [WeeklyEvolution.tsx](file:///c:/Users/Fabricio%20Padrin/OneDrive/Documentos/leadflow-navigator/src/pages/seller/WeeklyEvolution.tsx#L128)
- **INPUT:** Duplicated spinner pattern `animate-spin rounded-full h-8 w-8 border-b-2 border-primary`
- **OUTPUT:** New `<Spinner />` component in `src/components/ui/Spinner.tsx`, all 3 files import it
- **VERIFY:** `grep -r "animate-spin rounded-full" src/` returns 0 results (only the Spinner component)

#### Task 2.5: Replace CSS bar chart with Recharts (Issue #17)
- **Agent:** `frontend-specialist`
- **File:** [WeeklyEvolution.tsx](file:///c:/Users/Fabricio%20Padrin/OneDrive/Documentos/leadflow-navigator/src/pages/seller/WeeklyEvolution.tsx#L169-L204)
- **INPUT:** CSS-based bar chart with inline styles
- **OUTPUT:** Recharts `<BarChart>` with `<ChartContainer>` from shadcn, tooltips, responsive
- **VERIFY:** Chart renders correctly with real data, responsive on mobile
- **Dependencies:** `recharts` already installed
- **Effort:** 15 min

#### Task 2.6: Add error handling to WeeklyEvolution (mirrors Issue #3)
- **Agent:** `frontend-specialist`
- **File:** [WeeklyEvolution.tsx](file:///c:/Users/Fabricio%20Padrin/OneDrive/Documentos/leadflow-navigator/src/pages/seller/WeeklyEvolution.tsx#L96-L98)
- **INPUT:** `console.error` only
- **OUTPUT:** `toast.error` with retry action (same pattern as SellerDashboard)
- **VERIFY:** Error toast appears on network failure

### Sprint 3: Low Priority (Polish)

#### Task 3.1: Add AnimatePresence route transitions (Issue #19)
- **Agent:** `frontend-specialist`
- **File:** [App.tsx](file:///c:/Users/Fabricio%20Padrin/OneDrive/Documentos/leadflow-navigator/src/App.tsx)
- **INPUT:** Abrupt route switches
- **OUTPUT:** Framer Motion `AnimatePresence` wrapper with fade/slide transitions
- **VERIFY:** Smooth transitions between seller pages
- **Effort:** 10 min

#### Task 3.2: Add mobile :active states to stat cards (Issue #20)
- **Agent:** `frontend-specialist`
- **File:** `index.css` or inline styles
- **INPUT:** No active press feedback on mobile tap
- **OUTPUT:** `active:scale-[0.98]` or similar on nc-card-hover class
- **VERIFY:** Cards respond to touch on mobile

#### Task 3.3: Add relative timestamps to coach feedback (Issue #22)
- **Agent:** `frontend-specialist`
- **File:** [SellerDashboard.tsx](file:///c:/Users/Fabricio%20Padrin/OneDrive/Documentos/leadflow-navigator/src/pages/seller/SellerDashboard.tsx#L264-L316)
- **INPUT:** No timestamp on feedback card
- **OUTPUT:** `formatDistanceToNow(date, { locale: ptBR })` → "há 2h"
- **VERIFY:** Timestamp visible below coach feedback title

#### Task 3.4: Improve Supabase type safety (Issue #23)
- **Agent:** `frontend-specialist`
- **Scope:** All seller pages
- **INPUT:** `(supabase as any)` everywhere
- **OUTPUT:** Generated types from `mcp_supabase-mcp-server_generate_typescript_types`, properly typed client
- **VERIFY:** `grep -r "as any" src/pages/seller/` returns 0 results
- **Effort:** 20 min (generate types + refactor)

---

## 🚫 Empty State (Issue #8) — Already Handled

The designer noted the empty state when `submissions.length === 0 && todaySubmitted === true`. The current SellerDashboard already handles this implicitly:
- Stats still show (with 0 values)
- The CTA disappears when `todaySubmitted = true` but the feedback card shows if analysis exists
- The timeline simply doesn't render when empty

This is acceptable UX — no action needed.

---

## Dependency Graph

```
Sprint 2 (parallel):
  Task 2.1 (heading) ─── no deps
  Task 2.2 (back nav) ── no deps
  Task 2.3 (colors) ──── no deps
  Task 2.4 (Spinner) ─── no deps
  Task 2.6 (error) ───── no deps
  Task 2.5 (Recharts) ── depends on 2.3 (same file)

Sprint 3 (parallel, after Sprint 2):
  Task 3.1 (transitions) ─ no deps
  Task 3.2 (active states) ─ no deps
  Task 3.3 (timestamps) ── no deps
  Task 3.4 (types) ─────── last (affects many files)
```

---

## Next Pages (After Seller is Done)

Priority order per designer's review request:
1. **CS Inbox** (`/cs`) — second most used
2. **Admin Dashboard** (`/admin`)
3. **Client Dashboard** (`/client`)
4. **Closer Dashboard** (`/closer`)
5. **Training/Coach** (`/training/coach`)

Each will get the same treatment: designer reviews, then we implement fixes.

---

## Phase X: Verification

- [ ] `npx tsc --noEmit` — zero errors
- [ ] `npm run build` — success
- [ ] Browser test on mobile viewport (375px)
- [ ] Browser test on desktop (1440px)
- [ ] All seller pages: `/seller`, `/seller/report`, `/seller/evolution`
- [ ] MobileBottomNav visible on mobile, hidden on desktop
- [ ] No purple/violet hex codes
- [ ] No `animate-spin rounded-full` outside Spinner component
- [ ] No `(supabase as any)` in seller pages (Sprint 3)
