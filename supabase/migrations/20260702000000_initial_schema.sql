-- =============================================================================
-- AddisPulse Media — Supabase PostgreSQL Schema
-- Version: 1.0.1
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- SECTION 1: CUSTOM ENUM TYPES
-- =============================================================================

CREATE TYPE user_role AS ENUM ('super_admin', 'admin', 'advertiser', 'company_rep', 'driver');
CREATE TYPE campaign_type AS ENUM ('lead_generation', 'product_launch', 'appointment_booking', 'brand_awareness');
CREATE TYPE campaign_status AS ENUM ('draft', 'active', 'paused', 'completed', 'cancelled');
CREATE TYPE driver_status AS ENUM ('registered', 'shortlisted', 'active', 'suspended', 'removed');
CREATE TYPE lead_verification_status AS ENUM ('submitted', 'otp_sent', 'otp_verified', 'otp_failed', 'call_verified', 'rejected');
CREATE TYPE lead_status AS ENUM ('new', 'contacted', 'appointment_set', 'converted', 'rejected', 'duplicate', 'invalid');
CREATE TYPE otp_status AS ENUM ('sent', 'verified', 'expired', 'failed');
CREATE TYPE fraud_flag_type AS ENUM ('duplicate_phone', 'duplicate_device', 'velocity_anomaly', 'inventory_mismatch', 'manual_review');
CREATE TYPE notification_channel AS ENUM ('email', 'telegram');
CREATE TYPE notification_status AS ENUM ('pending', 'sent', 'failed', 'retry');
CREATE TYPE bonus_status AS ENUM ('pending', 'approved', 'paid');
CREATE TYPE invoice_status AS ENUM ('draft', 'sent', 'partially_paid', 'paid', 'overdue');

-- =============================================================================
-- SECTION 2: FOUNDATION LAYER
-- =============================================================================

