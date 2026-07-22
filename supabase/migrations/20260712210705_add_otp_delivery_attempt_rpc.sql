-- Record provider delivery lifecycle without granting service_role direct
-- access to OTP tables that contain verification secrets.
create or replace function public.record_otp_delivery_attempt_server(
  p_otp_verification_id uuid,
  p_attempt_number smallint,
  p_provider text,
  p_destination_hash text,
  p_status public.otp_delivery_status,
  p_provider_message_id text default null,
  p_error_code text default null,
  p_error_message text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_attempt_id uuid;
begin
  if p_status not in ('pending', 'accepted', 'delivered', 'failed') then
    raise exception using errcode = '22023', message = 'invalid_delivery_status';
  end if;

  insert into public.otp_delivery_attempts (
    otp_verification_id,
    attempt_number,
    provider,
    provider_message_id,
    destination_hash,
    status,
    accepted_at,
    delivered_at,
    failed_at,
    error_code,
    error_message
  ) values (
    p_otp_verification_id,
    p_attempt_number,
    p_provider,
    p_provider_message_id,
    p_destination_hash,
    p_status,
    case when p_status = 'accepted' then now() else null end,
    case when p_status = 'delivered' then now() else null end,
    case when p_status = 'failed' then now() else null end,
    p_error_code,
    p_error_message
  )
  on conflict (otp_verification_id, attempt_number)
  do update set
    provider_message_id = coalesce(excluded.provider_message_id, public.otp_delivery_attempts.provider_message_id),
    status = excluded.status,
    accepted_at = coalesce(excluded.accepted_at, public.otp_delivery_attempts.accepted_at),
    delivered_at = coalesce(excluded.delivered_at, public.otp_delivery_attempts.delivered_at),
    failed_at = coalesce(excluded.failed_at, public.otp_delivery_attempts.failed_at),
    error_code = excluded.error_code,
    error_message = excluded.error_message,
    updated_at = now()
  returning id into v_attempt_id;

  return v_attempt_id;
end;
$$;

revoke all on function public.record_otp_delivery_attempt_server(
  uuid, smallint, text, text, public.otp_delivery_status, text, text, text
) from public, anon, authenticated;
grant execute on function public.record_otp_delivery_attempt_server(
  uuid, smallint, text, text, public.otp_delivery_status, text, text, text
) to service_role;
