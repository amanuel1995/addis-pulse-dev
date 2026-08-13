begin;

-- Supabase CLI/cloud projects with auto_expose_new_tables disabled do not
-- implicitly grant Data API privileges to service_role. The trusted Next.js
-- API and guarded staging fixture workflow use this role and already keep its
-- credential server-only. RLS bypass alone is insufficient without table
-- privileges, so grant them explicitly.
grant all privileges on all tables in schema public to service_role;
grant all privileges on all sequences in schema public to service_role;

commit;
