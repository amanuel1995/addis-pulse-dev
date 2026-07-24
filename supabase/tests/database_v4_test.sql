begin;

create extension if not exists pgtap with schema extensions;
set search_path = public, extensions;

-- This suite runs against both local and linked databases. Every fixture uses
-- the test-only f-prefix UUID namespace and is rolled back with the test.
insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) values
  ('00000000-0000-0000-0000-000000000000', 'f1000000-0000-0000-0000-000000000001', 'authenticated', 'authenticated',
   'pgtap.admin@example.test', extensions.crypt('PgTap-Only-Password-1!', extensions.gen_salt('bf')), '2026-01-01 00:00:00+00',
   '{"provider":"email","providers":["email"]}', '{"full_name":"pgTAP Platform Admin"}', '2026-01-01 00:00:00+00', '2026-01-01 00:00:00+00'),
  ('00000000-0000-0000-0000-000000000000', 'f1000000-0000-0000-0000-000000000002', 'authenticated', 'authenticated',
   'pgtap.alpha@example.test', extensions.crypt('PgTap-Only-Password-2!', extensions.gen_salt('bf')), '2026-01-01 00:00:00+00',
   '{"provider":"email","providers":["email"]}', '{"full_name":"pgTAP Alpha Representative"}', '2026-01-01 00:00:00+00', '2026-01-01 00:00:00+00'),
  ('00000000-0000-0000-0000-000000000000', 'f1000000-0000-0000-0000-000000000003', 'authenticated', 'authenticated',
   'pgtap.beta@example.test', extensions.crypt('PgTap-Only-Password-3!', extensions.gen_salt('bf')), '2026-01-01 00:00:00+00',
   '{"provider":"email","providers":["email"]}', '{"full_name":"pgTAP Beta Representative"}', '2026-01-01 00:00:00+00', '2026-01-01 00:00:00+00');
update public.profiles
set platform_role = 'super_admin', full_name = 'pgTAP Platform Admin'
where id = 'f1000000-0000-0000-0000-000000000001';

insert into public.companies (
  id, identifier, name, logo_path, brand_color, description, services_summary,
  public_contact_name, public_contact_title, public_contact_email,
  public_contact_phone, website_url, sector, status, created_by, created_at, updated_at
) values
  ('f2000000-0000-0000-0000-000000000001', 'pgtap-alpha-health', 'pgTAP Alpha Health PLC',
   'tests/pgtap-alpha-logo.svg', '#2563EB', 'Transactional pgTAP fixture company.',
   'Test consultations.', 'Alpha Test', 'Test Contact', 'pgtap.alpha.contact@example.test',
   '+251911900001', 'https://pgtap-alpha.example.test', 'Healthcare', 'active',
   'f1000000-0000-0000-0000-000000000001', '2026-01-01 00:00:00+00', '2026-01-01 00:00:00+00'),
  ('f2000000-0000-0000-0000-000000000002', 'pgtap-beta-learning', 'pgTAP Beta Learning PLC',
   'tests/pgtap-beta-logo.svg', '#7C3AED', 'Transactional pgTAP fixture company.',
   'Test courses.', 'Beta Test', 'Test Contact', 'pgtap.beta.contact@example.test',
   '+251911900002', 'https://pgtap-beta.example.test', 'Education', 'active',
   'f1000000-0000-0000-0000-000000000001', '2026-01-01 00:00:00+00', '2026-01-01 00:00:00+00');

insert into public.company_memberships (
  company_id, user_id, can_edit_profile, can_view_leads, can_export_leads,
  can_update_lead_status, can_manage_notifications, created_by
) values
  ('f2000000-0000-0000-0000-000000000001', 'f1000000-0000-0000-0000-000000000002', true, true, true, true, true, 'f1000000-0000-0000-0000-000000000001'),
  ('f2000000-0000-0000-0000-000000000002', 'f1000000-0000-0000-0000-000000000003', true, true, true, true, true, 'f1000000-0000-0000-0000-000000000001');

