---
name: formaos-supabase
description: Work with FormaOS database layer — Supabase (PostgreSQL), migrations, RLS policies, database functions, triggers, and storage buckets. Use when writing migrations, modifying schema, debugging RLS issues, working with Supabase auth, storage, real-time subscriptions, or vector embeddings. Also use when troubleshooting data access or multi-tenant isolation.
---

# FormaOS Supabase & Database Engineering

## Architecture Overview

- **Supabase** (PostgreSQL-based BaaS) as primary database
- **Row-Level Security (RLS)** enforces multi-tenant org isolation
- **82 SQL migration files** in `supabase/migrations/`
- **Auth:** Supabase Auth (OAuth, email/password, SAML)
- **Storage:** File storage buckets for evidence artifacts
- **Vectors:** Vector storage for AI embeddings
- **Real-time:** Subscriptions for live updates

## Key Files & Directories

| Area | Path |
|------|------|
| Migrations | `supabase/migrations/` (82 files, dated `20250101` → `20250321`) |
| Base schema | `supabase/migrations/20250101_000_base_schema.sql` |
| Supabase client utils | `lib/supabase/` |
| Auth integration | `lib/auth/` |
| Audit trail | `lib/audit-trail.ts` |
| Supabase config | `supabase/` root directory |

## Workflow

### Writing a New Migration
1. Check latest migration number: `ls supabase/migrations/ | tail -5`
2. Create new file: `supabase/migrations/YYYYMMDD_NNN_description.sql`
3. Follow naming convention: date + sequence + snake_case description
4. **Always add RLS policies** for new tables
5. **Always scope to organization** — add `org_id` column with foreign key
6. Add indexes for frequently queried columns
7. Test locally with `supabase db reset` if available
8. Verify RLS with queries as different org users

### RLS Policy Checklist
For every new table:
```sql
ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own org data"
  ON table_name FOR SELECT
  USING (org_id = auth.jwt() ->> 'org_id');

CREATE POLICY "Users can insert own org data"
  ON table_name FOR INSERT
  WITH CHECK (org_id = auth.jwt() ->> 'org_id');

CREATE POLICY "Users can update own org data"
  ON table_name FOR UPDATE
  USING (org_id = auth.jwt() ->> 'org_id');

CREATE POLICY "Users can delete own org data"
  ON table_name FOR DELETE
  USING (org_id = auth.jwt() ->> 'org_id');
```

### Debugging RLS / Data Access Issues
1. Check RLS policies on the table: search migration files for the table name
2. Verify the JWT contains correct `org_id`
3. Check if service role key is being used (bypasses RLS)
4. Check `lib/supabase/` client creation — are you using the right client?
5. Test with Supabase dashboard SQL editor

### Working with Storage Buckets
1. Evidence artifacts are stored in Supabase storage
2. Buckets are org-scoped
3. Access policies mirror RLS patterns
4. File references stored in database rows

## Rules

- **Every table MUST have RLS enabled** — no exceptions
- **Every table MUST have `org_id`** for multi-tenant isolation
- **Never use service role key in client-side code** — server-only
- **Migration files are immutable once deployed** — create new migrations to fix issues
- **Migration naming:** `YYYYMMDD_NNN_snake_case_description.sql`
- **Always add indexes** for foreign keys and frequently filtered columns
- **Supabase error objects must not leak to clients** — sanitize in API layer
- **Use `lib/supabase/` clients** — never create raw Supabase clients elsewhere
- **Vector columns** use `pgvector` extension — ensure it's enabled in migrations
- **Audit all schema changes** — log via `lib/audit-trail.ts`
