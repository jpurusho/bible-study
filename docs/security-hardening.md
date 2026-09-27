# Security and Reliability Deployment

## Required deployment order

1. Add `ANTHROPIC_API_KEY` and `ESV_API_KEY` to the Vercel production environment.
2. Rotate both provider keys because the previous database policy exposed their values.
3. Apply `20260927000001_security_hardening.sql` to Supabase.
4. Deploy the application. The release removes old service-worker caches and unregisters the worker.
5. Confirm a pending account cannot update `role` or `is_approved`, then confirm an administrator can still approve users.

The application temporarily retains a service-role-only fallback to existing database key rows. After the rotated environment keys are verified, delete the `anthropic_api_key` and `esv_api_key` rows from `app_settings`.

## Verification checklist

- Install the site to an iPhone Home Screen, sign in, close it, and launch it again.
- Test a launch while changing between Wi-Fi and cellular service.
- Confirm scripture lookups, AI generation, quizzes, notes, search, and admin user management.
- Confirm the response includes CSP, `nosniff`, referrer, frame, and permissions headers.
- Review Vercel Analytics and Speed Insights after real iPhone launches.
- Enable GitHub Dependabot alerts and secret scanning in repository settings.
