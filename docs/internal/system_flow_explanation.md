# AddisPulse Media — System Flow & Architecture Explanation

*Version: 1.0 | Updated: 2026-07-02*
*Note: This document explains the core business flow mapping to the technical architecture.*

## The Core Problem Being Solved
Advertisers in Addis Ababa (real estate, clinics, education) struggle to get *verified, high-intent* leads. Meanwhile, ride-share passengers sit idle for 30–60 minutes in traffic. AddisPulse connects the two by offering passengers an immediate incentive (like a free water or discount) in exchange for their contact details, right from the back seat.

Here is how the tech stack maps directly to that physical journey:

---

### 1. The Physical Layer & Routing Engine (The Scan)
**Goal:** Zero operational friction for drivers. We cannot reprint physical QR stickers every time a campaign ends.

* **How it works:** Each driver gets **one permanent QR code** (e.g., `addispulse.com/d/XYZ-123`). 
* **The Tech:** When a passenger scans it, they hit the Next.js dynamic route `app/d/[qr_token]`. The server instantly calls a Supabase PostgreSQL function (`resolve_driver_campaign`). It checks the database to see: *"Which campaign is driver XYZ-123 assigned to today?"*
* **The Result:** The passenger is seamlessly routed to the correct, branded landing page (e.g., Sunshine Real Estate), dynamically loading the client's logo, colors, and bilingual (Amharic/English) copy.

### 2. The Conversion Layer (The OTP System)
**Goal:** Guarantee 100% verified leads to the advertiser so they aren't paying for spam or fake numbers.

* **How it works:** The passenger reads the offer and submits their name and phone number.
* **The Tech:** The Next.js API securely generates an OTP, hashes it in the Supabase database (so we never store plaintext codes), and triggers **Africa's Talking SMS API** to text the passenger a 6-digit code. 
* **The Result:** The passenger inputs the code on their screen. Only then does the system mark the lead as `otp_verified`. The passenger gets their reward confirmation on screen.

### 3. The Real-Time Value Layer (The Handoff)
**Goal:** Strike while the iron is hot. Leads called within 5 minutes convert exponentially higher.

* **How it works:** The exact millisecond a lead is OTP-verified, two things happen automatically.
* **The Tech:** 
  1. **Supabase Realtime** pushes the lead live to the Advertiser's web dashboard.
  2. The **Ops Telegram Bot** pings the Bluecore dispatch team with the lead details so they can initiate an immediate follow-up call if the client requested it.

### 4. The Operations & Fraud Layer (Protecting the Revenue)
**Goal:** Prevent drivers from gaming the system to earn bonuses, and ensure advertisers only pay for real passengers.

* **How it works:** We manage the drivers and audit the scans completely automatically.
* **The Tech:** 
  * **Fraud Detection Engine:** The database checks IP hashes and device fingerprints. If a driver scans their own code 20 times, or someone submits the same phone number twice in the same campaign, the system flags it (`velocity_anomaly` or `duplicate_phone`) and strips it from the advertiser's bill.
  * **Driver Telegram Bot:** Instead of building a complex, expensive native mobile app for drivers, they interact with a Telegram Bot. They type `/checkin` and upload a photo of the passenger seat to prove the QR code is intact, and type `/inventory` to report how many reward items (waters/brochures) they have left. 

### 5. The Admin Layer (Bluecore's Command Center)
**Goal:** Allow Bluecore Software PLC to operate the whole platform as a single operator.

* **How it works:** A protected internal dashboard powered by Next.js and Supabase Auth.
* **The Tech:** Only Super Admins can see the global view. From here, you create new campaigns, register new drivers, drag-and-drop drivers into active campaigns, review flagged fraudulent leads, and run the automated driver bonus calculations at the end of the month based on their compliance scores.

---

### Why this specific stack?
We aren't using Supabase and Next.js just because they are modern; we are using them because they are the *only* lean way to achieve **sub-5-second real-time lead delivery**, **row-level data privacy** (so advertisers never see each other's data), and **edge-deployed landing pages** that load instantly even on congested 3G networks in Addis Ababa. 
