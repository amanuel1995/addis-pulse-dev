# Local-only database tests

`seed_smoke_test.sql` verifies data loaded by `supabase/seed.sql`. It is kept
outside `supabase/tests/` so `npx supabase test db --linked` never expects local
development seed data.

Run it after `npx supabase db reset`:

```powershell
npx supabase test db supabase/tests-local/seed_smoke_test.sql
```
