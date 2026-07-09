# Developer Guide Review — AddisPulse_qr_work_flow_updated.pdf
*Reviewed: 2026-07-01 | Document date: 29 June 2026 | Status: Developer-ready planning guide*

---

## 0. First Finding: The "Updated" Doc Is Identical to the Original

A byte-level text diff of `AddisPulse_qr_work_flow.pdf` (Downloads) vs `AddisPulse_qr_work_flow_updated.pdf` (Downloads/BlueCore) shows:

- Both: **28,799 characters**, **13 pages**, **same structure, same content, zero lines different**

**What this means:** Either the developer renamed the file without making changes, or the update exists in formatting/layout (PDF metadata, visuals) but not in text content. The substance is identical. This review therefore covers both documents.

**Action required from developer:** Confirm whether a substantive revision was intended. If so, it has not been delivered.

---

## 1. What This Document Is

This is a **Developer Implementation Guide** — a companion to the SRS (v2.1). It translates the SRS into:

- A build roadmap (who builds what, in what order)
- The recommended IT/architecture structure
- A database schema proposal
- Git flow and PR discipline rules
- Skills requirements for the development team
- Hosting cost estimates with ETB conversion
- A launch checklist and handover package

**This is not a revised SRS.** It does not change or extend the requirements. It tells the developer *how* to build what the SRS specifies.

**Quality verdict on what it is:** For the scope it targets, it is a well-structured, practical, and senior-level document. If you were building the generic QR company-profile system the SRS describes, this guide would serve the developer well.

---

## 2. What Is Good — Genuinely Strong Work

### 2.1 Build Sequencing Is Correct
The 9-step build plan (Section 7) follows the right dependency order:

```
1. Project setup + auth shell
2. Auth and dashboards
3. Company profile + QR
4. Public landing page
5. Lead capture
6. Realtime + notifications
7. Admin lead operations
8. Hardening + QA
9. Launch
```

This is the correct order. Lead path first (QR → page → form → save → notify), hardening last. Reversing steps 5 and 6 is a common junior mistake; the guide avoids it.

### 2.2 The "Fixed Lead Receiver" Architecture Is Well-Understood
The separation between replaceable company content and the locked lead receiver is correctly modelled:
- `lead_receivers` is a separate table from `companies`
- Super-admin only, never editable from the company profile screen
- Enforced at both RLS and API layer — not just hidden in the UI
- The guide explicitly calls out: *"hiding buttons in the UI is not security"*

This is correct thinking and the developer shows they understand the constraint.

### 2.3 Database Schema Is Sensible for the SRS Scope
The proposed tables cover the SRS requirements cleanly:

| Table | Assessment |
|-------|-----------|
| `companies` | Correct. `identifier` is immutable. |
| `lead_receivers` | Correct. Separated from companies, super-admin controlled. |
| `leads` | Correct fields. `ip_hash` instead of raw IP — good privacy practice. |
| `qr_codes` | Correct. Notes that URL must remain permanent even if image is regenerated. |
| `profiles/users` | Correct. Three roles: `super_admin`, `admin`, `company_rep`. |
| `notification_logs` | Correct. Tracks retry state and failure flag. |
| `audit_logs` | Correct. Covers the SRS audit requirements. |
| `landing_page_visits` | Correctly flagged as optional in v1. |

### 2.4 Git Flow Is Appropriate
The branch model (`main` → `develop` → `feature/*`, `fix/*`, `release/*`, `hotfix/*`) is a standard, sensible Git flow for a small team. Commit style using conventional commits (`feat:`, `fix:`, `security:`, `chore:`, `docs:`) is the right call. Prevents the "added stuff" commit message problem common with junior developers.

### 2.5 Hosting Cost Estimates Are Realistic and in ETB
The document provides cost tiers in both USD and ETB (at 161 ETB/USD planning rate):

| Tier | USD/month | ETB/month | When to use |
|------|-----------|-----------|-------------|
| Developer/Pilot | $0–10 | 0–1,610 | Internal demo, learning |
| Professional MVP | $45–65 | 7,245–10,465 | First real client, pilot |
| Growing Production | $80–180 | 12,880–28,980 | Many companies, more leads |
| Enterprise | $200+ | 32,200+ | SLA, heavy realtime, large data |

