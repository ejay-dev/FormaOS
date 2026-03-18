create table if not exists public.org_onboarding_status (
  organization_id uuid primary key references public.organizations (id) on delete cascade,
  current_step integer not null default 1,
  completed_steps integer[] not null default '{}',
  first_action text,
  last_completed_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.org_onboarding_status enable row level security;

create policy "org_onboarding_status_select"
  on public.org_onboarding_status
  for select
  using (
    exists (
      select 1
      from public.org_members m
      where m.user_id = auth.uid()
        and m.organization_id = org_onboarding_status.organization_id
    )
  );

create policy "org_onboarding_status_insert"
  on public.org_onboarding_status
  for insert
  with check (
    exists (
      select 1
      from public.org_members m
      where m.user_id = auth.uid()
        and m.organization_id = org_onboarding_status.organization_id
    )
  );

create policy "org_onboarding_status_update"
  on public.org_onboarding_status
  for update
  using (
    exists (
      select 1
      from public.org_members m
      where m.user_id = auth.uid()
        and m.organization_id = org_onboarding_status.organization_id
    )
  );
