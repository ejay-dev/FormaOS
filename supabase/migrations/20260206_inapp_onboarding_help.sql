-- In-app onboarding tour + help assistant data tables

do $$
begin
  if not exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'user_onboarding_state'
  ) then
    create table public.user_onboarding_state (
      user_id uuid not null references auth.users (id) on delete cascade,
      org_id uuid not null references public.organizations (id) on delete cascade,
      completed boolean not null default false,
      skipped boolean not null default false,
      last_step integer not null default 0,
      updated_at timestamptz not null default now(),
      primary key (user_id, org_id)
    );
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'support_tickets'
  ) then
    create table public.support_tickets (
      id uuid primary key default gen_random_uuid(),
      user_id uuid not null references auth.users (id) on delete cascade,
      org_id uuid references public.organizations (id) on delete set null,
      route text not null,
      message text not null,
      meta_json jsonb not null default '{}'::jsonb,
      status text not null default 'open',
      created_at timestamptz not null default now()
    );
  end if;
end $$;

alter table public.user_onboarding_state enable row level security;
alter table public.support_tickets enable row level security;

drop policy if exists "user_onboarding_state_self" on public.user_onboarding_state;
create policy "user_onboarding_state_self" on public.user_onboarding_state
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "support_tickets_insert" on public.support_tickets;
create policy "support_tickets_insert" on public.support_tickets
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "support_tickets_admin" on public.support_tickets;
create policy "support_tickets_admin" on public.support_tickets
  for select
  using (auth.role() = 'service_role');

create index if not exists user_onboarding_state_org_idx on public.user_onboarding_state (org_id);
create index if not exists support_tickets_org_idx on public.support_tickets (org_id);
create index if not exists support_tickets_status_idx on public.support_tickets (status);
