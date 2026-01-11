# Founder Admin Dashboard

## Environment variables
- `FOUNDER_EMAILS`: Comma-separated founder emails allowed into `/admin`.
- `FOUNDER_USER_IDS`: Optional comma-separated Supabase user IDs for founders.
- `SUPABASE_SERVICE_ROLE_KEY`: Server-only key for cross-org admin queries.

## Access control
- `/admin` routes are guarded server-side via `requireFounderAccess`.
- API routes under `/api/admin/*` verify founder access again (defense in depth).

## Core routes
- `/admin` overview KPIs
- `/admin/orgs` organization list + actions
- `/admin/orgs/[orgId]` org detail with notes + members
- `/admin/users` user roster + lock/resend actions
- `/admin/billing` subscriptions + trials
- `/admin/revenue` MRR snapshot
- `/admin/support` support tickets
- `/admin/health` webhook + audit signals
- `/admin/settings` env reminders

## Admin actions
- `POST /api/admin/orgs/[orgId]/trial/extend {days}`
- `POST /api/admin/orgs/[orgId]/trial/reset`
- `POST /api/admin/orgs/[orgId]/lock {locked:true|false}`
- `POST /api/admin/orgs/[orgId]/plan {plan}`
- `POST /api/admin/users/[userId]/lock {locked:true|false}`
- `POST /api/admin/users/[userId]/resend-confirmation`
- `POST /api/admin/subscriptions/[orgId]/resync-stripe`

## Database additions
The admin console introduces additive tables and columns via `supabase/migrations/20260301_admin_console.sql`:
- `admin_notes`
- `admin_audit_log`
- `support_requests`
- `org_subscriptions.trial_started_at`
- `org_subscriptions.trial_expires_at`

Apply the migration through your normal Supabase workflow.
