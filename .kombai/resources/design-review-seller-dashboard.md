# Design Review Results: Seller Dashboard (`/seller`)

**Review Date**: 2026-02-20
**Route**: `/seller` (SellerDashboard)
**Focus Areas**: Visual Design, UX/Usability, Responsive/Mobile, Micro-interactions/Motion, Consistency

> **Note**: This review was conducted through static code analysis only (auth-gated route). Visual inspection via browser would provide additional insights into layout rendering, interactive behaviors, and actual appearance.

## Summary

The Seller Dashboard has a solid foundation with a good design system (Solar Dust palette, Jean-Pierre spec), well-structured cards, and thoughtful use of Framer Motion. However, it has **critical mobile navigation gaps** (the primary nav is completely hidden on mobile with no alternative), **mixed component styling patterns** that hurt consistency, and several UX issues like missing loading/error/empty states and non-interactive timeline items. These issues particularly impact the sales team who primarily use the app on mobile devices.

## Issues

| # | Issue | Criticality | Category | Location |
|---|-------|-------------|----------|----------|
| 1 | **No mobile navigation**: Nav links are `hidden md:flex` with zero fallback — no hamburger menu, no bottom nav, no drawer. Sales team on phones can only reach the dashboard page. | 🔴 Critical | Responsive | `src/components/layout/DashboardLayout.tsx:73` |
| 2 | **No loading skeleton on data fetch**: `fetchData()` runs on mount but UI shows nothing until data arrives — blank page with no feedback for the user. | 🟠 High | UX/Usability | `src/pages/seller/SellerDashboard.tsx:31-35` |
| 3 | **Silent error handling**: `fetchData` catches errors with only `console.error` — no toast, no error banner, no retry option shown to user. | 🟠 High | UX/Usability | `src/pages/seller/SellerDashboard.tsx:63-65` |
| 4 | **Conflicting button styling**: Buttons use both `variant="outline"` AND `className="nc-btn-ghost"` simultaneously. The shadcn outline variant styles conflict with the custom nc-btn-ghost class, causing unpredictable visual output. | 🟠 High | Consistency | `src/pages/seller/SellerDashboard.tsx:119-130` |
| 5 | **Double click target on CTA card**: The entire Card has an `onClick` handler AND contains a `<Button>` inside. Users clicking the button trigger both handlers; the card click area offers no visual affordance (no cursor change text, no focus ring). | 🟠 High | UX/Usability | `src/pages/seller/SellerDashboard.tsx:168-185` |
| 6 | **Raw ISO date format**: Submission dates display as `"2026-02-19"` — not user-friendly for a Portuguese-language app. Should use `date-fns` format like `"19 de fev"`. | 🟡 Medium | Visual Design | `src/pages/seller/SellerDashboard.tsx:264` |
| 7 | **Timeline items are not interactive**: Recent submissions list shows data but items aren't clickable — no way to drill into a specific day's submission details or analysis. | 🟡 Medium | UX/Usability | `src/pages/seller/SellerDashboard.tsx:255-277` |
| 8 | **No empty state**: When `submissions.length === 0` AND `todaySubmitted === true`, the page shows only stats and no guidance. Also, no first-time-user onboarding or hint. | 🟡 Medium | UX/Usability | `src/pages/seller/SellerDashboard.tsx:244-281` |
| 9 | **nc-badge used instead of shadcn Badge**: The role badge in the header uses custom CSS class `nc-badge` instead of the installed shadcn `Badge` component with proper variants. | 🟡 Medium | Consistency | `src/components/layout/DashboardLayout.tsx:99` |
| 10 | **Inconsistent heading font-family**: `SellerDashboard` uses `font-display` class (`Space Grotesk`) for h1, but `DailyReport` uses default sans for its h1. Both are the same heading level across the seller flow. | 🟡 Medium | Consistency | `src/pages/seller/SellerDashboard.tsx:108` vs `src/pages/seller/DailyReport.tsx:131` |
| 11 | **Header buttons overflow on mobile**: Two `Button` components side-by-side (`Evolução` + `Consultoria`) in the header flex without wrapping. On screens <400px they can overflow or squeeze text. | 🟡 Medium | Responsive | `src/pages/seller/SellerDashboard.tsx:117-134` |
| 12 | **Strengths/Improvements grid has no responsive fallback**: `grid-cols-2` is fixed — on very small screens (320px) the two feedback boxes become too narrow to read. Should collapse to single column below `sm` breakpoint. | 🟡 Medium | Responsive | `src/pages/seller/SellerDashboard.tsx:215` |
| 13 | **Card class patterns inconsistent**: Some cards use `nc-card-border nc-card-hover bg-card`, the feedback card uses `nc-card-border bg-card` (no hover), and the CTA card uses `nc-card-border nc-card-hover bg-card cursor-pointer group`. No unified pattern. | 🟡 Medium | Consistency | `src/pages/seller/SellerDashboard.tsx:146,169,195,246` |
| 14 | **Back navigation patterns differ across seller pages**: `WeeklyEvolution` uses an icon-only ghost back button, `DailyReport` uses a ghost button with "Voltar" text label. Should be one consistent pattern. | 🟡 Medium | Consistency | `src/pages/seller/WeeklyEvolution.tsx:113` vs `src/pages/seller/DailyReport.tsx:122` |
| 15 | **Hardcoded chart colors in WeeklyEvolution**: CSS bar chart uses inline hex colors (`#22c55e`, `#eab308`, `#ef4444`) instead of the design tokens (`nc-success`, `nc-warning`, `nc-error`). These won't adapt to theme changes. | 🟡 Medium | Visual Design | `src/pages/seller/WeeklyEvolution.tsx:190-194` |
| 16 | **Loading spinner not extracted to shared component**: The `animate-spin rounded-full h-8 w-8 border-b-2 border-primary` spinner pattern is duplicated in SellerDashboard (implicit), WeeklyEvolution, DailyReport, and RoleGuard. Should be a `<Spinner />` component. | 🟡 Medium | Consistency | `src/components/layout/RoleGuard.tsx:19`, `src/pages/seller/DailyReport.tsx:112` |
| 17 | **CSS bar chart instead of Recharts**: `WeeklyEvolution` builds a chart using CSS/inline styles instead of the already-installed Recharts + shadcn `ChartContainer`. This misses tooltips, accessibility, and responsiveness. | 🟡 Medium | Visual Design | `src/pages/seller/WeeklyEvolution.tsx:169-204` |
| 18 | **No touch-target minimum on timeline**: Submission timeline rows have no explicit `min-height`. On touch devices, tapping precision is reduced. WCAG recommends 44×44px minimum. | ⚪ Low | Responsive | `src/pages/seller/SellerDashboard.tsx:257-276` |
| 19 | **No page transition animations**: Moving between `/seller`, `/seller/report`, `/seller/evolution` has no route transition — content switches abruptly. Could use `AnimatePresence` for smoother flow. | ⚪ Low | Micro-interactions | `src/App.tsx:40-82` |
| 20 | **Missing hover/active states on stat cards**: Stat cards have `nc-card-hover` (translateY + glow on hover) but no `:active` press feedback for mobile taps. | ⚪ Low | Micro-interactions | `src/pages/seller/SellerDashboard.tsx:146` |
| 21 | **Logo not linked**: The brand logo/name in the header is not wrapped in a `<Link>` back to the dashboard — users can't click the logo to return home (common UX pattern). | ⚪ Low | UX/Usability | `src/components/layout/DashboardLayout.tsx:62-69` |
| 22 | **No relative timestamps**: Coach feedback shows no indication of when it was generated. Adding "há 2h" or similar would improve relevance perception. | ⚪ Low | UX/Usability | `src/pages/seller/SellerDashboard.tsx:189-241` |
| 23 | **Supabase typed as `any`**: All Supabase queries use `(supabase as any)` which removes type safety and could lead to silent runtime errors with wrong column names. | ⚪ Low | Performance | `src/pages/seller/SellerDashboard.tsx:42,55` |