insert into public.company_services (id, company_id, name, description, display_order) values
  ('f3000000-0000-0000-0000-000000000001', 'f2000000-0000-0000-0000-000000000001', 'pgTAP Wellness Consultation', 'Transactional test service.', 1),
  ('f3000000-0000-0000-0000-000000000002', 'f2000000-0000-0000-0000-000000000002', 'pgTAP Evening Course', 'Transactional test service.', 1);

insert into public.campaigns (
  id, company_id, name, campaign_type, status, start_date, end_date,
  vehicle_count, target_leads, budget_etb, reward_type, reward_description,
  reward_unit_cost_etb, landing_page_config, default_locale, created_by
) values
  ('f4000000-0000-0000-0000-000000000001', 'f2000000-0000-0000-0000-000000000001', 'pgTAP Alpha Campaign',
   'appointment_booking', 'active', '2026-01-01', '2099-12-31', 2, 100, 50000, 'voucher',
   'Transactional test voucher.', 25, '{"theme":"pgtap-alpha"}', 'en', 'f1000000-0000-0000-0000-000000000001'),
  ('f4000000-0000-0000-0000-000000000002', 'f2000000-0000-0000-0000-000000000002', 'pgTAP Beta Campaign',
   'lead_generation', 'active', '2026-01-01', '2099-12-31', 2, 120, 60000, 'digital_coupon',
   'Transactional test coupon.', 20, '{"theme":"pgtap-beta"}', 'am', 'f1000000-0000-0000-0000-000000000001');

insert into public.campaign_content (
  campaign_id, locale, headline, subheadline, description, offer_text,
  reward_text, call_to_action, privacy_notice_text, created_by
) values
  ('f4000000-0000-0000-0000-000000000001', 'en', 'pgTAP Alpha English', 'Test content', 'Test description', 'Test offer', 'Test reward', 'Continue', 'Test privacy notice', 'f1000000-0000-0000-0000-000000000001'),
  ('f4000000-0000-0000-0000-000000000001', 'am', 'pgTAP Alpha Amharic', 'Test content', 'Test description', 'Test offer', 'Test reward', 'Continue', 'Test privacy notice', 'f1000000-0000-0000-0000-000000000001'),
  ('f4000000-0000-0000-0000-000000000002', 'en', 'pgTAP Beta English', 'Test content', 'Test description', 'Test offer', 'Test reward', 'Continue', 'Test privacy notice', 'f1000000-0000-0000-0000-000000000001'),
  ('f4000000-0000-0000-0000-000000000002', 'am', 'pgTAP Beta Amharic', 'Test content', 'Test description', 'Test offer', 'Test reward', 'Continue', 'Test privacy notice', 'f1000000-0000-0000-0000-000000000001');

insert into public.campaign_videos (
  id, campaign_id, provider, video_url, duration_seconds, poster_path, caption,
  metadata, active, validated_at, validated_by, created_by
) values
  ('f5000000-0000-0000-0000-000000000001', 'f4000000-0000-0000-0000-000000000001', 'youtube',
   'https://www.youtube.com/watch?v=PGTAP_ALPHA', 35, 'tests/pgtap-alpha-poster.jpg', 'pgTAP alpha video',
   '{"fixture":"pgtap"}', true, '2026-01-01 00:00:00+00', 'f1000000-0000-0000-0000-000000000001', 'f1000000-0000-0000-0000-000000000001'),
  ('f5000000-0000-0000-0000-000000000002', 'f4000000-0000-0000-0000-000000000002', 'vimeo',
   'https://vimeo.com/999999002', 45, 'tests/pgtap-beta-poster.jpg', 'pgTAP beta video',
   '{"fixture":"pgtap"}', true, '2026-01-01 00:00:00+00', 'f1000000-0000-0000-0000-000000000001', 'f1000000-0000-0000-0000-000000000001');

