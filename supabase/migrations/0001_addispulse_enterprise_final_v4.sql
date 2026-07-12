-- =============================================================================
-- AddisPulse Media - Supabase PostgreSQL enterprise foundation
-- v4.1 adds replaceable 30-50 second campaign promotional videos with
-- validation, tenant RLS, landing-page resolution, and rating attribution.
-- Fresh-project initial migration (not an in-place upgrade)
-- Version: 4.1.0
-- Target: Supabase PostgreSQL + Auth + Realtime
-- =============================================================================

begin;

-- -----------------------------------------------------------------------------
-- 0. Schemas and extensions
-- -----------------------------------------------------------------------------
create schema if not exists private;
create schema if not exists extensions;

-- Useful for fast contains-search on lead names/email. Supabase supports pg_trgm.
create extension if not exists pg_trgm with schema extensions;
-- Used for bcrypt-style OTP hashing and verification.
create extension if not exists pgcrypto with schema extensions;

-- -----------------------------------------------------------------------------
-- 1. Domain enums
-- -----------------------------------------------------------------------------
create type public.platform_role as enum ('super_admin', 'admin');
create type public.account_status as enum ('active', 'locked', 'disabled');
create type public.company_status as enum ('draft', 'active', 'inactive', 'archived');
create type public.membership_role as enum ('company_rep');
create type public.campaign_type as enum ('lead_generation', 'product_launch', 'appointment_booking', 'brand_awareness');
create type public.campaign_status as enum ('draft', 'scheduled', 'active', 'paused', 'completed', 'cancelled');
create type public.video_provider as enum ('youtube', 'vimeo', 'cloudinary', 'supabase_storage');
create type public.driver_status as enum ('registered', 'shortlisted', 'active', 'suspended', 'removed');
create type public.assignment_status as enum ('active', 'completed', 'removed');
create type public.qr_code_type as enum ('company', 'driver');
create type public.qr_code_status as enum ('active', 'inactive', 'retired');
create type public.lead_verification_status as enum ('submitted', 'otp_sent', 'otp_verified', 'otp_failed', 'call_verified', 'rejected');
create type public.lead_status as enum ('new', 'viewed', 'contacted', 'appointment_set', 'followed_up', 'converted', 'rejected', 'duplicate', 'invalid', 'archived');
create type public.preferred_contact_method as enum ('phone', 'email', 'whatsapp');
create type public.otp_status as enum ('created', 'send_pending', 'sent', 'verified', 'expired', 'failed');
create type public.otp_delivery_status as enum ('pending', 'accepted', 'delivered', 'failed');
create type public.fraud_flag_type as enum ('duplicate_phone', 'duplicate_device', 'ip_velocity', 'velocity_anomaly', 'inventory_mismatch', 'manual_review');
create type public.notification_channel as enum ('email', 'telegram');
create type public.notification_event_type as enum ('lead_verified', 'feedback_received');
create type public.notification_frequency as enum ('instant', 'daily_digest');
create type public.notification_job_status as enum ('pending', 'processing', 'retry', 'sent', 'dead_letter', 'cancelled');
create type public.notification_attempt_status as enum ('sent', 'failed');
create type public.notification_summary_status as enum ('waiting_verification', 'not_configured', 'pending', 'sent', 'partially_sent', 'failed');
create type public.notification_digest_status as enum ('pending', 'processing', 'sent', 'failed', 'cancelled');
create type public.reward_issuance_status as enum ('pending', 'issued', 'redeemed', 'expired', 'cancelled');
create type public.lead_quality_status as enum ('pending', 'qualified', 'duplicate', 'fraud_suspected', 'fraud_confirmed', 'invalid_phone', 'invalid_other', 'rejected');
create type public.lead_quality_source as enum ('rule_engine', 'manual_review', 'system');
create type public.lead_activity_type as enum ('call', 'sms', 'email', 'whatsapp', 'telegram', 'appointment', 'note');
create type public.lead_activity_status as enum ('planned', 'in_progress', 'completed', 'cancelled');
create type public.feedback_status as enum ('new', 'viewed', 'actioned', 'archived');
create type public.inventory_movement_type as enum ('issued', 'returned', 'distributed', 'lost', 'adjustment');
create type public.bonus_status as enum ('pending', 'approved', 'paid', 'cancelled');
create type public.invoice_status as enum ('draft', 'sent', 'partially_paid', 'paid', 'overdue', 'void');
create type public.deletion_request_status as enum ('received', 'verified', 'approved', 'completed', 'rejected');

-- -----------------------------------------------------------------------------
-- 2. Global configuration and identity
-- -----------------------------------------------------------------------------
create table public.app_settings (
  id                              smallint primary key default 1 check (id = 1),
  public_base_url                 text not null,
  default_unavailable_message     varchar(500) not null default 'This page is currently unavailable.',
  lead_retention_months           integer not null default 24 check (lead_retention_months between 1 and 120),
  max_active_companies            integer not null default 500 check (max_active_companies > 0),
  max_company_representatives     integer not null default 5 check (max_company_representatives between 1 and 100),
  created_at                      timestamptz not null default now(),
  updated_at                      timestamptz not null default now()
);

create table public.profiles (
  id              uuid primary key references auth.users(id) on delete cascade,
  email           text not null,
  full_name       varchar(100),
  platform_role   public.platform_role,
  status          public.account_status not null default 'active',
  last_login_at   timestamptz,
  locked_until    timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  constraint profiles_email_length check (char_length(email) <= 254),
  constraint profiles_lock_consistency check (
    (status = 'locked' and locked_until is not null)
    or (status <> 'locked' and locked_until is null)
  )
);

create unique index profiles_email_ci_uq on public.profiles (lower(email));

