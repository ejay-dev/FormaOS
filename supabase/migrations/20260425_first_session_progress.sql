-- First-session guided onboarding — tracks which of the 5 guided steps
-- the user has seen the completion acknowledgment for. Keeps the
-- "Great! You've completed X" toast from re-appearing across sessions.
--
-- Distinct from org_onboarding_status (initial signup wizard).

create table if not exists public.org_first_session_progress (
  organization_id uuid primary key references public.organizations (id) on delete cascade,
  seen_steps text[] not null default '{}',
  updated_at timestamptz not null default now()
);

alter table public.org_first_session_progress enable row level security;

drop policy if exists "org_first_session_progress_select" on public.org_first_session_progress;
create policy "org_first_session_progress_select"
  on public.org_first_session_progress
  for select
  using (
    exists (
      select 1
      from public.org_members m
      where m.organization_id = org_first_session_progress.organization_id
        and m.user_id = auth.uid()
    )
  );

drop policy if exists "org_first_session_progress_insert" on public.org_first_session_progress;
create policy "org_first_session_progress_insert"
  on public.org_first_session_progress
  for insert
  with check (
    exists (
      select 1
      from public.org_members m
      where m.organization_id = org_first_session_progress.organization_id
        and m.user_id = auth.uid()
    )
  );

drop policy if exists "org_first_session_progress_update" on public.org_first_session_progress;
create policy "org_first_session_progress_update"
  on public.org_first_session_progress
  for update
  using (
    exists (
      select 1
      from public.org_members m
      where m.organization_id = org_first_session_progress.organization_id
        and m.user_id = auth.uid()
    )
  );