insert into public.drivers (
  id, full_name, phone_e164, phone_hash, vehicle_plate, primary_zone,
  telegram_handle, telegram_user_id, status
) values
  ('f6000000-0000-0000-0000-000000000001', 'pgTAP Driver Alpha One', '+251911900011', 'pgtap-driver-phone-hash-1', 'TEST-A-001', 'Bole', 'pgtap_alpha_one', 990000001, 'active'),
  ('f6000000-0000-0000-0000-000000000002', 'pgTAP Driver Alpha Two', '+251911900012', 'pgtap-driver-phone-hash-2', 'TEST-A-002', 'Kazanchis', 'pgtap_alpha_two', 990000002, 'active'),
  ('f6000000-0000-0000-0000-000000000003', 'pgTAP Driver Beta One', '+251911900013', 'pgtap-driver-phone-hash-3', 'TEST-B-001', 'Sar Bet', 'pgtap_beta_one', 990000003, 'active'),
  ('f6000000-0000-0000-0000-000000000004', 'pgTAP Driver Beta Two', '+251911900014', 'pgtap-driver-phone-hash-4', 'TEST-B-002', 'Megenagna', 'pgtap_beta_two', 990000004, 'active');

insert into public.driver_campaign_assignments (id, driver_id, campaign_id, assigned_by) values
  ('f7000000-0000-0000-0000-000000000001', 'f6000000-0000-0000-0000-000000000001', 'f4000000-0000-0000-0000-000000000001', 'f1000000-0000-0000-0000-000000000001'),
  ('f7000000-0000-0000-0000-000000000002', 'f6000000-0000-0000-0000-000000000002', 'f4000000-0000-0000-0000-000000000001', 'f1000000-0000-0000-0000-000000000001'),
  ('f7000000-0000-0000-0000-000000000003', 'f6000000-0000-0000-0000-000000000003', 'f4000000-0000-0000-0000-000000000002', 'f1000000-0000-0000-0000-000000000001'),
  ('f7000000-0000-0000-0000-000000000004', 'f6000000-0000-0000-0000-000000000004', 'f4000000-0000-0000-0000-000000000002', 'f1000000-0000-0000-0000-000000000001');

insert into public.qr_codes (id, qr_type, company_id, driver_id, token, public_path, image_path) values
  ('f8000000-0000-0000-0000-000000000001', 'company', 'f2000000-0000-0000-0000-000000000001', null, 'f8100000-0000-0000-0000-000000000001', 'c/pgtap-alpha', 'tests/qr-company-alpha.png'),
  ('f8000000-0000-0000-0000-000000000002', 'company', 'f2000000-0000-0000-0000-000000000002', null, 'f8100000-0000-0000-0000-000000000002', 'c/pgtap-beta', 'tests/qr-company-beta.png'),
  ('f8000000-0000-0000-0000-000000000011', 'driver', 'f2000000-0000-0000-0000-000000000001', 'f6000000-0000-0000-0000-000000000001', 'f8100000-0000-0000-0000-000000000011', 'd/pgtap-alpha-driver-1', 'tests/qr-driver-alpha-1.png'),
  ('f8000000-0000-0000-0000-000000000012', 'driver', 'f2000000-0000-0000-0000-000000000001', 'f6000000-0000-0000-0000-000000000002', 'f8100000-0000-0000-0000-000000000012', 'd/pgtap-alpha-driver-2', 'tests/qr-driver-alpha-2.png'),
  ('f8000000-0000-0000-0000-000000000013', 'driver', 'f2000000-0000-0000-0000-000000000002', 'f6000000-0000-0000-0000-000000000003', 'f8100000-0000-0000-0000-000000000013', 'd/pgtap-beta-driver-1', 'tests/qr-driver-beta-1.png'),
  ('f8000000-0000-0000-0000-000000000014', 'driver', 'f2000000-0000-0000-0000-000000000002', 'f6000000-0000-0000-0000-000000000004', 'f8100000-0000-0000-0000-000000000014', 'd/pgtap-beta-driver-2', 'tests/qr-driver-beta-2.png');

insert into public.company_receiver_settings (company_id, receiver_name, updated_by) values
  ('f2000000-0000-0000-0000-000000000001', 'pgTAP Alpha Receiver', 'f1000000-0000-0000-0000-000000000001'),
  ('f2000000-0000-0000-0000-000000000002', 'pgTAP Beta Receiver', 'f1000000-0000-0000-0000-000000000001');