-- -----------------------------------------------------------------------------
-- 3. Companies, public content, memberships, and fixed receiver
-- -----------------------------------------------------------------------------
create table public.companies (
  id                      uuid primary key default gen_random_uuid(),
  identifier              varchar(80) not null,
  name                    varchar(120) not null,
  logo_path               text not null,
  brand_color             varchar(7),
  description             varchar(500),
  services_summary        varchar(1000),
  video_url               varchar(2048),
  public_contact_name     varchar(100),
  public_contact_title    varchar(100),
  public_contact_email    varchar(254),
  public_contact_phone    varchar(20),
  whatsapp_url            varchar(2048),
  telegram_url            varchar(2048),
  website_url             varchar(2048),
  address_or_map_url      varchar(2048),
  social_links            jsonb not null default '[]'::jsonb,
  sector                  varchar(120),
  status                  public.company_status not null default 'draft',
  unavailable_message     varchar(500),
  created_by              uuid references public.profiles(id) on delete set null,
  deactivated_at          timestamptz,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now(),
  constraint companies_identifier_format check (identifier ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  constraint companies_brand_color_format check (brand_color is null or brand_color ~ '^#[0-9A-Fa-f]{6}$'),
  constraint companies_social_links_array check (
    jsonb_typeof(social_links) = 'array' and jsonb_array_length(social_links) <= 5
  ),
  constraint companies_phone_format check (
    public_contact_phone is null or public_contact_phone ~ '^\+[1-9][0-9]{7,14}$'
  ),
  constraint companies_deactivation_consistency check (
    (status in ('inactive', 'archived') and deactivated_at is not null)
    or (status not in ('inactive', 'archived') and deactivated_at is null)
  )
);

create unique index companies_identifier_ci_uq on public.companies (lower(identifier));
create index companies_status_idx on public.companies (status);

create table public.company_services (
  id              uuid primary key default gen_random_uuid(),
  company_id      uuid not null references public.companies(id) on delete cascade,
  name            varchar(120) not null,
  description     varchar(500),
  display_order   smallint not null default 0 check (display_order >= 0),
  active          boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create unique index company_services_name_ci_uq
  on public.company_services (company_id, lower(name));
create index company_services_display_idx
  on public.company_services (company_id, active, display_order);

create table public.company_memberships (
  company_id              uuid not null references public.companies(id) on delete cascade,
  user_id                 uuid not null references public.profiles(id) on delete cascade,
  role                    public.membership_role not null default 'company_rep',
  can_edit_profile        boolean not null default false,
  can_view_leads          boolean not null default true,
  can_export_leads        boolean not null default false,
  can_update_lead_status  boolean not null default true,
  can_manage_notifications boolean not null default false,
  realtime_enabled        boolean not null default true,
  active                  boolean not null default true,
  created_by              uuid references public.profiles(id) on delete set null,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now(),
  primary key (company_id, user_id)
);

create index company_memberships_user_active_idx
  on public.company_memberships (user_id, active, company_id);

create table public.company_receiver_settings (
  company_id          uuid primary key references public.companies(id) on delete restrict,
  receiver_name       varchar(120) not null,
  enabled             boolean not null default true,
  updated_by          uuid not null references public.profiles(id) on delete restrict,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create table public.notification_destinations (
  id                   uuid primary key default gen_random_uuid(),
  company_id           uuid not null references public.company_receiver_settings(company_id) on delete cascade,
  channel              public.notification_channel not null,
  event_type           public.notification_event_type not null default 'lead_verified',
  frequency            public.notification_frequency not null default 'instant',
  digest_time_utc      time,
  destination_value    text not null,
  destination_hash     text not null,
  label                varchar(100),
  active               boolean not null default true,
  is_primary           boolean not null default false,
  created_by           uuid not null references public.profiles(id) on delete restrict,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),
  constraint notification_destination_email check (
    channel <> 'email' or destination_value ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
  ),
  constraint notification_destination_digest_time check (
    (frequency = 'instant' and digest_time_utc is null)
    or (frequency = 'daily_digest' and digest_time_utc is not null)
  )
);

create unique index notification_destinations_unique_uq
  on public.notification_destinations (company_id, event_type, channel, destination_hash);
create unique index notification_destinations_primary_channel_uq
  on public.notification_destinations (company_id, event_type, channel)
  where active and is_primary;

-- -----------------------------------------------------------------------------
-- 4. Campaigns, drivers, assignments, and permanent QR routes
-- -----------------------------------------------------------------------------
create table public.campaigns (
  id                    uuid primary key default gen_random_uuid(),
  company_id            uuid not null references public.companies(id) on delete restrict,
  name                  varchar(160) not null,
  campaign_type         public.campaign_type not null default 'lead_generation',
  status                public.campaign_status not null default 'draft',
  start_date            date not null,
  end_date              date not null,
  vehicle_count         integer not null default 20 check (vehicle_count > 0),
  target_leads          integer check (target_leads is null or target_leads >= 0),
  budget_etb            numeric(14,2) check (budget_etb is null or budget_etb >= 0),
  reward_type           varchar(80),
  reward_description    varchar(500),
  brochure_path         text,
  reward_unit_cost_etb  numeric(12,2) not null default 0 check (reward_unit_cost_etb >= 0),
  landing_page_config   jsonb not null default '{}'::jsonb,
  default_locale        varchar(10) not null default 'en',
  internal_notes        text,
  created_by            uuid references public.profiles(id) on delete set null,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  constraint campaigns_valid_dates check (end_date >= start_date),
  constraint campaigns_landing_config_object check (jsonb_typeof(landing_page_config) = 'object'),
  constraint campaigns_default_locale_format check (default_locale ~ '^[a-z]{2,3}(?:-[A-Z]{2})?$')
);

create index campaigns_company_status_dates_idx
  on public.campaigns (company_id, status, start_date, end_date);

create table public.campaign_zones (
  campaign_id   uuid not null references public.campaigns(id) on delete cascade,
  zone_name     varchar(120) not null,
  primary key (campaign_id, zone_name)
);

-- Localized campaign copy. One row per campaign and locale (for example en/am).
create table public.campaign_content (
  campaign_id          uuid not null references public.campaigns(id) on delete cascade,
  locale               varchar(10) not null,
  headline             varchar(180) not null,
  subheadline          varchar(300),
  description          text,
  offer_text           varchar(500),
  terms_text           text,
  reward_text          varchar(500),
  call_to_action       varchar(120) not null default 'Continue',
  privacy_notice_text  text,
  active               boolean not null default true,
  content_version      integer not null default 1 check (content_version >= 1),
  created_by           uuid references public.profiles(id) on delete set null,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),
  primary key (campaign_id, locale),
  constraint campaign_content_locale_format check (locale ~ '^[a-z]{2,3}(?:-[A-Z]{2})?$')
);

create index campaign_content_active_locale_idx
  on public.campaign_content (campaign_id, active, locale);


-- Replaceable campaign-specific promotional media. A driver QR stays permanent;
-- the active campaign decides which company video and copy the passenger sees.
-- External providers use video_url; Supabase Storage uses video_path.
create table public.campaign_videos (
  id                uuid primary key default gen_random_uuid(),
  campaign_id       uuid not null references public.campaigns(id) on delete cascade,
  provider          public.video_provider not null,
  video_url         varchar(2048),
  video_path        text,
  duration_seconds  smallint not null check (duration_seconds between 30 and 50),
  poster_path       text,
  caption           varchar(200),
  metadata          jsonb not null default '{}'::jsonb,
  active            boolean not null default false,
  validated_at      timestamptz,
  validated_by      uuid references public.profiles(id) on delete set null,
  created_by        uuid references public.profiles(id) on delete set null,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  constraint campaign_video_source_check check (
    (provider = 'supabase_storage' and video_path is not null and video_url is null)
    or
    (provider <> 'supabase_storage' and video_url is not null and video_path is null)
  ),
  constraint campaign_video_url_not_blank check (
    video_url is null or char_length(trim(video_url)) > 0
  ),
  constraint campaign_video_path_not_blank check (
    video_path is null or char_length(trim(video_path)) > 0
  ),
  constraint campaign_video_metadata_object check (jsonb_typeof(metadata) = 'object'),
  constraint campaign_video_validation_consistency check (
    (active and validated_at is not null)
    or not active
  )
);

create unique index one_active_campaign_video_uq
  on public.campaign_videos (campaign_id)
  where active;
create index campaign_videos_campaign_created_idx
  on public.campaign_videos (campaign_id, created_at desc);

create table public.drivers (
  id                uuid primary key default gen_random_uuid(),
  full_name         varchar(100) not null,
  phone_e164        varchar(20) not null,
  phone_hash        text not null,
  vehicle_plate     varchar(32),
  vehicle_type      varchar(50) not null default 'ride_share',
  primary_zone      varchar(120) not null,
  telegram_handle   varchar(64),
  telegram_user_id  bigint,
  status            public.driver_status not null default 'registered',
  compliance_score  numeric(5,2) not null default 100.00,
  notes             text,
  registered_at     timestamptz not null default now(),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  constraint drivers_phone_format check (phone_e164 ~ '^\+[1-9][0-9]{7,14}$'),
  constraint drivers_compliance_range check (compliance_score between 0 and 100)
);

create unique index drivers_phone_hash_uq on public.drivers (phone_hash);
create unique index drivers_telegram_user_uq on public.drivers (telegram_user_id) where telegram_user_id is not null;
create unique index drivers_vehicle_plate_ci_uq on public.drivers (lower(vehicle_plate)) where vehicle_plate is not null;
create index drivers_status_zone_idx on public.drivers (status, primary_zone);

create table public.driver_campaign_assignments (
  id            uuid primary key default gen_random_uuid(),
  driver_id     uuid not null references public.drivers(id) on delete restrict,
  campaign_id   uuid not null references public.campaigns(id) on delete restrict,
  status        public.assignment_status not null default 'active',
  assigned_by   uuid references public.profiles(id) on delete set null,
  assigned_at   timestamptz not null default now(),
  ended_at      timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  constraint assignments_end_consistency check (
    (status = 'active' and ended_at is null) or (status <> 'active' and ended_at is not null)
  ),
  unique (driver_id, campaign_id)
);

-- A permanent driver QR resolves deterministically to one active campaign.
create unique index one_active_campaign_per_driver_uq
  on public.driver_campaign_assignments (driver_id)
  where status = 'active';
create index assignments_campaign_status_idx
  on public.driver_campaign_assignments (campaign_id, status, driver_id);

-- Permanent public QR identity.
-- Architecture wording may call the dynamic driver URL segment a "qr_token";
-- in v4 that stable public token is stored as qr_codes.public_path/token, not
-- on drivers. This keeps company and driver QR routes under one model.
create table public.qr_codes (
  id                uuid primary key default gen_random_uuid(),
  qr_type           public.qr_code_type not null,
  company_id        uuid not null references public.companies(id) on delete restrict,
  driver_id         uuid references public.drivers(id) on delete restrict,
  token             uuid not null default gen_random_uuid(),
  public_path       varchar(180) not null,
  image_path        text,
  error_correction  char(1) not null default 'H' check (error_correction in ('L', 'M', 'Q', 'H')),
  status            public.qr_code_status not null default 'active',
  retired_at        timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  constraint qr_code_target_check check (
    (qr_type = 'company' and driver_id is null)
    or (qr_type = 'driver' and driver_id is not null)
  ),
  constraint qr_code_retired_consistency check (
    (status = 'retired' and retired_at is not null) or status <> 'retired'
  )
);

create unique index qr_codes_token_uq on public.qr_codes (token);
create unique index qr_codes_public_path_uq on public.qr_codes (public_path);
create unique index one_active_company_qr_uq
  on public.qr_codes (company_id)
  where qr_type = 'company' and status = 'active';
create unique index one_active_driver_qr_uq
  on public.qr_codes (driver_id)
  where qr_type = 'driver' and status = 'active';
create index qr_codes_company_status_idx on public.qr_codes (company_id, status);

-- -----------------------------------------------------------------------------
-- 5. Lead capture, verification, privacy, and fraud
-- -----------------------------------------------------------------------------
create table public.leads (
  id                         uuid primary key default gen_random_uuid(),
  idempotency_key            uuid not null,
  company_id                 uuid not null references public.companies(id) on delete restrict,
  campaign_id                uuid references public.campaigns(id) on delete set null,
  campaign_video_id          uuid references public.campaign_videos(id) on delete restrict,
  driver_id                  uuid references public.drivers(id) on delete set null,
  qr_code_id                 uuid not null references public.qr_codes(id) on delete restrict,
  service_id                 uuid references public.company_services(id) on delete set null,
  full_name                  varchar(100) not null,
  phone_e164                 varchar(20) not null,
  phone_hash                 text not null,
  email                      varchar(254),
  organization               varchar(120),
  interested_service_text    varchar(200),
  message                    varchar(1000),
  preferred_contact_method   public.preferred_contact_method,
  verification_status        public.lead_verification_status not null default 'submitted',
  status                     public.lead_status not null default 'new',
  ip_hash                    text not null,
  device_fingerprint_hash    text,
  consent_given              boolean not null,
  consent_at                 timestamptz not null,
  privacy_notice_version     varchar(40) not null,
  notification_status        public.notification_summary_status not null default 'waiting_verification',
  viewed_at                  timestamptz,
  followed_up_at             timestamptz,
  converted_at               timestamptz,
  archived_at                timestamptz,
  deleted_at                 timestamptz,
  created_at                 timestamptz not null default now(),
  updated_at                 timestamptz not null default now(),
  constraint leads_phone_format check (phone_e164 ~ '^\+[1-9][0-9]{7,14}$'),
  constraint leads_email_basic_format check (email is null or email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  constraint leads_consent_required check (consent_given = true),
  constraint leads_status_timestamps check (
    (status <> 'viewed' or viewed_at is not null)
    and (status <> 'followed_up' or followed_up_at is not null)
    and (status <> 'converted' or converted_at is not null)
    and (status <> 'archived' or archived_at is not null)
  )
);

create unique index leads_company_idempotency_uq on public.leads (company_id, idempotency_key);
create index leads_company_created_idx on public.leads (company_id, created_at desc);
create index leads_company_status_created_idx on public.leads (company_id, status, created_at desc);
create index leads_campaign_created_idx on public.leads (campaign_id, created_at desc) where campaign_id is not null;
create index leads_campaign_video_created_idx on public.leads (campaign_video_id, created_at desc) where campaign_video_id is not null;
create index leads_driver_created_idx on public.leads (driver_id, created_at desc) where driver_id is not null;
create index leads_company_phone_hash_created_idx on public.leads (company_id, phone_hash, created_at desc);
create index leads_company_ip_hash_created_idx on public.leads (company_id, ip_hash, created_at desc);
create index leads_created_brin_idx on public.leads using brin (created_at);
create index leads_full_name_trgm_idx on public.leads using gin (lower(full_name) extensions.gin_trgm_ops);
create index leads_email_trgm_idx on public.leads using gin (lower(email) extensions.gin_trgm_ops) where email is not null;

create table public.lead_status_history (
  id           uuid primary key default gen_random_uuid(),
  lead_id      uuid not null references public.leads(id) on delete cascade,
  old_status   public.lead_status,
  new_status   public.lead_status not null,
  changed_by   uuid references public.profiles(id) on delete set null,
  note         varchar(1000),
  created_at   timestamptz not null default now()
);

create index lead_status_history_lead_created_idx
  on public.lead_status_history (lead_id, created_at desc);


-- Follow-up calls, messages, appointments, and notes. This is richer than a
-- single lead status and provides a defensible activity timeline.
create table public.lead_activities (
  id                  uuid primary key default gen_random_uuid(),
  lead_id             uuid not null references public.leads(id) on delete cascade,
  company_id          uuid not null references public.companies(id) on delete restrict,
  activity_type       public.lead_activity_type not null,
  status              public.lead_activity_status not null default 'planned',
  assigned_to         uuid references public.profiles(id) on delete set null,
  performed_by        uuid references public.profiles(id) on delete set null,
  scheduled_at        timestamptz,
  started_at          timestamptz,
  completed_at        timestamptz,
  outcome_code        varchar(80),
  notes               varchar(2000),
  external_reference  varchar(200),
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  constraint lead_activity_time_order check (
    (started_at is null or scheduled_at is null or started_at >= scheduled_at - interval '24 hours')
    and (completed_at is null or started_at is null or completed_at >= started_at)
  ),
  constraint lead_activity_completion_consistency check (
    (status = 'completed' and completed_at is not null)
    or (status <> 'completed')
  )
);

create index lead_activities_lead_time_idx
  on public.lead_activities (lead_id, coalesce(completed_at, scheduled_at, created_at) desc);
create index lead_activities_company_status_schedule_idx
  on public.lead_activities (company_id, status, scheduled_at)
  where status in ('planned', 'in_progress');



-- Passenger feedback is intentionally separate from the original lead inquiry.
-- One verified lead may submit one star rating and one optional comment. The row
-- is published through Supabase Realtime and may also create email/Telegram
-- notification jobs for the company's fixed destinations.
create table public.lead_feedback (
  id                    uuid primary key default gen_random_uuid(),
  idempotency_key       uuid not null,
  lead_id               uuid not null unique references public.leads(id) on delete cascade,
  company_id            uuid not null references public.companies(id) on delete restrict,
  campaign_id           uuid references public.campaigns(id) on delete set null,
  driver_id             uuid references public.drivers(id) on delete set null,
  qr_code_id            uuid not null references public.qr_codes(id) on delete restrict,
  content_locale        varchar(10),
  content_version       integer,
  rating                smallint not null check (rating between 1 and 5),
  comment               varchar(1000),
  status                public.feedback_status not null default 'new',
  notification_status   public.notification_summary_status not null default 'pending',
  viewed_at             timestamptz,
  viewed_by             uuid references public.profiles(id) on delete set null,
  actioned_at           timestamptz,
  actioned_by           uuid references public.profiles(id) on delete set null,
  archived_at           timestamptz,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  constraint lead_feedback_locale_format check (
    content_locale is null or content_locale ~ '^[a-z]{2,3}(?:-[A-Z]{2})?$'
  ),
  constraint lead_feedback_content_version check (
    content_version is null or content_version >= 1
  ),
  constraint lead_feedback_comment_not_blank check (
    comment is null or char_length(trim(comment)) > 0
  ),
  constraint lead_feedback_status_timestamps check (
    (status <> 'viewed' or viewed_at is not null)
    and (status <> 'actioned' or actioned_at is not null)
    and (status <> 'archived' or archived_at is not null)
  )
);

create unique index lead_feedback_company_idempotency_uq
  on public.lead_feedback (company_id, idempotency_key);
create index lead_feedback_company_status_created_idx
  on public.lead_feedback (company_id, status, created_at desc);
create index lead_feedback_company_rating_created_idx
  on public.lead_feedback (company_id, rating, created_at desc);
create index lead_feedback_campaign_created_idx
  on public.lead_feedback (campaign_id, created_at desc)
  where campaign_id is not null;
create index lead_feedback_unread_idx
  on public.lead_feedback (company_id, created_at desc)
  where status = 'new';

-- Dashboard-ready rating aggregates. SECURITY INVOKER makes the view obey the
-- caller's RLS permissions on lead_feedback.
create view public.campaign_feedback_summary
with (security_invoker = true)
as
select
  company_id,
  campaign_id,
  count(*)::bigint as feedback_count,
  round(avg(rating)::numeric, 2) as average_rating,
  count(*) filter (where rating = 1)::bigint as one_star_count,
  count(*) filter (where rating = 2)::bigint as two_star_count,
  count(*) filter (where rating = 3)::bigint as three_star_count,
  count(*) filter (where rating = 4)::bigint as four_star_count,
  count(*) filter (where rating = 5)::bigint as five_star_count,
  count(*) filter (where comment is not null)::bigint as comment_count,
  max(created_at) as last_feedback_at
from public.lead_feedback
where status <> 'archived'
group by company_id, campaign_id;

-- Rating analytics for the exact promotional video shown when the lead was
-- captured. SECURITY INVOKER preserves company RLS on both source tables.
create view public.campaign_video_feedback_summary
with (security_invoker = true)
as
select
  l.company_id,
  l.campaign_id,
  l.campaign_video_id,
  count(*)::bigint as feedback_count,
  round(avg(f.rating)::numeric, 2) as average_rating,
  count(*) filter (where f.rating = 1)::bigint as one_star_count,
  count(*) filter (where f.rating = 2)::bigint as two_star_count,
  count(*) filter (where f.rating = 3)::bigint as three_star_count,
  count(*) filter (where f.rating = 4)::bigint as four_star_count,
  count(*) filter (where f.rating = 5)::bigint as five_star_count,
  count(*) filter (where f.comment is not null)::bigint as comment_count,
  max(f.created_at) as last_feedback_at
from public.lead_feedback f
join public.leads l on l.id = f.lead_id
where f.status <> 'archived'
  and l.campaign_video_id is not null
group by l.company_id, l.campaign_id, l.campaign_video_id;


create table public.otp_verifications (
  id               uuid primary key default gen_random_uuid(),
  lead_id          uuid not null references public.leads(id) on delete cascade,
  phone_hash       text not null,
  code_hash        text not null,
  status           public.otp_status not null default 'created',
  attempts         smallint not null default 0 check (attempts between 0 and 3),
  expires_at       timestamptz not null,
  last_attempt_at  timestamptz,
  verified_at      timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  constraint otp_expiry_after_creation check (expires_at > created_at),
  constraint otp_verified_consistency check (
    (status = 'verified' and verified_at is not null) or status <> 'verified'
  )
);

create unique index one_open_otp_per_lead_uq
  on public.otp_verifications (lead_id)
  where status in ('created', 'send_pending', 'sent');
create index otp_expiry_idx on public.otp_verifications (status, expires_at);


-- SMS provider lifecycle for OTP delivery. Provider responses may be updated
-- asynchronously by Africa's Talking delivery-receipt webhooks.
create table public.otp_delivery_attempts (
  id                    uuid primary key default gen_random_uuid(),
  otp_verification_id   uuid not null references public.otp_verifications(id) on delete cascade,
  attempt_number        smallint not null check (attempt_number between 1 and 4),
  provider              varchar(80) not null default 'africas_talking',
  provider_message_id   text,
  destination_hash      text not null,
  status                public.otp_delivery_status not null default 'pending',
  provider_status_code  varchar(100),
  provider_response     jsonb,
  error_code            varchar(100),
  error_message         text,
  attempted_at          timestamptz not null default now(),
  accepted_at           timestamptz,
  delivered_at          timestamptz,
  failed_at             timestamptz,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  unique (otp_verification_id, attempt_number),
  constraint otp_delivery_provider_response_object check (
    provider_response is null or jsonb_typeof(provider_response) = 'object'
  ),
  constraint otp_delivery_status_timestamps check (
    (status <> 'accepted' or accepted_at is not null)
    and (status <> 'delivered' or delivered_at is not null)
    and (status <> 'failed' or failed_at is not null)
  )
);

create unique index otp_delivery_provider_message_uq
  on public.otp_delivery_attempts (provider, provider_message_id)
  where provider_message_id is not null;
create index otp_delivery_attempts_worker_idx
  on public.otp_delivery_attempts (status, attempted_at)
  where status in ('pending', 'accepted');

create table public.fraud_flags (
  id            uuid primary key default gen_random_uuid(),
  lead_id       uuid not null references public.leads(id) on delete cascade,
  driver_id     uuid references public.drivers(id) on delete set null,
  flag_type     public.fraud_flag_type not null,
  flag_reason   varchar(1000) not null,
  evidence      jsonb not null default '{}'::jsonb,
  resolved      boolean not null default false,
  resolved_by   uuid references public.profiles(id) on delete set null,
  resolved_at   timestamptz,
  created_at    timestamptz not null default now(),
  constraint fraud_evidence_object check (jsonb_typeof(evidence) = 'object'),
  constraint fraud_resolution_consistency check (
    (resolved and resolved_at is not null and resolved_by is not null)
    or (not resolved and resolved_at is null)
  )
);

create unique index fraud_flags_open_type_uq
  on public.fraud_flags (lead_id, flag_type)
  where not resolved;
create index fraud_flags_unresolved_created_idx
  on public.fraud_flags (created_at desc)
  where not resolved;


-- Append-preserving lead quality and billing decision. Only one row may be
-- current for a lead; a new decision supersedes the previous one.
create table public.lead_quality_decisions (
  id               uuid primary key default gen_random_uuid(),
  lead_id          uuid not null references public.leads(id) on delete cascade,
  company_id       uuid not null references public.companies(id) on delete restrict,
  campaign_id      uuid references public.campaigns(id) on delete set null,
  quality_status   public.lead_quality_status not null,
  billable         boolean,
  decision_source  public.lead_quality_source not null,
  reason_code      varchar(100) not null,
  reason_detail    varchar(1000),
  risk_score       numeric(5,2) check (risk_score is null or risk_score between 0 and 100),
  rule_version     varchar(80),
  is_current       boolean not null default true,
  supersedes_id    uuid references public.lead_quality_decisions(id) on delete restrict,
  superseded_at    timestamptz,
  decided_by       uuid references public.profiles(id) on delete set null,
  decided_at       timestamptz not null default now(),
  created_at       timestamptz not null default now(),
  constraint lead_quality_billable_consistency check (
    (quality_status in ('pending', 'fraud_suspected') and billable is null)
    or (quality_status = 'qualified' and billable is true)
    or (quality_status in ('duplicate', 'fraud_confirmed', 'invalid_phone', 'invalid_other', 'rejected') and billable is false)
  ),
  constraint lead_quality_source_consistency check (
    (decision_source = 'manual_review' and decided_by is not null)
    or (decision_source = 'rule_engine' and rule_version is not null)
    or decision_source = 'system'
  ),
  constraint lead_quality_current_consistency check (
    (is_current and superseded_at is null) or (not is_current and superseded_at is not null)
  )
);

create unique index one_current_quality_decision_per_lead_uq
  on public.lead_quality_decisions (lead_id)
  where is_current;
create index lead_quality_company_billable_idx
  on public.lead_quality_decisions (company_id, billable, decided_at desc)
  where is_current;
create index lead_quality_campaign_status_idx
  on public.lead_quality_decisions (campaign_id, quality_status, decided_at desc)
  where is_current and campaign_id is not null;

-- One passenger reward record per lead. The campaign reward details are copied
-- as a snapshot so later campaign edits cannot rewrite historical obligations.
create table public.reward_issuances (
  id                       uuid primary key default gen_random_uuid(),
  lead_id                  uuid not null unique references public.leads(id) on delete restrict,
  company_id               uuid not null references public.companies(id) on delete restrict,
  campaign_id              uuid not null references public.campaigns(id) on delete restrict,
  driver_id                uuid references public.drivers(id) on delete set null,
  reward_type              varchar(80) not null,
  reward_description       varchar(500),
  status                   public.reward_issuance_status not null default 'pending',
  redemption_token_hash    text,
  external_reference       varchar(200),
  issued_at                timestamptz,
  redeemed_at              timestamptz,
  expires_at               timestamptz,
  cancelled_at             timestamptz,
  cancellation_reason      varchar(500),
  issued_by                uuid references public.profiles(id) on delete set null,
  redeemed_by              uuid references public.profiles(id) on delete set null,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now(),
  constraint reward_status_timestamps check (
    (status <> 'issued' or issued_at is not null)
    and (status <> 'redeemed' or (issued_at is not null and redeemed_at is not null))
    and (status <> 'cancelled' or cancelled_at is not null)
  ),
  constraint reward_expiry_after_issue check (
    expires_at is null or issued_at is null or expires_at > issued_at
  )
);

create unique index reward_redemption_token_hash_uq
  on public.reward_issuances (redemption_token_hash)
  where redemption_token_hash is not null;
create index reward_issuances_company_status_idx
  on public.reward_issuances (company_id, status, created_at desc);
create index reward_issuances_campaign_status_idx
  on public.reward_issuances (campaign_id, status, created_at desc);

create table public.landing_page_visits (
  id                       uuid primary key default gen_random_uuid(),
  qr_code_id               uuid not null references public.qr_codes(id) on delete restrict,
  company_id               uuid not null references public.companies(id) on delete restrict,
  campaign_id              uuid references public.campaigns(id) on delete set null,
  driver_id                uuid references public.drivers(id) on delete set null,
  ip_hash                  text,
  session_hash             text,
  device_category          varchar(30),
  user_agent_summary       varchar(255),
  referrer_domain          varchar(255),
  created_at               timestamptz not null default now()
);

create index visits_company_created_idx on public.landing_page_visits (company_id, created_at desc);
create index visits_campaign_created_idx on public.landing_page_visits (campaign_id, created_at desc) where campaign_id is not null;
create index visits_created_brin_idx on public.landing_page_visits using brin (created_at);

-- -----------------------------------------------------------------------------
-- 6. Durable notification outbox and attempt history
-- -----------------------------------------------------------------------------
create table public.notification_digest_batches (
  id                uuid primary key default gen_random_uuid(),
  company_id        uuid not null references public.companies(id) on delete restrict,
  destination_id    uuid not null references public.notification_destinations(id) on delete restrict,
  event_type        public.notification_event_type not null,
  digest_for_date   date not null,
  scheduled_for     timestamptz not null,
  status            public.notification_digest_status not null default 'pending',
  job_count         integer not null default 0 check (job_count >= 0),
  locked_at         timestamptz,
  locked_by         varchar(100),
  sent_at           timestamptz,
  last_error        text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  constraint notification_digest_sent_consistency check (
    (status = 'sent' and sent_at is not null) or status <> 'sent'
  )
);

create unique index notification_digest_batches_unique_uq
  on public.notification_digest_batches (destination_id, event_type, digest_for_date);
create index notification_digest_batches_worker_idx
  on public.notification_digest_batches (status, scheduled_for, created_at)
  where status in ('pending', 'processing');

create table public.notification_jobs (
  id                    uuid primary key default gen_random_uuid(),
  event_type            public.notification_event_type not null,
  lead_id               uuid not null references public.leads(id) on delete cascade,
  feedback_id           uuid references public.lead_feedback(id) on delete cascade,
  destination_id        uuid not null references public.notification_destinations(id) on delete restrict,
  digest_batch_id       uuid references public.notification_digest_batches(id) on delete set null,
  channel               public.notification_channel not null,
  delivery_frequency    public.notification_frequency not null default 'instant',
  status                public.notification_job_status not null default 'pending',
  attempt_count         smallint not null default 0 check (attempt_count between 0 and 4),
  next_attempt_at       timestamptz not null default now(),
  locked_at             timestamptz,
  locked_by             varchar(100),
  sent_at               timestamptz,
  provider_message_id   text,
  last_error            text,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  constraint notification_job_event_context check (
    (event_type = 'lead_verified' and feedback_id is null)
    or (event_type = 'feedback_received' and feedback_id is not null)
  ),
  constraint notification_sent_consistency check (
    (status = 'sent' and sent_at is not null) or status <> 'sent'
  )
);

create unique index notification_jobs_lead_verified_uq
  on public.notification_jobs (lead_id, destination_id)
  where event_type = 'lead_verified';
create unique index notification_jobs_feedback_uq
  on public.notification_jobs (feedback_id, destination_id)
  where event_type = 'feedback_received';
create index notification_jobs_worker_idx
  on public.notification_jobs (status, next_attempt_at, created_at)
  where status in ('pending', 'retry');
create index notification_jobs_digest_idx
  on public.notification_jobs (delivery_frequency, digest_batch_id, next_attempt_at)
  where status in ('pending', 'retry') and delivery_frequency = 'daily_digest';
create index notification_jobs_lead_idx
  on public.notification_jobs (lead_id, event_type, status);
create index notification_jobs_feedback_idx
  on public.notification_jobs (feedback_id, status)
  where feedback_id is not null;

create table public.notification_attempts (
  id                  uuid primary key default gen_random_uuid(),
  job_id              uuid not null references public.notification_jobs(id) on delete cascade,
  attempt_number      smallint not null check (attempt_number between 1 and 4),
  status              public.notification_attempt_status not null,
  provider_code       varchar(100),
  provider_response   jsonb,
  error_message       text,
  duration_ms         integer check (duration_ms is null or duration_ms >= 0),
  attempted_at        timestamptz not null default now(),
  completed_at        timestamptz,
  unique (job_id, attempt_number)
);

create index notification_attempts_job_idx
  on public.notification_attempts (job_id, attempt_number);

-- -----------------------------------------------------------------------------
-- 7. Driver operations, inventory ledger, bonuses, and finance
-- -----------------------------------------------------------------------------
create table public.driver_compliance_records (
  id                   uuid primary key default gen_random_uuid(),
  driver_id            uuid not null references public.drivers(id) on delete restrict,
  campaign_id          uuid not null references public.campaigns(id) on delete restrict,
  record_date          date not null,
  checkin_photo_path   text,
  checkin_time         timestamptz,
  inventory_reported   integer check (inventory_reported is null or inventory_reported >= 0),
  compliance_flag      boolean not null default false,
  flag_reason          varchar(1000),
  recorded_by          uuid references public.profiles(id) on delete set null,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),
  unique (driver_id, campaign_id, record_date)
);

create index compliance_campaign_date_idx
  on public.driver_compliance_records (campaign_id, record_date desc);

create table public.inventory_movements (
  id              uuid primary key default gen_random_uuid(),
  driver_id       uuid not null references public.drivers(id) on delete restrict,
  campaign_id     uuid not null references public.campaigns(id) on delete restrict,
  movement_type   public.inventory_movement_type not null,
  quantity        integer not null check (quantity > 0),
  occurred_at     timestamptz not null default now(),
  recorded_by     uuid references public.profiles(id) on delete set null,
  notes           varchar(1000),
  created_at      timestamptz not null default now()
);

create index inventory_driver_campaign_time_idx
  on public.inventory_movements (driver_id, campaign_id, occurred_at desc);

create table public.driver_bonuses (
  id                           uuid primary key default gen_random_uuid(),
  driver_id                    uuid not null references public.drivers(id) on delete restrict,
  campaign_id                  uuid not null references public.campaigns(id) on delete restrict,
  base_fee_etb                 numeric(12,2) not null default 0 check (base_fee_etb >= 0),
  lead_bonus_etb               numeric(12,2) not null default 0 check (lead_bonus_etb >= 0),
  top_driver_prize_etb         numeric(12,2) not null default 0 check (top_driver_prize_etb >= 0),
  compliance_deduction_etb     numeric(12,2) not null default 0 check (compliance_deduction_etb >= 0),
  verified_leads_count         integer not null default 0 check (verified_leads_count >= 0),
  compliance_score_at_close    numeric(5,2) check (compliance_score_at_close between 0 and 100),
  calculation_snapshot         jsonb not null default '{}'::jsonb,
  status                       public.bonus_status not null default 'pending',
  approved_by                  uuid references public.profiles(id) on delete set null,
  approved_at                  timestamptz,
  paid_at                      timestamptz,
  notes                        varchar(1000),
  created_at                   timestamptz not null default now(),
  updated_at                   timestamptz not null default now(),
  unique (driver_id, campaign_id),
  constraint bonus_approval_consistency check (
    (status in ('approved', 'paid') and approved_by is not null and approved_at is not null)
    or status not in ('approved', 'paid')
  ),
  constraint bonus_paid_consistency check ((status = 'paid' and paid_at is not null) or status <> 'paid')
);

create table public.invoices (
  id                 uuid primary key default gen_random_uuid(),
  company_id         uuid not null references public.companies(id) on delete restrict,
  campaign_id        uuid not null references public.campaigns(id) on delete restrict,
  invoice_number     varchar(50) not null,
  status             public.invoice_status not null default 'draft',
  amount_etb         numeric(14,2) not null check (amount_etb >= 0),
  due_date           date,
  issued_at          timestamptz,
  created_by         uuid references public.profiles(id) on delete set null,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create unique index invoices_number_ci_uq on public.invoices (lower(invoice_number));
create index invoices_company_status_idx on public.invoices (company_id, status, due_date);

create table public.invoice_payments (
  id                 uuid primary key default gen_random_uuid(),
  invoice_id         uuid not null references public.invoices(id) on delete restrict,
  amount_etb         numeric(14,2) not null check (amount_etb > 0),
  payment_reference  varchar(120),
  paid_at            timestamptz not null,
  recorded_by        uuid references public.profiles(id) on delete set null,
  created_at         timestamptz not null default now()
);

create index invoice_payments_invoice_idx on public.invoice_payments (invoice_id, paid_at desc);

-- -----------------------------------------------------------------------------
-- 8. Governance, auditing, security state, and privacy requests
-- -----------------------------------------------------------------------------
create table public.audit_logs (
  id               uuid primary key default gen_random_uuid(),
  actor_id         uuid references public.profiles(id) on delete set null,
  actor_role       varchar(40),
  action           varchar(120) not null,
  entity_type      varchar(80) not null,
  entity_id        uuid,
  company_id       uuid references public.companies(id) on delete set null,
  details          jsonb not null default '{}'::jsonb,
  ip_hash          text,
  request_id       uuid,
  created_at       timestamptz not null default now(),
  constraint audit_details_object check (jsonb_typeof(details) = 'object')
);

create index audit_logs_actor_created_idx on public.audit_logs (actor_id, created_at desc);
create index audit_logs_company_created_idx on public.audit_logs (company_id, created_at desc);
create index audit_logs_entity_idx on public.audit_logs (entity_type, entity_id, created_at desc);
create index audit_logs_created_brin_idx on public.audit_logs using brin (created_at);

create table public.login_security_events (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid references public.profiles(id) on delete set null,
  email_hash       text not null,
  ip_hash          text not null,
  success          boolean not null,
  failure_reason   varchar(120),
  device_hash      text,
  created_at       timestamptz not null default now()
);

create index login_security_email_time_idx
  on public.login_security_events (email_hash, created_at desc);
create index login_security_ip_time_idx
  on public.login_security_events (ip_hash, created_at desc);

create table public.user_session_controls (
  session_id        uuid primary key,
  user_id           uuid not null references public.profiles(id) on delete cascade,
  device_hash       text not null,
  started_at        timestamptz not null default now(),
  last_activity_at  timestamptz not null default now(),
  revoked_at        timestamptz,
  created_at        timestamptz not null default now()
);

create index user_session_controls_active_idx
  on public.user_session_controls (user_id, last_activity_at desc)
  where revoked_at is null;

create table public.data_deletion_requests (
  id                 uuid primary key default gen_random_uuid(),
  company_id         uuid not null references public.companies(id) on delete restrict,
  lead_id            uuid references public.leads(id) on delete set null,
  requester_name     varchar(100),
  requester_contact  varchar(254) not null,
  verification_hash  text,
  status             public.deletion_request_status not null default 'received',
  handled_by         uuid references public.profiles(id) on delete set null,
  handled_at         timestamptz,
  notes              varchar(1000),
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  constraint deletion_handled_consistency check (
    (status in ('completed', 'rejected') and handled_by is not null and handled_at is not null)
    or status not in ('completed', 'rejected')
  )
);

create index deletion_requests_status_created_idx
  on public.data_deletion_requests (status, created_at);

-- -----------------------------------------------------------------------------
-- 9. Trigger functions and invariants
-- -----------------------------------------------------------------------------
create or replace function private.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function private.prevent_immutable_field_change()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if tg_table_name = 'companies' and new.identifier is distinct from old.identifier then
    raise exception using errcode = '23514', message = 'company_identifier_is_immutable';
  end if;
  if tg_table_name = 'qr_codes' and (
    new.token is distinct from old.token
    or new.public_path is distinct from old.public_path
    or new.qr_type is distinct from old.qr_type
    or new.company_id is distinct from old.company_id
    or new.driver_id is distinct from old.driver_id
  ) then
    raise exception using errcode = '23514', message = 'qr_route_identity_is_immutable';
  end if;
  return new;
end;
$$;

create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, coalesce(new.email, ''), nullif(new.raw_user_meta_data ->> 'full_name', ''))
  on conflict (id) do nothing;
  return new;
end;
$$;

create or replace function private.sync_user_email()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.profiles
  set email = coalesce(new.email, email), updated_at = now()
  where id = new.id;
  return new;
end;
$$;

create or replace function private.enforce_company_member_limit()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_limit integer;
  v_count integer;
begin
  if new.active then
    select max_company_representatives into v_limit
    from public.app_settings where id = 1;

    v_limit := coalesce(v_limit, 5);

    select count(*) into v_count
    from public.company_memberships m
    where m.company_id = new.company_id
      and m.active
      and m.user_id <> new.user_id;

    if v_count >= v_limit then
      raise exception using errcode = '23514', message = 'company_representative_limit_reached';
    end if;
  end if;
  return new;
end;
$$;

create or replace function private.validate_lead_context()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_qr public.qr_codes%rowtype;
  v_campaign_company uuid;
  v_video_campaign uuid;
  v_service_company uuid;
begin
  select * into v_qr from public.qr_codes where id = new.qr_code_id;
  if not found or v_qr.status <> 'active' then
    raise exception using errcode = '23514', message = 'invalid_or_inactive_qr_code';
  end if;

  if v_qr.company_id <> new.company_id then
    raise exception using errcode = '23514', message = 'lead_company_qr_mismatch';
  end if;

  if v_qr.qr_type = 'driver' and v_qr.driver_id is distinct from new.driver_id then
    raise exception using errcode = '23514', message = 'lead_driver_qr_mismatch';
  end if;

  if v_qr.qr_type = 'company' and new.driver_id is not null then
    raise exception using errcode = '23514', message = 'company_qr_cannot_set_driver';
  end if;

  if new.campaign_id is not null then
    select company_id into v_campaign_company from public.campaigns where id = new.campaign_id;
    if v_campaign_company is distinct from new.company_id then
      raise exception using errcode = '23514', message = 'lead_campaign_company_mismatch';
    end if;
  end if;

  if new.campaign_video_id is not null then
    select campaign_id into v_video_campaign
    from public.campaign_videos
    where id = new.campaign_video_id
      and active;

    if v_video_campaign is null
       or v_video_campaign is distinct from new.campaign_id then
      raise exception using errcode = '23514', message = 'lead_campaign_video_mismatch';
    end if;
  end if;

  if new.driver_id is not null and new.campaign_id is not null and not exists (
    select 1
    from public.driver_campaign_assignments a
    where a.driver_id = new.driver_id
      and a.campaign_id = new.campaign_id
      and a.status = 'active'
  ) then
    raise exception using errcode = '23514', message = 'driver_not_assigned_to_campaign';
  end if;

  if new.service_id is not null then
    select company_id into v_service_company from public.company_services where id = new.service_id;
    if v_service_company is distinct from new.company_id then
      raise exception using errcode = '23514', message = 'lead_service_company_mismatch';
    end if;
  end if;

  return new;
end;
$$;

create or replace function private.next_daily_digest_at(
  p_digest_time_utc time
)
returns timestamptz
language sql
stable
set search_path = ''
as $$
  with candidate as (
    select (current_date + p_digest_time_utc) at time zone 'UTC' as next_at
  )
  select case
    when next_at > now() then next_at
    else next_at + interval '1 day'
  end
  from candidate;
$$;

create or replace function private.get_or_create_notification_digest_batch(
  p_destination_id uuid,
  p_event_type public.notification_event_type,
  p_scheduled_for timestamptz
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_company_id uuid;
  v_batch_id uuid;
begin
  select d.company_id into v_company_id
  from public.notification_destinations d
  where d.id = p_destination_id;

  if v_company_id is null then
    raise exception using errcode = '23503', message = 'notification_destination_not_found';
  end if;

  insert into public.notification_digest_batches (
    company_id, destination_id, event_type, digest_for_date, scheduled_for
  ) values (
    v_company_id,
    p_destination_id,
    p_event_type,
    (p_scheduled_for at time zone 'UTC')::date,
    p_scheduled_for
  )
  on conflict (destination_id, event_type, digest_for_date)
  do update set updated_at = now()
  returning id into v_batch_id;

  return v_batch_id;
end;
$$;

create or replace function private.enqueue_lead_notifications()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_inserted integer;
begin
  if new.verification_status not in ('otp_verified', 'call_verified') then
    return new;
  end if;

  if tg_op = 'UPDATE' and old.verification_status in ('otp_verified', 'call_verified') then
    return new;
  end if;

  update public.leads
  set notification_status = 'pending'
  where id = new.id;

  insert into public.notification_jobs (
    event_type, lead_id, destination_id, digest_batch_id, channel,
    delivery_frequency, next_attempt_at
  )
  select
    'lead_verified',
    new.id,
    d.id,
    case
      when d.frequency = 'daily_digest'
        then private.get_or_create_notification_digest_batch(d.id, 'lead_verified', schedule.next_attempt_at)
      else null
    end,
    d.channel,
    d.frequency,
    schedule.next_attempt_at
  from public.notification_destinations d
  join public.company_receiver_settings r on r.company_id = d.company_id
  cross join lateral (
    select case
      when d.frequency = 'daily_digest' then private.next_daily_digest_at(d.digest_time_utc)
      else now()
    end as next_attempt_at
  ) schedule
  where d.company_id = new.company_id
    and d.event_type = 'lead_verified'
    and d.active
    and r.enabled
  on conflict (lead_id, destination_id) do nothing;

  get diagnostics v_inserted = row_count;

  if v_inserted = 0 then
    update public.leads
    set notification_status = 'not_configured'
    where id = new.id;
  end if;

  return new;
end;
$$;

create or replace function private.sync_notification_summary()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_total integer;
  v_sent integer;
  v_failed integer;
  v_summary public.notification_summary_status;
begin
  if new.event_type = 'feedback_received' then
    select
      count(*),
      count(*) filter (where status = 'sent'),
      count(*) filter (where status = 'dead_letter')
    into v_total, v_sent, v_failed
    from public.notification_jobs
    where feedback_id = new.feedback_id
      and event_type = 'feedback_received';
  else
    select
      count(*),
      count(*) filter (where status = 'sent'),
      count(*) filter (where status = 'dead_letter')
    into v_total, v_sent, v_failed
    from public.notification_jobs
    where lead_id = new.lead_id
      and event_type = 'lead_verified';
  end if;

  v_summary := case
    when v_total = 0 then 'not_configured'::public.notification_summary_status
    when v_sent = v_total then 'sent'::public.notification_summary_status
    when v_sent > 0 and v_failed > 0 then 'partially_sent'::public.notification_summary_status
    when v_failed = v_total then 'failed'::public.notification_summary_status
    else 'pending'::public.notification_summary_status
  end;

  if new.event_type = 'feedback_received' then
    update public.lead_feedback
    set notification_status = v_summary
    where id = new.feedback_id;
  else
    update public.leads
    set notification_status = v_summary
    where id = new.lead_id;
  end if;

  return new;
end;
$$;

create or replace function private.sync_notification_digest_job_count()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op in ('INSERT', 'UPDATE') and new.digest_batch_id is not null then
    update public.notification_digest_batches b
    set job_count = (
      select count(*) from public.notification_jobs j
      where j.digest_batch_id = new.digest_batch_id
    ),
    updated_at = now()
    where b.id = new.digest_batch_id;
  end if;

  if tg_op in ('UPDATE', 'DELETE')
     and old.digest_batch_id is not null
     and (tg_op = 'DELETE' or old.digest_batch_id is distinct from new.digest_batch_id) then
    update public.notification_digest_batches b
    set job_count = (
      select count(*) from public.notification_jobs j
      where j.digest_batch_id = old.digest_batch_id
    ),
    updated_at = now()
    where b.id = old.digest_batch_id;
  end if;

  return coalesce(new, old);
end;
$$;

create or replace function private.capture_lead_status_history()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.status is distinct from old.status then
    insert into public.lead_status_history (lead_id, old_status, new_status, changed_by)
    values (new.id, old.status, new.status, auth.uid());
  end if;
  return new;
end;
$$;

create or replace function private.audit_sensitive_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_entity_id uuid;
  v_company_id uuid;
  v_action text;
begin
  v_action := lower(tg_op) || '_' || tg_table_name;

  if tg_table_name = 'company_receiver_settings' then
    v_company_id := case when tg_op = 'DELETE' then old.company_id else new.company_id end;
    v_entity_id := v_company_id;
  elsif tg_table_name = 'notification_destinations' then
    v_company_id := case when tg_op = 'DELETE' then old.company_id else new.company_id end;
    v_entity_id := case when tg_op = 'DELETE' then old.id else new.id end;
  else
    raise exception 'unsupported audit table: %', tg_table_name;
  end if;

  insert into public.audit_logs (
    actor_id, actor_role, action, entity_type, entity_id, company_id, details
  ) values (
    auth.uid(),
    coalesce((select platform_role::text from public.profiles where id = auth.uid()), 'system'),
    v_action,
    tg_table_name,
    v_entity_id,
    v_company_id,
    jsonb_build_object('operation', tg_op)
  );

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

-- Audit replaceable campaign copy and promotional-video changes without
-- exposing media URLs or visitor data in the audit payload.
create or replace function private.audit_campaign_content_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_campaign_id uuid;
  v_company_id uuid;
  v_entity_id uuid;
  v_details jsonb;
begin
  v_campaign_id := case when tg_op = 'DELETE' then old.campaign_id else new.campaign_id end;

  select c.company_id into v_company_id
  from public.campaigns c
  where c.id = v_campaign_id;

  if tg_table_name = 'campaign_videos' then
    v_entity_id := case when tg_op = 'DELETE' then old.id else new.id end;
    v_details := jsonb_build_object(
      'operation', tg_op,
      'campaign_id', v_campaign_id,
      'provider', case when tg_op = 'DELETE' then old.provider else new.provider end,
      'duration_seconds', case when tg_op = 'DELETE' then old.duration_seconds else new.duration_seconds end,
      'active', case when tg_op = 'DELETE' then old.active else new.active end
    );
  elsif tg_table_name = 'campaign_content' then
    v_entity_id := v_campaign_id;
    v_details := jsonb_build_object(
      'operation', tg_op,
      'campaign_id', v_campaign_id,
      'locale', case when tg_op = 'DELETE' then old.locale else new.locale end,
      'content_version', case when tg_op = 'DELETE' then old.content_version else new.content_version end
    );
  else
    raise exception 'unsupported campaign-content audit table: %', tg_table_name;
  end if;

  insert into public.audit_logs (
    actor_id, actor_role, action, entity_type, entity_id, company_id, details
  ) values (
    auth.uid(),
    coalesce((select platform_role::text from public.profiles where id = auth.uid()), 'system'),
    lower(tg_op) || '_' || tg_table_name,
    tg_table_name,
    v_entity_id,
    v_company_id,
    v_details
  );

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;


-- Synchronize OTP and lead state from SMS delivery outcomes.
create or replace function private.sync_otp_delivery_status()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_lead_id uuid;
  v_failed_attempts integer;
begin
  select o.lead_id into v_lead_id
  from public.otp_verifications o
  where o.id = new.otp_verification_id
  for update;

  if v_lead_id is null then
    raise exception using errcode = '23503', message = 'otp_verification_not_found';
  end if;

  if new.status = 'pending' then
    update public.otp_verifications
    set status = case when status in ('created', 'send_pending') then 'send_pending' else status end
    where id = new.otp_verification_id;
  elsif new.status in ('accepted', 'delivered') then
    update public.otp_verifications
    set status = case when status in ('created', 'send_pending') then 'sent' else status end
    where id = new.otp_verification_id;

    update public.leads
    set verification_status = case
      when verification_status = 'submitted' then 'otp_sent'
      else verification_status
    end
    where id = v_lead_id;
  elsif new.status = 'failed' then
    select count(*) into v_failed_attempts
    from public.otp_delivery_attempts a
    where a.otp_verification_id = new.otp_verification_id
      and a.status = 'failed';

    if v_failed_attempts >= 4 then
      update public.otp_verifications
      set status = 'failed'
      where id = new.otp_verification_id
        and status <> 'verified';

      update public.leads
      set verification_status = 'otp_failed'
      where id = v_lead_id
        and verification_status <> 'otp_verified';
    end if;
  end if;

  return new;
end;
$$;

-- Derive and validate lead activity tenant context inside the database.
create or replace function private.validate_lead_activity()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_company_id uuid;
begin
  select l.company_id into v_company_id
  from public.leads l
  where l.id = new.lead_id;

  if v_company_id is null then
    raise exception using errcode = '23503', message = 'lead_not_found';
  end if;

  if new.company_id is distinct from v_company_id then
    raise exception using errcode = '23514', message = 'lead_activity_company_mismatch';
  end if;

  if new.assigned_to is not null and not exists (
    select 1
    from public.company_memberships m
    where m.company_id = v_company_id
      and m.user_id = new.assigned_to
      and m.active
    union all
    select 1
    from public.profiles p
    where p.id = new.assigned_to
      and p.status = 'active'
      and p.platform_role in ('super_admin', 'admin')
  ) then
    raise exception using errcode = '23514', message = 'activity_assignee_not_authorized';
  end if;

  if new.performed_by is null and auth.uid() is not null then
    new.performed_by := auth.uid();
  end if;

  return new;
end;
$$;

-- Preserve quality-decision history and validate lead/company/campaign context.
create or replace function private.manage_current_quality_decision()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_company_id uuid;
  v_campaign_id uuid;
  v_previous_id uuid;
begin
  select l.company_id, l.campaign_id
  into v_company_id, v_campaign_id
  from public.leads l
  where l.id = new.lead_id
  for update;

  if v_company_id is null then
    raise exception using errcode = '23503', message = 'lead_not_found';
  end if;

  if new.company_id is distinct from v_company_id
     or new.campaign_id is distinct from v_campaign_id then
    raise exception using errcode = '23514', message = 'quality_decision_context_mismatch';
  end if;

  if new.is_current then
    select q.id into v_previous_id
    from public.lead_quality_decisions q
    where q.lead_id = new.lead_id
      and q.is_current
    for update;

    if v_previous_id is not null then
      update public.lead_quality_decisions
      set is_current = false,
          superseded_at = now()
      where id = v_previous_id;

      if new.supersedes_id is null then
        new.supersedes_id := v_previous_id;
      end if;
    end if;
  end if;

  return new;
end;
$$;

create or replace function private.create_initial_quality_decision()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.lead_quality_decisions (
    lead_id, company_id, campaign_id, quality_status, billable,
    decision_source, reason_code, reason_detail
  ) values (
    new.id, new.company_id, new.campaign_id, 'pending', null,
    'system', 'awaiting_verification_and_fraud_checks',
    'Lead saved and awaiting OTP verification plus fraud evaluation.'
  );
  return new;
end;
$$;

-- Validate reward context and require a verified lead before issuance/redemption.
create or replace function private.validate_reward_issuance()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_lead public.leads%rowtype;
begin
  select * into v_lead
  from public.leads l
  where l.id = new.lead_id;

  if not found then
    raise exception using errcode = '23503', message = 'lead_not_found';
  end if;

  if v_lead.verification_status not in ('otp_verified', 'call_verified') then
    raise exception using errcode = '23514', message = 'reward_requires_verified_lead';
  end if;

  if new.company_id is distinct from v_lead.company_id
     or new.campaign_id is distinct from v_lead.campaign_id
     or new.driver_id is distinct from v_lead.driver_id then
    raise exception using errcode = '23514', message = 'reward_context_mismatch';
  end if;

  return new;
end;
$$;

-- Create a pending reward obligation exactly once when a lead becomes verified.
create or replace function private.create_reward_on_verification()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_campaign public.campaigns%rowtype;
  v_became_verified boolean;
begin
  v_became_verified := new.verification_status in ('otp_verified', 'call_verified')
    and (tg_op = 'INSERT' or old.verification_status not in ('otp_verified', 'call_verified'));

  if not v_became_verified or new.campaign_id is null then
    return new;
  end if;

  select * into v_campaign
  from public.campaigns c
  where c.id = new.campaign_id;

  if not found or v_campaign.reward_type is null then
    return new;
  end if;

  insert into public.reward_issuances (
    lead_id, company_id, campaign_id, driver_id,
    reward_type, reward_description, status
  ) values (
    new.id, new.company_id, new.campaign_id, new.driver_id,
    v_campaign.reward_type, v_campaign.reward_description, 'pending'
  )
  on conflict (lead_id) do nothing;

  return new;
end;
$$;



-- Prepare campaign video changes. Source or duration changes invalidate the
-- previous validation. Activating a validated video automatically deactivates
-- the campaign's former active video while preserving its history.
create or replace function private.prepare_campaign_video()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    new.created_by := coalesce(new.created_by, auth.uid());
  elsif row(new.provider, new.video_url, new.video_path, new.duration_seconds)
        is distinct from
        row(old.provider, old.video_url, old.video_path, old.duration_seconds) then
    new.active := false;
    new.validated_at := null;
    new.validated_by := null;
  end if;

  if new.active and new.validated_at is null then
    raise exception using errcode = '23514', message = 'campaign_video_must_be_validated_before_activation';
  end if;

  if new.active then
    update public.campaign_videos
    set active = false,
        updated_at = now()
    where campaign_id = new.campaign_id
      and id <> new.id
      and active;
  end if;

  return new;
end;
$$;

-- Increment the content version whenever visitor-facing campaign copy changes.
create or replace function private.bump_campaign_content_version()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if row(
    new.headline, new.subheadline, new.description, new.offer_text,
    new.terms_text, new.reward_text, new.call_to_action,
    new.privacy_notice_text
  ) is distinct from row(
    old.headline, old.subheadline, old.description, old.offer_text,
    old.terms_text, old.reward_text, old.call_to_action,
    old.privacy_notice_text
  ) then
    new.content_version := old.content_version + 1;
  else
    new.content_version := old.content_version;
  end if;
  return new;
end;
$$;

-- Defensive tenant and lifecycle validation for passenger feedback.
create or replace function private.validate_lead_feedback()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_lead public.leads%rowtype;
begin
  select * into v_lead
  from public.leads l
  where l.id = new.lead_id
    and l.deleted_at is null;

  if not found then
    raise exception using errcode = '23503', message = 'lead_not_found';
  end if;

  if v_lead.verification_status not in ('otp_verified', 'call_verified') then
    raise exception using errcode = '23514', message = 'feedback_requires_verified_lead';
  end if;

  if new.company_id is distinct from v_lead.company_id
     or new.campaign_id is distinct from v_lead.campaign_id
     or new.driver_id is distinct from v_lead.driver_id
     or new.qr_code_id is distinct from v_lead.qr_code_id then
    raise exception using errcode = '23514', message = 'feedback_context_mismatch';
  end if;

  if tg_op = 'UPDATE' then
    if new.status = 'viewed' and old.status is distinct from 'viewed' then
      new.viewed_at := coalesce(new.viewed_at, now());
      new.viewed_by := coalesce(new.viewed_by, auth.uid());
    elsif new.status = 'actioned' and old.status is distinct from 'actioned' then
      new.viewed_at := coalesce(new.viewed_at, now());
      new.viewed_by := coalesce(new.viewed_by, auth.uid());
      new.actioned_at := coalesce(new.actioned_at, now());
      new.actioned_by := coalesce(new.actioned_by, auth.uid());
    elsif new.status = 'archived' and old.status is distinct from 'archived' then
      new.archived_at := coalesce(new.archived_at, now());
    end if;
  end if;

  return new;
end;
$$;

-- Queue optional email/Telegram alerts in addition to the Realtime dashboard
-- event. The feedback row remains saved even when notification delivery fails.
create or replace function private.enqueue_feedback_notifications()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_inserted integer;
begin
  update public.lead_feedback
  set notification_status = 'pending'
  where id = new.id;

  insert into public.notification_jobs (
    event_type, lead_id, feedback_id, destination_id, digest_batch_id, channel,
    delivery_frequency, next_attempt_at
  )
  select
    'feedback_received',
    new.lead_id,
    new.id,
    d.id,
    case
      when d.frequency = 'daily_digest'
        then private.get_or_create_notification_digest_batch(d.id, 'feedback_received', schedule.next_attempt_at)
      else null
    end,
    d.channel,
    d.frequency,
    schedule.next_attempt_at
  from public.notification_destinations d
  join public.company_receiver_settings r on r.company_id = d.company_id
  cross join lateral (
    select case
      when d.frequency = 'daily_digest' then private.next_daily_digest_at(d.digest_time_utc)
      else now()
    end as next_attempt_at
  ) schedule
  where d.company_id = new.company_id
    and d.event_type = 'feedback_received'
    and d.active
    and r.enabled
  on conflict do nothing;

  get diagnostics v_inserted = row_count;

  if v_inserted = 0 then
    update public.lead_feedback
    set notification_status = 'not_configured'
    where id = new.id;
  end if;

  return new;
end;
$$;


-- Updated-at triggers
create trigger app_settings_updated_at before update on public.app_settings
for each row execute function private.set_updated_at();
create trigger profiles_updated_at before update on public.profiles
for each row execute function private.set_updated_at();
create trigger companies_updated_at before update on public.companies
for each row execute function private.set_updated_at();
create trigger services_updated_at before update on public.company_services
for each row execute function private.set_updated_at();
create trigger memberships_updated_at before update on public.company_memberships
for each row execute function private.set_updated_at();
create trigger receiver_settings_updated_at before update on public.company_receiver_settings
for each row execute function private.set_updated_at();
create trigger destinations_updated_at before update on public.notification_destinations
for each row execute function private.set_updated_at();
create trigger campaigns_updated_at before update on public.campaigns
for each row execute function private.set_updated_at();
create trigger campaign_content_version before update on public.campaign_content
for each row execute function private.bump_campaign_content_version();
create trigger campaign_content_updated_at before update on public.campaign_content
for each row execute function private.set_updated_at();
create trigger campaign_videos_prepare before insert or update on public.campaign_videos
for each row execute function private.prepare_campaign_video();
create trigger campaign_videos_updated_at before update on public.campaign_videos
for each row execute function private.set_updated_at();
create trigger drivers_updated_at before update on public.drivers
for each row execute function private.set_updated_at();
create trigger assignments_updated_at before update on public.driver_campaign_assignments
for each row execute function private.set_updated_at();
create trigger qr_codes_updated_at before update on public.qr_codes
for each row execute function private.set_updated_at();
create trigger leads_updated_at before update on public.leads
for each row execute function private.set_updated_at();
create trigger lead_activities_updated_at before update on public.lead_activities
for each row execute function private.set_updated_at();
create trigger lead_feedback_updated_at before update on public.lead_feedback
for each row execute function private.set_updated_at();
create trigger otp_updated_at before update on public.otp_verifications
for each row execute function private.set_updated_at();
create trigger otp_delivery_attempts_updated_at before update on public.otp_delivery_attempts
for each row execute function private.set_updated_at();
create trigger notification_digest_batches_updated_at before update on public.notification_digest_batches
for each row execute function private.set_updated_at();
create trigger notification_jobs_updated_at before update on public.notification_jobs
for each row execute function private.set_updated_at();
create trigger reward_issuances_updated_at before update on public.reward_issuances
for each row execute function private.set_updated_at();
create trigger compliance_updated_at before update on public.driver_compliance_records
for each row execute function private.set_updated_at();
create trigger bonuses_updated_at before update on public.driver_bonuses
for each row execute function private.set_updated_at();
create trigger invoices_updated_at before update on public.invoices
for each row execute function private.set_updated_at();
create trigger deletion_requests_updated_at before update on public.data_deletion_requests
for each row execute function private.set_updated_at();

-- Immutable route identity
create trigger companies_identifier_immutable before update on public.companies
for each row execute function private.prevent_immutable_field_change();
create trigger qr_identity_immutable before update on public.qr_codes
for each row execute function private.prevent_immutable_field_change();

-- Auth profile synchronization
create trigger on_auth_user_created
after insert on auth.users
for each row execute function private.handle_new_user();
create trigger on_auth_user_email_updated
after update of email on auth.users
for each row execute function private.sync_user_email();

-- Business invariants
create trigger memberships_limit before insert or update on public.company_memberships
for each row execute function private.enforce_company_member_limit();
create trigger leads_validate_context before insert or update of company_id, campaign_id, campaign_video_id, driver_id, qr_code_id, service_id
on public.leads for each row execute function private.validate_lead_context();
create trigger leads_enqueue_notifications after insert or update of verification_status on public.leads
for each row execute function private.enqueue_lead_notifications();
create trigger leads_initial_quality_decision after insert on public.leads
for each row execute function private.create_initial_quality_decision();
create trigger leads_create_reward after insert or update of verification_status on public.leads
for each row execute function private.create_reward_on_verification();
create trigger notification_jobs_sync_summary after insert or update of status on public.notification_jobs
for each row execute function private.sync_notification_summary();
create trigger notification_jobs_sync_digest_count after insert or update of digest_batch_id or delete on public.notification_jobs
for each row execute function private.sync_notification_digest_job_count();
create trigger lead_status_audit after update of status on public.leads
for each row execute function private.capture_lead_status_history();
create trigger otp_delivery_sync after insert or update of status on public.otp_delivery_attempts
for each row execute function private.sync_otp_delivery_status();
create trigger lead_activities_validate before insert or update of lead_id, company_id, assigned_to, performed_by
on public.lead_activities for each row execute function private.validate_lead_activity();
create trigger lead_feedback_validate before insert or update on public.lead_feedback
for each row execute function private.validate_lead_feedback();
create trigger lead_feedback_enqueue_notifications after insert on public.lead_feedback
for each row execute function private.enqueue_feedback_notifications();
create trigger quality_decision_manage before insert on public.lead_quality_decisions
for each row execute function private.manage_current_quality_decision();
create trigger reward_issuances_validate before insert or update of lead_id, company_id, campaign_id, driver_id, status
on public.reward_issuances for each row execute function private.validate_reward_issuance();

-- Sensitive receiver changes must always be audited.
create trigger receiver_settings_audit after insert or update or delete on public.company_receiver_settings
for each row execute function private.audit_sensitive_change();
create trigger notification_destinations_audit after insert or update or delete on public.notification_destinations
for each row execute function private.audit_sensitive_change();
create trigger campaign_content_audit after insert or update or delete on public.campaign_content
for each row execute function private.audit_campaign_content_change();
create trigger campaign_videos_audit after insert or update or delete on public.campaign_videos
for each row execute function private.audit_campaign_content_change();

-- -----------------------------------------------------------------------------
-- 10. Hardened helper functions for RLS
-- -----------------------------------------------------------------------------
create or replace function private.is_platform_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.status = 'active'
      and p.platform_role in ('super_admin', 'admin')
  );
$$;

create or replace function private.is_super_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.status = 'active'
      and p.platform_role = 'super_admin'
  );
