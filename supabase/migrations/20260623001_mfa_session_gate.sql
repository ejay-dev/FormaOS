-- =========================================================
-- MFA Session Gate
-- =========================================================
-- Tracks which Supabase session id has cleared a TOTP/backup-code
-- challenge after password sign-in. Without this, password login
-- could mint a usable session for a 2FA-enabled user.
--
-- The user_security table is referenced throughout the app but its
-- creation lives outside of /supabase/migrations (legacy bootstrap).
-- Use IF NOT EXISTS so this migration is safe to apply against a
-- database where the table already exists.
-- =========================================================

create table if not exists public.user_security (
  user_id uuid primary key references auth.users(id) on delete cascade,
  two_factor_enabled boolean not null default false,
  two_factor_enabled_at timestamptz,
  two_factor_secret text,
  backup_codes text[] default '{}'::text[],
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.user_security
  add column if not exists mfa_passed_session_id text,
  add column if not exists mfa_passed_at timestamptz,
  add column if not exists mfa_failed_attempts integer not null default 0,
  add column if not exists mfa_last_failure_at timestamptz;

-- Index used by the layout-level gate every server request.
create index if not exists user_security_mfa_passed_session_idx
  on public.user_security (user_id, mfa_passed_session_id);

-- RLS: a user can read/update only their own row. Service role
-- bypasses RLS and is used by audit/admin tooling.
alter table public.user_security enable row level security;

drop policy if exists user_security_self_select on public.user_security;
create policy user_security_self_select
  on public.user_security
  for select
  using (auth.uid() = user_id);

drop policy if exists user_security_self_update on public.user_security;
create policy user_security_self_update
  on public.user_security
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Inserts/deletes are handled by service-role admin paths only.
revoke insert, delete on public.user_security from authenticated;
