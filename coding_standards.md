# AddisPulse Media — Engineering Playbook & Coding Standards

*Version: 1.1 | Updated: 2026-07-02*

This document serves as the single source of truth for the AddisPulse engineering team (CTO, Architects, Developers, and DevSecOps). It defines our architectural principles, strict coding conventions, and automated workflows to ensure a secure, high-performance, and scalable mobility advertising platform.

---

## 1. Engineering Vision & Core Principles (For CTO & Architects)

*   **Business-First Execution:** Code exists to solve business problems. Every feature must directly map to an advertiser requirement (e.g., verifying leads) or an operational need (e.g., driver check-ins).
*   **Low-Bandwidth Resilience:** Addis Ababa's mobile networks can fluctuate. The architecture must prioritize Time to First Byte (TTFB). We aggressively cache static assets and combine database queries to minimize network round-trips.
*   **Data Residency & Privacy compliance:** Ethiopia's Data Protection Proclamation No. 1321/2024 requires strict PII handling. We do not store raw IP addresses or raw device fingerprints; we store salted hashes for fraud detection.
*   **Single-Operator V1:** The platform is currently operated solely by Bluecore Software PLC. Avoid premature abstractions for multi-tenancy, but keep foreign keys (`company_id`, `campaign_id`) strict so we can easily add a `tenant_id` in Phase 2.

---

## 2. Git & Branching Workflow (For the Whole Team)

We follow a strict, Trunk-Based Development hybrid model augmented by AI peer review. `main` is sacred and always represents production-ready code.

### Branch Naming Conventions
Always use all-lowercase, kebab-case formatting:
*   **Features:** `feature/[scope]-[brief-description]` (e.g., `feature/lead-capture-form`, `feature/driver-telegram-bot`)
*   **Bug Fixes:** `bugfix/[scope]-[issue]` (e.g., `bugfix/otp-rate-limit`, `bugfix/safari-ui-glitch`)
*   **Hotfixes (Prod issues):** `hotfix/[issue]` (e.g., `hotfix/db-connection-pool`)
*   **Documentation/Setup:** `docs/...` or `chore/...`

### The Pull Request (PR) Lifecycle
1.  **Develop:** Commit atomic, logical changes locally to your feature branch.
2.  **Draft PR:** Push to remote and immediately open a Draft PR against `main`.
3.  **AI Code Review:** Invoke the AI Code Review Subagent to perform a static analysis of the branch against these standards (checking RLS, Next.js caching, etc.).
4.  **Human Review:** Once the AI passes the code, request a review from a Lead Developer/Architect.
5.  **Merge:** Squash and merge into `main`. Delete the feature branch.

---

## 3. Frontend & Next.js Guidelines (For Developers)

We utilize Next.js 14+ (App Router), TypeScript, Tailwind CSS, and shadcn/ui.

### Server vs. Client Components
*   **Default to Server:** Every component is a Server Component (`.tsx`) by default.
*   **Opt-in to Client:** Only add `"use client"` when you absolutely need React hooks (`useState`, `useEffect`), browser APIs, or interactive event listeners (like the Lead Form submission). Push the `"use client"` boundary as far down the component tree as possible.

### Data Fetching & Caching
*   **Avoid `force-dynamic` on Public Routes:** Taxi QR scans happen in bursts. Hitting the database on every single scan risks bottlenecking. Prefer ISR (`export const revalidate = 60`) or `unstable_cache` for public campaign landing pages.
*   **Dead States & SEO:** Never return a generic `200 OK` React component for an invalid or suspended QR code. Always call Next.js `notFound()` to correctly return a `404` status, preventing search engines from indexing dead routes.

### UI & Styling
*   **Mobile-First:** 99% of passengers scan QR codes via smartphones. Design for `xs` and `sm` breakpoints first.
*   **Bilingual Default:** Do not hardcode English. All passenger-facing UI must pull both Amharic and English strings dynamically from the database (`landing_page_config`).
*   **Styling:** Strictly use Tailwind utility classes and `shadcn/ui` components. Avoid writing custom CSS in `globals.css` unless defining core brand CSS variables.

---

## 4. Backend & Database Guidelines (For Developers & Architects)

We use Supabase (PostgreSQL). The database is our central source of truth and business logic engine.

### Query Optimization & TTFB
*   **Eliminate Network Waterfalls:** Do not perform a `.select()` query, await the result, and then fire a second `.select()` query based on the first.
*   **Leverage RPCs:** Combine complex relational logic into PostgreSQL functions (RPCs). For example, `resolve_driver_campaign` joins the driver, assignment, campaign, and company tables in a single database execution, returning the exact payload the Next.js frontend needs in one network round-trip.

### Type Safety
*   Never use `any`.
*   When calling Supabase `.rpc()`, explicitly typecast the return payload (or generate types via the Supabase CLI) so TypeScript can catch missing properties at compile time.

---

## 5. Security & DevSecOps (For DevSecOps)

Security is shifted left. A PR will be rejected immediately if it violates these rules.

### Row Level Security (RLS)
*   **Mandatory Enablement:** Every single table created in the `public` schema MUST have `ALTER TABLE [table_name] ENABLE ROW LEVEL SECURITY;` explicitly applied.
*   **Explicit Policies:** Do not rely on implicit bounds. Write explicit `CREATE POLICY` statements for `anon` (public, unauthenticated traffic) and `authenticated` (admin/advertiser) roles.
*   **Server-Side Bypasses:** Only use the `SUPABASE_SERVICE_ROLE_KEY` in secure, server-side API routes (e.g., `POST /api/v1/leads`) where you intentionally need to bypass RLS to insert a record.

### Secrets Management
*   **No Commits:** `.env.local` is strictly ignored by Git. Never commit API keys.
*   **Variable Prefixing:** Only prefix variables with `NEXT_PUBLIC_` if they are 100% safe to be exposed to the browser (e.g., `NEXT_PUBLIC_SUPABASE_URL`). Everything else (OTP secrets, Telegram tokens) must remain server-side only.
