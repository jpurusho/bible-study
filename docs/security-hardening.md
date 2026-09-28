# Security and Reliability Deployment

## Required deployment order

1. Create replacement Anthropic and ESV keys, but leave the old keys active temporarily.
2. Add the replacements as `ANTHROPIC_API_KEY` and `ESV_API_KEY` in the Vercel production environment. The values take effect on the next deployment.
3. Apply `20260927000001_security_hardening.sql` to Supabase. Do this before deploying because the new application calls RPCs created by the migration.
4. Merge and deploy the application. The release removes old service-worker caches and unregisters the worker.
5. Confirm a pending account cannot update `role` or `is_approved`, then confirm an administrator can still approve users.
6. Confirm scripture lookup, AI generation, and the other smoke tests below.
7. Revoke the old provider keys and delete the `anthropic_api_key` and `esv_api_key` rows from `app_settings`.

The application temporarily retains a service-role-only fallback to the database key rows so steps 3 and 4 can be completed without downtime. Remove those rows only after the replacement environment keys are verified in production.

## Verification checklist

- Install the site to an iPhone Home Screen, sign in, close it, and launch it again.
- Test a launch while changing between Wi-Fi and cellular service.
- Confirm scripture lookups, AI generation, quizzes, notes, search, and admin user management.
- Confirm the response includes CSP, `nosniff`, referrer, frame, and permissions headers.
- Review Vercel Analytics and Speed Insights after real iPhone launches.
- Enable GitHub Dependabot alerts and secret scanning in repository settings.
