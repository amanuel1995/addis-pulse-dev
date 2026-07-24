# Milestone 1 release-candidate smoke test

## Safety gates

- Use `feature/m1-release-candidate`; never run this checklist from `main`.
- Confirm the application and server keys point to the staging Supabase project.
- Confirm the staging and production project references differ.
- Use only a team-controlled Ethiopian test handset for the one manual SMS check.
- Never print credentials, plaintext OTPs, raw IPs, fingerprints, or customer phone numbers.
- Automated checks must use `fake_local`; they must not call Africa's Talking.

## Automated release checks

```powershell
npm ci
npx supabase start
npx supabase db reset
npx supabase test db
npm run lint
npm run typecheck
npm run test
npm run build
```

## Local passenger demonstration

With local Supabase and explicit `fake_local` configuration:

1. Open `http://127.0.0.1:3000/d/fake-alpha-driver-1`.
2. Confirm the seeded campaign and lead form render.
3. Confirm `/d/does-not-exist` shows the invalid/not-found state.
4. Submit a fictitious name, supported Ethiopian test number, and consent.
5. Confirm a retry with the same idempotency key does not create a second lead.
6. Confirm the verification page loads.
7. Enter an incorrect code and confirm a useful error.
8. Confirm resend cooldown behavior.
9. Verify with the explicitly configured local fake code.
10. Confirm the thank-you and reward state.
11. Confirm the database lead is `otp_verified`.

## Advertiser demonstration

1. Sign in at `http://127.0.0.1:3000/advertiser/login` with a deterministic local representative from `supabase/seed.sql`.
2. Confirm an unauthenticated dashboard request redirects to sign-in.
3. Confirm a representative without `can_view_leads` sees the unauthorized state.
4. Confirm the dashboard shows only the representative's company records.
5. Submit a new passenger lead and confirm it appears as pending without refresh.
6. Verify the OTP and confirm the same row changes to verified without refresh.
7. Confirm totals, verified, pending, and conversion rate recalculate.
8. Sign in as the other seeded company representative and confirm the first company's lead is absent.
9. Confirm only a masked phone representation is rendered.

## Controlled staging SMS check

After automated staging validation succeeds:

1. Configure `OTP_PROVIDER=africas_talking` and staging-only provider credentials in Vercel Preview.
2. Submit one clearly marked staging lead using a team-controlled handset.
3. Confirm exactly one SMS arrives.
4. Verify the received code and confirm reward creation and dashboard visibility.
5. Clean up the staging fixture and manual test lead.

Record the Preview URL, commit SHA, staging project reference, test time, and tester. Do not record secrets or the OTP.
