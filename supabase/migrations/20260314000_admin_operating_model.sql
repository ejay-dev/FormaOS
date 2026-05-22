-- Platform admin operating model
-- Adds delegated admin assignments, change approvals, and a unified platform audit view.

create extension if not exists pgcrypto;

create or replace function public.platform_admin_touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

do $$
begin
  if not exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'platform_admin_assignments'
  ) then
    create table public.platform_admin_assignments (
      id uuid primary key default gen_random_uuid(),
      user_id uuid not null,
      email text,
      role_key text not null check (
        role_key in (
          'platform_viewer',
          'platform_support',
          'platform_security',
          'platform_release_manager',
          'platform_operator',
          'platform_super_admin'
        )
      ),
      permissions jsonb not null default '[]'::jsonb,
      is_active boolean not null default true,
      created_by uuid,
      updated_by uuid,
      reason text not null,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now(),
      unique (user_id)
    );

    create index platform_admin_assignments_active_idx
      on public.platform_admin_assignments (is_active, role_key, updated_at desc);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'platform_change_approvals'
  ) then
    create table public.platform_change_approvals (
      id uuid primary key default gen_random_uuid(),
      action text not null,
      target_type text not null,
      target_id text,
      requested_for_user_id uuid not null,
      requested_by uuid,
      approver_user_id uuid,
      status text not null default 'pending' check (
        status in ('pending', 'approved', 'rejected', 'expired', 'consumed')
      ),
      reason text not null,
      metadata jsonb not null default '{}'::jsonb,
      expires_at timestamptz,
      approved_at timestamptz,
      rejected_at timestamptz,
      consumed_at timestamptz,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    );

    create index platform_change_approvals_status_idx
      on public.platform_change_approvals (status, requested_for_user_id, created_at desc);
    create index platform_change_approvals_target_idx
      on public.platform_change_approvals (action, target_type, target_id, status);
  end if;
end $$;

drop trigger if exists platform_admin_assignments_touch_updated_at on public.platform_admin_assignments;
create trigger platform_admin_assignments_touch_updated_at
before update on public.platform_admin_assignments
for each row execute function public.platform_admin_touch_updated_at();

drop trigger if exists platform_change_approvals_touch_updated_at on public.platform_change_approvals;
create trigger platform_change_approvals_touch_updated_at
before update on public.platform_change_approvals
for each row execute function public.platform_admin_touch_updated_at();

alter table public.platform_admin_assignments enable row level security;
alter table public.platform_change_approvals enable row level security;

drop policy if exists platform_admin_assignments_service_only on public.platform_admin_assignments;
create policy platform_admin_assignments_service_only on public.platform_admin_assignments
for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

drop policy if exists platform_change_approvals_service_only on public.platform_change_approvals;
create policy platform_change_approvals_service_only on public.platform_change_approvals
for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create or replace view public.platform_admin_audit_feed as
select
  a.id,
  'immutable_audit'::text as source,
  a.actor_user_id,
  a.event_type as action,
  a.target_type,
  a.target_id,
  a.metadata,
  a.environment,
  a.created_at
from public.audit_log a

union all

select
  l.id,
  'legacy_admin_audit'::text as source,
  l.actor_user_id,
  l.action,
  l.target_type,
  l.target_id,
  l.metadata,
  coalesce((l.metadata ->> 'environment'), 'production') as environment,
  l.created_at
from public.admin_audit_log l;

comment on view public.platform_admin_audit_feed is
  'Unified read surface for platform admin audit history across immutable and legacy admin logs.';