The recommendation to use Vercel Pro ($20) + Supabase Pro ($25) + Resend for the first real client is correct. The "cheap hosting is expensive when a real lead disappears" line is good senior advice.

### 2.6 Skills Matrix Is Honest and Complete
Section 10 lists what the developer must know with a "why it matters" column. The ordering in Section 10.1 (build → connect → form → notify → auth → QR/export/realtime → harden) is a practical junior-to-production learning path. The inclusion of OWASP ZAP, k6, and Playwright as testing tools shows the guide was written by someone with production experience, not just tutorial experience.

---

## 3. The Core Problem — This Document Is Built on the Wrong Foundation

Everything above is correct **for the system described in the SRS**. The problem — which we identified in our gap analysis — is that the SRS itself does not describe AddisPulse's actual business requirements.

The developer is building the right thing for the wrong brief.

### What the developer is building:
> "A reusable QR lead generation platform where each company has its own configurable public landing page, permanent QR link, replaceable profile content, and lead capture form."

### What AddisPulse actually needs:
> "A campaign management platform where time-bounded campaigns are assigned to specific drivers (each with a unique QR), passenger leads are OTP-verified, driver compliance is tracked via Telegram, fraud is detected at the driver level, and advertisers get a campaign-scoped analytics dashboard."

These are two different products. The developer guide faithfully implements Product A. AddisPulse needs Product B. The guide cannot be fixed without first fixing the SRS.

---

## 4. Specific Gaps Inherited from the SRS (Now Visible in the Guide)

### 4.1 No Driver Entity Anywhere
The entire document — 13 pages — contains zero mentions of:
- Driver
- Vehicle
- Campaign
- OTP / verification
- Fraud detection
- Inventory / rewards
- Compliance score
- Leaderboard
- Telegram bot (mentioned as "optional notification channel" only — not as a driver operations interface)

This confirms GAP-01 through GAP-07 from our SRS analysis. The developer has faithfully implemented the SRS. The SRS is the problem.

### 4.2 The "Company" Concept Is Architecturally Wrong for AddisPulse

In the guide, a "company" = an advertiser with a permanent QR page. In AddisPulse's reality:
- One advertiser may run multiple campaigns over time
- Each campaign uses 20 different driver QR codes
- The QR must be campaign-scoped, not company-permanent
- The same vehicle fleet runs different advertisers' campaigns in sequence

The guide's route structure (`/c/[identifier]`) is a permanent URL for a permanent company. AddisPulse needs something like `/campaign/[campaign_id]/driver/[driver_token]` — or at minimum, a campaign-context lookup behind a stable URL.

### 4.3 Lead Status in MVP Exclude List Conflicts with Business Requirements

The guide explicitly puts "Full CRM pipeline beyond basic lead status" in the **MVP should exclude** list.

This directly conflicts with the business proposal's Section 6 which lists lead status (`new | contacted | appointment set | converted | rejected`) as a **minimum dashboard metric** — not a future feature.

The developer is correctly following the SRS. The SRS is wrong on this point (our GAP-08).

### 4.4 Notification Architecture Misses the Primary Business Value

The guide treats Telegram as an optional secondary notification channel (for the system admin). In AddisPulse's world, Telegram is the **primary driver operations interface** — where drivers check in, report inventory, see their scores, and receive compliance alerts.

These are two completely different uses of Telegram:
- **Guide's Telegram use:** Admin gets a notification when a lead arrives (secondary to email)
- **AddisPulse's Telegram need:** Drivers use a bot for daily operations workflow

Both are needed, but the guide specs only the first.

---

## 5. New Findings Specific to This Document

### 5.1 shadcn/ui Added to Stack (Good Decision)
The guide adds `shadcn/ui` style components to the stack (Section 4, UI layer), which wasn't in the SRS. This is a good call — shadcn/ui provides accessible, composable components that work well with Tailwind and Next.js. It will speed up dashboard development significantly. **No objection — keep it.**

