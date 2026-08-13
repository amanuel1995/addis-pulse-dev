# AddisPulse Media

AddisPulse Media is a QR-enabled mobility advertising platform for Addis Ababa. Milestone 1 connects a permanent driver QR to an active campaign, captures a consented passenger lead, verifies the phone through OTP, presents the reward state, and shows company-scoped lead activity in a protected advertiser dashboard.

## Release-candidate scope

The current release candidate is `feature/m1-release-candidate`, based on `feature/lead-otp-production` with the useful presentation work from `feature/passenger-ui-redesign` reconciled on top.

Implemented Milestone 1 workflow:

```text
QR scan → active campaign → lead form → OTP → verified lead
→ thank-you/reward → protected realtime advertiser dashboard
```

This does not include full campaign management, fraud operations, inventory, reporting, the driver portal, or the complete advertiser portal.

## Stack

- Next.js 16.2.10 App Router and React 19
- TypeScript 5.9
- Supabase PostgreSQL, Auth, Storage, and Realtime
- Africa's Talking for controlled OTP delivery
- Tailwind CSS and shadcn/ui foundations
- Vercel Preview for the Next.js frontend and route handlers

## Database migrations

The merged foundation is:

```text
supabase/migrations/0001_addispulse_enterprise_final_v4.sql
```

It must not be rewritten after application. Every subsequent schema or policy adjustment belongs in a new timestamped incremental migration under `supabase/migrations/`.

## Local setup

Prerequisites: Node.js 20 or 22, npm, Docker Desktop, and the Supabase CLI.

```powershell
npm ci
npx supabase start
npx supabase db reset
npm run dev
```

Useful local routes:

```text
Passenger:            http://127.0.0.1:3000/d/fake-alpha-driver-1
Advertiser sign-in:   http://127.0.0.1:3000/advertiser/login
Advertiser dashboard: http://127.0.0.1:3000/advertiser/dashboard
```

The deterministic credentials in `supabase/seed.sql` are fictitious and local-development-only. Never reuse them in staging or production.

For safe local OTP testing, explicitly set `OTP_PROVIDER=fake_local` and `OTP_FAKE_CODE` in the local process. `fake_local` is rejected in production. Automated tests do not call Africa's Talking.

## Validation

```powershell
npm run lint
npm run typecheck
npm run test
npx supabase test db
npm run build
```

Staging validation is intentionally guarded:

```powershell
npm run staging:fixtures:up
npm run test:staging
npm run staging:fixtures:down
```

Before those commands can run, every staging safety variable documented in [docs/staging-passenger-validation.md](docs/staging-passenger-validation.md) must be present. Staging and production project references must differ.

See [docs/m1-release-candidate-smoke-test.md](docs/m1-release-candidate-smoke-test.md) for the complete pilot checklist.

## Preview architecture

```text
Browser
  → Vercel Preview: Next.js pages and API route handlers
  → staging Supabase: PostgreSQL, Auth, Storage, and Realtime
  → Africa's Talking: one controlled manual staging SMS check only
```

Configure the exact Vercel Preview URL in Supabase Auth allowed redirect/site URLs when an auth flow requires callbacks. Password sign-in for the pilot dashboard does not create an external callback. Preview variables must reference staging Supabase, never production.

Private and confidential — Bluecore Software PLC.
