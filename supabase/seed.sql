-- Deterministic local-development data. All people, companies, contact details,
-- provider identifiers, and media URLs below are fictitious.
begin;

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) values
  ('00000000-0000-0000-0000-000000000000', '10000000-0000-0000-0000-000000000001', 'authenticated', 'authenticated',
   'admin.one@example.test', extensions.crypt('LocalOnly-Fake-Password-1!', extensions.gen_salt('bf')), '2026-01-01 00:00:00+00',
   '{"provider":"email","providers":["email"]}', '{"full_name":"Fake Platform Admin"}', '2026-01-01 00:00:00+00', '2026-01-01 00:00:00+00'),
  ('00000000-0000-0000-0000-000000000000', '10000000-0000-0000-0000-000000000002', 'authenticated', 'authenticated',
   'rep.alpha@example.test', extensions.crypt('LocalOnly-Fake-Password-2!', extensions.gen_salt('bf')), '2026-01-01 00:00:00+00',
   '{"provider":"email","providers":["email"]}', '{"full_name":"Fake Alpha Representative"}', '2026-01-01 00:00:00+00', '2026-01-01 00:00:00+00'),
  ('00000000-0000-0000-0000-000000000000', '10000000-0000-0000-0000-000000000003', 'authenticated', 'authenticated',
   'rep.beta@example.test', extensions.crypt('LocalOnly-Fake-Password-3!', extensions.gen_salt('bf')), '2026-01-01 00:00:00+00',
   '{"provider":"email","providers":["email"]}', '{"full_name":"Fake Beta Representative"}', '2026-01-01 00:00:00+00', '2026-01-01 00:00:00+00');

update public.profiles
set platform_role = 'super_admin', full_name = 'Fake Platform Admin'
where id = '10000000-0000-0000-0000-000000000001';

insert into public.companies (
  id, identifier, name, logo_path, brand_color, description, services_summary,
  public_contact_name, public_contact_title, public_contact_email,
  public_contact_phone, website_url, sector, status, created_by, created_at, updated_at
) values
  ('20000000-0000-0000-0000-000000000001', 'fake-alpha-health', 'Fake Alpha Health PLC',
   'seed/fake-alpha-logo.svg', '#2563EB', 'Fictitious local seed healthcare company.',
   'Fake consultations and wellness information.', 'Almaz Test', 'Seed Contact',
   'contact.alpha@example.test', '+251911000001', 'https://alpha.example.test', 'Healthcare', 'active',
   '10000000-0000-0000-0000-000000000001', '2026-01-01 00:00:00+00', '2026-01-01 00:00:00+00'),
  ('20000000-0000-0000-0000-000000000002', 'fake-beta-learning', 'Fake Beta Learning PLC',
   'seed/fake-beta-logo.svg', '#7C3AED', 'Fictitious local seed education company.',
   'Fake short courses and admissions guidance.', 'Bekele Test', 'Seed Contact',
   'contact.beta@example.test', '+251911000002', 'https://beta.example.test', 'Education', 'active',
   '10000000-0000-0000-0000-000000000001', '2026-01-01 00:00:00+00', '2026-01-01 00:00:00+00');

insert into public.company_memberships (
  company_id, user_id, can_edit_profile, can_view_leads, can_export_leads,
  can_update_lead_status, can_manage_notifications, created_by
) values
  ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002', true, true, true, true, true, '10000000-0000-0000-0000-000000000001'),
  ('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000003', true, true, true, true, true, '10000000-0000-0000-0000-000000000001');