### 5.2 Resend Replaces Generic SMTP as Recommended Email Provider
The guide recommends **Resend** (resend.com) specifically, rather than the SRS's generic "SendGrid, Mailgun, or AWS SES." Resend has excellent Next.js integration, a generous free tier (3,000 emails/month), and clean developer experience. **Good choice for MVP.**

### 5.3 `destination_hash` in notification_logs Is a Privacy Win
The notification log stores `destination_hash` instead of the raw receiver email/Telegram ID. This is good privacy practice — even the notification log doesn't expose the receiver's contact in plaintext. **Keep this.**

### 5.4 Environment Variable List Is Practical and Complete
The `.env` variable list (Section 4.2) is well-considered:
- `IP_HASH_SECRET` — for salted IP anonymisation (privacy-correct)
- `RATE_LIMIT_SECRET` — for signed rate-limit tokens
- `CSV_EXPORT_MAX_ROWS=50000` — a sensible configurable cap
- `DEFAULT_TELEGRAM_CHAT_ID` — correct for the fixed-receiver Telegram use

**Missing from the env list** (for AddisPulse's actual needs): SMS API key (Africa's Talking), OTP expiry config, driver bot token (separate from fixed-receiver bot token), campaign configuration variables.

### 5.5 Build Timeline: 38–48 Days Total
Adding up all phase estimates:
- Setup: 1–2 days
- Auth/dashboards: 3–5 days
- Company profile + QR: 4–6 days
- Landing page: 4–6 days
- Lead capture: 5–7 days
- Realtime + notifications: 5–7 days
- Admin operations: 4–6 days
- Hardening + QA: 5–8 days
- Launch: 2–3 days

**Total: ~33–50 days for a solo developer.** This is a reasonable estimate for the system described. For AddisPulse's actual system (with campaign management, driver attribution, OTP, fraud detection, Telegram bot), add another **20–30 days minimum**.

---

## 6. Verdict and Recommended Actions

### On the Document Itself

| Dimension | Rating | Comment |
|-----------|--------|---------|
| Technical correctness | ✅ Strong | Architecture, Git flow, database schema, testing approach all correct |
| Build sequencing | ✅ Strong | Right order, right priorities |
| Hosting guidance | ✅ Good | Realistic costs, good ETB conversion, practical tier advice |
| Alignment with SRS | ✅ Faithful | Correctly implements the SRS as written |
| **Alignment with AddisPulse business needs** | ❌ Misaligned | Correctly implements the wrong brief |
| "Updated" vs original | ⚠️ Identical | No text changes detected — confirm intent |

### Recommended Path Forward

**Option A — Phased approach (recommended):**
1. Build the system exactly as the guide specifies (the "company profile + lead capture" layer)
2. Treat it as the **AddisPulse platform foundation** — it handles: landing pages, lead form, real-time delivery, admin dashboard, RBAC, notifications
3. Layer the AddisPulse-specific modules on top: Campaign entity, Driver entity, OTP verification, fraud detection, Telegram bot, driver dashboard
4. Timeline: Foundation ~6 weeks → AddisPulse layer ~4 additional weeks → total ~10 weeks

**Option B — Revise SRS first, then guide:**
1. Update SRS to include the missing entities (Campaign, Driver, DriverCampaignAssignment, OTPVerification, FraudAudit, Reward/Inventory)
2. Revise the developer guide to reflect the new data model and routes
3. Then build

**Recommendation: Option A.** The foundation the developer is building is genuinely useful and reusable. The AddisPulse-specific layer can be built incrementally on top. Starting over with a full SRS rewrite delays the pilot unnecessarily.

---

## 7. Updated Saved Preferences

| Preference | Update |
|-----------|--------|
| UI component library | Add shadcn/ui to accepted stack (developer guide decision) |
| Email provider | Resend confirmed as preferred (over generic SMTP) |
| Build approach | Option A: build foundation first, layer AddisPulse-specific on top |
| Developer guide | Well-written technically; misaligned with actual business brief |
| "Updated" PDF | Identical to original — no substantive changes — confirm with developer |

---

*End of developer guide review — 2026-07-01*
