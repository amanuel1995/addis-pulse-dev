# AddisPulse Media — Implementation Plan

*Last updated: 2026-07-09 | Maintained by: Antigravity (Bluecore engagement)*

> **Source of truth for branch creation, sprint planning, and progress tracking.**
> Cross-referenced with `docs/internal/architecture.md` (build timeline) and `docs/internal/addis_pulse_full_analysis.md` (gap analysis).

---

## Phase 1 — Foundation (Weeks 1–6)

| Week | Focus | Branch | Status |
|------|-------|--------|--------|
| 1 | Project setup, auth, Supabase connection, DB schema, protected routes | `feature/supabase-vercel-foundation` | ✅ Done |
| 2 | Company profile CRUD, logo upload, QR generation | `feature/company-profile-qr` | 🔲 Not started |
| 3 | Public landing page — bilingual, ISR, video embed | `feature/nextjs-proxy-migration` | ⚠️ Partial — route shell + RPC done; lead form is hardcoded placeholder |
| 4 | Lead form + OTP flow (Africa's Talking) + thank-you + inactive screens | `feature/lead-capture-otp` | 🟡 **Current** |
| 5 | Real-time notifications (Supabase Realtime, Resend email, Telegram ops bot) | `feature/realtime-notifications` | 🔲 Not started |
| 6 | Admin dashboard (lead list, search, filter, CSV export, audit log) | `feature/admin-dashboard` | 🔲 Not started |

### What's Actually Built on `main` (verified 2026-07-09)

| File / Feature | Status | Notes |
|---|---|---|
| `src/lib/supabase/` (client, server, middleware) | ✅ Done | SSR helpers wired |
| `src/proxy.ts` | ✅ Done | Middleware renamed from `middleware.ts` → `proxy.ts` |
| `src/app/d/[qr_token]/page.tsx` | ⚠️ Partial | Route, RPC call, ISR `revalidate=60`, bilingual header done. **Lead form is `[placeholder]`** |
| `supabase/migrations/20260702000000_initial_schema.sql` | ✅ Done | 16 tables, RLS, enums, indexes, `resolve_driver_campaign()` RPC |
| `shadcn/ui` + `components.json` + `button.tsx` | ✅ Done | Component scaffold ready |
| Company profile CRUD | ❌ Not built | No pages, no routes |
| Logo upload (Supabase Storage) | ❌ Not built | — |
| QR code generation | ❌ Not built | — |
| Lead form | ❌ Not built | Placeholder only |
| OTP flow | ❌ Not built | — |

---

## Phase 2 — AddisPulse Layer (Weeks 7–10)

| Week | Focus | Branch | Status |
|------|-------|--------|--------|
| 7 | Campaign CRUD + driver management + driver QR resolution | `feature/campaign-driver-mgmt` | 🔲 Not started |
| 8 | Fraud detection logic (velocity, device fingerprint, duplicate) | `feature/fraud-detection` | 🔲 Not started |
| 9 | Advertiser dashboard + lead pipeline + driver leaderboard | `feature/advertiser-dashboard` | 🔲 Not started |
| 10 | Telegram driver bot + compliance records + hardening + QA | `feature/telegram-driver-bot` | 🔲 Not started |

---

## Current Milestone — Week 4: `feature/lead-capture-otp`

> **Goal:** A passenger who scans a QR code can submit their name + phone, receive an OTP SMS via Africa's Talking, verify it, and land on a thank-you screen. No lead is counted as `otp_verified` without phone confirmation.

### UI Components
- [ ] `LeadForm` client component (`src/components/lead/LeadForm.tsx`)
  - Fields: name + phone (required), email + interest type (optional)
  - Bilingual labels pulled from `campaign.landing_config` JSONB
  - Client-side Ethiopian phone validation (`^(09|07)\d{8}$`)
  - On submit → `POST /api/v1/leads`
- [ ] `/d/[qr_token]/verify` page + `OTPForm` component (6-digit code entry, resend link)
- [ ] `/d/[qr_token]/thank-you` page (reward info, campaign branding)
- [ ] `/d/[qr_token]/inactive` page (driver has no active campaign)

### API Routes
- [ ] `POST /api/v1/leads`
  - Rate limit: 5/min per IP, 20/day per IP per campaign
  - Duplicate phone check: `is_duplicate_lead(phone, campaign_id)` RPC
  - Salted device fingerprint hash (no raw fingerprints stored)
  - Salted IP hash (Data Proclamation 1321/2024 compliance — no raw IPs)
  - Insert lead (`verification_status = 'submitted'`)
  - Trigger `POST /api/v1/otp/send`
- [ ] `POST /api/v1/otp/send`
  - Africa's Talking SMS: 6-digit OTP to passenger phone
  - Store `code_hash` + `expires_at` in `otp_verifications`
- [ ] `POST /api/v1/otp/verify`
  - Checks: expiry (10 min window), attempt count (max 3), `code_hash` match
  - On success: update `leads.verification_status = 'otp_verified'`
  - Trigger: Supabase Realtime push + Resend email notification (wired up fully in Week 5)

### Integrations
- [ ] Africa's Talking SMS client (`src/lib/africas-talking.ts`)
- [ ] Resend client stub (`src/lib/resend.ts`) — email notification placeholder for Week 5

### Security Checklist
- [ ] No raw IPs or fingerprints stored — only salted hashes
- [ ] `SUPABASE_SERVICE_ROLE_KEY` used only inside `/api/v1/` server routes
- [ ] All new tables: `ENABLE ROW LEVEL SECURITY` + explicit `CREATE POLICY` statements

### Definition of Done
- [ ] `npm run build` passes — zero TypeScript or SSR errors
- [ ] Full flow works end-to-end: scan → form → OTP SMS → verify → `otp_verified` in DB
- [ ] Invalid/expired/exhausted OTP handled gracefully with user-facing error
- [ ] `notFound()` returned for inactive driver token
- [ ] Draft PR opened against `main`

---

## Decisions Log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-07-02 | QR per-driver PERMANENT | No reprinting per campaign; `resolve_driver_campaign()` handles routing |
| 2026-07-02 | Single-operator MVP (Bluecore only) | Avoids multi-tenant complexity; `company_id` FK keeps v2 path open |
| 2026-07-02 | Africa's Talking for OTP SMS | ETH market presence, clean REST API, easy to swap for Ethio Telecom later |
| 2026-07-02 | Telegram bot for driver ops (not native app) | Speed to pilot; native app after 3 paid campaigns + investment |
| 2026-07-09 | Supabase retained (not Neon) | Realtime + Auth + Storage are hard requirements; Neon covers none of them |
| 2026-07-09 | Week 2 (Company CRUD + QR) skipped in build order | Landing page shell already exists; completing the passenger flow (lead capture → OTP) is higher priority for pilot demo |
