-- =============================================================================
-- AddisPulse Media — Supabase PostgreSQL Schema
-- Version: 1.0.0
-- Last updated: 2026-07-01
-- Operator: Bluecore Software PLC (single-operator, no multi-tenancy)
-- Stack: Supabase PostgreSQL + Supabase Auth + RLS
-- =============================================================================
-- Run this against your Supabase project via the SQL editor or migration tool.
-- Extensions are enabled by default in Supabase; uuid-ossp may need enabling.
-- =============================================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- SECTION 1: CUSTOM ENUM TYPES
-- =============================================================================

CREATE TYPE user_role AS ENUM (
  'super_admin',   -- Bluecore leadership, full access
  'admin',         -- AddisPulse ops team, campaign management
  'advertiser',    -- Client dashboard access (campaign-scoped)
  'company_rep',   -- Legacy SRS role; maps to advertiser in AddisPulse context
  'driver'         -- Future: driver portal access
);

CREATE TYPE campaign_type AS ENUM (
  'lead_generation',     -- QR → form → OTP → verified lead (real estate, finance, healthcare)
  'product_launch',      -- QR → video → coupon claim / demo request (telecom, electronics)
  'appointment_booking', -- QR → select callback time (clinics, training centers)
  'brand_awareness'      -- QR → brand story → survey (NGOs, CSR)
);

CREATE TYPE campaign_status AS ENUM (
  'draft',      -- Being configured, not yet live
  'active',     -- Currently running
  'paused',     -- Temporarily halted
  'completed',  -- Ended normally
  'cancelled'   -- Cancelled before completion
);

CREATE TYPE driver_status AS ENUM (
  'registered',   -- Applied, not yet vetted
  'shortlisted',  -- Passed inspection, in pool
  'active',       -- Currently assigned to a campaign
  'suspended',    -- Suspended for compliance violations
  'removed'       -- Permanently removed from pool
);

CREATE TYPE lead_verification_status AS ENUM (
  'submitted',     -- Form submitted, no OTP yet
  'otp_sent',      -- OTP SMS sent to passenger
  'otp_verified',  -- Passenger entered correct OTP → verified lead
  'otp_failed',    -- OTP expired or max attempts exceeded
  'call_verified', -- Manually verified by ops team audit call
  'rejected'       -- Invalid phone, duplicate, or fraud
);

CREATE TYPE lead_status AS ENUM (
  'new',              -- Just captured, not yet followed up
  'contacted',        -- Advertiser's team has called/messaged
  'appointment_set',  -- Appointment or site visit booked
  'converted',        -- Sale or conversion achieved
  'rejected',         -- Not a viable lead
  'duplicate',        -- Duplicate submission removed
  'invalid'           -- Invalid contact or fraudulent
);

CREATE TYPE otp_status AS ENUM (
  'sent',
  'verified',
  'expired',
  'failed'
);

CREATE TYPE fraud_flag_type AS ENUM (
  'duplicate_phone',      -- Same phone already in this campaign
  'duplicate_device',     -- Same device fingerprint submitted again
  'velocity_anomaly',     -- Driver's QR scan rate far above campaign baseline
  'inventory_mismatch',   -- Driver reported inventory doesn't match scan volume
  'manual_review'         -- Flagged by ops team during audit call
);

CREATE TYPE notification_channel AS ENUM (
  'email',
  'telegram'
);

CREATE TYPE notification_status AS ENUM (
  'pending',
  'sent',
  'failed',
  'retry'
);

CREATE TYPE bonus_status AS ENUM (
  'pending',
  'approved',
  'paid'
);

CREATE TYPE invoice_status AS ENUM (
  'draft',
  'sent',
  'partially_paid',
  'paid',
  'overdue'
);

-- =============================================================================
-- SECTION 2: FOUNDATION LAYER (from SRS — company profiles, QR, auth)
-- =============================================================================

