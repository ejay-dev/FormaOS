# Supabase Test Workflow

FormaOS tests should verify schema, RLS assumptions, and storage buckets before deep E2E runs. This avoids false failures from stale local databases or PostgREST schema cache drift.

## Commands

Reset a local Supabase stack and verify required app tables:

```bash
npm run db:test:reset
```

Verify the configured Supabase project without resetting it:

```bash
npm run db:test:verify
```

`db:test:verify` targets the project in:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

It loads `.env.local` for local runs.

## What Verification Checks

Required tables:

- `organizations`
- `org_members`
- `org_forms`
- `org_form_submissions`
- `org_form_templates`
- `org_evidence`
- `org_first_session_progress`
- `org_care_plans`
- `org_audit_logs`
- `security_audit_log`
- `organization_sso`

Required storage buckets:

- `evidence`

Behavioral checks:

- no `PGRST205` for required tables
- authenticated test user can insert/read `org_forms`
- authenticated test user can insert/read `org_form_submissions`
- authenticated test user can select critical org-scoped tables
- migration files contain RLS policies for forms, evidence, care plans, and SSO

## Schema Cache

If a migration was applied but REST queries still return `PGRST205`, reload the PostgREST schema cache in Supabase, then re-run:

```bash
npm run db:test:verify
```

Also confirm the env points to the same Supabase project where the migration was applied.

## Local Reset

Local reset requires the Supabase CLI:

```bash
supabase db reset
npm run db:test:verify
```

Use this before debugging RLS or migration drift.

## Notes

`organization_sso` is expected schema for enterprise SSO. If SSO is not enabled for an organization, rows may be absent, but the table and RLS policies should still exist.