## Criticality Legend

- 🔴 **Critical**: Breaks functionality or violates accessibility standards
- 🟠 **High**: Significantly impacts user experience or design quality
- 🟡 **Medium**: Noticeable issue that should be addressed
- ⚪ **Low**: Nice-to-have improvement

## Next Steps

### Recommended prioritization:

1. **Immediate (Critical)**: Add mobile navigation — either a `MobileBottomNav` component (recommended for sales teams, always visible) or a `Sheet`-based hamburger menu. This is the single highest-impact fix.

2. **Sprint 1 (High)**:
   - Add loading skeleton using shadcn `Skeleton` component on SellerDashboard
   - Add toast-based error handling with retry action
   - Fix conflicting button styling — choose either shadcn variants OR `nc-btn-*` classes, not both
   - Fix CTA card double-click — remove card-level `onClick`, keep only the Button

3. **Sprint 2 (Medium)**:
   - Format dates with `date-fns` (`format(date, "dd 'de' MMM", { locale: ptBR })`)
   - Make timeline items clickable with navigation to submission detail
   - Replace `nc-badge` with shadcn `Badge` component
   - Standardize card class patterns across all seller pages
   - Replace CSS bar chart with Recharts `BarChart` in `WeeklyEvolution`
   - Extract shared `Spinner` component

4. **Sprint 3 (Low)**:
   - Add `AnimatePresence` route transitions
   - Add mobile `:active` states to cards
   - Link the logo to role-based dashboard
   - Add relative timestamps to feedback
   - Add proper Supabase typing
