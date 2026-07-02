# AddisPulse Media

AddisPulse Media is a smart mobility advertising platform that bridges offline and online experiences through QR-enabled campaigns in Addis Ababa. Passengers scan QR codes inside ride-share vehicles to access dynamic, campaign-specific landing pages and claim rewards via an OTP-verified lead capture system.

## 🚀 Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS + shadcn/ui
- **Database & Auth:** Supabase (PostgreSQL, Auth, Realtime, Storage)
- **Email:** Resend
- **SMS / OTP:** Africa's Talking
- **Bot Integrations:** Telegram Bot API (Ops & Driver Operations)

## 📁 Architecture Overview

- **Foundation Layer:** Supabase DB schema (`supabase/migrations/`) handles RBAC, company profiles, and permanent QR routing.
- **Campaign Layer:** Dynamic mapping of permanent driver QR tokens (`/d/[qr_token]`) to active advertiser campaigns.
- **Lead Capture:** High-conversion, bilingual (Amharic/English) landing pages with Africa's Talking SMS OTP verification.
- **Fraud Prevention:** Multi-layer fraud detection (device fingerprinting, IP hashing, duplicate checking, and scan velocity monitoring).

## 🛠 Local Setup

### 1. Prerequisites
- Node.js (v18+)
- npm
- Supabase account (or local Supabase CLI)

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Variables
Copy the example environment file and fill in your credentials:
```bash
cp .env.example .env.local
```
*(Ensure `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are populated at a minimum).*

### 4. Database Setup
Execute the migration file located at `supabase/migrations/20260702000000_initial_schema.sql` against your Supabase project's SQL editor to generate the 16 tables, custom enum types, utility functions, and Row-Level Security (RLS) policies.

### 5. Run the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## 🗄 Project Structure
- `/src/app` - Next.js App Router pages and API routes.
- `/src/lib/supabase` - Supabase SSR client utilities and session middleware.
- `/src/components` - Reusable UI components (shadcn/ui).
- `/supabase/migrations` - PostgreSQL schema migrations.

## 📄 License
Private and Confidential — Bluecore Software PLC
