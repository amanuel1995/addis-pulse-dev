begin;

create extension if not exists pgtap with schema extensions;
set search_path = public, extensions;

select plan(8);

select is((select count(*) from public.companies where id in (
  '20000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000002'
)), 2::bigint, 'local seed includes two companies');
select is((select count(*) from public.campaigns where id in (
  '40000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000002'
)), 2::bigint, 'local seed includes two campaigns');
select is((select count(*) from public.campaign_content where campaign_id in (
  '40000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000002'
) and locale in ('en', 'am')), 4::bigint, 'local seed includes bilingual campaign content');
select is((select count(*) from public.campaign_videos where id in (
  '50000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000002'
) and active), 2::bigint, 'local seed includes two active campaign videos');
select is((select count(*) from public.drivers where id in (
  '60000000-0000-0000-0000-000000000001', '60000000-0000-0000-0000-000000000002',
  '60000000-0000-0000-0000-000000000003', '60000000-0000-0000-0000-000000000004'
)), 4::bigint, 'local seed includes four drivers');
select is((select count(*) from public.driver_campaign_assignments where id in (
  '70000000-0000-0000-0000-000000000001', '70000000-0000-0000-0000-000000000002',
  '70000000-0000-0000-0000-000000000003', '70000000-0000-0000-0000-000000000004'
)), 4::bigint, 'local seed includes four driver assignments');
select is((select count(*) from public.qr_codes where id in (
  '80000000-0000-0000-0000-000000000001', '80000000-0000-0000-0000-000000000002',
  '80000000-0000-0000-0000-000000000011', '80000000-0000-0000-0000-000000000012',
  '80000000-0000-0000-0000-000000000013', '80000000-0000-0000-0000-000000000014'
)), 6::bigint, 'local seed includes company and driver QR codes');
select is((select count(*) from public.notification_destinations where id in (
  '90000000-0000-0000-0000-000000000001', '90000000-0000-0000-0000-000000000002',
  '90000000-0000-0000-0000-000000000003', '90000000-0000-0000-0000-000000000004'
)), 4::bigint, 'local seed includes notification destinations');

select * from finish();
rollback;
