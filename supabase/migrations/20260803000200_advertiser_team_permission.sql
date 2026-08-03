alter table public.company_memberships
  add column if not exists can_manage_team boolean not null default false;

comment on column public.company_memberships.can_manage_team is
  'Allows a representative to provision and update representatives for the same company through a trusted server action.';
