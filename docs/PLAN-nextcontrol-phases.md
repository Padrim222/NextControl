# PLAN-nextcontrol-phases: NextControl Future Phases (2-7)

## 📌 Context
Following the completion of Phase 0 (Infrastructure) and Phase 1 (Critical Bug Fixes), this document outlines the structured roadmap, epics, and tasks for the remaining phases. It follows the methodologies from `@product-owner` and `@orchestrator`.

---

## 🎯 Objective
Accelerate adoption, improve the Seller/Client/Closer UX, and integrate Gemini 2.0 and RAG capabilities into the NextControl platform.

## 👥 User Personas
- **Seller**: Needs a frictionless daily check-in process, better mobile touch targets, and instant AI insights on their daily performance to course-correct immediately.
- **Admin**: Needs comprehensive oversight, ability to upload strategic material for clients, and detailed reporting with low manual effort.
- **Closer**: Needs deep context on conversion rates, specific lead insights, and longitudinal feedback analysis.
- **Client**: Needs clarity on their specific implementation phase ("Meu Plano") and easy access to training materials.

---

## 🛠 Project Phases & Epics

### Epic 1: Seller & Admin UX Overhaul (Phase 2)
**Goal:** Frictionless data entry and immediate performance feedback.
- [ ] **US 1.1**: As a Seller, I want larger Add/Remove buttons, so I can easily register check-ins on mobile.
- [ ] **US 1.2**: As a Seller, I want an automated summary panel of my "Daily Metrics" with insights, so I know where to improve before the week ends.
- [ ] **US 1.3**: As a Seller, I want to input followers, conversations, opportunities, follow-ups, objections, and conversation quality in my check-in, to provide full context to the Admin.
- [ ] **US 1.4**: As a Seller, I want to paste text or upload prints of my conversations with leads, so the AI can evaluate my approach.

### Epic 2: Advanced AI & External Integrations (Phase 3)
**Goal:** Replace OpenRouter with Gemini 2.0 direct API and implement RAG.
- [ ] **US 2.1**: As an Admin, I want the Coach Chat to use Gemini 2.0 Flash natively, so responses are faster and more accurate.
- [ ] **US 2.2**: As an Admin, I want to upload PDFs/Docs to a Knowledge Base (RAG), so the NextControl AI can answer based on our proprietary material.
- [ ] **US 2.3**: As an Admin, I want an automated Blacklist of discarded strategies, so the Coach Chat stops recommending what didn't work.
- [ ] **US 2.4**: As an Admin, I want a Respondi Webhook integration, to automatically sync client onboarding form answers into the platform.
- [ ] **US 2.5**: As an Admin, I want the Client Model/Form to include all Formula X, Phase-Company, and Block 1-3 sections.

### Epic 3: Closer Deep Analytics (Phase 4)
**Goal:** Actionable intelligence for closing deals.
- [ ] **US 3.1**: As a Closer, I want to see my calculated "Check-in Conversion Rate", so I know my true closing efficiency.
- [ ] **US 3.2**: As a Closer, I want an Insights/Tips section alerting me about old leads needing follow-up, so I don't lose warm opportunities.
- [ ] **US 3.3**: As a Closer, I want month-over-month feedback filters, so I can track my ramp-up progress historically.

### Epic 4: Client Journey Visualization (Phase 5)
**Goal:** Clear onboarding and continuous training access for the end client.
- [ ] **US 4.1**: As a Client, I want a clickable "Meu Plano" tab, so I can see my current phase, next steps, and onboarding summary.
- [ ] **US 4.2**: As a Client, I want a dedicated "Training Materials" section, to access scripts and funnels at any time.
- [ ] **US 4.3**: As an Admin, I want to send videos/audios/docs directly to a specific Client's profile, to give them personalized coaching.

### Epic 5: AI Feedback Loops (Phase 6)
**Goal:** The platform learns from usage and becomes smarter over time.
- [ ] **US 5.1**: As the System, I want to cross-reference winning scripts across multiple users, to feed the Coach Chat with proven best practices.
- [ ] **US 5.2**: As an Admin, I want to run A/B model analyses on scripts, to see which has the highest pass rate.
- [ ] **US 5.3**: As an Admin, I want an automated bi-weekly update report summarizing all accumulated knowledge.
- [ ] **US 5.4**: As a Seller, I want a personal Script Vault, to save and quickly reference approaches that worked well for me.

---

## 🚦 Orchestration Matrix (Agent Assignments)

This project requires simultaneous parallel execution once approved.

| Specialty | Agent | Assigned Tasks (Epics) |
| :--- | :--- | :--- |
| **Frontend/UI** | `@frontend-specialist` | Epic 1 (UI, forms), Epic 4 (Tabs, views) |
| **Backend/API** | `@backend-specialist` | Epic 2 (Webhooks, Gemini integration, RAG logic), Epic 5 |
| **Data/SQL** | `@database-architect` | Epic 2 (RAG vectors, Webhook tables), Epic 3 (Stats queries) |
| **Security/Auth** | `@security-auditor` | Audit API Keys usage, RLS policies for Client/Admin split |
| **Testing/QA** | `@test-engineer` | Verify complex forms, test Webhook reliability |

---

## 🔒 Verification & Release Checklist (Phase 7)
- [ ] Execute `playwright_runner.py` for E2E flow testing.
- [ ] Execute `security_scan.py` before any production deployment.
- [ ] Execute `lint_runner.py` to handle the final code quality.
- [ ] Ensure `npm run build` is 100% clean.
- [ ] Ensure Supabase edge functions have accurate `.env` secrets configured.