-- companies: Advertisers in AddisPulse context. Each advertiser is a "company."
-- The `identifier` field is IMMUTABLE — it is the basis for all QR URLs.
CREATE TABLE companies (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier    TEXT NOT NULL UNIQUE,       -- Immutable slug, basis for QR URL
  name          TEXT NOT NULL,              -- max 120 chars enforced at app level
  logo_url      TEXT,
  brand_color   TEXT,                       -- Hex color, e.g. '#1A3A5C'
  description   TEXT,                       -- max 500 chars
  services      TEXT,                       -- max 1000 chars
  video_url     TEXT,                       -- YouTube/Vimeo URL
  contacts      JSONB DEFAULT '{}',         -- { phone, email, whatsapp, telegram, website, social[], address }
  sector        TEXT,                       -- real_estate, finance, education, healthcare, etc.
  active        BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE companies IS 'Advertisers / clients who purchase AddisPulse campaigns. Maps to the SRS company profile concept.';
COMMENT ON COLUMN companies.identifier IS 'Immutable unique slug. Never changes. QR URL = /c/[identifier]. Also used for /campaign/[campaign_id]/[driver_token] routing.';

-- lead_receivers: WHERE leads get sent. Completely separate from company content.
-- Super-admin only. Changing this is a protected action logged in audit_logs.
CREATE TABLE lead_receivers (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id       UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  receiver_name    TEXT NOT NULL,
  receiver_email   TEXT,
  telegram_chat_id TEXT,                    -- Telegram chat_id for lead alerts
  active           BOOLEAN NOT NULL DEFAULT true,
  updated_by       UUID,                    -- References profiles.id
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE lead_receivers IS 'Protected: where new lead notifications are sent. Only super_admin can modify. Separate from company profile content.';

-- profiles: Supabase Auth user profiles. One row per auth.users entry.
CREATE TABLE profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email       TEXT NOT NULL,
  role        user_role NOT NULL DEFAULT 'company_rep',
  company_id  UUID REFERENCES companies(id) ON DELETE SET NULL,  -- NULL for admins
  full_name   TEXT,
  status      TEXT NOT NULL DEFAULT 'active',                    -- active, suspended
  last_login  TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE profiles IS 'Extends Supabase auth.users with role and company association. One row per authenticated user.';

-- qr_codes: One QR per company (permanent company page URL, per SRS).
-- For driver QRs, see drivers.qr_token — those are per-driver, permanent.
CREATE TABLE qr_codes (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id       UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  url              TEXT NOT NULL,            -- The encoded URL, e.g. https://app.addispulse.com/c/[identifier]
  image_path       TEXT,                     -- Supabase Storage path to PNG
  error_correction TEXT NOT NULL DEFAULT 'H', -- H = 30% damage tolerance
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE qr_codes IS 'Company-level permanent QR codes. URL never changes even if company content is updated.';

-- audit_logs: Immutable record of all admin actions
CREATE TABLE audit_logs (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id     UUID REFERENCES profiles(id) ON DELETE SET NULL,
  action       TEXT NOT NULL,               -- e.g. 'company.create', 'receiver.update', 'lead.export'
  entity_type  TEXT,                        -- e.g. 'company', 'driver', 'campaign'
  entity_id    UUID,
  details      JSONB DEFAULT '{}',
  ip_hash      TEXT,                        -- Hashed IP of the actor
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE audit_logs IS 'Immutable audit trail. Never update or delete rows. Append-only.';

-- =============================================================================
-- SECTION 3: ADDISPULSE EXTENSION LAYER — CAMPAIGNS & DRIVERS
-- =============================================================================

-- campaigns: Time-bounded advertiser campaigns. Core business entity.
CREATE TABLE campaigns (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  advertiser_id         UUID NOT NULL REFERENCES companies(id) ON DELETE RESTRICT,
  name                  TEXT NOT NULL,
  campaign_type         campaign_type NOT NULL DEFAULT 'lead_generation',
  status                campaign_status NOT NULL DEFAULT 'draft',
  start_date            DATE NOT NULL,
  end_date              DATE NOT NULL,
  target_zones          TEXT[] NOT NULL DEFAULT '{}',  -- ['Bole', 'Kazanchis', 'Megenagna']
  vehicle_count         INT NOT NULL DEFAULT 20,
  target_leads          INT,
  budget_etb            NUMERIC(12,2),
  reward_type           TEXT,                          -- 'water', 'coupon', 'discount_code', 'none'
  reward_description    TEXT,                          -- What the passenger receives
  reward_unit_cost_etb  NUMERIC(8,2) DEFAULT 0,
  landing_page_config   JSONB DEFAULT '{}',            -- Campaign-specific overrides: headline, CTA, offer_text, etc.
  invoice_status        invoice_status NOT NULL DEFAULT 'draft',
  invoice_amount_etb    NUMERIC(12,2),
  advance_paid_etb      NUMERIC(12,2) DEFAULT 0,
  internal_notes        TEXT,
  created_by            UUID REFERENCES profiles(id),
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT valid_dates CHECK (end_date > start_date),
  CONSTRAINT positive_budget CHECK (budget_etb IS NULL OR budget_etb > 0)
);

COMMENT ON TABLE campaigns IS 'Time-bounded advertising campaigns. Each campaign belongs to one advertiser. Drivers are assigned via driver_campaign_assignments.';
COMMENT ON COLUMN campaigns.landing_page_config IS 'JSONB overrides for the campaign landing page: { headline, offer_text, cta_label, amharic_headline, amharic_offer_text, background_image_url }';

-- drivers: The physical supply chain. One row per driver, permanent.
-- qr_token is the driver's permanent identifier — never changes.
-- Backend resolves: qr_token → active campaign at scan time.
CREATE TABLE drivers (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name         TEXT NOT NULL,
  phone             TEXT NOT NULL UNIQUE,
  vehicle_plate     TEXT,
  vehicle_type      TEXT NOT NULL DEFAULT 'ride_share',  -- ride_share, taxi, delivery
  primary_zone      TEXT NOT NULL,
  telegram_handle   TEXT,
  telegram_user_id  BIGINT UNIQUE,           -- Set when driver first messages the ops Telegram bot
  qr_token          TEXT NOT NULL UNIQUE,    -- PERMANENT. Generated once. URL: /d/[qr_token]
  status            driver_status NOT NULL DEFAULT 'registered',
  compliance_score  NUMERIC(5,2) NOT NULL DEFAULT 100.00,  -- 0–100
  notes             TEXT,
  registered_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE drivers IS 'Driver pool. Each driver has ONE permanent qr_token. The backend resolves qr_token to the active campaign dynamically at scan time.';
COMMENT ON COLUMN drivers.qr_token IS 'Permanent unique token. Never changes. QR URL = /d/[qr_token]. Landing page served by looking up active campaign assignment.';
COMMENT ON COLUMN drivers.telegram_user_id IS 'Set by the Telegram driver bot when driver first sends /start. Used to push score, compliance alerts, and bonus info.';

-- driver_campaign_assignments: Many-to-many: drivers ↔ campaigns.
-- A driver can be assigned to one campaign at a time (enforced by app logic).
CREATE TABLE driver_campaign_assignments (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id    UUID NOT NULL REFERENCES drivers(id) ON DELETE RESTRICT,
  campaign_id  UUID NOT NULL REFERENCES campaigns(id) ON DELETE RESTRICT,
  assigned_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  removed_at   TIMESTAMPTZ,
  active       BOOLEAN NOT NULL DEFAULT true,

  UNIQUE(driver_id, campaign_id)
);

COMMENT ON TABLE driver_campaign_assignments IS 'Links drivers to campaigns. Backend checks this to resolve which campaign a driver QR scan belongs to.';

-- =============================================================================
-- SECTION 4: LEAD CAPTURE WITH VERIFICATION AND FRAUD DETECTION
-- =============================================================================

-- leads: The core value unit. Extended from SRS base with campaign/driver context.
CREATE TABLE leads (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Campaign + driver context
  campaign_id              UUID REFERENCES campaigns(id) ON DELETE SET NULL,
  driver_id                UUID REFERENCES drivers(id) ON DELETE SET NULL,
  company_id               UUID NOT NULL REFERENCES companies(id) ON DELETE RESTRICT,  -- Denormalised for fast queries
  -- Visitor submitted fields
  full_name                TEXT NOT NULL,
  phone                    TEXT NOT NULL,
  email                    TEXT,
  organization             TEXT,
  interested_service       TEXT,
  message                  TEXT,
  preferred_contact_method TEXT,            -- 'phone', 'email', 'whatsapp'
  -- Verification
  verification_status      lead_verification_status NOT NULL DEFAULT 'submitted',
  -- Lead pipeline status (updated by advertiser)
  status                   lead_status NOT NULL DEFAULT 'new',
  -- Privacy & fraud
  ip_hash                  TEXT,            -- Salted hash of IP — raw IP never stored
  device_fingerprint_hash  TEXT,            -- Hash of browser fingerprint — raw never stored
  fraud_flag               BOOLEAN NOT NULL DEFAULT false,
  -- Notification
  notification_sent        BOOLEAN NOT NULL DEFAULT false,
  -- Metadata
  created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE leads IS 'Every passenger form submission. Includes campaign and driver attribution, OTP verification status, and advertiser pipeline status.';
COMMENT ON COLUMN leads.phone IS 'Raw phone stored encrypted or as collected. Used for duplicate detection within campaign. Not hashed — must be readable for OTP and follow-up.';
COMMENT ON COLUMN leads.ip_hash IS 'SHA-256 hash of IP + secret salt. Raw IP never persisted. Complies with Proclamation No. 1321/2024.';

-- otp_verifications: OTP lifecycle tracking. Never store plaintext OTP codes.
CREATE TABLE otp_verifications (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone        TEXT NOT NULL,
  code_hash    TEXT NOT NULL,              -- bcrypt or SHA-256 hash of the 6-digit OTP
  campaign_id  UUID REFERENCES campaigns(id) ON DELETE SET NULL,
  lead_id      UUID REFERENCES leads(id) ON DELETE SET NULL,
  status       otp_status NOT NULL DEFAULT 'sent',
  attempts     INT NOT NULL DEFAULT 0,
  expires_at   TIMESTAMPTZ NOT NULL,      -- Typically NOW() + 10 minutes
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE otp_verifications IS 'OTP lifecycle. code_hash stores hashed OTP — never plaintext. Expires after 10 minutes. Max 3 attempts.';

-- fraud_flags: Fraud events linked to leads and/or drivers
CREATE TABLE fraud_flags (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id      UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  driver_id    UUID REFERENCES drivers(id) ON DELETE SET NULL,
  flag_type    fraud_flag_type NOT NULL,
  flag_reason  TEXT NOT NULL,
  resolved     BOOLEAN NOT NULL DEFAULT false,
  resolved_by  UUID REFERENCES profiles(id) ON DELETE SET NULL,
  resolved_at  TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE fraud_flags IS 'Fraud detection events. One lead can have multiple flags. Ops team reviews and resolves. Auto-generated by anomaly detection logic.';

-- =============================================================================
-- SECTION 5: DRIVER OPERATIONS (Telegram bot feeds into these tables)
-- =============================================================================

-- driver_compliance_records: Daily check-in records per driver per campaign
CREATE TABLE driver_compliance_records (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id           UUID NOT NULL REFERENCES drivers(id) ON DELETE RESTRICT,
  campaign_id         UUID NOT NULL REFERENCES campaigns(id) ON DELETE RESTRICT,
  record_date         DATE NOT NULL,
  checkin_photo_url   TEXT,               -- Supabase Storage path
  checkin_time        TIMESTAMPTZ,
  inventory_reported  INT,               -- Items remaining as reported by driver
  compliance_flag     BOOLEAN NOT NULL DEFAULT false,
  flag_reason         TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(driver_id, campaign_id, record_date)
);

COMMENT ON TABLE driver_compliance_records IS 'Daily driver check-in records fed by the Telegram bot /checkin command. Missing records trigger compliance score deductions.';

-- inventory_records: Physical campaign material tracking
CREATE TABLE inventory_records (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id           UUID NOT NULL REFERENCES drivers(id) ON DELETE RESTRICT,
  campaign_id         UUID NOT NULL REFERENCES campaigns(id) ON DELETE RESTRICT,
  record_date         DATE NOT NULL,
  issued_quantity     INT NOT NULL DEFAULT 0,
  reported_remaining  INT,
  discrepancy_flag    BOOLEAN NOT NULL DEFAULT false,
  notes               TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE inventory_records IS 'Tracks physical campaign materials (water, treats, brochures) per driver. Discrepancies trigger fraud investigation.';

-- driver_bonuses: Calculated at campaign close
CREATE TABLE driver_bonuses (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id                 UUID NOT NULL REFERENCES drivers(id) ON DELETE RESTRICT,
  campaign_id               UUID NOT NULL REFERENCES campaigns(id) ON DELETE RESTRICT,
  base_fee_etb              NUMERIC(10,2) NOT NULL DEFAULT 0,
  lead_bonus_etb            NUMERIC(10,2) NOT NULL DEFAULT 0,
  top_driver_prize_etb      NUMERIC(10,2) NOT NULL DEFAULT 0,
  compliance_deduction_etb  NUMERIC(10,2) NOT NULL DEFAULT 0,
  verified_leads_count      INT NOT NULL DEFAULT 0,
  compliance_score_at_close NUMERIC(5,2),
  status                    bonus_status NOT NULL DEFAULT 'pending',
  paid_at                   TIMESTAMPTZ,
  approved_by               UUID REFERENCES profiles(id),
  notes                     TEXT,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(driver_id, campaign_id)
);

COMMENT ON TABLE driver_bonuses IS 'Bonus calculation per driver per campaign. Created at campaign close. total = base + lead_bonus + prize - deductions.';

-- =============================================================================
-- SECTION 6: NOTIFICATIONS AND REPORTING
-- =============================================================================

-- notification_logs: Tracks lead notification delivery with retry state
CREATE TABLE notification_logs (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id          UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  channel          notification_channel NOT NULL,
  destination_hash TEXT NOT NULL,           -- Hashed receiver email/chat_id — not plaintext
  status           notification_status NOT NULL DEFAULT 'pending',
  attempt_count    INT NOT NULL DEFAULT 0,
  last_error       TEXT,
  next_retry_at    TIMESTAMPTZ,             -- Set during exponential backoff
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE notification_logs IS 'Lead notification delivery tracking. Retry with exponential backoff (1s, 4s, 16s). destination_hash protects receiver PII.';

-- landing_page_visits: Optional scan analytics (v1 optional, useful for QR scan count)
CREATE TABLE landing_page_visits (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id         UUID REFERENCES campaigns(id) ON DELETE SET NULL,
  driver_id           UUID REFERENCES drivers(id) ON DELETE SET NULL,
  company_id          UUID REFERENCES companies(id) ON DELETE SET NULL,
  ip_hash             TEXT,
  user_agent_summary  TEXT,               -- Browser family + OS, never full UA string
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE landing_page_visits IS 'QR scan / landing page visit analytics. Enables scan count separate from lead count. Optional in v1.';

-- =============================================================================
-- SECTION 7: INDEXES FOR PERFORMANCE
-- =============================================================================

-- Companies
CREATE INDEX idx_companies_identifier ON companies(identifier);
CREATE INDEX idx_companies_active ON companies(active);

-- Campaigns
CREATE INDEX idx_campaigns_advertiser ON campaigns(advertiser_id);
CREATE INDEX idx_campaigns_status ON campaigns(status);
CREATE INDEX idx_campaigns_dates ON campaigns(start_date, end_date);

-- Drivers
CREATE INDEX idx_drivers_qr_token ON drivers(qr_token);
CREATE INDEX idx_drivers_status ON drivers(status);
CREATE INDEX idx_drivers_telegram_user_id ON drivers(telegram_user_id);
CREATE INDEX idx_drivers_phone ON drivers(phone);

-- Driver assignments
CREATE INDEX idx_dca_driver_active ON driver_campaign_assignments(driver_id, active);
CREATE INDEX idx_dca_campaign ON driver_campaign_assignments(campaign_id);

-- Leads (most queried table — index heavily)
CREATE INDEX idx_leads_campaign ON leads(campaign_id);
CREATE INDEX idx_leads_driver ON leads(driver_id);
CREATE INDEX idx_leads_company ON leads(company_id);
CREATE INDEX idx_leads_phone ON leads(phone);
CREATE INDEX idx_leads_verification_status ON leads(verification_status);
CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_leads_fraud_flag ON leads(fraud_flag) WHERE fraud_flag = true;
CREATE INDEX idx_leads_created_at ON leads(created_at DESC);

-- OTP
CREATE INDEX idx_otp_phone_campaign ON otp_verifications(phone, campaign_id);
CREATE INDEX idx_otp_status ON otp_verifications(status);
CREATE INDEX idx_otp_expires_at ON otp_verifications(expires_at);

-- Fraud
CREATE INDEX idx_fraud_lead ON fraud_flags(lead_id);
CREATE INDEX idx_fraud_driver ON fraud_flags(driver_id);
CREATE INDEX idx_fraud_unresolved ON fraud_flags(resolved) WHERE resolved = false;

-- Compliance
CREATE INDEX idx_compliance_driver_campaign ON driver_compliance_records(driver_id, campaign_id);
CREATE INDEX idx_compliance_date ON driver_compliance_records(record_date);

-- Notifications
CREATE INDEX idx_notif_lead ON notification_logs(lead_id);
CREATE INDEX idx_notif_status ON notification_logs(status);
CREATE INDEX idx_notif_next_retry ON notification_logs(next_retry_at) WHERE status = 'retry';

-- Landing page visits
CREATE INDEX idx_visits_campaign ON landing_page_visits(campaign_id);
CREATE INDEX idx_visits_driver ON landing_page_visits(driver_id);
CREATE INDEX idx_visits_created_at ON landing_page_visits(created_at);

-- =============================================================================
-- SECTION 8: ROW LEVEL SECURITY (RLS)
-- =============================================================================

-- Enable RLS on all tables with PII or access-control requirements
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_receivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE otp_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE fraud_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE driver_compliance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE driver_bonuses ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Helper function: get current user's role
CREATE OR REPLACE FUNCTION get_my_role()
RETURNS user_role AS $$
  SELECT role FROM profiles WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Helper function: get current user's company_id
CREATE OR REPLACE FUNCTION get_my_company_id()
RETURNS UUID AS $$
  SELECT company_id FROM profiles WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- profiles: Users see only their own profile; admins see all
CREATE POLICY "profiles_self_read" ON profiles
  FOR SELECT USING (id = auth.uid() OR get_my_role() IN ('super_admin', 'admin'));

CREATE POLICY "profiles_admin_write" ON profiles
  FOR ALL USING (get_my_role() IN ('super_admin', 'admin'));

-- companies: Admins manage all; advertisers read their own
CREATE POLICY "companies_admin_all" ON companies
  FOR ALL USING (get_my_role() IN ('super_admin', 'admin'));

CREATE POLICY "companies_advertiser_read" ON companies
  FOR SELECT USING (
    get_my_role() = 'advertiser' AND id = get_my_company_id()
  );

-- lead_receivers: Super-admin only
CREATE POLICY "receivers_super_admin_only" ON lead_receivers
  FOR ALL USING (get_my_role() = 'super_admin');

-- campaigns: Admins manage all; advertisers see their own
CREATE POLICY "campaigns_admin_all" ON campaigns
  FOR ALL USING (get_my_role() IN ('super_admin', 'admin'));

CREATE POLICY "campaigns_advertiser_read" ON campaigns
  FOR SELECT USING (
    get_my_role() = 'advertiser' AND advertiser_id = get_my_company_id()
  );

-- leads: Admins see all; advertisers see leads for their campaigns only
CREATE POLICY "leads_admin_all" ON leads
  FOR ALL USING (get_my_role() IN ('super_admin', 'admin'));

CREATE POLICY "leads_advertiser_read" ON leads
  FOR SELECT USING (
    get_my_role() = 'advertiser' AND
    company_id = get_my_company_id()
  );

CREATE POLICY "leads_advertiser_status_update" ON leads
  FOR UPDATE USING (
    get_my_role() = 'advertiser' AND
    company_id = get_my_company_id()
  )
  WITH CHECK (
    -- Advertisers can only update the pipeline status field
    get_my_role() = 'advertiser'
  );

-- Public lead insert: via server-side service role only (no direct RLS insert policy)
-- All public form submissions go through /api/v1/leads using service role key (server-side)

-- fraud_flags: Admin only
CREATE POLICY "fraud_admin_only" ON fraud_flags
  FOR ALL USING (get_my_role() IN ('super_admin', 'admin'));

-- driver operations: Admin only for writes; future driver portal for reads
CREATE POLICY "compliance_admin_all" ON driver_compliance_records
  FOR ALL USING (get_my_role() IN ('super_admin', 'admin'));

CREATE POLICY "inventory_admin_all" ON inventory_records
  FOR ALL USING (get_my_role() IN ('super_admin', 'admin'));

CREATE POLICY "bonuses_admin_all" ON driver_bonuses
  FOR ALL USING (get_my_role() IN ('super_admin', 'admin'));

-- notifications: Admin only
CREATE POLICY "notif_admin_only" ON notification_logs
  FOR ALL USING (get_my_role() IN ('super_admin', 'admin'));

-- audit logs: Read-only for admins, append-only via service role
CREATE POLICY "audit_admin_read" ON audit_logs
  FOR SELECT USING (get_my_role() IN ('super_admin', 'admin'));

-- =============================================================================
-- SECTION 9: UTILITY FUNCTIONS
-- =============================================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply auto-update trigger to all tables with updated_at
CREATE TRIGGER trg_companies_updated_at
  BEFORE UPDATE ON companies FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_campaigns_updated_at
  BEFORE UPDATE ON campaigns FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_drivers_updated_at
  BEFORE UPDATE ON drivers FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_leads_updated_at
  BEFORE UPDATE ON leads FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_bonuses_updated_at
  BEFORE UPDATE ON driver_bonuses FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_notif_updated_at
  BEFORE UPDATE ON notification_logs FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Function: resolve driver QR token to active campaign
-- Called at every QR scan to find which campaign to serve
CREATE OR REPLACE FUNCTION resolve_driver_campaign(p_qr_token TEXT)
RETURNS TABLE(
  driver_id    UUID,
  campaign_id  UUID,
  company_id   UUID,
  driver_name  TEXT,
  campaign_status campaign_status
) AS $$
  SELECT
    d.id           AS driver_id,
    c.id           AS campaign_id,
    c.advertiser_id AS company_id,
    d.full_name    AS driver_name,
    c.status       AS campaign_status
  FROM drivers d
  JOIN driver_campaign_assignments dca ON dca.driver_id = d.id AND dca.active = true
  JOIN campaigns c ON c.id = dca.campaign_id AND c.status = 'active'
    AND CURRENT_DATE BETWEEN c.start_date AND c.end_date
  WHERE d.qr_token = p_qr_token
    AND d.status = 'active'
  LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

COMMENT ON FUNCTION resolve_driver_campaign IS 'Core routing function. Called on every QR scan. Returns the active campaign for a driver token. Returns empty if driver has no active campaign.';

-- Function: check for duplicate phone in campaign (for fraud detection)
CREATE OR REPLACE FUNCTION is_duplicate_lead(p_phone TEXT, p_campaign_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM leads
    WHERE phone = p_phone
      AND campaign_id = p_campaign_id
      AND verification_status NOT IN ('rejected', 'otp_failed')
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Function: get driver stats for a campaign (leaderboard)
CREATE OR REPLACE FUNCTION get_driver_campaign_stats(p_campaign_id UUID)
RETURNS TABLE(
  driver_id         UUID,
  driver_name       TEXT,
  total_scans       BIGINT,
  total_leads       BIGINT,
  verified_leads    BIGINT,
  compliance_score  NUMERIC,
  rank              BIGINT
) AS $$
  SELECT
    d.id                    AS driver_id,
    d.full_name             AS driver_name,
    COUNT(DISTINCT lpv.id)  AS total_scans,
    COUNT(DISTINCT l.id)    AS total_leads,
    COUNT(DISTINCT l.id) FILTER (WHERE l.verification_status = 'otp_verified') AS verified_leads,
    d.compliance_score,
    RANK() OVER (ORDER BY COUNT(DISTINCT l.id) FILTER (WHERE l.verification_status = 'otp_verified') DESC) AS rank
  FROM drivers d
  JOIN driver_campaign_assignments dca ON dca.driver_id = d.id AND dca.campaign_id = p_campaign_id
  LEFT JOIN landing_page_visits lpv ON lpv.driver_id = d.id AND lpv.campaign_id = p_campaign_id
  LEFT JOIN leads l ON l.driver_id = d.id AND l.campaign_id = p_campaign_id AND l.fraud_flag = false
  GROUP BY d.id, d.full_name, d.compliance_score;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

COMMENT ON FUNCTION get_driver_campaign_stats IS 'Driver leaderboard for a campaign. Returns scans, leads, verified leads, compliance score, and rank.';

-- =============================================================================
-- SECTION 10: SEED DATA — ROLES AND INITIAL SUPER ADMIN
-- =============================================================================
-- Run this separately after creating the first Supabase auth user.
-- Replace the UUID below with the actual auth.users.id for your super admin.

-- INSERT INTO profiles (id, email, role, full_name)
-- VALUES ('YOUR-SUPER-ADMIN-AUTH-UUID', 'admin@bluecore.et', 'super_admin', 'Bluecore Admin');

-- =============================================================================
-- END OF SCHEMA
-- Schema version: 1.0.0
-- Next migration: add Amharic fields to campaigns.landing_page_config (already JSONB)
-- =============================================================================
