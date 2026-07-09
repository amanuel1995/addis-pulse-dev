# AddisPulse Media — System Architecture
*Version: 1.0 | Updated: 2026-07-01*

---

## Architecture Decisions (ADRs)

### ADR-01: QR Code Scope — Per-Driver-Permanent
**Decision:** Each driver has ONE permanent QR code (`qr_token`). The URL `/d/[qr_token]` resolves to the driver's active campaign at scan time via `resolve_driver_campaign()`.

**Why:** Operationally simpler — no reprinting cards per campaign. Backend handles the routing logic cleanly via the `driver_campaign_assignments` table + `active` flag.

**Trade-off:** Fraud attribution is slightly more complex (same token, multiple campaigns over time). Mitigated by campaign-scoped duplicate detection and device fingerprint tracking.

### ADR-02: Single-Operator Model
**Decision:** Bluecore Software PLC is the sole operator. No self-service multi-tenancy in v1.

**Why:** Proposal explicitly states "One operator: Bluecore Software PLC at launch." Simplifies auth, RBAC, and data model significantly. Multi-tenant can be added in v2 by adding a `tenant_id` column to key tables.

### ADR-03: Phased Build — Foundation First, AddisPulse Layer Second
**Decision:** Build the SRS foundation (landing page, lead form, admin dashboard, RBAC) then layer in Campaign, Driver, OTP, fraud detection on top.

**Why:** Developer has a 6-8 week head start on the foundation. Avoid rework. The foundation is genuinely reusable.

### ADR-04: Bilingual Landing Pages — Amharic + English
**Decision:** All public-facing content is bilingual. `campaigns.landing_page_config` JSONB stores both `headline` (English) and `amharic_headline`, `offer_text` and `amharic_offer_text`.

**Why:** Conversion rate. Target zones include passengers who respond better in Amharic. Especially critical for healthcare and education campaigns.

### ADR-05: OTP via Africa's Talking SMS API
**Decision:** Africa's Talking as primary SMS provider for OTP and follow-up SMS.

**Why:** Established presence in Ethiopia. Clean REST API. Competitive ETH pricing. Easy to switch to Ethio Telecom bulk SMS later if volume justifies it.

### ADR-06: Two Telegram Bots
**Decision:** Two separate Telegram bots:
1. **Ops/Admin bot** — receives lead alert notifications (fixed receiver). Configured by super-admin. This is what the SRS described.
2. **Driver bot** — driver operations interface. Drivers use `/checkin`, `/inventory`, `/score`. Feeds `driver_compliance_records` and `inventory_records`.

**Why:** Completely different purposes, different audiences, different access levels. One bot for both would be a security and UX disaster.

---

## System Layers

