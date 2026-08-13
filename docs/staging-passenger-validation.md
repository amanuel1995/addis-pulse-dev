# Staging passenger-flow validation

## Why fixtures use the Admin API

`supabase test db --linked` connects as the restricted `cli_login_postgres`
role. That role cannot write `auth.users`, so it cannot create the identities
required by profile foreign keys and tenant RLS tests. We do not grant it Auth
schema access and do not install a privileged SQL helper. Staging identities
are instead created through `supabase.auth.admin.createUser()` using a
server-side service-role client.

## Temporary environment

Set these only in the PowerShell session used for staging operations. Never
put the values in source files or paste them into logs:

```powershell
$env:ALLOW_STAGING_FIXTURES="true"
$env:STAGING_PROJECT_REF="<staging-ref>"
$env:STAGING_SUPABASE_URL="https://<staging-ref>.supabase.co"
$env:STAGING_SUPABASE_SERVICE_ROLE_KEY="<staging-service-role-key>"
$env:PRODUCTION_PROJECT_REF="<production-ref>"
$env:STAGING_APP_URL="https://<staging-deployment>"
```

The scripts refuse to run unless the safety switch is exactly `true`, the URL
host exactly matches the staging reference, staging differs from production,
the service key exists, and `NODE_ENV` is not `production`.

## Workflow

```powershell
npm run staging:fixtures:up
npm run test:staging
npm run staging:fixtures:down
```

Bootstrap is idempotent and only repairs deterministic, marked staging rows.
Cleanup verifies fixture markers before deleting known IDs. Passwords are
randomized in memory and never printed. Notification destinations use reserved
`.example.test` addresses and must not be connected to a delivery worker.

## Automated OTP scope

Automated validation uses the real database OTP functions and triggers with an
explicit `fake_local` code generated under `NODE_ENV=test`. It does not invoke
the deployed SMS sender and never calls Africa's Talking. Production provider
configuration continues to reject `fake_local`.

## Manual Africa's Talking check

Run separately after automated checks:

1. Confirm the deployment uses the staging Supabase reference.
2. Set `OTP_PROVIDER=africas_talking` and staging Africa's Talking credentials.
3. Use a team-controlled Ethiopian test handset and the staging QR.
4. Submit one clearly marked staging lead and confirm one SMS arrives.
5. Verify the received code, reward, and notification job.
6. Run `npm run staging:fixtures:down` and remove the manual lead if it did not
   use the automated fixture marker.

Never automate this checklist or use a customer phone number.
