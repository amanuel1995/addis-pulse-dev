begin;

-- Milestone 1 advertiser dashboards must see a company-scoped lead while it
-- transitions from submitted/otp_sent to otp_verified. The foundational policy
-- intentionally limited reads to verified leads, which prevents that realtime
-- transition from reaching an authorized company representative.
drop policy if exists leads_authorized_read on public.leads;

create policy leads_authorized_read on public.leads
for select to authenticated
using (
  deleted_at is null
  and (
    (select private.is_platform_admin())
    or (select private.has_company_permission(company_id, 'view_leads'))
  )
);

commit;