insert into public.company_services (id, company_id, name, description, display_order) values
  ('30000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'Fake Wellness Consultation', 'Fictitious consultation service.', 1),
  ('30000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000001', 'Fake Health Screening', 'Fictitious screening service.', 2),
  ('30000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000002', 'Fake Evening Course', 'Fictitious evening course.', 1),
  ('30000000-0000-0000-0000-000000000004', '20000000-0000-0000-0000-000000000002', 'Fake Admissions Advice', 'Fictitious admissions service.', 2);

insert into public.campaigns (
  id, company_id, name, campaign_type, status, start_date, end_date,
  vehicle_count, target_leads, budget_etb, reward_type, reward_description,
  reward_unit_cost_etb, landing_page_config, default_locale, created_by
) values
  ('40000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'Fake Alpha Wellness Campaign',
   'appointment_booking', 'active', '2026-01-01', '2099-12-31', 2, 100, 50000, 'voucher',
   'Fake 10 percent wellness voucher.', 25, '{"theme":"seed-alpha","form_fields":["full_name","phone"]}', 'en',
   '10000000-0000-0000-0000-000000000001'),
  ('40000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000002', 'Fake Beta Skills Campaign',
   'lead_generation', 'active', '2026-01-01', '2099-12-31', 2, 120, 60000, 'digital_coupon',
   'Fake course information coupon.', 20, '{"theme":"seed-beta","form_fields":["full_name","phone"]}', 'am',
   '10000000-0000-0000-0000-000000000001');

insert into public.campaign_content (
  campaign_id, locale, headline, subheadline, description, offer_text,
  reward_text, call_to_action, privacy_notice_text, created_by
) values
  ('40000000-0000-0000-0000-000000000001', 'en', 'Book a fake wellness visit', 'Local seed content only',
   'Explore a fictitious wellness service.', 'Request a fake callback.', 'Receive a fake voucher after verification.',
   'Continue', 'This is fake local seed data.', '10000000-0000-0000-0000-000000000001'),
  ('40000000-0000-0000-0000-000000000001', 'am', 'የሙከራ የጤና ቀጠሮ ይያዙ', 'ለአካባቢ ሙከራ ብቻ',
   'ምናባዊ የጤና አገልግሎት።', 'የሙከራ ጥሪ ይጠይቁ።', 'ከማረጋገጫ በኋላ የሙከራ ቫውቸር።',
   'ይቀጥሉ', 'ይህ የአካባቢ የሙከራ ውሂብ ነው።', '10000000-0000-0000-0000-000000000001'),
  ('40000000-0000-0000-0000-000000000002', 'en', 'Explore a fake evening course', 'Local seed content only',
   'Explore a fictitious learning program.', 'Request fake course details.', 'Receive a fake digital coupon.',
   'Continue', 'This is fake local seed data.', '10000000-0000-0000-0000-000000000001'),
  ('40000000-0000-0000-0000-000000000002', 'am', 'የሙከራ ማታ ትምህርት ይመልከቱ', 'ለአካባቢ ሙከራ ብቻ',
   'ምናባዊ የትምህርት ፕሮግራም።', 'የሙከራ መረጃ ይጠይቁ።', 'የሙከራ ዲጂታል ኩፖን ያግኙ።',
   'ይቀጥሉ', 'ይህ የአካባቢ የሙከራ ውሂብ ነው።', '10000000-0000-0000-0000-000000000001');

insert into public.campaign_videos (
  id, campaign_id, provider, video_url, duration_seconds, poster_path, caption,
  metadata, active, validated_at, validated_by, created_by
) values
  ('50000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000001', 'youtube',
   'https://www.youtube.com/watch?v=FAKE_ALPHA_SEED', 35, 'seed/fake-alpha-poster.jpg', 'Fake alpha campaign video',
   '{"seed":true,"fake":true}', true, '2026-01-01 00:00:00+00', '10000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001'),
  ('50000000-0000-0000-0000-000000000002', '40000000-0000-0000-0000-000000000002', 'vimeo',
   'https://vimeo.com/000000002', 45, 'seed/fake-beta-poster.jpg', 'Fake beta campaign video',
   '{"seed":true,"fake":true}', true, '2026-01-01 00:00:00+00', '10000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001');

insert into public.drivers (
  id, full_name, phone_e164, phone_hash, vehicle_plate, primary_zone,
  telegram_handle, telegram_user_id, status
) values
  ('60000000-0000-0000-0000-000000000001', 'Fake Driver Alpha One', '+251911100001', 'fake-driver-phone-hash-1', 'FAKE-A-001', 'Bole', 'fake_alpha_one', 900000001, 'active'),
  ('60000000-0000-0000-0000-000000000002', 'Fake Driver Alpha Two', '+251911100002', 'fake-driver-phone-hash-2', 'FAKE-A-002', 'Kazanchis', 'fake_alpha_two', 900000002, 'active'),
  ('60000000-0000-0000-0000-000000000003', 'Fake Driver Beta One', '+251911100003', 'fake-driver-phone-hash-3', 'FAKE-B-001', 'Sar Bet', 'fake_beta_one', 900000003, 'active'),
  ('60000000-0000-0000-0000-000000000004', 'Fake Driver Beta Two', '+251911100004', 'fake-driver-phone-hash-4', 'FAKE-B-002', 'Megenagna', 'fake_beta_two', 900000004, 'active');

insert into public.driver_campaign_assignments (id, driver_id, campaign_id, assigned_by) values
  ('70000000-0000-0000-0000-000000000001', '60000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001'),
  ('70000000-0000-0000-0000-000000000002', '60000000-0000-0000-0000-000000000002', '40000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001'),
  ('70000000-0000-0000-0000-000000000003', '60000000-0000-0000-0000-000000000003', '40000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001'),
  ('70000000-0000-0000-0000-000000000004', '60000000-0000-0000-0000-000000000004', '40000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001');

insert into public.qr_codes (id, qr_type, company_id, driver_id, token, public_path, image_path) values
  ('80000000-0000-0000-0000-000000000001', 'company', '20000000-0000-0000-0000-000000000001', null, '81000000-0000-0000-0000-000000000001', 'c/fake-alpha-health', 'seed/qr-company-alpha.png'),
  ('80000000-0000-0000-0000-000000000002', 'company', '20000000-0000-0000-0000-000000000002', null, '81000000-0000-0000-0000-000000000002', 'c/fake-beta-learning', 'seed/qr-company-beta.png'),
  ('80000000-0000-0000-0000-000000000011', 'driver', '20000000-0000-0000-0000-000000000001', '60000000-0000-0000-0000-000000000001', '81000000-0000-0000-0000-000000000011', 'd/fake-alpha-driver-1', 'seed/qr-driver-alpha-1.png'),
  ('80000000-0000-0000-0000-000000000012', 'driver', '20000000-0000-0000-0000-000000000001', '60000000-0000-0000-0000-000000000002', '81000000-0000-0000-0000-000000000012', 'd/fake-alpha-driver-2', 'seed/qr-driver-alpha-2.png'),
  ('80000000-0000-0000-0000-000000000013', 'driver', '20000000-0000-0000-0000-000000000002', '60000000-0000-0000-0000-000000000003', '81000000-0000-0000-0000-000000000013', 'd/fake-beta-driver-1', 'seed/qr-driver-beta-1.png'),
  ('80000000-0000-0000-0000-000000000014', 'driver', '20000000-0000-0000-0000-000000000002', '60000000-0000-0000-0000-000000000004', '81000000-0000-0000-0000-000000000014', 'd/fake-beta-driver-2', 'seed/qr-driver-beta-2.png');

insert into public.company_receiver_settings (company_id, receiver_name, updated_by) values
  ('20000000-0000-0000-0000-000000000001', 'Fake Alpha Receiver', '10000000-0000-0000-0000-000000000001'),
  ('20000000-0000-0000-0000-000000000002', 'Fake Beta Receiver', '10000000-0000-0000-0000-000000000001');

insert into public.notification_destinations (
  id, company_id, channel, event_type, frequency, destination_value,
  destination_hash, label, active, is_primary, created_by
) values
  ('90000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'email', 'lead_verified', 'instant', 'leads.alpha@example.test', 'fake-destination-hash-alpha-leads', 'Fake lead inbox', true, true, '10000000-0000-0000-0000-000000000001'),
  ('90000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000001', 'telegram', 'feedback_received', 'instant', 'fake-telegram-chat-alpha', 'fake-destination-hash-alpha-feedback', 'Fake feedback chat', true, true, '10000000-0000-0000-0000-000000000001'),
  ('90000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000002', 'email', 'lead_verified', 'instant', 'leads.beta@example.test', 'fake-destination-hash-beta-leads', 'Fake lead inbox', true, true, '10000000-0000-0000-0000-000000000001'),
  ('90000000-0000-0000-0000-000000000004', '20000000-0000-0000-0000-000000000002', 'telegram', 'feedback_received', 'instant', 'fake-telegram-chat-beta', 'fake-destination-hash-beta-feedback', 'Fake feedback chat', true, true, '10000000-0000-0000-0000-000000000001');

update public.app_settings
set public_base_url = 'http://127.0.0.1:3000', updated_at = '2026-01-01 00:00:00+00'
where id = 1;

commit;