insert into public.notification_destinations (
  id, company_id, channel, event_type, frequency, destination_value,
  destination_hash, label, active, is_primary, created_by
) values
  ('f9000000-0000-0000-0000-000000000001', 'f2000000-0000-0000-0000-000000000001', 'email', 'lead_verified', 'instant', 'pgtap.alpha.leads@example.test', 'pgtap-destination-alpha-leads', 'pgTAP lead inbox', true, true, 'f1000000-0000-0000-0000-000000000001'),
  ('f9000000-0000-0000-0000-000000000002', 'f2000000-0000-0000-0000-000000000001', 'telegram', 'feedback_received', 'instant', 'pgtap-alpha-chat', 'pgtap-destination-alpha-feedback', 'pgTAP feedback chat', true, true, 'f1000000-0000-0000-0000-000000000001'),
  ('f9000000-0000-0000-0000-000000000003', 'f2000000-0000-0000-0000-000000000002', 'email', 'lead_verified', 'instant', 'pgtap.beta.leads@example.test', 'pgtap-destination-beta-leads', 'pgTAP lead inbox', true, true, 'f1000000-0000-0000-0000-000000000001'),
  ('f9000000-0000-0000-0000-000000000004', 'f2000000-0000-0000-0000-000000000002', 'telegram', 'feedback_received', 'instant', 'pgtap-beta-chat', 'pgtap-destination-beta-feedback', 'pgTAP feedback chat', true, true, 'f1000000-0000-0000-0000-000000000001');

select plan(67);

select is((select count(*) from public.companies where id in (
  'f2000000-0000-0000-0000-000000000001', 'f2000000-0000-0000-0000-000000000002'
)), 2::bigint, 'fixtures include two companies');
select is((select count(*) from public.campaigns where id in (
  'f4000000-0000-0000-0000-000000000001', 'f4000000-0000-0000-0000-000000000002'
)), 2::bigint, 'fixtures include two campaigns');
select is((select count(*) from public.campaign_content
  where campaign_id in ('f4000000-0000-0000-0000-000000000001', 'f4000000-0000-0000-0000-000000000002')
    and locale in ('en', 'am')), 4::bigint, 'fixtures include English and Amharic campaign content');
select is((select count(*) from public.campaign_videos
  where id in ('f5000000-0000-0000-0000-000000000001', 'f5000000-0000-0000-0000-000000000002')
    and active), 2::bigint, 'fixtures include two active campaign videos');
select is((select count(*) from public.drivers where id in (
  'f6000000-0000-0000-0000-000000000001', 'f6000000-0000-0000-0000-000000000002',
  'f6000000-0000-0000-0000-000000000003', 'f6000000-0000-0000-0000-000000000004'
)), 4::bigint, 'fixtures include four drivers');
select is((select count(*) from public.qr_codes where id in (
  'f8000000-0000-0000-0000-000000000011', 'f8000000-0000-0000-0000-000000000012',
  'f8000000-0000-0000-0000-000000000013', 'f8000000-0000-0000-0000-000000000014'
) and qr_type = 'driver'), 4::bigint, 'fixtures include four permanent driver QR codes');
select is((select count(*) from public.company_memberships where user_id in (
  'f1000000-0000-0000-0000-000000000002', 'f1000000-0000-0000-0000-000000000003'
)), 2::bigint, 'fixtures include two company memberships');

select throws_ok(
  $$insert into public.campaigns (company_id, name, start_date, end_date)
    values ('f2000000-0000-0000-0000-000000000001', 'Invalid dates', '2026-02-01', '2026-01-01')$$,
  '23514', 'new row for relation "campaigns" violates check constraint "campaigns_valid_dates"',
  'campaign date constraint rejects end dates before start dates'
);
select throws_ok(
  $$insert into public.driver_campaign_assignments (driver_id, campaign_id)
    values ('f6000000-0000-0000-0000-000000000001', 'f4000000-0000-0000-0000-000000000002')$$,
  '23505', 'duplicate key value violates unique constraint "one_active_campaign_per_driver_uq"',
  'one-active-campaign constraint protects each driver'
);
select throws_ok(
  $$insert into public.qr_codes (qr_type, company_id, public_path)
    values ('driver', 'f2000000-0000-0000-0000-000000000001', 'd/missing-driver')$$,
  '23514', 'new row for relation "qr_codes" violates check constraint "qr_code_target_check"',
  'driver QR constraint requires a driver'
);

