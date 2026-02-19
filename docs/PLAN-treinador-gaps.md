# PLAN — Treinador de Bolso: PRD Gap Analysis

> **Objective:** Close ALL gaps between the PRD and current implementation for MVP (Phase 1).

---

## PRD vs Implementation — Gap Matrix

| # | PRD Requirement | Status | Gap Severity |
|---|----------------|--------|-------------|
| 1 | Form Diário (seller + closer) | ⚠️ Partial | **P0 — CRITICAL** |
| 2 | Upload 5 prints de conversas | ✅ `DailySubmissionForm` has it | OK |
| 3 | Upload call recording (closer) | ✅ `DailySubmissionForm` has it | OK |
| 4 | Agente RED (Social Selling) | ✅ `analyze-submission` | OK |
| 5 | Agente Call Analysis | ✅ `analyze-submission` | OK |
| 6 | Agente Metrics | ✅ `analyze-submission` | OK |
| 7 | Relatório PDF com logo | ❌ HTML only, no PDF | **P0 — CRITICAL** |
| 8 | Treinador de Bolso Chat | ✅ `coach-chat` + `CoachChat.tsx` | OK |
| 9 | Dashboard CS (Ronaldo) | ⚠️ `CSInbox.tsx` exists but basic | **P1** |
| 10 | Histórico de evolução semanal | ❌ Not implemented | **P1** |
| 11 | Entrega via WhatsApp | ⚠️ `deliver-report` exists, graceful fallback | OK |
| 12 | PWA (Progressive Web App) | ❌ No manifest, no SW | **P1** |
| 13 | DailyReport uses wrong table | ❌ References `daily_reports` (doesn't exist) | **P0 — BROKEN** |
| 14 | DailyCheckinWizard fields mismatch | ❌ Old funnel metrics, not PRD fields | **P0 — BROKEN** |
| 15 | Weekly Reports aggregation | ❌ Table exists, no logic | **P2** |
| 16 | OpenRouter integration | ✅ All 3 AI functions migrated | OK |
| 17 | Storage buckets | ✅ `submissions` + `reports` | OK |
| 18 | RLS + Auth | ✅ 24 + 7 policies | OK |
| 19 | Whisper transcription | ❌ No audio transcription | **P2** |

---

## P0 — CRITICAL FIXES (App is broken without these)

### 1. Fix DailyReport.tsx → Use `daily_submissions` table

**File:** `src/pages/seller/DailyReport.tsx`

**Problem:** Line 64 inserts into `daily_reports` — this table **does not exist**. The real table is `daily_submissions`.

**Changes:**
- Replace `supabase.from('daily_reports')` → `supabase.from('daily_submissions')`
- Map wizard data to `daily_submissions` schema: `metrics` (JSONB), `notes`, `seller_id`, `submission_date`
- Remove old field-by-field insert (chat_ativo, boas_vindas, etc.)

---

### 2. Fix DailyCheckinWizard → Match PRD Form Fields

**File:** `src/components/seller/DailyCheckinWizard.tsx`

**Problem:** Wizard collects `chat_ativo, boas_vindas, reaquecimento, nutricao, conexoes, mapeamentos, pitchs, capturas, followups` — the PRD specifies different fields.

**PRD Fields for Sellers:**
- Quantas abordagens hoje?
- Quantos follow-ups?
- Quantas propostas enviadas?
- Quantas vendas?
- Descrição breve do dia

**PRD Fields for Closers:**
- Quantas calls realizadas?
- Taxa de conversão do dia
- Principais objeções encontradas

**Changes:**
- Accept `sellerType` prop to differentiate seller vs closer fields
- Replace STEPS array with PRD-aligned fields
- Add `notes` textarea for daily description
- Output data as `metrics` JSONB object

---

### 3. Integrate print uploads into DailyReport flow

**File:** `src/pages/seller/DailyReport.tsx`

**Problem:** DailyReport uses DailyCheckinWizard (no uploads). DailySubmissionForm (has uploads) is only in CloserDashboard.

**Changes:**
- Merge: Add 5-print upload step into Wizard as final step
- Trigger `process-upload` → then `analyze-submission` → then `generate-report`

---

### 4. PDF Report Generation

**File:** `supabase/functions/generate-report/index.ts`

**Problem:** Currently generates HTML only. PRD requires branded PDF with logo.

**Recommended approach:** Client-side PDF generation
- Generate HTML report on server (existing)
- Use `html2canvas` + `jsPDF` on frontend to convert to PDF
- Upload PDF to `reports` bucket
- Zero additional backend cost

---

## P1 — Important for MVP Quality

### 5. PWA Configuration

**New files:**
- `public/manifest.json` — app name, icons, theme, `display: standalone`
- `public/sw.js` — service worker for offline caching
- App icons (192x192, 512x512)

**Modify:** `index.html` — add manifest link + meta tags

---

### 6. Histórico de Evolução Semanal

**New file:** `src/pages/seller/WeeklyEvolution.tsx`

**Changes:**
- Page showing weekly score trends chart
- Query `analyses` grouped by week
- Add route `/seller/evolution` in `App.tsx`

---

### 7. Enhance CS Dashboard

**File:** `src/pages/cs/CSInbox.tsx`

**Changes:**
- Consolidated view of all sellers with status
- Pending reports queue with approve/reject
- Link to `deliver-report` for WhatsApp delivery

---

## P2 — Nice-to-have for MVP

### 8. Weekly Reports Aggregation Logic
- Edge Function or cron aggregating daily scores into `weekly_reports`

### 9. Whisper Integration for Call Transcription
- Audio transcription via OpenRouter before call analysis
- Adds ~$0.50/call cost

---

## Implementation Order

```
P0.1 Fix DailyReport table reference
  ↓
P0.2 Fix Wizard form fields (PRD-aligned)
  ↓
P0.3 Integrate uploads into seller flow
  ↓
P0.4 PDF generation (client-side)
  ↓
P1.5 PWA manifest + service worker
  ↓
P1.6 Weekly Evolution page
  ↓
P1.7 Enhance CS Dashboard
  ↓
P2 Weekly aggregation + Whisper
```

## Agent Assignments

| Task | Agent |
|------|-------|
| P0.1-P0.3 | `frontend-specialist` + `backend-specialist` |
| P0.4 | `backend-specialist` |
| P1.5 | `frontend-specialist` |
| P1.6 | `frontend-specialist` |
| P1.7 | `frontend-specialist` |
| Security review | `security-auditor` |

## Verification Plan

### Automated
- Build compiles without errors (`npm run build`)
- All Supabase queries target existing tables
- Edge Functions respond to test payloads

### Manual
- Seller fills form → uploads prints → sees AI analysis
- CS sees all sellers, approves reports
- Reports generate as PDF with logo
- PWA installs on mobile
