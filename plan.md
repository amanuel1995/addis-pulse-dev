# AddisPulse Media - Implementation Plan

*Last updated: 2026-07-21 | Maintained by: Antigravity (Bluecore engagement)*

> Source of truth for branch creation, sprint planning, and progress tracking.
> Cross-referenced with `docs/internal/architecture.md`, `docs/internal/addis_pulse_full_analysis.md`, and `docs/internal/schema_architecture_gap_analysis.md`.

---

## Milestone Breakdown

The original 10-week chronological plan is organized into 4 logical feature milestones. The priority is the end-to-end passenger pilot flow first, followed by the backend engine, backoffice operations, and finally client/driver portals.

Milestones are large logical groupings. A single milestone can and should be split into smaller feature branches and multiple pull requests.

### Milestone 1: Core Passenger Flow (MVP Foundation)

> Goal: A passenger can scan a QR, see a campaign, submit a lead, verify via OTP, and land on a thank-you page.

- [x] Project setup, auth, Supabase connection, DB schema, protected routes (`feature/supabase-vercel-foundation`)
- [x] CI/CD pipeline, Vercel deployments, Next.js proxy middleware, security headers
- [x] Public landing page shell, bilingual, ISR (`feature/nextjs-proxy-migration`)
- [x] v4 schema direction selected; architecture compatibility RPC added (`resolve_driver_campaign` backed by `qr_codes`)
- [x] Lead form + OTP flow (Africa's Talking) + thank-you + inactive screens (`feature/lead-otp-passenger-flow`)

### Milestone 2: Campaign & Driver Management (The Engine)

> Goal: Admins can create advertisers, configure campaigns with rewards, register drivers, and assign permanent QRs.

Branch: `feature/campaign-driver-mgmt`

- [ ] Advertiser / company profile CRUD and logo upload using Supabase Storage
- [ ] Campaign CRUD, localized campaign content, reward configuration, target zones, and budget
- [ ] Driver registration and permanent `qr_codes` generation (`qr_type = 'driver'`, `public_path` resolves to active campaign)
- [ ] Driver campaign assignments, with one active assignment per driver enforced by DB

### Milestone 3: Admin Backoffice & Fraud Control

> Goal: Ops team can monitor incoming leads in real time, export data, and rely on automated fraud/quality rules.

Branch: `feature/admin-fraud-ops`

- [ ] Admin dashboard: global lead list, search, filter, CSV export, audit log
- [ ] Real-time notifications using Supabase Realtime, `notification_jobs`, Resend email stub, and Telegram Ops Bot
- [ ] Fraud/quality logic using `lead_quality_decisions`, scan velocity, device fingerprint hash, and duplicate phone hash
- [ ] IP, phone, and device hashing implementation for Data Proclamation compliance

### Milestone 4: Client Value & Driver Compliance

> Goal: Advertisers can view ROI, and drivers can check in and report inventory via Telegram.

Branch: `feature/client-driver-portals`

- [ ] Advertiser dashboard: campaign stats, CPL, lead pipeline status updates, PDF report generation
- [ ] Driver Telegram Bot: daily photo check-ins, inventory reporting, compliance score
- [ ] Inventory and reward tracking: restock alerts, discrepancy flags, reward issuance/redemption
- [ ] Driver leaderboard

---

## Current Sprint - Milestone 1: `feature/lead-capture-otp`

> Goal: A passenger who scans a QR code can submit their name and phone, receive an OTP SMS via Africa's Talking, verify it, and land on a thank-you screen. No lead is counted as `otp_verified` without phone confirmation.

### UI Components

- [x] `LeadForm` client component (`src/components/lead/LeadForm.tsx`)
  - Fields: name and phone required; email and interest type optional
  - Localized campaign copy pulled from `campaign_content`, with bilingual form-label fallbacks
  - Client-side Ethiopian phone validation (`^(09|07)\d{8}$`)
  - On submit: `POST /api/v1/leads`
- [x] `/d/[qr_token]/verify` page with `OTPForm` component
  - 6-digit code entry
  - Resend link
  - Expired and exhausted-attempt states
- [x] `/d/[qr_token]/thank-you` page
  - Reward info
  - Campaign/company branding
  - Feedback handoff placeholder for v4 `lead_feedback`
- [x] `/d/[qr_token]/inactive` page
  - Driver QR exists but no active campaign is available

### API Routes

- [x] `POST /api/v1/leads`
  - Normalize Ethiopian phone input to E.164 before persistence
  - Salt/hash phone, IP, and device fingerprint server-side
  - Never store raw IP or raw fingerprint
  - Accept a client-generated `idempotency_key` that remains stable across retries
  - Include `consent_given` and `privacy_notice_version`
  - Call v4 service-role RPC: `submit_lead_server(...)`
  - Return lead id and next verification route
- [x] `POST /api/v1/otp/send`
  - Generate 6-digit OTP server-side
  - Call v4 service-role RPC: `create_otp_challenge_server(lead_id, otp, ttl_seconds)`
  - Send OTP through Africa's Talking
  - Update OTP delivery state through `otp_delivery_attempts`
- [x] `POST /api/v1/otp/verify`
  - Call v4 service-role RPC: `verify_otp_server(lead_id, otp)`
  - On success, DB updates `leads.verification_status = 'otp_verified'`
  - DB hooks create downstream notification/reward jobs where configured

### Integrations

- [x] Africa's Talking SMS provider (`src/lib/otp/provider.ts`)
- [x] Server-side hashing helpers for phone, IP, and device fingerprint
- [x] Service-role Supabase server client used only inside trusted API routes

### Database And Seed Data

- [x] Decide active migration path:
  - Fresh dev path: v4 replaces the old initial migration.
  - Existing data path: convert v4 into incremental migrations.
- [x] Seed one active company
- [x] Seed one active campaign
- [x] Seed one campaign content row, at least English; Amharic optional for sprint test
- [x] Seed one active driver
- [x] Seed one active driver QR row in `qr_codes`
- [x] Seed one active driver campaign assignment
- [x] Confirm `/d/[qr_token]` resolves through `resolve_driver_campaign`

### Security Checklist

- [x] No raw IPs or fingerprints stored, only salted hashes
- [x] No plaintext OTP stored, only bcrypt-style `code_hash`
- [x] Lead submission requires consent and `privacy_notice_version`
- [x] `SUPABASE_SERVICE_ROLE_KEY` used only inside trusted server-only routes and components
- [x] v4 RLS and grants reviewed before production
- [x] pgTAP coverage added for RLS and service-role RPC grants

### Definition Of Done

- [x] `npm run build` passes with zero TypeScript or SSR errors
- [x] Full flow implemented end to end: scan -> form -> OTP SMS -> verify -> `otp_verified` in DB
- [x] Invalid, expired, and exhausted OTP states show user-facing errors
- [x] Inactive or invalid driver token routes to the correct unavailable/not-found state
- [ ] Draft PR opened against `main`

---

## Decisions Log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-07-02 | QR per-driver permanent | No reprinting per campaign; `resolve_driver_campaign()` handles architecture-compatible routing. |
| 2026-07-02 | Single-operator MVP: Bluecore only | Avoids unnecessary self-service multi-tenant complexity while keeping a `company_id` path for growth. |
| 2026-07-02 | Africa's Talking for OTP SMS | Ethiopia market presence, clean REST API, easy to swap for Ethio Telecom later. |
| 2026-07-02 | Telegram bot for driver ops | Fast pilot operations; native driver app can wait until after validated paid campaigns. |
| 2026-07-09 | Supabase retained, not Neon | Realtime, Auth, and Storage are hard requirements; Neon does not cover the whole platform need. |
| 2026-07-09 | Milestone restructuring | Shifted from 10-week chronological plan to 4 logical feature milestones. |
| 2026-07-10 | v4 schema direction selected | Use the enterprise v4 schema as the target direction; keep `qr_codes` model and add `resolve_driver_campaign()` compatibility for architecture/app alignment. |
