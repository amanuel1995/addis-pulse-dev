begin;

create extension if not exists pgtap with schema extensions;
set search_path = public, extensions;

select plan(62);

select is((select count(*) from public.companies), 2::bigint, 'seed has two companies');
select is((select count(*) from public.campaigns), 2::bigint, 'seed has two campaigns');
select is((select count(*) from public.campaign_content where locale in ('en', 'am')), 4::bigint, 'seed has English and Amharic campaign content');
select is((select count(*) from public.campaign_videos where active), 2::bigint, 'seed has two active campaign videos');

select throws_ok(
  $$insert into public.campaigns (company_id, name, start_date, end_date)
    values ('20000000-0000-0000-0000-000000000001', 'Invalid dates', '2026-02-01', '2026-01-01')$$,
  '23514', 'new row for relation "campaigns" violates check constraint "campaigns_valid_dates"',
  'campaign date constraint rejects end dates before start dates'
);
select throws_ok(
  $$insert into public.driver_campaign_assignments (driver_id, campaign_id)
    values ('60000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000002')$$,
  '23505', 'duplicate key value violates unique constraint "one_active_campaign_per_driver_uq"',
  'one-active-campaign constraint protects each driver'
);
select throws_ok(
  $$insert into public.qr_codes (qr_type, company_id, public_path)
    values ('driver', '20000000-0000-0000-0000-000000000001', 'd/missing-driver')$$,
  '23514', 'new row for relation "qr_codes" violates check constraint "qr_code_target_check"',
  'driver QR constraint requires a driver'
);

