begin;

-- This trigger function is shared by companies and qr_codes. PL/pgSQL resolves
-- record fields referenced within a boolean expression even when an earlier
-- AND operand is false, so use nested table guards before accessing fields that
-- only exist on one of the trigger tables.
create or replace function private.prevent_immutable_field_change()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if tg_table_name = 'companies' then
    if new.identifier is distinct from old.identifier then
      raise exception using
        errcode = '23514',
        message = 'company_identifier_is_immutable';
    end if;
  end if;

  if tg_table_name = 'qr_codes' then
    if new.token is distinct from old.token
       or new.public_path is distinct from old.public_path
       or new.qr_type is distinct from old.qr_type
       or new.company_id is distinct from old.company_id
       or new.driver_id is distinct from old.driver_id then
      raise exception using
        errcode = '23514',
        message = 'qr_route_identity_is_immutable';
    end if;
  end if;

  return new;
end;
$$;

commit;
