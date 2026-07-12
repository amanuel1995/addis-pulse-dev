# AddisPulse Schema and Architecture Gap Analysis

Reviewed files:

- `docs/internal/architecture.md`
- `docs/internal/schema.sql`
- `supabase/migrations/20260702000000_initial_schema.sql`
- `supabase/migrations/0001_addispulse_enterprise_final_v4.sql`
- `src/app/d/[qr_token]/page.tsx`

## Executive Summary

`0001_addispulse_enterprise_final_v4.sql` is materially stronger than the older schema from a privacy, RLS, workflow, and auditability perspective. It should be treated as the intended future database foundation.

It is not currently safe to apply as-is in this repository because it conflicts with the older initial migration and with the current app route/API contract. The migration itself states it is a fresh-project initial migration, not an in-place upgrade, so it must either replace the old initial migration in a reset/squashed migration path or be rewritten as a true incremental migration.

## Critical Findings

### 1. Two Competing Initial Schemas

The repository currently has both:

- `supabase/migrations/20260702000000_initial_schema.sql`
- `supabase/migrations/0001_addispulse_enterprise_final_v4.sql`

Both define foundational types and tables such as campaign enums, companies, profiles, campaigns, drivers, leads, OTP, fraud, and notifications. Applying both to the same database will fail with duplicate type/table errors or create an inconsistent migration history.

Required decision:

- For a fresh development database, keep `0001_addispulse_enterprise_final_v4.sql` as the canonical initial migration and remove/archive the old initial migration from the active migration folder.
- For an existing database, do not run v4 directly. Write a proper migration that renames/transforms old tables and columns, migrates data, and only then drops obsolete objects.

### 2. Current App Route Expects the Old RPC Contract

The current route `src/app/d/[qr_token]/page.tsx` calls:

```ts
supabase.rpc('resolve_driver_campaign', { p_qr_token: qr_token })
```

The v4 migration does not define `resolve_driver_campaign`. It replaces the public page lookup with:

```sql
public.get_public_landing_page(p_public_path text, p_locale text default 'en')
```

So the current `/d/[qr_token]` page will fail after applying v4 unless it is updated to call `get_public_landing_page`.

### 3. QR Token Model Changed

The architecture and older schema describe `drivers.qr_token`.

The v4 migration removes `drivers.qr_token` and models QR identity through `public.qr_codes`:

- `qr_codes.qr_type`
- `qr_codes.driver_id`
- `qr_codes.token`
- `qr_codes.public_path`

This is a better long-term model because it supports both company and driver QR codes consistently, but the architecture document must be updated. The route parameter should represent `qr_codes.public_path` or a token-derived public path, not `drivers.qr_token`.

### 4. Column Name Contract Changed

The older schema and current app refer to fields like:

- `companies.logo_url`
- `campaigns.advertiser_id`
- `drivers.phone`
- `leads.phone`
- `inventory_records`
- `notification_logs`
- `lead_receivers`

The v4 migration uses:

- `companies.logo_path`
- `campaigns.company_id`
- `drivers.phone_e164` and `drivers.phone_hash`
- `leads.phone_e164` and `leads.phone_hash`
- `inventory_movements`
- `notification_jobs` and `notification_attempts`
- `company_receiver_settings` and `notification_destinations`

This is an intentional enterprise redesign, but it is a breaking change for the app and for `docs/internal/architecture.md`.

### 5. v4 Requires Server-Only Lead/OTP Flows

The old architecture describes public endpoints such as `/api/v1/leads`, `/api/v1/otp/send`, and `/api/v1/otp/verify`.

The v4 migration expects trusted server routes to call these server-only RPCs:

- `submit_lead_server`
- `create_otp_challenge_server`
- `verify_otp_server`
- `submit_lead_feedback_server`

Those RPCs require hashed phone/IP inputs, consent fields, idempotency keys, and service-role execution. The app workflow needs to be updated to match this contract before v4 can be used safely.

## Architectural Optimizations

### Public Landing Page

Update architecture from:

```text
/d/[qr_token] -> resolve_driver_campaign(qr_token)
```

to:

```text
/d/[public_path] -> get_public_landing_page(public_path, locale)
```

The returned JSON should drive company, campaign, content, services, and unavailable-state rendering.

### Bilingual Content

The older architecture stores bilingual content inside `campaigns.landing_page_config`.

v4 introduces `campaign_content` with one row per locale. That is the better model because it supports versioning, content review, and feedback attribution. The architecture should describe `campaign_content`, not hard-code Amharic fields inside JSONB.

### Notification Workflow

The older schema has a simple `notification_logs` table. v4 correctly separates configured destinations, notification jobs, and notification attempts.

Architecture should document:

- `company_receiver_settings`
- `notification_destinations`
- `notification_jobs`
- `notification_attempts`
- background worker behavior and dead-letter handling

### Lead Quality and Rewards

v4 adds `lead_quality_decisions`, `reward_issuances`, and `lead_feedback`, which are missing from the older architecture. These are important business workflow entities and should be added to the system flow.

## What They Got Right

- v4 improves PII handling by separating E.164 phone values from `phone_hash`.
- v4 uses idempotency keys for lead and feedback submission.
- v4 adds rate-limit style protections in `submit_lead_server`.
- v4 enforces one active campaign per driver at the database level.
- v4 uses service-role-only RPCs for sensitive public writes.
- v4 separates notification configuration from notification delivery attempts.
- v4 has a stronger membership/permission model than the old single `profiles.company_id` approach.

## Recommended Canonical Direction

Use `0001_addispulse_enterprise_final_v4.sql` as the target schema, but only after choosing one of these paths:

1. Fresh reset path:
   - Remove/archive `20260702000000_initial_schema.sql` from active migrations.
   - Keep v4 as the only initial schema.
   - Update app code and architecture docs to v4 names and RPCs.
   - Reset the local/dev Supabase database.

2. Existing database path:
   - Keep the old migration history.
   - Convert v4 into incremental migrations.
   - Include table renames, column migrations, backfill scripts, and compatibility views/functions during rollout.

The fresh reset path is simpler and cleaner if there is no production data to preserve.
