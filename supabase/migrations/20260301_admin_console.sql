do $$
begin
  if not exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'admin_notes'
  ) then
    create table public.admin_notes (
      id uuid primary key default gen_random_uuid(),
      org_id uuid references public.organizations (id) on delete cascade,
      user_id uuid,
      note text not null,
      created_by uuid not null,
      created_at timestamptz not null default now()
    );
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'admin_audit_log'
  ) then
    create table public.admin_audit_log (
      id uuid primary key default gen_random_uuid(),
      actor_user_id uuid not null,
      action text not null,
      target_type text not null,
      target_id text not null,
      metadata jsonb not null default '{}'::jsonb,
      created_at timestamptz not null default now()
    );
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'support_requests'
  ) then
    create table public.support_requests (
      id uuid primary key default gen_random_uuid(),
      org_id uuid references public.organizations (id) on delete set null,
      email text not null,
      name text,
      subject text not null,
      message text not null,
      status text not null default 'open',
      created_at timestamptz not null default now()
    );
  end if;
end $$;

do $$
begin
  if exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'org_subscriptions'
  ) then
    if not exists (
      select 1 from information_schema.columns
      where table_schema = 'public'
        and table_name = 'org_subscriptions'
        and column_name = 'trial_started_at'
    ) then
      alter table public.org_subscriptions add column trial_started_at timestamptz;
    end if;
    if not exists (
      select 1 from information_schema.columns
      where table_schema = 'public'
        and table_name = 'org_subscriptions'
        and column_name = 'trial_expires_at'
    ) then
      alter table public.org_subscriptions add column trial_expires_at timestamptz;
    end if;
  end if;
end $$;

alter table public.admin_notes enable row level security;
alter table public.admin_audit_log enable row level security;
alter table public.support_requests enable row level security;

drop policy if exists "admin_notes_admin" on public.admin_notes;
create policy "admin_notes_admin" on public.admin_notes
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

drop policy if exists "admin_audit_log_admin" on public.admin_audit_log;
create policy "admin_audit_log_admin" on public.admin_audit_log
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

drop policy if exists "support_requests_admin" on public.support_requests;
create policy "support_requests_admin" on public.support_requests
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

create index if not exists admin_notes_org_id_idx on public.admin_notes (org_id);
create index if not exists admin_notes_user_id_idx on public.admin_notes (user_id);
create index if not exists admin_audit_log_actor_idx on public.admin_audit_log (actor_user_id);
create index if not exists admin_audit_log_target_idx on public.admin_audit_log (target_type, target_id);
create index if not exists support_requests_status_idx on public.support_requests (status);