```
┌─────────────────────────────────────────────────────────────────────┐
│                        PUBLIC LAYER                                 │
│  /d/[qr_token]          — Driver QR landing page (campaign-dynamic) │
│  /c/[identifier]        — Company profile page (SRS permanent QR)   │
│  /c/[identifier]/verify — OTP verification step                     │
└─────────────────────────────────────────────────────────────────────┘
                              ↓ Lead form submit
┌─────────────────────────────────────────────────────────────────────┐
│                        API LAYER (Next.js Route Handlers)           │
│  POST /api/v1/leads              — Submit lead (public, rate-limited)│
│  POST /api/v1/otp/send           — Trigger OTP SMS                  │
│  POST /api/v1/otp/verify         — Verify OTP code                  │
│  POST /api/v1/campaigns          — Create/manage campaigns (admin)   │
│  GET  /api/v1/campaigns/:id/stats — Campaign analytics              │
│  GET  /api/v1/drivers/leaderboard — Driver ranking                  │
│  POST /api/v1/telegram/driver    — Telegram driver bot webhook       │
│  POST /api/v1/telegram/ops       — Telegram ops bot webhook          │
└─────────────────────────────────────────────────────────────────────┘
                              ↓ Supabase service role
┌─────────────────────────────────────────────────────────────────────┐
│                        DATA LAYER (Supabase)                        │
│  PostgreSQL — 16 tables, full RLS, indexes, utility functions       │
│  Auth       — super_admin, admin, advertiser, company_rep roles     │
│  Realtime   — leads channel (→ admin + advertiser dashboards)       │
│  Storage    — driver check-in photos, company logos, QR PNGs        │
└─────────────────────────────────────────────────────────────────────┘
                              ↓ External integrations
┌─────────────────────────────────────────────────────────────────────┐
│                        INTEGRATIONS                                 │
│  Africa's Talking  — OTP SMS + follow-up SMS                        │
│  Resend            — Email notifications (lead alerts, reports)     │
│  Telegram Bot API  — (1) Ops lead alerts  (2) Driver operations     │
│  YouTube/Vimeo     — Campaign video embeds (no direct hosting)      │
│  Vercel            — Hosting, edge functions, env management        │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Route Map (Full Application)

### Public Routes
| Route | Purpose |
|-------|---------|
| `/` | AddisPulse platform homepage / redirect |
| `/d/[qr_token]` | **Driver QR landing page** — resolves to active campaign |
| `/d/[qr_token]/verify` | OTP entry screen |
| `/d/[qr_token]/thank-you` | Post-submission confirmation |
| `/d/[qr_token]/inactive` | Driver has no active campaign |
| `/c/[identifier]` | Company profile page (SRS permanent QR — still supported) |
| `/c/[identifier]/not-available` | Deactivated company fallback |

### Admin Routes (Bluecore ops team)
| Route | Purpose |
|-------|---------|
| `/login` | Admin + company rep + advertiser login |
| `/admin` | Dashboard summary |
| `/admin/campaigns` | Campaign list + create |
| `/admin/campaigns/[id]` | Campaign detail + analytics |
| `/admin/campaigns/[id]/drivers` | Driver assignment + leaderboard |
| `/admin/companies` | Advertiser/company management |
| `/admin/companies/[id]/qr` | QR code view + download |
| `/admin/leads` | Global lead list (search, filter, export) |
| `/admin/drivers` | Driver pool management |
| `/admin/drivers/[id]` | Driver profile + compliance history |
| `/admin/settings/receiver` | Fixed lead receiver config (super-admin) |
| `/admin/settings/telegram` | Telegram bot configuration |

### Advertiser Routes (client login)
| Route | Purpose |
|-------|---------|
| `/advertiser` | Campaign dashboard (their campaigns only) |
| `/advertiser/campaigns/[id]` | Campaign analytics + lead list |
| `/advertiser/campaigns/[id]/leads` | Lead pipeline + status updates |
| `/advertiser/campaigns/[id]/report` | Final campaign report view |

### API Routes
| Route | Method | Auth | Purpose |
|-------|--------|------|---------|
| `/api/v1/leads` | POST | Public | Lead form submission |
| `/api/v1/otp/send` | POST | Public | Send OTP to phone |
| `/api/v1/otp/verify` | POST | Public | Verify OTP |
| `/api/v1/campaigns` | GET/POST | Admin | Campaign CRUD |
| `/api/v1/campaigns/[id]/stats` | GET | Admin/Advertiser | Analytics |
| `/api/v1/drivers` | GET/POST | Admin | Driver management |
| `/api/v1/drivers/resolve/[token]` | GET | Server | QR token resolution |
| `/api/v1/exports/leads` | GET | Admin/Advertiser | CSV export |
| `/api/v1/telegram/driver` | POST | Webhook | Driver bot events |
| `/api/v1/telegram/ops` | POST | Webhook | Ops bot events |
| `/api/v1/notifications/retry` | POST | Admin | Retry failed notifications |

---

## Key Business Logic

### QR Scan → Campaign Resolution
```
1. Passenger scans /d/[qr_token]
2. Server calls resolve_driver_campaign(qr_token)
3. If driver has active campaign → load campaign landing page
4. If driver has no active campaign → redirect to /d/[qr_token]/inactive
5. Log landing_page_visits (driver_id, campaign_id, ip_hash)
```

### Lead Submission → OTP → Verified Lead
```
1. Passenger submits form on /d/[qr_token]
2. POST /api/v1/leads:
   a. Rate limit check (5/min per IP, 20/day per IP per company)
   b. Duplicate phone check via is_duplicate_lead(phone, campaign_id)
   c. Device fingerprint check
   d. Save lead (verification_status = 'submitted')
   e. Trigger POST /api/v1/otp/send