select lives_ok(
  $$insert into public.campaign_videos (id, campaign_id, provider, video_url, duration_seconds)
    values ('50000000-0000-0000-0000-000000000010', '40000000-0000-0000-0000-000000000001',
      'youtube', 'https://www.youtube.com/watch?v=FAKE_BOUNDARY_30', 30)$$,
  'video duration accepts 30 seconds'
);
select lives_ok(
  $$insert into public.campaign_videos (id, campaign_id, provider, video_url, duration_seconds)
    values ('50000000-0000-0000-0000-000000000011', '40000000-0000-0000-0000-000000000001',
      'youtube', 'https://www.youtube.com/watch?v=FAKE_BOUNDARY_50', 50)$$,
  'video duration accepts 50 seconds'
);
select throws_ok(
  $$insert into public.campaign_videos (campaign_id, provider, video_url, duration_seconds)
    values ('40000000-0000-0000-0000-000000000001', 'youtube', 'https://example.test/too-short', 29)$$,
  '23514', 'new row for relation "campaign_videos" violates check constraint "campaign_videos_duration_seconds_check"',
  'video duration rejects 29 seconds'
);
select throws_ok(
  $$insert into public.campaign_videos (campaign_id, provider, video_url, duration_seconds)
    values ('40000000-0000-0000-0000-000000000001', 'youtube', 'https://example.test/too-long', 51)$$,
  '23514', 'new row for relation "campaign_videos" violates check constraint "campaign_videos_duration_seconds_check"',
  'video duration rejects 51 seconds'
);
select throws_ok(
  $$insert into public.campaign_videos (campaign_id, provider, video_url, duration_seconds, active)
    values ('40000000-0000-0000-0000-000000000001', 'youtube', 'https://example.test/unvalidated', 40, true)$$,
  '23514', 'campaign_video_must_be_validated_before_activation',
  'video activation requires trusted validation'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000002', true);
select set_config('request.jwt.claims', '{"sub":"10000000-0000-0000-0000-000000000002","role":"authenticated"}', true);
select is((select count(*) from public.companies), 1::bigint, 'alpha representative sees one company');
select is((select id from public.companies limit 1), '20000000-0000-0000-0000-000000000001'::uuid, 'alpha representative sees only alpha company');
select is((select count(*) from public.campaigns), 1::bigint, 'alpha representative sees only alpha campaign');
select is((select count(*) from public.notification_destinations), 2::bigint, 'alpha representative sees only alpha destinations');
reset role;

insert into public.leads (
  id, idempotency_key, company_id, campaign_id, campaign_video_id, driver_id,
  qr_code_id, full_name, phone_e164, phone_hash, verification_status,
  ip_hash, consent_given, consent_at, privacy_notice_version
) values
  ('a0000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001',
   '20000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000001',
   '50000000-0000-0000-0000-000000000001', '60000000-0000-0000-0000-000000000001',
   '80000000-0000-0000-0000-000000000011', 'Fake Unverified Lead', '+251922000001',
   'fake-lead-phone-hash-1', 'submitted', 'fake-ip-hash-1', true, '2026-01-01 00:00:00+00', 'seed-v1'),
  ('a0000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000002',
   '20000000-0000-0000-0000-000000000002', '40000000-0000-0000-0000-000000000002',
   '50000000-0000-0000-0000-000000000002', '60000000-0000-0000-0000-000000000003',
   '80000000-0000-0000-0000-000000000013', 'Fake OTP Lead', '+251922000002',
   'fake-lead-phone-hash-2', 'submitted', 'fake-ip-hash-2', true, '2026-01-01 00:00:00+00', 'seed-v1');

select is((select count(*) from public.lead_quality_decisions where lead_id in (
  'a0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000002'
)), 2::bigint, 'lead inserts create initial quality decisions');
select throws_ok(
  $$select public.submit_lead_feedback_server('a0000000-0000-0000-0000-000000000001',
      'a2000000-0000-0000-0000-000000000001', 5::smallint, 'Too early', 'en', 1)$$,
  'P0001', 'feedback_requires_verified_lead', 'feedback requires a verified lead'
);
select throws_ok(
  $$insert into public.reward_issuances (lead_id, company_id, campaign_id, driver_id, reward_type)
    values ('a0000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001',
      '40000000-0000-0000-0000-000000000001', '60000000-0000-0000-0000-000000000001', 'voucher')$$,
  '23514', 'reward_requires_verified_lead', 'rewards require a verified lead'
);

select lives_ok(
  $$select public.create_otp_challenge_server('a0000000-0000-0000-0000-000000000001', '654321', 300)$$,
  'failed-flow OTP challenge is created'
);
insert into public.otp_delivery_attempts (
  otp_verification_id, attempt_number, destination_hash, status, accepted_at
) select id, 1, 'fake-failed-otp-destination-hash', 'accepted', now()
  from public.otp_verifications where lead_id = 'a0000000-0000-0000-0000-000000000001' and status = 'created';
select is((select status from public.otp_verifications where lead_id = 'a0000000-0000-0000-0000-000000000001'),
  'sent'::public.otp_status, 'failed-flow OTP starts sent');
select ok(not public.verify_otp_server('a0000000-0000-0000-0000-000000000001', '000000'),
  'first incorrect OTP returns false');
select is((select attempts from public.otp_verifications where lead_id = 'a0000000-0000-0000-0000-000000000001'),
  1::smallint, 'first incorrect OTP increments attempts to one');
select is((select status from public.otp_verifications where lead_id = 'a0000000-0000-0000-0000-000000000001'),
  'sent'::public.otp_status, 'first incorrect OTP keeps status sent');
select ok(not public.verify_otp_server('a0000000-0000-0000-0000-000000000001', '000000'),
  'second incorrect OTP returns false');
select is((select attempts from public.otp_verifications where lead_id = 'a0000000-0000-0000-0000-000000000001'),
  2::smallint, 'second incorrect OTP increments attempts to two');
select is((select status from public.otp_verifications where lead_id = 'a0000000-0000-0000-0000-000000000001'),
  'sent'::public.otp_status, 'second incorrect OTP keeps status sent');
select ok(not public.verify_otp_server('a0000000-0000-0000-0000-000000000001', '000000'),
  'third incorrect OTP returns false');
select is((select attempts from public.otp_verifications where lead_id = 'a0000000-0000-0000-0000-000000000001'),
  3::smallint, 'third incorrect OTP increments attempts to three');
select is((select status from public.otp_verifications where lead_id = 'a0000000-0000-0000-0000-000000000001'),
  'failed'::public.otp_status, 'third incorrect OTP marks OTP failed');
select is((select verification_status from public.leads where id = 'a0000000-0000-0000-0000-000000000001'),
  'otp_failed'::public.lead_verification_status, 'third incorrect OTP marks lead otp_failed');

select lives_ok(
  $$select public.create_otp_challenge_server('a0000000-0000-0000-0000-000000000002', '123456', 300)$$,
  'OTP challenge accepts a six-digit code and valid TTL'
);
select throws_ok(
  $$select public.create_otp_challenge_server('a0000000-0000-0000-0000-000000000002', '12345', 300)$$,
  '22023', 'otp_must_be_six_digits', 'OTP challenge rejects a non-six-digit code'
);
select lives_ok(
  $$select public.record_otp_delivery_attempt_server(
      (select id from public.otp_verifications
        where lead_id = 'a0000000-0000-0000-0000-000000000002' and status = 'created'),
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
select is((select status from public.otp_verifications where lead_id = 'a0000000-0000-0000-0000-000000000002'),
  'sent'::public.otp_status, 'accepted delivery marks OTP sent');
select throws_ok(
  $$update public.otp_verifications set attempts = 4
    where lead_id = 'a0000000-0000-0000-0000-000000000002'$$,
  '23514', 'new row for relation "otp_verifications" violates check constraint "otp_verifications_attempts_check"',
  'OTP attempts constraint rejects more than three attempts'
);
select ok(public.verify_otp_server('a0000000-0000-0000-0000-000000000002', '123456'), 'correct OTP verifies the lead');
select is((select status from public.otp_verifications where lead_id = 'a0000000-0000-0000-0000-000000000002'),
  'verified'::public.otp_status, 'correct OTP marks OTP verified');
select is((select verification_status from public.leads where id = 'a0000000-0000-0000-0000-000000000002'),
  'otp_verified'::public.lead_verification_status, 'OTP verification updates lead status');
select is((select count(*) from public.reward_issuances where lead_id = 'a0000000-0000-0000-0000-000000000002'),
  1::bigint, 'verification creates exactly one reward');
select is((select count(*) from public.notification_jobs where lead_id = 'a0000000-0000-0000-0000-000000000002' and event_type = 'lead_verified'),
  1::bigint, 'verification creates the tenant lead notification job');
select is((select notification_status from public.leads where id = 'a0000000-0000-0000-0000-000000000002'),
  'pending'::public.notification_summary_status, 'lead notification summary is pending');
select lives_ok(
  $$update public.leads set verification_status = 'submitted'
      where id = 'a0000000-0000-0000-0000-000000000002';
    update public.leads set verification_status = 'otp_verified'
      where id = 'a0000000-0000-0000-0000-000000000002'$$,
  'repeated verified transition has no conflict-target error'
);
select is((select count(*) from public.notification_jobs where lead_id = 'a0000000-0000-0000-0000-000000000002' and event_type = 'lead_verified'),
  1::bigint, 'repeated verified transition does not duplicate lead jobs');

select lives_ok(
  $$select public.submit_lead_feedback_server('a0000000-0000-0000-0000-000000000002',
      'a2000000-0000-0000-0000-000000000002', 4::smallint, 'Fake useful feedback', 'am', 1)$$,
  'verified lead can submit feedback'
);
select is((select count(*) from public.lead_feedback where lead_id = 'a0000000-0000-0000-0000-000000000002'),
  1::bigint, 'feedback is stored once');
select is((select count(*) from public.notification_jobs where lead_id = 'a0000000-0000-0000-0000-000000000002' and event_type = 'feedback_received'),
  1::bigint, 'feedback creates the tenant feedback notification job');
select lives_ok(
  $$select public.submit_lead_feedback_server('a0000000-0000-0000-0000-000000000002',
      'a2000000-0000-0000-0000-000000000002', 4::smallint, 'Fake useful feedback', 'am', 1)$$,
  'repeated feedback submission is idempotent'
);
select is((select count(*) from public.notification_jobs where lead_id = 'a0000000-0000-0000-0000-000000000002' and event_type = 'feedback_received'),
  1::bigint, 'repeated feedback submission does not duplicate feedback jobs');
select is((select count(*) from public.notification_jobs j join public.notification_destinations d on d.id = j.destination_id
  where j.lead_id = 'a0000000-0000-0000-0000-000000000002' and d.company_id <> '20000000-0000-0000-0000-000000000002'),
  0::bigint, 'notification jobs never cross tenant destinations');
select is((select count(*) from pg_trigger
  where tgname in ('leads_enqueue_notifications', 'lead_feedback_enqueue_notifications')
    and tgenabled = 'O'), 2::bigint, 'notification triggers remain enabled throughout integrated tests');
select lives_ok(
  $$select * from public.calculate_driver_bonuses_server(
      '40000000-0000-0000-0000-000000000002', 100, 10, 50, 80, 20
    )$$,
  'driver bonus calculation executes without ambiguous references'
);
select is((select
    base_fee_etb + lead_bonus_etb + top_driver_prize_etb - compliance_deduction_etb
  from public.driver_bonuses
  where campaign_id = '40000000-0000-0000-0000-000000000002'
    and driver_id = '60000000-0000-0000-0000-000000000003'),
  160::numeric, 'verified top driver receives the expected total bonus');
select is((select
    base_fee_etb + lead_bonus_etb + top_driver_prize_etb - compliance_deduction_etb
  from public.driver_bonuses
  where campaign_id = '40000000-0000-0000-0000-000000000002'
    and driver_id = '60000000-0000-0000-0000-000000000004'),
  100::numeric, 'other assigned driver receives only the configured base fee');
select is((select count(*) from public.driver_bonuses
  where driver_id in (
    '60000000-0000-0000-0000-000000000001',
    '60000000-0000-0000-0000-000000000002'
  )), 0::bigint, 'driver bonus calculation does not cross tenant campaigns');
select lives_ok(
  $$select * from public.calculate_driver_bonuses_server(
      '40000000-0000-0000-0000-000000000002', 100, 10, 50, 80, 20
    )$$,
  'repeated driver bonus calculation succeeds idempotently'
);
select is((select count(*) from public.driver_bonuses
  where campaign_id = '40000000-0000-0000-0000-000000000002'),
  2::bigint, 'repeated calculation updates rather than duplicates bonuses');
select throws_ok(
  $$insert into public.lead_feedback (idempotency_key, lead_id, company_id, campaign_id, driver_id, qr_code_id, rating)
    values ('a2000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000002',
      '20000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000002',
      '60000000-0000-0000-0000-000000000003', '80000000-0000-0000-0000-000000000013', 3)$$,
  '23514', 'feedback_context_mismatch', 'feedback tenant context mismatch is rejected'
);
select throws_ok(
  $$update public.reward_issuances set company_id = '20000000-0000-0000-0000-000000000001'
    where lead_id = 'a0000000-0000-0000-0000-000000000002'$$,
  '23514', 'reward_context_mismatch', 'reward tenant context mismatch is rejected'
);

select * from finish();
rollback;
