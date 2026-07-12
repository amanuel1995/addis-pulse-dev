-- Correct PostgreSQL enum assignment in the failed OTP path without changing
-- the existing verification, reward, or notification lifecycle.
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
      status = case
        when v_next_attempts >= 3 then 'failed'::public.otp_status
        else 'sent'::public.otp_status
      end
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

-- Match the conflict target predicate to notification_jobs_lead_verified_uq so
-- repeated lead events remain idempotent under the existing partial index.
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
  on conflict (lead_id, destination_id)
  where event_type = 'lead_verified'::public.notification_event_type
  do nothing;

  get diagnostics v_inserted = row_count;

  if v_inserted = 0 then
    update public.leads
    set notification_status = 'not_configured'
    where id = new.id;
  end if;

  return new;
end;
$$;

-- Match the conflict target predicate to notification_jobs_feedback_uq so
-- repeated feedback events remain idempotent under the existing partial index.
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
  on conflict (feedback_id, destination_id)
  where event_type = 'feedback_received'::public.notification_event_type
  do nothing;

  get diagnostics v_inserted = row_count;

  if v_inserted = 0 then
    update public.lead_feedback
    set notification_status = 'not_configured'
    where id = new.id;
  end if;

  return new;
end;
$$;