3. Africa's Talking sends 6-digit OTP SMS to passenger's phone
4. Passenger enters OTP on /d/[qr_token]/verify
5. POST /api/v1/otp/verify:
   a. Check OTP expiry (10 min window)
   b. Check attempt count (max 3)
   c. Compare code_hash
   d. Update lead: verification_status = 'otp_verified'
   e. Trigger lead notification (email + Telegram ops bot)
   f. Push via Supabase Realtime to admin + advertiser dashboards
6. Passenger sees /d/[qr_token]/thank-you with reward info
```

### Driver Telegram Bot Flow
```
Driver sends /start → bot registers telegram_user_id in drivers table
Driver sends /checkin + photo → photo stored in Supabase Storage
  → driver_compliance_records row created
  → if photo missing by 9am → compliance_flag = true
Driver sends /inventory 45 → inventory_records updated
Driver sends /score → bot replies: "12 verified leads | Score: 87/100 | Est. bonus: 1,450 ETB"
Campaign closes → admin runs bonus calculation → driver_bonuses populated
```

### Fraud Detection Logic
```
On every lead submission:
- Duplicate phone in same campaign → fraud_flags (duplicate_phone) + lead rejected
- Same device fingerprint in same campaign → fraud_flags (duplicate_device) + flagged
- Driver scan velocity > 3x campaign baseline → fraud_flags (velocity_anomaly) + admin alert
- Inventory reported < (scans × expected_per_passenger_ratio) → fraud_flags (inventory_mismatch)
Admin reviews fraud_flags dashboard → resolves or invalidates leads
```

---

## Environment Variables

```env
# App
NEXT_PUBLIC_APP_URL=https://app.addispulse.com

# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_JWT_SECRET=

# Email (Resend)
EMAIL_PROVIDER=resend
RESEND_API_KEY=
EMAIL_FROM=AddisPulse Leads <leads@addispulse.com>

# Telegram
TELEGRAM_OPS_BOT_TOKEN=        # Fixed-receiver lead alert bot
TELEGRAM_DRIVER_BOT_TOKEN=     # Driver operations bot
DEFAULT_OPS_TELEGRAM_CHAT_ID=  # Where lead alerts go

# SMS / OTP (Africa's Talking)
AT_API_KEY=
AT_USERNAME=
AT_SENDER_ID=AddisPulse

# Security
IP_HASH_SECRET=
DEVICE_FP_HASH_SECRET=
OTP_SECRET=                    # Additional entropy for OTP generation
RATE_LIMIT_SECRET=

# Feature flags
OTP_EXPIRY_MINUTES=10
OTP_MAX_ATTEMPTS=3
CSV_EXPORT_MAX_ROWS=50000
FRAUD_VELOCITY_THRESHOLD=3     # x times campaign baseline triggers fraud flag
```

---

## Build Timeline (10 weeks)

### Foundation Phase — 6 weeks (developer's current scope)
| Week | Focus |
|------|-------|
| 1 | Project setup, auth, Supabase connection, protected routes |
| 2 | Company profile CRUD, logo upload, QR generation |
| 3 | Public landing page (mobile-first, bilingual, video embed) |
| 4 | Lead form (validation, duplicate guard, rate limiting, thank-you) |
| 5 | Real-time notifications (Supabase Realtime, email, Telegram ops) |
| 6 | Admin dashboard (lead list, search, filter, CSV export, audit log) |

### AddisPulse Layer — 4 weeks
| Week | Focus |
|------|-------|
| 7 | Campaign CRUD + driver management + driver QR resolution (`/d/[token]`) |
| 8 | OTP flow (Africa's Talking integration) + fraud detection logic |
| 9 | Advertiser dashboard + lead pipeline + driver leaderboard |
| 10 | Telegram driver bot + compliance records + hardening + QA |

**Pilot-ready:** End of week 10.