$$;

create or replace function private.can_access_company(p_company_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select private.is_platform_admin()
  or exists (
    select 1
    from public.company_memberships m
    where m.user_id = auth.uid()
      and m.company_id = p_company_id
      and m.active
  );
$$;

create or replace function private.has_company_permission(p_company_id uuid, p_permission text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select private.is_platform_admin()
  or exists (
    select 1
    from public.company_memberships m
    where m.user_id = auth.uid()
      and m.company_id = p_company_id
      and m.active
      and case p_permission
        when 'edit_profile' then m.can_edit_profile
        when 'view_leads' then m.can_view_leads
        when 'export_leads' then m.can_export_leads
        when 'update_lead_status' then m.can_update_lead_status
        when 'manage_notifications' then m.can_manage_notifications
        when 'realtime' then m.realtime_enabled
        else false
      end
  );
$$;

create or replace function private.can_access_campaign(p_campaign_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.campaigns c
    where c.id = p_campaign_id
      and private.can_access_company(c.company_id)
  );
$$;

create or replace function private.can_access_driver(p_driver_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select private.is_platform_admin()
  or exists (
    select 1
    from public.driver_campaign_assignments a
    join public.campaigns c on c.id = a.campaign_id
    join public.company_memberships m on m.company_id = c.company_id
    where a.driver_id = p_driver_id
      and m.user_id = auth.uid()
      and m.active
  );
$$;

revoke all on schema private from public;
grant usage on schema private to authenticated;
revoke all on all functions in schema private from public;
grant execute on function private.is_platform_admin() to authenticated;
grant execute on function private.is_super_admin() to authenticated;
grant execute on function private.can_access_company(uuid) to authenticated;
grant execute on function private.has_company_permission(uuid, text) to authenticated;
grant execute on function private.can_access_campaign(uuid) to authenticated;
grant execute on function private.can_access_driver(uuid) to authenticated;

-- -----------------------------------------------------------------------------
-- 11. Narrow public read API and server-only lead submission RPC
-- -----------------------------------------------------------------------------
create or replace function public.get_public_landing_page(
  p_public_path text,
  p_locale text default 'en'
)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_qr public.qr_codes%rowtype;
  v_company public.companies%rowtype;
  v_campaign public.campaigns%rowtype;
  v_content public.campaign_content%rowtype;
  v_video public.campaign_videos%rowtype;
  v_services jsonb;
  v_unavailable text;
begin
  select * into v_qr
  from public.qr_codes q
  where q.public_path = p_public_path
  limit 1;

  if not found then
    return jsonb_build_object('available', false, 'reason', 'invalid_qr');
  end if;

  select * into v_company from public.companies where id = v_qr.company_id;

  select coalesce(v_company.unavailable_message, s.default_unavailable_message)
  into v_unavailable
  from public.app_settings s where s.id = 1;

  if v_qr.status <> 'active' or v_company.status <> 'active' then
    return jsonb_build_object(
      'available', false,
      'reason', 'inactive',
      'message', coalesce(v_unavailable, 'This page is currently unavailable.')
    );
  end if;

  if v_qr.qr_type = 'driver' then
    select c.* into v_campaign
    from public.driver_campaign_assignments a
    join public.campaigns c on c.id = a.campaign_id
    where a.driver_id = v_qr.driver_id
      and a.status = 'active'
      and c.status = 'active'
      and current_date between c.start_date and c.end_date
    limit 1;

    if v_campaign.id is null then
      return jsonb_build_object(
        'available', false,
        'reason', 'no_active_campaign',
        'message', coalesce(v_unavailable, 'This campaign is currently unavailable.')
      );
    end if;

    select cv.* into v_video
    from public.campaign_videos cv
    where cv.campaign_id = v_campaign.id
      and cv.active
    limit 1;

    select cc.* into v_content
    from public.campaign_content cc
    where cc.campaign_id = v_campaign.id
      and cc.active
    order by case
      when lower(cc.locale) = lower(coalesce(p_locale, '')) then 0
      when cc.locale = v_campaign.default_locale then 1
      when cc.locale = 'en' then 2
      else 3
    end,
    cc.locale
    limit 1;
  end if;

  select coalesce(jsonb_agg(
    jsonb_build_object('id', s.id, 'name', s.name, 'description', s.description)
    order by s.display_order, s.name
  ), '[]'::jsonb)
  into v_services
  from public.company_services s
  where s.company_id = v_company.id and s.active;

  return jsonb_build_object(
    'available', true,
    'qr', jsonb_build_object(
      'id', v_qr.id,
      'type', v_qr.qr_type,
      'path', v_qr.public_path
    ),
    'company', jsonb_build_object(
      'id', v_company.id,
      'identifier', v_company.identifier,
      'name', v_company.name,
      'logo_path', v_company.logo_path,
      'brand_color', v_company.brand_color,
      'description', v_company.description,
      'services_summary', v_company.services_summary,
      'video_url', v_company.video_url,
      'public_contact_name', v_company.public_contact_name,
      'public_contact_title', v_company.public_contact_title,
      'public_contact_email', v_company.public_contact_email,
      'public_contact_phone', v_company.public_contact_phone,
      'whatsapp_url', v_company.whatsapp_url,
      'telegram_url', v_company.telegram_url,
      'website_url', v_company.website_url,
      'address_or_map_url', v_company.address_or_map_url,
      'social_links', v_company.social_links,
      'services', v_services
    ),
    'video', case
      when v_video.id is not null then jsonb_build_object(
        'source', 'campaign',
        'id', v_video.id,
        'provider', v_video.provider,
        'url', v_video.video_url,
        'path', v_video.video_path,
        'duration_seconds', v_video.duration_seconds,
        'poster_path', v_video.poster_path,
        'caption', v_video.caption
      )
      when v_company.video_url is not null then jsonb_build_object(
        'source', 'company_default',
        'provider', 'external',
        'url', v_company.video_url
      )
      else null
    end,
    'campaign', case when v_campaign.id is null then null else jsonb_build_object(
      'id', v_campaign.id,
      'name', v_campaign.name,
      'type', v_campaign.campaign_type,
      'default_locale', v_campaign.default_locale,
      'reward_description', v_campaign.reward_description,
      'brochure_path', v_campaign.brochure_path,
      'landing_page_config', v_campaign.landing_page_config,
      'content', case when v_content.campaign_id is null then null else jsonb_build_object(
        'locale', v_content.locale,
        'content_version', v_content.content_version,
        'headline', v_content.headline,
        'subheadline', v_content.subheadline,
        'description', v_content.description,
        'offer_text', v_content.offer_text,
          'terms_text', v_content.terms_text,
          'reward_text', v_content.reward_text,
          'brochure_path', v_campaign.brochure_path,
          'call_to_action', v_content.call_to_action,
        'privacy_notice_text', v_content.privacy_notice_text
      ) end
    ) end
  );
end;
$$;

revoke all on function public.get_public_landing_page(text, text) from public;
grant execute on function public.get_public_landing_page(text, text) to anon, authenticated;

-- Architecture compatibility RPC.
-- The architecture describes /d/[qr_token] -> resolve_driver_campaign(qr_token).
-- v4 keeps QR identity in public.qr_codes, so this function resolves the route
-- token through qr_codes.public_path/token and returns the legacy landing shape.
-- New code should prefer get_public_landing_page() when it needs the full public
-- page payload, services, localized campaign_content, and unavailable states.
create or replace function public.resolve_driver_campaign(
  p_qr_token text
)
returns table(
  driver_id       uuid,
  driver_name     text,
  campaign_id     uuid,
  company_id      uuid,
  campaign_name   text,
  company_name    text,
  logo_url        text,
  brand_color     text,
  landing_config  jsonb,
  reward_desc     text
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    d.id,
    d.full_name::text,
    c.id,
    co.id,
    c.name::text,
    co.name::text,
    co.logo_path,
    co.brand_color,
    (
      c.landing_page_config ||
      jsonb_build_object(
        'brochure_path', c.brochure_path,
        'video', case
          when cv.id is not null then jsonb_build_object(
            'source', 'campaign',
            'id', cv.id,
            'provider', cv.provider,
            'url', cv.video_url,
            'path', cv.video_path,
            'duration_seconds', cv.duration_seconds,
            'poster_path', cv.poster_path,
            'caption', cv.caption
          )
          when co.video_url is not null then jsonb_build_object(
            'source', 'company_default',
            'provider', 'external',
            'url', co.video_url
          )
          else null
        end
      ) ||
      case when cc.campaign_id is null then '{}'::jsonb else
        jsonb_build_object(
          'content_locale', cc.locale,
          'content_version', cc.content_version,
          'headline', cc.headline,
          'subheadline', cc.subheadline,
          'description', cc.description,
          'offer_text', cc.offer_text,
          'terms_text', cc.terms_text,
          'reward_text', cc.reward_text,
          'call_to_action', cc.call_to_action,
          'privacy_notice_text', cc.privacy_notice_text
        )
      end
    ),
    c.reward_description
  from public.qr_codes q
  join public.drivers d on d.id = q.driver_id
  join public.companies co on co.id = q.company_id
  join public.driver_campaign_assignments a
    on a.driver_id = d.id
   and a.status = 'active'
  join public.campaigns c
    on c.id = a.campaign_id
   and c.company_id = co.id
   and c.status = 'active'
   and current_date between c.start_date and c.end_date
  left join lateral (
    select cv0.*
    from public.campaign_videos cv0
    where cv0.campaign_id = c.id
      and cv0.active
    limit 1
  ) cv on true
  left join lateral (
    select cc.*
    from public.campaign_content cc
    where cc.campaign_id = c.id
      and cc.active
    order by case
      when cc.locale = c.default_locale then 0
      when cc.locale = 'en' then 1
      else 2
    end,
    cc.locale
    limit 1
  ) cc on true
  where q.qr_type = 'driver'
    and q.status = 'active'
    and co.status = 'active'
    and d.status = 'active'
    and (q.public_path = p_qr_token or q.token::text = p_qr_token)
  limit 1;
$$;

revoke all on function public.resolve_driver_campaign(text)
  from public, anon, authenticated;
grant execute on function public.resolve_driver_campaign(text)
  to anon, authenticated;

-- This RPC must be called only from a trusted Next.js server route with the
-- Supabase service-role key. The browser must never receive that key.
create or replace function public.submit_lead_server(
  p_public_path                text,
  p_idempotency_key            uuid,
  p_full_name                  text,
  p_phone_e164                 text,
  p_phone_hash                 text,
  p_email                      text default null,
  p_organization               text default null,
  p_service_id                 uuid default null,
  p_interested_service_text    text default null,
  p_message                    text default null,
  p_preferred_contact_method   public.preferred_contact_method default null,
  p_ip_hash                    text default null,
  p_device_fingerprint_hash    text default null,
  p_consent_given              boolean default false,
  p_privacy_notice_version     text default null,
  p_captcha_verified           boolean default false
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_qr public.qr_codes%rowtype;
  v_company public.companies%rowtype;
  v_campaign_id uuid;
  v_campaign_video_id uuid;
  v_existing_id uuid;
  v_lead_id uuid;
  v_pair_count integer;
  v_ip_hour_count integer;
  v_ip_day_count integer;
begin
  if p_ip_hash is null or p_phone_hash is null then
    raise exception using errcode = '22023', message = 'server_hashes_required';
  end if;
  if not p_consent_given or p_privacy_notice_version is null then
    raise exception using errcode = '22023', message = 'consent_required';
  end if;
  if char_length(trim(p_full_name)) < 2 or char_length(trim(p_full_name)) > 100 then
    raise exception using errcode = '22023', message = 'invalid_full_name';
  end if;
  if p_phone_e164 !~ '^\+[1-9][0-9]{7,14}$' then
    raise exception using errcode = '22023', message = 'invalid_phone';
  end if;
  if p_email is not null and p_email !~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
    raise exception using errcode = '22023', message = 'invalid_email';
  end if;

  select * into v_qr from public.qr_codes where public_path = p_public_path and status = 'active';
  if not found then
    raise exception using errcode = 'P0001', message = 'invalid_or_inactive_qr';
  end if;

  select * into v_company from public.companies where id = v_qr.company_id and status = 'active';
  if not found then
    raise exception using errcode = 'P0001', message = 'company_inactive';
  end if;

  if v_qr.qr_type = 'driver' then
    select c.id into v_campaign_id
    from public.driver_campaign_assignments a
    join public.campaigns c on c.id = a.campaign_id
    where a.driver_id = v_qr.driver_id
      and a.status = 'active'
      and c.status = 'active'
      and current_date between c.start_date and c.end_date
    limit 1;

    if v_campaign_id is null then
      raise exception using errcode = 'P0001', message = 'campaign_unavailable';
    end if;
  end if;

  select id into v_existing_id
  from public.leads
  where company_id = v_company.id and idempotency_key = p_idempotency_key;
  if v_existing_id is not null then
    return v_existing_id;
  end if;

  -- Serialize duplicate checks for the same company + IP + phone pair.
  perform pg_advisory_xact_lock(
    hashtextextended(v_company.id::text || ':' || p_ip_hash || ':' || p_phone_hash, 0)
  );

  select count(*) into v_pair_count
  from public.leads
  where company_id = v_company.id
    and ip_hash = p_ip_hash
    and phone_hash = p_phone_hash
    and created_at >= now() - interval '24 hours'
    and deleted_at is null;

  if v_pair_count >= 3 then
    raise exception using errcode = 'P0001', message = 'submission_limit_exceeded';
  end if;

  select count(*) into v_ip_hour_count
  from public.leads
  where company_id = v_company.id
    and ip_hash = p_ip_hash
    and created_at >= now() - interval '1 hour';

  if v_ip_hour_count >= 10 and not p_captcha_verified then
    raise exception using errcode = 'P0001', message = 'captcha_required';
  end if;

  select count(*) into v_ip_day_count
  from public.leads
  where company_id = v_company.id
    and ip_hash = p_ip_hash
    and created_at >= now() - interval '24 hours';

  if v_ip_day_count >= 20 then
    raise exception using errcode = 'P0001', message = 'daily_ip_limit_exceeded';
  end if;

  if v_campaign_id is not null then
    select cv.id into v_campaign_video_id
    from public.campaign_videos cv
    where cv.campaign_id = v_campaign_id
      and cv.active
    limit 1;
  end if;

  insert into public.leads (
    idempotency_key, company_id, campaign_id, campaign_video_id, driver_id, qr_code_id, service_id,
    full_name, phone_e164, phone_hash, email, organization,
    interested_service_text, message, preferred_contact_method,
    ip_hash, device_fingerprint_hash, consent_given, consent_at,
    privacy_notice_version
  ) values (
    p_idempotency_key, v_company.id, v_campaign_id, v_campaign_video_id, v_qr.driver_id, v_qr.id, p_service_id,
    trim(p_full_name), p_phone_e164, p_phone_hash, nullif(trim(p_email), ''),
    nullif(trim(p_organization), ''), nullif(trim(p_interested_service_text), ''),
    nullif(trim(p_message), ''), p_preferred_contact_method,
    p_ip_hash, p_device_fingerprint_hash, true, now(), p_privacy_notice_version
  ) returning id into v_lead_id;

  return v_lead_id;
end;
$$;

revoke all on function public.submit_lead_server(
  text, uuid, text, text, text, text, text, uuid, text, text,
  public.preferred_contact_method, text, text, boolean, text, boolean
) from public, anon, authenticated;
grant execute on function public.submit_lead_server(
  text, uuid, text, text, text, text, text, uuid, text, text,
  public.preferred_contact_method, text, text, boolean, text, boolean
) to service_role;


-- Create a short-lived OTP challenge. Called only from a trusted server route.
create or replace function public.create_otp_challenge_server(
  p_lead_id uuid,
  p_code_plaintext text,
  p_ttl_seconds integer default 300
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_phone_hash text;
  v_otp_id uuid;
begin
  if p_code_plaintext !~ '^[0-9]{6}$' then
    raise exception using errcode = '22023', message = 'otp_must_be_six_digits';
  end if;
  if p_ttl_seconds < 60 or p_ttl_seconds > 900 then
    raise exception using errcode = '22023', message = 'invalid_otp_ttl';
  end if;

  select l.phone_hash into v_phone_hash
  from public.leads l
  where l.id = p_lead_id
    and l.deleted_at is null
  for update;

  if v_phone_hash is null then
    raise exception using errcode = 'P0001', message = 'lead_not_found';
  end if;

  update public.otp_verifications
  set status = 'expired'
  where lead_id = p_lead_id
    and status in ('created', 'send_pending', 'sent');

  insert into public.otp_verifications (
    lead_id, phone_hash, code_hash, status, expires_at
  ) values (
    p_lead_id,
    v_phone_hash,
    extensions.crypt(p_code_plaintext, extensions.gen_salt('bf', 10)),
    'created',
    now() + make_interval(secs => p_ttl_seconds)
  ) returning id into v_otp_id;

  return v_otp_id;
end;
$$;

revoke all on function public.create_otp_challenge_server(uuid, text, integer)
  from public, anon, authenticated;
grant execute on function public.create_otp_challenge_server(uuid, text, integer)
  to service_role;

-- Verify the latest delivered OTP atomically. A successful verification updates
-- the lead, which then triggers Realtime visibility, notifications, and rewards.
create or replace function public.verify_otp_server(
  p_lead_id uuid,
  p_code_plaintext text
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_otp public.otp_verifications%rowtype;
  v_next_attempts integer;
begin
  select * into v_otp
  from public.otp_verifications o
  where o.lead_id = p_lead_id
    and o.status = 'sent'
  order by o.created_at desc
  limit 1
  for update;

  if not found then
    return false;
  end if;

  if v_otp.expires_at <= now() then
    update public.otp_verifications
    set status = 'expired', last_attempt_at = now()
    where id = v_otp.id;
    return false;
  end if;

  v_next_attempts := v_otp.attempts + 1;

  if extensions.crypt(p_code_plaintext, v_otp.code_hash) = v_otp.code_hash then
    update public.otp_verifications
    set status = 'verified',
        attempts = v_next_attempts,
        last_attempt_at = now(),
        verified_at = now()
    where id = v_otp.id;

    update public.leads
    set verification_status = 'otp_verified'
    where id = p_lead_id
      and verification_status <> 'otp_verified';

    return true;
  end if;

  update public.otp_verifications
  set attempts = v_next_attempts,
      last_attempt_at = now(),
      status = case when v_next_attempts >= 3 then 'failed' else 'sent' end
  where id = v_otp.id;

  if v_next_attempts >= 3 then
    update public.leads
    set verification_status = 'otp_failed'
    where id = p_lead_id
      and verification_status <> 'otp_verified';
  end if;

  return false;
end;
$$;

revoke all on function public.verify_otp_server(uuid, text)
  from public, anon, authenticated;
grant execute on function public.verify_otp_server(uuid, text)
  to service_role;



-- Submit one rating/comment after a lead has been verified. The trusted Next.js
-- route must derive p_lead_id from its signed server-side flow rather than trust
-- an arbitrary browser-supplied lead id.
create or replace function public.submit_lead_feedback_server(
  p_lead_id          uuid,
  p_idempotency_key  uuid,
  p_rating           smallint,
  p_comment          text default null,
  p_content_locale   text default null,
  p_content_version  integer default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_lead public.leads%rowtype;
  v_feedback_id uuid;
  v_existing_id uuid;
  v_selected_locale varchar(10);
  v_selected_version integer;
  v_current_version integer;
begin
  if p_rating < 1 or p_rating > 5 then
    raise exception using errcode = '22023', message = 'rating_must_be_between_1_and_5';
  end if;
  if p_comment is not null and char_length(trim(p_comment)) > 1000 then
    raise exception using errcode = '22023', message = 'feedback_comment_too_long';
  end if;
  if p_content_locale is not null
     and p_content_locale !~ '^[a-z]{2,3}(?:-[A-Z]{2})?$' then
    raise exception using errcode = '22023', message = 'invalid_feedback_locale';
  end if;
  if p_content_version is not null and p_content_version < 1 then
    raise exception using errcode = '22023', message = 'invalid_content_version';
  end if;

  select * into v_lead
  from public.leads l
  where l.id = p_lead_id
    and l.deleted_at is null
  for update;

  if not found then
    raise exception using errcode = 'P0001', message = 'lead_not_found';
  end if;
  if v_lead.verification_status not in ('otp_verified', 'call_verified') then
    raise exception using errcode = 'P0001', message = 'feedback_requires_verified_lead';
  end if;

  select f.id into v_existing_id
  from public.lead_feedback f
  where f.lead_id = v_lead.id
     or (f.company_id = v_lead.company_id and f.idempotency_key = p_idempotency_key)
  order by case when f.lead_id = v_lead.id then 0 else 1 end
  limit 1;

  if v_existing_id is not null then
    return v_existing_id;
  end if;

  if v_lead.campaign_id is not null then
    select cc.locale, cc.content_version
    into v_selected_locale, v_current_version
    from public.campaigns c
    join public.campaign_content cc on cc.campaign_id = c.id and cc.active
    where c.id = v_lead.campaign_id
    order by case
      when lower(cc.locale) = lower(coalesce(p_content_locale, '')) then 0
      when cc.locale = c.default_locale then 1
      when cc.locale = 'en' then 2
      else 3
    end,
    cc.locale
    limit 1;

    if p_content_version is not null
       and v_current_version is not null
       and p_content_version > v_current_version then
      raise exception using errcode = '22023', message = 'content_version_not_yet_published';
    end if;

    v_selected_version := coalesce(p_content_version, v_current_version);
  end if;

  insert into public.lead_feedback (
    idempotency_key, lead_id, company_id, campaign_id, driver_id, qr_code_id,
    content_locale, content_version, rating, comment
  ) values (
    p_idempotency_key, v_lead.id, v_lead.company_id, v_lead.campaign_id,
    v_lead.driver_id, v_lead.qr_code_id, v_selected_locale,
    v_selected_version, p_rating, nullif(trim(p_comment), '')
  )
  returning id into v_feedback_id;

  return v_feedback_id;
end;
$$;

revoke all on function public.submit_lead_feedback_server(
  uuid, uuid, smallint, text, text, integer
) from public, anon, authenticated;
grant execute on function public.submit_lead_feedback_server(
  uuid, uuid, smallint, text, text, integer
) to service_role;

-- Calculate campaign driver bonuses from verified/billable leads and the
-- driver's compliance score. Called by a trusted scheduled job or admin route.
create or replace function public.calculate_driver_bonuses_server(
  p_campaign_id uuid,
  p_base_fee_etb numeric default 0,
  p_bonus_per_verified_lead_etb numeric default 0,
  p_top_driver_prize_etb numeric default 0,
  p_compliance_threshold numeric default 80,
  p_compliance_deduction_etb numeric default 0
)
returns table(
  driver_bonus_id uuid,
  driver_id uuid,
  verified_leads_count integer,
  total_bonus_etb numeric
)
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_base_fee_etb < 0
     or p_bonus_per_verified_lead_etb < 0
     or p_top_driver_prize_etb < 0
     or p_compliance_deduction_etb < 0 then
    raise exception using errcode = '22023', message = 'bonus_amounts_must_be_non_negative';
  end if;
  if p_compliance_threshold < 0 or p_compliance_threshold > 100 then
    raise exception using errcode = '22023', message = 'invalid_compliance_threshold';
  end if;

  return query
  with driver_counts as (
    select
      d.id as driver_id,
      d.compliance_score,
      count(l.id)::integer as verified_count
    from public.driver_campaign_assignments a
    join public.drivers d on d.id = a.driver_id
    left join public.leads l
      on l.driver_id = d.id
     and l.campaign_id = a.campaign_id
     and l.verification_status in ('otp_verified', 'call_verified')
     and l.deleted_at is null
    left join public.lead_quality_decisions q
      on q.lead_id = l.id
     and q.is_current
    where a.campaign_id = p_campaign_id
      and a.status in ('active', 'completed')
      and coalesce(q.billable, true)
    group by d.id, d.compliance_score
  ),
  ranked as (
    select
      driver_id,
      compliance_score,
      verified_count,
      rank() over (order by verified_count desc, compliance_score desc, driver_id) as driver_rank
    from driver_counts
  ),
  upserted as (
    insert into public.driver_bonuses (
      driver_id,
      campaign_id,
      base_fee_etb,
      lead_bonus_etb,
      top_driver_prize_etb,
      compliance_deduction_etb,
      verified_leads_count,
      compliance_score_at_close,
      calculation_snapshot,
      status,
      updated_at
    )
    select
      r.driver_id,
      p_campaign_id,
      p_base_fee_etb,
      p_bonus_per_verified_lead_etb * r.verified_count,
      case when r.driver_rank = 1 and r.verified_count > 0 then p_top_driver_prize_etb else 0 end,
      case when r.compliance_score < p_compliance_threshold then p_compliance_deduction_etb else 0 end,
      r.verified_count,
      r.compliance_score,
      jsonb_build_object(
        'campaign_id', p_campaign_id,
        'base_fee_etb', p_base_fee_etb,
        'bonus_per_verified_lead_etb', p_bonus_per_verified_lead_etb,
        'top_driver_prize_etb', p_top_driver_prize_etb,
        'compliance_threshold', p_compliance_threshold,
        'compliance_deduction_etb', p_compliance_deduction_etb,
        'driver_rank', r.driver_rank,
        'calculated_at', now()
      ),
      'pending',
      now()
    from ranked r
    on conflict (driver_id, campaign_id)
    do update set
      base_fee_etb = excluded.base_fee_etb,
      lead_bonus_etb = excluded.lead_bonus_etb,
      top_driver_prize_etb = excluded.top_driver_prize_etb,
      compliance_deduction_etb = excluded.compliance_deduction_etb,
      verified_leads_count = excluded.verified_leads_count,
      compliance_score_at_close = excluded.compliance_score_at_close,
      calculation_snapshot = excluded.calculation_snapshot,
      status = 'pending',
      updated_at = now()
    returning
      id,
      public.driver_bonuses.driver_id,
      public.driver_bonuses.verified_leads_count,
      (
        public.driver_bonuses.base_fee_etb
        + public.driver_bonuses.lead_bonus_etb
        + public.driver_bonuses.top_driver_prize_etb
        - public.driver_bonuses.compliance_deduction_etb
      )
  )
  select * from upserted;
end;
$$;

revoke all on function public.calculate_driver_bonuses_server(
  uuid, numeric, numeric, numeric, numeric, numeric
) from public, anon, authenticated;
grant execute on function public.calculate_driver_bonuses_server(
  uuid, numeric, numeric, numeric, numeric, numeric
) to service_role;


-- -----------------------------------------------------------------------------
-- 12. Row Level Security
-- -----------------------------------------------------------------------------
alter table public.app_settings enable row level security;
alter table public.profiles enable row level security;
alter table public.companies enable row level security;
alter table public.company_services enable row level security;
alter table public.company_memberships enable row level security;
alter table public.company_receiver_settings enable row level security;
alter table public.notification_destinations enable row level security;
alter table public.campaigns enable row level security;
alter table public.campaign_zones enable row level security;
alter table public.campaign_content enable row level security;
alter table public.campaign_videos enable row level security;
alter table public.drivers enable row level security;
alter table public.driver_campaign_assignments enable row level security;
alter table public.qr_codes enable row level security;
alter table public.leads enable row level security;
alter table public.lead_status_history enable row level security;
alter table public.lead_activities enable row level security;
alter table public.lead_feedback enable row level security;
alter table public.otp_verifications enable row level security;
alter table public.otp_delivery_attempts enable row level security;
alter table public.fraud_flags enable row level security;
alter table public.lead_quality_decisions enable row level security;
alter table public.reward_issuances enable row level security;
alter table public.landing_page_visits enable row level security;
alter table public.notification_digest_batches enable row level security;
alter table public.notification_jobs enable row level security;
alter table public.notification_attempts enable row level security;
alter table public.driver_compliance_records enable row level security;
alter table public.inventory_movements enable row level security;
alter table public.driver_bonuses enable row level security;
alter table public.invoices enable row level security;
alter table public.invoice_payments enable row level security;
alter table public.audit_logs enable row level security;
alter table public.login_security_events enable row level security;
alter table public.user_session_controls enable row level security;
alter table public.data_deletion_requests enable row level security;

create policy app_settings_admin_read on public.app_settings
for select to authenticated using ((select private.is_platform_admin()));
create policy app_settings_super_admin_write on public.app_settings
for update to authenticated
using ((select private.is_super_admin()))
with check ((select private.is_super_admin()));

create policy profiles_self_or_admin_read on public.profiles
for select to authenticated
using ((select auth.uid()) = id or (select private.is_platform_admin()));
create policy profiles_self_update on public.profiles
for update to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

create policy companies_member_or_admin_read on public.companies
for select to authenticated
using ((select private.can_access_company(id)));
create policy companies_authorized_rep_update on public.companies
for update to authenticated
using ((select private.has_company_permission(id, 'edit_profile')))
with check ((select private.has_company_permission(id, 'edit_profile')));

create policy services_member_or_admin_read on public.company_services
for select to authenticated
using ((select private.can_access_company(company_id)));
create policy services_authorized_rep_write on public.company_services
for all to authenticated
using ((select private.has_company_permission(company_id, 'edit_profile')))
with check ((select private.has_company_permission(company_id, 'edit_profile')));

create policy memberships_self_or_admin_read on public.company_memberships
for select to authenticated
using (user_id = (select auth.uid()) or (select private.is_platform_admin()));

create policy receiver_settings_admin_read on public.company_receiver_settings
for select to authenticated using ((select private.is_platform_admin()));
create policy receiver_settings_super_admin_write on public.company_receiver_settings
for all to authenticated
using ((select private.is_super_admin()))
with check ((select private.is_super_admin()));

create policy destinations_admin_read on public.notification_destinations
for select to authenticated using ((select private.is_platform_admin()));
create policy destinations_super_admin_write on public.notification_destinations
for all to authenticated
using ((select private.is_super_admin()))
with check ((select private.is_super_admin()));
create policy destinations_company_notification_read on public.notification_destinations
for select to authenticated
using ((select private.can_access_company(company_id)));
create policy destinations_company_notification_write on public.notification_destinations
for all to authenticated
using ((select private.has_company_permission(company_id, 'manage_notifications')))
with check ((select private.has_company_permission(company_id, 'manage_notifications')));

create policy campaigns_member_or_admin_read on public.campaigns
for select to authenticated
using ((select private.can_access_company(company_id)));
create policy campaign_zones_member_or_admin_read on public.campaign_zones
for select to authenticated
using ((select private.can_access_campaign(campaign_id)));
create policy campaign_content_member_or_admin_read on public.campaign_content
for select to authenticated
using ((select private.can_access_campaign(campaign_id)));
create policy campaign_content_authorized_rep_write on public.campaign_content
for all to authenticated
using (exists (
  select 1 from public.campaigns c
  where c.id = campaign_id
    and (select private.has_company_permission(c.company_id, 'edit_profile'))
))
with check (exists (
  select 1 from public.campaigns c
  where c.id = campaign_id
    and (select private.has_company_permission(c.company_id, 'edit_profile'))
));

create policy campaign_videos_member_or_admin_read on public.campaign_videos
for select to authenticated
using ((select private.can_access_campaign(campaign_id)));
create policy campaign_videos_authorized_rep_write on public.campaign_videos
for all to authenticated
using (exists (
  select 1 from public.campaigns c
  where c.id = campaign_id
    and (select private.has_company_permission(c.company_id, 'edit_profile'))
))
with check (exists (
  select 1 from public.campaigns c
  where c.id = campaign_id
    and (select private.has_company_permission(c.company_id, 'edit_profile'))
));

create policy drivers_authorized_read on public.drivers
for select to authenticated
using ((select private.can_access_driver(id)));
create policy assignments_authorized_read on public.driver_campaign_assignments
for select to authenticated
using ((select private.can_access_campaign(campaign_id)));
create policy qr_codes_member_or_admin_read on public.qr_codes
for select to authenticated
using ((select private.can_access_company(company_id)));

create policy leads_authorized_read on public.leads
for select to authenticated
using (
  (select private.is_platform_admin())
  or (
    (select private.has_company_permission(company_id, 'view_leads'))
    and verification_status in ('otp_verified', 'call_verified')
  )
);
create policy leads_authorized_status_update on public.leads
for update to authenticated
using (
  (select private.is_platform_admin())
  or (
    (select private.has_company_permission(company_id, 'update_lead_status'))
    and verification_status in ('otp_verified', 'call_verified')
  )
)
with check (
  (select private.is_platform_admin())
  or (
    (select private.has_company_permission(company_id, 'update_lead_status'))
    and verification_status in ('otp_verified', 'call_verified')
  )
);

create policy lead_history_authorized_read on public.lead_status_history
for select to authenticated
using (exists (
  select 1 from public.leads l
  where l.id = lead_id
    and (select private.has_company_permission(l.company_id, 'view_leads'))
));


create policy lead_activities_authorized_read on public.lead_activities
for select to authenticated
using (
  (select private.is_platform_admin())
  or exists (
    select 1 from public.leads l
    where l.id = lead_id
      and l.verification_status in ('otp_verified', 'call_verified')
      and (select private.has_company_permission(l.company_id, 'view_leads'))
  )
);
create policy lead_activities_authorized_insert on public.lead_activities
for insert to authenticated
with check (
  (select private.is_platform_admin())
  or exists (
    select 1 from public.leads l
    where l.id = lead_id
      and l.verification_status in ('otp_verified', 'call_verified')
      and (select private.has_company_permission(l.company_id, 'update_lead_status'))
  )
);
create policy lead_activities_authorized_update on public.lead_activities
for update to authenticated
using (
  (select private.is_platform_admin())
  or (select private.has_company_permission(company_id, 'update_lead_status'))
)
with check (
  (select private.is_platform_admin())
  or (select private.has_company_permission(company_id, 'update_lead_status'))
);



create policy lead_feedback_authorized_read on public.lead_feedback
for select to authenticated
using (
  (select private.is_platform_admin())
  or (select private.has_company_permission(company_id, 'view_leads'))
);

create policy lead_feedback_authorized_update on public.lead_feedback
for update to authenticated
using (
  (select private.is_platform_admin())
  or (select private.has_company_permission(company_id, 'update_lead_status'))
)
with check (
  (select private.is_platform_admin())
  or (select private.has_company_permission(company_id, 'update_lead_status'))
);


create policy fraud_admin_only on public.fraud_flags
for all to authenticated
using ((select private.is_platform_admin()))
with check ((select private.is_platform_admin()));


create policy lead_quality_authorized_read on public.lead_quality_decisions
for select to authenticated
using (
  (select private.is_platform_admin())
  or exists (
    select 1 from public.leads l
    where l.id = lead_id
      and l.verification_status in ('otp_verified', 'call_verified')
      and (select private.has_company_permission(l.company_id, 'view_leads'))
  )
);

create policy reward_issuances_authorized_read on public.reward_issuances
for select to authenticated
using (
  (select private.is_platform_admin())
  or exists (
    select 1 from public.leads l
    where l.id = lead_id
      and l.verification_status in ('otp_verified', 'call_verified')
      and (select private.has_company_permission(l.company_id, 'view_leads'))
  )
);

create policy visits_authorized_read on public.landing_page_visits
for select to authenticated
using ((select private.has_company_permission(company_id, 'view_leads')));

create policy notification_jobs_admin_only on public.notification_jobs
for all to authenticated
using ((select private.is_platform_admin()))
with check ((select private.is_platform_admin()));
create policy notification_digest_batches_authorized_read on public.notification_digest_batches
for select to authenticated
using ((select private.can_access_company(company_id)));
create policy notification_attempts_admin_only on public.notification_attempts
for all to authenticated
using ((select private.is_platform_admin()))
with check ((select private.is_platform_admin()));

create policy compliance_authorized_read on public.driver_compliance_records
for select to authenticated
using ((select private.can_access_campaign(campaign_id)));
create policy inventory_authorized_read on public.inventory_movements
for select to authenticated
using ((select private.can_access_campaign(campaign_id)));
create policy bonuses_authorized_read on public.driver_bonuses
for select to authenticated
using ((select private.can_access_campaign(campaign_id)));
create policy invoices_authorized_read on public.invoices
for select to authenticated
using ((select private.can_access_company(company_id)));
create policy invoice_payments_authorized_read on public.invoice_payments
for select to authenticated
using (exists (
  select 1 from public.invoices i
  where i.id = invoice_id
    and (select private.can_access_company(i.company_id))
));

create policy audit_logs_admin_read on public.audit_logs
for select to authenticated using ((select private.is_platform_admin()));
create policy login_security_admin_read on public.login_security_events
for select to authenticated using ((select private.is_platform_admin()));
create policy sessions_self_or_admin_read on public.user_session_controls
for select to authenticated
using (user_id = (select auth.uid()) or (select private.is_platform_admin()));
create policy deletion_requests_admin_only on public.data_deletion_requests
for all to authenticated
using ((select private.is_platform_admin()))
with check ((select private.is_platform_admin()));

-- OTP records and OTP delivery attempts contain verification/provider secrets
-- and are server-only. No authenticated policy is intentionally defined;
-- service_role bypasses RLS.

-- -----------------------------------------------------------------------------
-- 13. Table privileges (RLS is necessary but table grants are still explicit)
-- -----------------------------------------------------------------------------
revoke all on all tables in schema public from anon;
revoke all on all tables in schema public from authenticated;

-- Authenticated dashboard reads. RLS still filters rows.
grant select on public.app_settings, public.profiles, public.companies,
  public.company_services, public.company_memberships,
  public.company_receiver_settings, public.notification_destinations,
  public.campaigns, public.campaign_zones, public.campaign_content, public.campaign_videos, public.drivers,
  public.driver_campaign_assignments, public.qr_codes, public.leads,
  public.lead_status_history, public.lead_activities, public.lead_feedback,
  public.campaign_feedback_summary, public.campaign_video_feedback_summary, public.fraud_flags,
  public.lead_quality_decisions, public.reward_issuances, public.landing_page_visits,
  public.notification_digest_batches, public.notification_jobs, public.notification_attempts,
  public.driver_compliance_records, public.inventory_movements,
  public.driver_bonuses, public.invoices, public.invoice_payments,
  public.audit_logs, public.login_security_events,
  public.user_session_controls, public.data_deletion_requests
  to authenticated;

-- Self-service profile edits cannot change role/status/email.
grant update (full_name) on public.profiles to authenticated;

-- Optional company-rep content editing; identifier/status/receiver remain locked.
grant update (
  name, logo_path, brand_color, description, services_summary, video_url,
  public_contact_name, public_contact_title, public_contact_email,
  public_contact_phone, whatsapp_url, telegram_url, website_url,
  address_or_map_url, social_links
) on public.companies to authenticated;
grant insert, update, delete on public.company_services to authenticated;
grant insert, update, delete on public.campaign_content to authenticated;

-- Company members may create/edit their own campaign media metadata. They cannot
-- directly set validation fields; a trusted server route validates the actual
-- provider/file duration before activating the video.
grant insert (
  campaign_id, provider, video_url, video_path, duration_seconds,
  poster_path, caption, metadata
) on public.campaign_videos to authenticated;
grant update (
  provider, video_url, video_path, duration_seconds,
  poster_path, caption, metadata, active
) on public.campaign_videos to authenticated;
grant delete on public.campaign_videos to authenticated;

-- Company reps may update workflow fields only, not PII or tenant ownership.
grant update (status, viewed_at, followed_up_at, converted_at) on public.leads to authenticated;
grant insert, update on public.lead_activities to authenticated;
grant update (status, viewed_at, viewed_by, actioned_at, actioned_by, archived_at)
  on public.lead_feedback to authenticated;

-- Receiver setting writes remain super-admin controlled. Notification
-- destinations may also be managed by company reps with
-- can_manage_notifications for advertiser portal self-service.
grant insert, update, delete on public.company_receiver_settings,
  public.notification_destinations to authenticated;

-- -----------------------------------------------------------------------------
-- 14. Realtime
-- -----------------------------------------------------------------------------
-- Postgres Changes is the simplest v1 option. RLS controls which lead rows each
-- authenticated subscriber receives. For heavier scale, move to private Realtime
-- Broadcast topics per company.
alter publication supabase_realtime add table
  public.campaign_content,
  public.campaign_videos,
  public.leads,
  public.lead_activities,
  public.lead_feedback,
  public.lead_quality_decisions,
  public.reward_issuances;

-- -----------------------------------------------------------------------------
-- 15. Seed the singleton settings row
-- -----------------------------------------------------------------------------
insert into public.app_settings (id, public_base_url)
values (1, 'https://replace-with-production-domain.example')
on conflict (id) do nothing;

commit;

-- =============================================================================
-- POST-MIGRATION ACTIONS (not SQL defects)
-- 1. Replace app_settings.public_base_url.
-- 2. Create Storage buckets and policies for company-assets, campaign-videos,
--    and driver-checkins.
-- 3. Implement trusted video validation. Read YouTube/Vimeo/Cloudinary metadata
--    or inspect uploaded media server-side; confirm the real duration is 30-50
--    seconds, then set validated_at/validated_by and activate the row. Never trust
--    duration_seconds supplied by the browser.
-- 4. Store email/Telegram provider secrets in Vercel env vars or Supabase Vault,
--    never in a public table.
-- 5. Implement the notification worker with one initial attempt plus retries at
--    1s, 4s, and 16s. After the fourth failed attempt, set
--    notification_jobs.status = 'dead_letter'.
-- 6. Implement the Africa's Talking OTP sender and delivery-receipt webhook.
--    Each provider call must create/update otp_delivery_attempts idempotently.
-- 7. Subscribe company dashboards to INSERT events on lead_feedback, filtered
--    by company_id. Show an unread badge and the star/comment immediately.
-- 8. Update the notification worker to branch on notification_jobs.event_type:
--    lead_verified versus feedback_received.
-- 9. Implement the fraud/quality worker that supersedes the initial pending
--    lead_quality_decision with a qualified/billable or non-billable decision.
-- 10. Implement reward issuance/redemption server routes or Telegram bot commands.
--    Never store plaintext reward redemption codes; store only hashes.
-- 11. Implement login lockout/session inactivity in trusted server routes using
--    login_security_events, profiles.locked_until, and user_session_controls.
-- 12. Add pgTAP tests for every RLS policy before production.
-- =============================================================================
