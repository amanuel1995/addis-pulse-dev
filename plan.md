# AddisPulse Media — Implementation Plan

*Last updated: 2026-07-09 | Maintained by: Antigravity (Bluecore engagement)*

> **Source of truth for branch creation, sprint planning, and progress tracking.**
> Cross-referenced with `docs/internal/architecture.md` (build timeline) and `docs/internal/addis_pulse_full_analysis.md` (gap analysis).

---

## The New Milestone Breakdown
*Note: The original 10-week chronological plan has been refactored into 4 logical feature milestones to prioritize the end-to-end passenger pilot flow first, followed by the backend engine, backoffice operations, and finally client/driver portals. This ensures all gaps identified in the business analysis are fully covered.*

> **Branching Note:** Milestones are large logical groupings. A single milestone can (and often should) be broken down into multiple smaller feature branches and multiple Pull Requests to keep code reviews manageable.

### Milestone 1: Core Passenger Flow (MVP Foundation)
> **Goal:** A passenger can scan a QR, see a campaign, submit a lead, verify via OTP, and land on a thank-you page.
- [x] Project setup, auth, Supabase connection, DB schema, protected routes (`feature/supabase-vercel-foundation`)
- [x] CI/CD pipeline, Vercel deployments, Next.js proxy middleware, security headers
- [x] Public landing page shell — bilingual, ISR (`feature/nextjs-proxy-migration`)
- [ ] **Current:** Lead form + OTP flow (Africa's Talking) + thank-you + inactive screens (`feature/lead-capture-otp`)

### Milestone 2: Campaign & Driver Management (The Engine)
> **Goal:** Admins can create advertisers, configure campaigns with rewards, register drivers, and assign permanent QRs.
*Branch:* `feature/campaign-driver-mgmt`
- [ ] Advertiser / Company profile CRUD & logo upload (Supabase Storage)
- [ ] Campaign CRUD, reward configuration, target zones, and budget
- [ ] Driver registration & Driver permanent QR generation (resolves to active campaign)
- [ ] Driver campaign assignments (mapping driver to campaign)

### Milestone 3: Admin Backoffice & Fraud Control
> **Goal:** Ops team can monitor incoming leads in real-time, export data, and rely on automated fraud rules.
*Branch:* `feature/admin-fraud-ops`
- [ ] Admin dashboard (Global lead list, search, filter, CSV export, audit log)
- [ ] Real-time notifications (Supabase Realtime, Resend email stub, Telegram Ops Bot)
- [ ] Fraud detection logic (scan velocity, device fingerprint, duplicate phone)
- [ ] IP & Device hashing implementation for Data Proclamation compliance

### Milestone 4: Client Value & Driver Compliance
> **Goal:** Advertisers can view their ROI dashboard, and drivers can check-in and report inventory via Telegram.
*Branch:* `feature/client-driver-portals`
- [ ] Advertiser Dashboard (Campaign stats, CPL, lead pipeline status updates, PDF report generation)
- [ ] Driver Telegram Bot (Daily photo check-ins, inventory reporting, compliance score)
- [ ] Inventory & Reward tracking (restock alerts, discrepancy flags)
- [ ] Driver Leaderboard

---

## Current Sprint — Milestone 1: `feature/lead-capture-otp`

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
  - Trigger: Placeholder for Realtime push & Email (implemented in M3)

### Integrations
- [ ] Africa's Talking SMS client (`src/lib/africas-talking.ts`)

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
| 2026-07-02 | Telegram bot for driver ops | Speed to pilot; native app after 3 paid campaigns + investment |
| 2026-07-09 | Supabase retained (not Neon) | Realtime + Auth + Storage are hard requirements; Neon covers none of them |
| 2026-07-09 | Milestone Restructuring | Shifted from 10-week chronological to 4 logical feature milestones to group related functionality (e.g., Campaign CRUD + Driver QR, Ops + Fraud). |