select lives_ok(
  $$insert into public.campaign_videos (id, campaign_id, provider, video_url, duration_seconds)
    values ('f5000000-0000-0000-0000-000000000010', 'f4000000-0000-0000-0000-000000000001',
      'youtube', 'https://www.youtube.com/watch?v=FAKE_BOUNDARY_30', 30)$$,
  'video duration accepts 30 seconds'
);
select lives_ok(
  $$insert into public.campaign_videos (id, campaign_id, provider, video_url, duration_seconds)
    values ('f5000000-0000-0000-0000-000000000011', 'f4000000-0000-0000-0000-000000000001',
      'youtube', 'https://www.youtube.com/watch?v=FAKE_BOUNDARY_50', 50)$$,
  'video duration accepts 50 seconds'
);
select throws_ok(
  $$insert into public.campaign_videos (campaign_id, provider, video_url, duration_seconds)
    values ('f4000000-0000-0000-0000-000000000001', 'youtube', 'https://example.test/too-short', 29)$$,
  '23514', 'new row for relation "campaign_videos" violates check constraint "campaign_videos_duration_seconds_check"',
  'video duration rejects 29 seconds'
);
select throws_ok(
  $$insert into public.campaign_videos (campaign_id, provider, video_url, duration_seconds)
    values ('f4000000-0000-0000-0000-000000000001', 'youtube', 'https://example.test/too-long', 51)$$,
  '23514', 'new row for relation "campaign_videos" violates check constraint "campaign_videos_duration_seconds_check"',
  'video duration rejects 51 seconds'
);
select throws_ok(
  $$insert into public.campaign_videos (campaign_id, provider, video_url, duration_seconds, active)
    values ('f4000000-0000-0000-0000-000000000001', 'youtube', 'https://example.test/unvalidated', 40, true)$$,
  '23514', 'campaign_video_must_be_validated_before_activation',
  'video activation requires trusted validation'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', 'f1000000-0000-0000-0000-000000000002', true);
select set_config('request.jwt.claims', '{"sub":"f1000000-0000-0000-0000-000000000002","role":"authenticated"}', true);
select is((select count(*) from public.companies), 1::bigint, 'alpha representative sees one company');
select is((select id from public.companies limit 1), 'f2000000-0000-0000-0000-000000000001'::uuid, 'alpha representative sees only alpha company');
select is((select count(*) from public.campaigns), 1::bigint, 'alpha representative sees only alpha campaign');
select is((select count(*) from public.notification_destinations), 2::bigint, 'alpha representative sees only alpha destinations');
reset role;

insert into public.leads (
  id, idempotency_key, company_id, campaign_id, campaign_video_id, driver_id,
  qr_code_id, full_name, phone_e164, phone_hash, verification_status,
  ip_hash, consent_given, consent_at, privacy_notice_version
) values
  ('fa000000-0000-0000-0000-000000000001', 'fa100000-0000-0000-0000-000000000001',
   'f2000000-0000-0000-0000-000000000001', 'f4000000-0000-0000-0000-000000000001',
   'f5000000-0000-0000-0000-000000000001', 'f6000000-0000-0000-0000-000000000001',
   'f8000000-0000-0000-0000-000000000011', 'Fake Unverified Lead', '+251922000001',
   'pgtap-lead-phone-hash-1', 'submitted', 'pgtap-ip-hash-1', true, '2026-01-01 00:00:00+00', 'test-v1'),
  ('fa000000-0000-0000-0000-000000000002', 'fa100000-0000-0000-0000-000000000002',
   'f2000000-0000-0000-0000-000000000002', 'f4000000-0000-0000-0000-000000000002',
   'f5000000-0000-0000-0000-000000000002', 'f6000000-0000-0000-0000-000000000003',
   'f8000000-0000-0000-0000-000000000013', 'Fake OTP Lead', '+251922000002',
   'pgtap-lead-phone-hash-2', 'submitted', 'pgtap-ip-hash-2', true, '2026-01-01 00:00:00+00', 'test-v1');

set local role authenticated;
select set_config('request.jwt.claim.sub', 'f1000000-0000-0000-0000-000000000002', true);
select set_config('request.jwt.claims', '{"sub":"f1000000-0000-0000-0000-000000000002","role":"authenticated"}', true);
select is(
  (select array_agg(id order by id) from public.leads),
  array['fa000000-0000-0000-0000-000000000001'::uuid],
  'alpha representative sees the alpha pending lead only'
);
reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub', 'f1000000-0000-0000-0000-000000000003', true);
select set_config('request.jwt.claims', '{"sub":"f1000000-0000-0000-0000-000000000003","role":"authenticated"}', true);
select is(
  (select array_agg(id order by id) from public.leads),
  array['fa000000-0000-0000-0000-000000000002'::uuid],
  'beta representative sees the beta pending lead only'
);
reset role;

select is((select count(*) from public.lead_quality_decisions where lead_id in (
  'fa000000-0000-0000-0000-000000000001', 'fa000000-0000-0000-0000-000000000002'
)), 2::bigint, 'lead inserts create initial quality decisions');
select throws_ok(
  $$select public.submit_lead_feedback_server('fa000000-0000-0000-0000-000000000001',
      'fa200000-0000-0000-0000-000000000001', 5::smallint, 'Too early', 'en', 1)$$,
  'P0001', 'feedback_requires_verified_lead', 'feedback requires a verified lead'
);
select throws_ok(
  $$insert into public.reward_issuances (lead_id, company_id, campaign_id, driver_id, reward_type)
    values ('fa000000-0000-0000-0000-000000000001', 'f2000000-0000-0000-0000-000000000001',
      'f4000000-0000-0000-0000-000000000001', 'f6000000-0000-0000-0000-000000000001', 'voucher')$$,
  '23514', 'reward_requires_verified_lead', 'rewards require a verified lead'
);

select lives_ok(
  $$select public.create_otp_challenge_server('fa000000-0000-0000-0000-000000000001', '654321', 300)$$,
  'failed-flow OTP challenge is created'
);
insert into public.otp_delivery_attempts (
  otp_verification_id, attempt_number, destination_hash, status, accepted_at
) select id, 1, 'fake-failed-otp-destination-hash', 'accepted', now()
  from public.otp_verifications where lead_id = 'fa000000-0000-0000-0000-000000000001' and status = 'created';
select is((select status from public.otp_verifications where lead_id = 'fa000000-0000-0000-0000-000000000001'),
  'sent'::public.otp_status, 'failed-flow OTP starts sent');
select ok(not public.verify_otp_server('fa000000-0000-0000-0000-000000000001', '000000'),
  'first incorrect OTP returns false');
select is((select attempts from public.otp_verifications where lead_id = 'fa000000-0000-0000-0000-000000000001'),
  1::smallint, 'first incorrect OTP increments attempts to one');
select is((select status from public.otp_verifications where lead_id = 'fa000000-0000-0000-0000-000000000001'),
  'sent'::public.otp_status, 'first incorrect OTP keeps status sent');
select ok(not public.verify_otp_server('fa000000-0000-0000-0000-000000000001', '000000'),
  'second incorrect OTP returns false');
select is((select attempts from public.otp_verifications where lead_id = 'fa000000-0000-0000-0000-000000000001'),
  2::smallint, 'second incorrect OTP increments attempts to two');
select is((select status from public.otp_verifications where lead_id = 'fa000000-0000-0000-0000-000000000001'),
  'sent'::public.otp_status, 'second incorrect OTP keeps status sent');
select ok(not public.verify_otp_server('fa000000-0000-0000-0000-000000000001', '000000'),
  'third incorrect OTP returns false');
select is((select attempts from public.otp_verifications where lead_id = 'fa000000-0000-0000-0000-000000000001'),
  3::smallint, 'third incorrect OTP increments attempts to three');
select is((select status from public.otp_verifications where lead_id = 'fa000000-0000-0000-0000-000000000001'),
  'failed'::public.otp_status, 'third incorrect OTP marks OTP failed');
select is((select verification_status from public.leads where id = 'fa000000-0000-0000-0000-000000000001'),
  'otp_failed'::public.lead_verification_status, 'third incorrect OTP marks lead otp_failed');

select lives_ok(
  $$select public.create_otp_challenge_server('fa000000-0000-0000-0000-000000000002', '123456', 300)$$,
  'OTP challenge accepts a six-digit code and valid TTL'
);
select throws_ok(
  $$select public.create_otp_challenge_server('fa000000-0000-0000-0000-000000000002', '12345', 300)$$,
  '22023', 'otp_must_be_six_digits', 'OTP challenge rejects a non-six-digit code'
);
select lives_ok(
  $$select public.record_otp_delivery_attempt_server(
      (select id from public.otp_verifications
        where lead_id = 'fa000000-0000-0000-0000-000000000002' and status = 'created'),
      1::smallint, 'fake_local', 'fake-otp-destination-hash', 'accepted'
    )$$,
  'service RPC records accepted OTP delivery'
);
select ok(not has_function_privilege('anon',
  'public.record_otp_delivery_attempt_server(uuid,smallint,text,text,public.otp_delivery_status,text,text,text)',
  'execute'), 'anonymous role cannot record OTP deliveries');
select ok(not has_function_privilege('authenticated',
  'public.record_otp_delivery_attempt_server(uuid,smallint,text,text,public.otp_delivery_status,text,text,text)',
  'execute'), 'authenticated role cannot record OTP deliveries');
select ok(has_function_privilege('service_role',
  'public.record_otp_delivery_attempt_server(uuid,smallint,text,text,public.otp_delivery_status,text,text,text)',
  'execute'), 'service role can record OTP deliveries');
select is((select status from public.otp_verifications where lead_id = 'fa000000-0000-0000-0000-000000000002'),
  'sent'::public.otp_status, 'accepted delivery marks OTP sent');
select throws_ok(
  $$update public.otp_verifications set attempts = 4
    where lead_id = 'fa000000-0000-0000-0000-000000000002'$$,
  '23514', 'new row for relation "otp_verifications" violates check constraint "otp_verifications_attempts_check"',
  'OTP attempts constraint rejects more than three attempts'
);
select ok(public.verify_otp_server('fa000000-0000-0000-0000-000000000002', '123456'), 'correct OTP verifies the lead');
select is((select status from public.otp_verifications where lead_id = 'fa000000-0000-0000-0000-000000000002'),
  'verified'::public.otp_status, 'correct OTP marks OTP verified');
select is((select verification_status from public.leads where id = 'fa000000-0000-0000-0000-000000000002'),
  'otp_verified'::public.lead_verification_status, 'OTP verification updates lead status');
select is((select count(*) from public.reward_issuances where lead_id = 'fa000000-0000-0000-0000-000000000002'),
  1::bigint, 'verification creates exactly one reward');
select is((select count(*) from public.notification_jobs where lead_id = 'fa000000-0000-0000-0000-000000000002' and event_type = 'lead_verified'),
  1::bigint, 'verification creates the tenant lead notification job');
select is((select notification_status from public.leads where id = 'fa000000-0000-0000-0000-000000000002'),
  'pending'::public.notification_summary_status, 'lead notification summary is pending');
select lives_ok(
  $$update public.leads set verification_status = 'submitted'
      where id = 'fa000000-0000-0000-0000-000000000002';
    update public.leads set verification_status = 'otp_verified'
      where id = 'fa000000-0000-0000-0000-000000000002'$$,
  'repeated verified transition has no conflict-target error'
);
select is((select count(*) from public.notification_jobs where lead_id = 'fa000000-0000-0000-0000-000000000002' and event_type = 'lead_verified'),
  1::bigint, 'repeated verified transition does not duplicate lead jobs');

select lives_ok(
  $$select public.submit_lead_feedback_server('fa000000-0000-0000-0000-000000000002',
      'fa200000-0000-0000-0000-000000000002', 4::smallint, 'Fake useful feedback', 'am', 1)$$,
  'verified lead can submit feedback'
);
select is((select count(*) from public.lead_feedback where lead_id = 'fa000000-0000-0000-0000-000000000002'),
  1::bigint, 'feedback is stored once');
select is((select count(*) from public.notification_jobs where lead_id = 'fa000000-0000-0000-0000-000000000002' and event_type = 'feedback_received'),
  1::bigint, 'feedback creates the tenant feedback notification job');
select lives_ok(
  $$select public.submit_lead_feedback_server('fa000000-0000-0000-0000-000000000002',
      'fa200000-0000-0000-0000-000000000002', 4::smallint, 'Fake useful feedback', 'am', 1)$$,
  'repeated feedback submission is idempotent'
);
select is((select count(*) from public.notification_jobs where lead_id = 'fa000000-0000-0000-0000-000000000002' and event_type = 'feedback_received'),
  1::bigint, 'repeated feedback submission does not duplicate feedback jobs');
select is((select count(*) from public.notification_jobs j join public.notification_destinations d on d.id = j.destination_id
  where j.lead_id = 'fa000000-0000-0000-0000-000000000002' and d.company_id <> 'f2000000-0000-0000-0000-000000000002'),
  0::bigint, 'notification jobs never cross tenant destinations');
select is((select count(*) from pg_trigger
  where tgname in ('leads_enqueue_notifications', 'lead_feedback_enqueue_notifications')
    and tgenabled = 'O'), 2::bigint, 'notification triggers remain enabled throughout integrated tests');
select lives_ok(
  $$select * from public.calculate_driver_bonuses_server(
      'f4000000-0000-0000-0000-000000000002', 100, 10, 50, 80, 20
    )$$,
  'driver bonus calculation executes without ambiguous references'
);
select is((select
    base_fee_etb + lead_bonus_etb + top_driver_prize_etb - compliance_deduction_etb
  from public.driver_bonuses
  where campaign_id = 'f4000000-0000-0000-0000-000000000002'
    and driver_id = 'f6000000-0000-0000-0000-000000000003'),
  160::numeric, 'verified top driver receives the expected total bonus');
select is((select
    base_fee_etb + lead_bonus_etb + top_driver_prize_etb - compliance_deduction_etb
  from public.driver_bonuses
  where campaign_id = 'f4000000-0000-0000-0000-000000000002'
    and driver_id = 'f6000000-0000-0000-0000-000000000004'),
  100::numeric, 'other assigned driver receives only the configured base fee');
select is((select count(*) from public.driver_bonuses
  where driver_id in (
    'f6000000-0000-0000-0000-000000000001',
    'f6000000-0000-0000-0000-000000000002'
  )), 0::bigint, 'driver bonus calculation does not cross tenant campaigns');
select lives_ok(
  $$select * from public.calculate_driver_bonuses_server(
      'f4000000-0000-0000-0000-000000000002', 100, 10, 50, 80, 20
    )$$,
  'repeated driver bonus calculation succeeds idempotently'
);
select is((select count(*) from public.driver_bonuses
  where campaign_id = 'f4000000-0000-0000-0000-000000000002'),
  2::bigint, 'repeated calculation updates rather than duplicates bonuses');
select throws_ok(
  $$insert into public.lead_feedback (idempotency_key, lead_id, company_id, campaign_id, driver_id, qr_code_id, rating)
    values ('fa200000-0000-0000-0000-000000000003', 'fa000000-0000-0000-0000-000000000002',
      'f2000000-0000-0000-0000-000000000001', 'f4000000-0000-0000-0000-000000000002',
      'f6000000-0000-0000-0000-000000000003', 'f8000000-0000-0000-0000-000000000013', 3)$$,
  '23514', 'feedback_context_mismatch', 'feedback tenant context mismatch is rejected'
);
select throws_ok(
  $$update public.reward_issuances set company_id = 'f2000000-0000-0000-0000-000000000001'
    where lead_id = 'fa000000-0000-0000-0000-000000000002'$$,
  '23514', 'reward_context_mismatch', 'reward tenant context mismatch is rejected'
);

select * from finish();
rollback;