CREATE TABLE companies (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier    TEXT NOT NULL UNIQUE,
  name          TEXT NOT NULL,
  logo_url      TEXT,
  brand_color   TEXT,
  description   TEXT,
  services      TEXT,
  video_url     TEXT,
  contacts      JSONB DEFAULT '{}',
  sector        TEXT,
  active        BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE lead_receivers (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id       UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  receiver_name    TEXT NOT NULL,
  receiver_email   TEXT,
  telegram_chat_id TEXT,
  active           BOOLEAN NOT NULL DEFAULT true,
  updated_by       UUID,
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email       TEXT NOT NULL,
  role        user_role NOT NULL DEFAULT 'company_rep',
  company_id  UUID REFERENCES companies(id) ON DELETE SET NULL,
  full_name   TEXT,
  status      TEXT NOT NULL DEFAULT 'active',
  last_login  TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE qr_codes (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id       UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  url              TEXT NOT NULL,
  image_path       TEXT,
  error_correction TEXT NOT NULL DEFAULT 'H',
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE audit_logs (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id     UUID REFERENCES profiles(id) ON DELETE SET NULL,
  action       TEXT NOT NULL,
  entity_type  TEXT,
  entity_id    UUID,
  details      JSONB DEFAULT '{}',
  ip_hash      TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- SECTION 3: ADDISPULSE EXTENSION LAYER
-- =============================================================================

CREATE TABLE campaigns (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id            UUID NOT NULL REFERENCES companies(id) ON DELETE RESTRICT,
  name                  TEXT NOT NULL,
  campaign_type         campaign_type NOT NULL DEFAULT 'lead_generation',
  status                campaign_status NOT NULL DEFAULT 'draft',
  start_date            DATE NOT NULL,
  end_date              DATE NOT NULL,
  target_zones          TEXT[] NOT NULL DEFAULT '{}',
  vehicle_count         INT NOT NULL DEFAULT 20,
  target_leads          INT,
  budget_etb            NUMERIC(12,2),
  reward_type           TEXT,
  reward_description    TEXT,
  reward_unit_cost_etb  NUMERIC(8,2) DEFAULT 0,
  landing_page_config   JSONB DEFAULT '{}',
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

CREATE TABLE drivers (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name         TEXT NOT NULL,
  phone             TEXT NOT NULL UNIQUE,
  vehicle_plate     TEXT,
  vehicle_type      TEXT NOT NULL DEFAULT 'ride_share',
  primary_zone      TEXT NOT NULL,
  telegram_handle   TEXT,
  telegram_user_id  BIGINT UNIQUE,
  qr_token          TEXT NOT NULL UNIQUE,
  status            driver_status NOT NULL DEFAULT 'registered',
  compliance_score  NUMERIC(5,2) NOT NULL DEFAULT 100.00,
  notes             TEXT,
  registered_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE driver_campaign_assignments (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id    UUID NOT NULL REFERENCES drivers(id) ON DELETE RESTRICT,
  campaign_id  UUID NOT NULL REFERENCES campaigns(id) ON DELETE RESTRICT,
  assigned_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  removed_at   TIMESTAMPTZ,
  active       BOOLEAN NOT NULL DEFAULT true,
  UNIQUE(driver_id, campaign_id)
);

-- =============================================================================
-- SECTION 4: LEAD CAPTURE
-- =============================================================================

CREATE TABLE leads (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id              UUID REFERENCES campaigns(id) ON DELETE SET NULL,
  driver_id                UUID REFERENCES drivers(id) ON DELETE SET NULL,
  company_id               UUID NOT NULL REFERENCES companies(id) ON DELETE RESTRICT,
  full_name                TEXT NOT NULL,
  phone                    TEXT NOT NULL,
  email                    TEXT,
  organization             TEXT,
  interested_service       TEXT,
  message                  TEXT,
  preferred_contact_method TEXT,
  verification_status      lead_verification_status NOT NULL DEFAULT 'submitted',
  status                   lead_status NOT NULL DEFAULT 'new',
  ip_hash                  TEXT,
  device_fingerprint_hash  TEXT,
  fraud_flag               BOOLEAN NOT NULL DEFAULT false,
  notification_sent        BOOLEAN NOT NULL DEFAULT false,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE otp_verifications (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone        TEXT NOT NULL,
  code_hash    TEXT NOT NULL,
  campaign_id  UUID REFERENCES campaigns(id) ON DELETE SET NULL,
  lead_id      UUID REFERENCES leads(id) ON DELETE SET NULL,
  status       otp_status NOT NULL DEFAULT 'sent',
  attempts     INT NOT NULL DEFAULT 0,
  expires_at   TIMESTAMPTZ NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

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

-- =============================================================================
-- SECTION 5: DRIVER OPERATIONS & NOTIFICATIONS
-- =============================================================================

CREATE TABLE driver_compliance_records (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id           UUID NOT NULL REFERENCES drivers(id) ON DELETE RESTRICT,
  campaign_id         UUID NOT NULL REFERENCES campaigns(id) ON DELETE RESTRICT,
  record_date         DATE NOT NULL,
  checkin_photo_url   TEXT,
  checkin_time        TIMESTAMPTZ,
  inventory_reported  INT,
  compliance_flag     BOOLEAN NOT NULL DEFAULT false,
  flag_reason         TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(driver_id, campaign_id, record_date)
);

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

CREATE TABLE notification_logs (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id          UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  channel          notification_channel NOT NULL,
  destination_hash TEXT NOT NULL,
  status           notification_status NOT NULL DEFAULT 'pending',
  attempt_count    INT NOT NULL DEFAULT 0,
  last_error       TEXT,
  next_retry_at    TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE landing_page_visits (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id         UUID REFERENCES campaigns(id) ON DELETE SET NULL,
  driver_id           UUID REFERENCES drivers(id) ON DELETE SET NULL,
  company_id          UUID REFERENCES companies(id) ON DELETE SET NULL,
  ip_hash             TEXT,
  user_agent_summary  TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- SECTION 6: INDEXES FOR PERFORMANCE
-- =============================================================================

CREATE INDEX idx_companies_identifier ON companies(identifier);
CREATE INDEX idx_campaigns_company ON campaigns(company_id);
CREATE INDEX idx_drivers_qr_token ON drivers(qr_token);
CREATE INDEX idx_dca_driver_active ON driver_campaign_assignments(driver_id, active);
CREATE INDEX idx_leads_campaign ON leads(campaign_id);
CREATE INDEX idx_leads_driver ON leads(driver_id);
CREATE INDEX idx_leads_company ON leads(company_id);
CREATE INDEX idx_leads_phone ON leads(phone);
CREATE INDEX idx_otp_phone_campaign ON otp_verifications(phone, campaign_id);
CREATE INDEX idx_fraud_lead ON fraud_flags(lead_id);
CREATE INDEX idx_fraud_unresolved ON fraud_flags(resolved) WHERE resolved = false;

-- =============================================================================
-- SECTION 7: ROW LEVEL SECURITY (RLS)
-- =============================================================================

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

CREATE OR REPLACE FUNCTION get_my_role() RETURNS user_role AS $$
  SELECT role FROM profiles WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION get_my_company_id() RETURNS UUID AS $$
  SELECT company_id FROM profiles WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Profiles: read own, admin all
CREATE POLICY "profiles_self_read" ON profiles FOR SELECT USING (id = auth.uid() OR get_my_role() IN ('super_admin', 'admin'));
CREATE POLICY "profiles_admin_write" ON profiles FOR ALL USING (get_my_role() IN ('super_admin', 'admin'));

-- Companies: admin all, advertiser read own
CREATE POLICY "companies_admin_all" ON companies FOR ALL USING (get_my_role() IN ('super_admin', 'admin'));
CREATE POLICY "companies_advertiser_read" ON companies FOR SELECT USING (get_my_role() = 'advertiser' AND id = get_my_company_id());

-- Campaigns: admin all, advertiser read own
CREATE POLICY "campaigns_admin_all" ON campaigns FOR ALL USING (get_my_role() IN ('super_admin', 'admin'));
CREATE POLICY "campaigns_advertiser_read" ON campaigns FOR SELECT USING (get_my_role() = 'advertiser' AND company_id = get_my_company_id());

-- Leads: admin all, advertiser read own campaigns
CREATE POLICY "leads_admin_all" ON leads FOR ALL USING (get_my_role() IN ('super_admin', 'admin'));
CREATE POLICY "leads_advertiser_read" ON leads FOR SELECT USING (get_my_role() = 'advertiser' AND company_id = get_my_company_id());

-- Other tables: admin only
CREATE POLICY "receivers_admin_only" ON lead_receivers FOR ALL USING (get_my_role() = 'super_admin');
CREATE POLICY "fraud_admin_only" ON fraud_flags FOR ALL USING (get_my_role() IN ('super_admin', 'admin'));
CREATE POLICY "compliance_admin_all" ON driver_compliance_records FOR ALL USING (get_my_role() IN ('super_admin', 'admin'));

-- =============================================================================
-- SECTION 8: UTILITY FUNCTIONS & RPCs
-- =============================================================================

CREATE OR REPLACE FUNCTION resolve_driver_campaign(p_qr_token TEXT)
RETURNS TABLE(
  driver_id    UUID,
  driver_name  TEXT,
  campaign_id  UUID,
  company_id   UUID,
  campaign_name TEXT,
  company_name TEXT,
  logo_url     TEXT,
  brand_color  TEXT,
  landing_config JSONB,
  reward_desc  TEXT
) AS $$
  SELECT
    d.id           AS driver_id,
    d.full_name    AS driver_name,
    c.id           AS campaign_id,
    co.id          AS company_id,
    c.name         AS campaign_name,
    co.name        AS company_name,
    co.logo_url    AS logo_url,
    co.brand_color AS brand_color,
    c.landing_page_config AS landing_config,
    c.reward_description AS reward_desc
  FROM drivers d
  JOIN driver_campaign_assignments dca ON dca.driver_id = d.id AND dca.active = true
  JOIN campaigns c ON c.id = dca.campaign_id AND c.status = 'active' AND CURRENT_DATE BETWEEN c.start_date AND c.end_date
  JOIN companies co ON co.id = c.company_id
  WHERE d.qr_token = p_qr_token
    AND d.status = 'active'
  LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION is_duplicate_lead(p_phone TEXT, p_campaign_id UUID) RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM leads WHERE phone = p_phone AND campaign_id = p_campaign_id AND verification_status NOT IN ('rejected', 'otp_failed')
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;
