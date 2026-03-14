-- Organization lifecycle controls for enterprise admin operations.
-- Adds suspend/restore state separate from subscription billing state.

alter table public.organizations
  add column if not exists lifecycle_status text not null default 'active'
    check (lifecycle_status in ('active', 'suspended', 'retired')),
  add column if not exists lifecycle_reason text,
  add column if not exists suspended_at timestamptz,
  add column if not exists suspended_by uuid references auth.users(id) on delete set null,
  add column if not exists restored_at timestamptz,
  add column if not exists restored_by uuid references auth.users(id) on delete set null;

update public.organizations
set lifecycle_status = 'active'
where lifecycle_status is null;

create index if not exists idx_organizations_lifecycle_status
  on public.organizations (lifecycle_status, created_at desc);

comment on column public.organizations.lifecycle_status is
  'Operational lifecycle state for platform operators: active, suspended, retired.';

comment on column public.organizations.lifecycle_reason is
  'Most recent operator-supplied reason for suspend/restore lifecycle changes.';
