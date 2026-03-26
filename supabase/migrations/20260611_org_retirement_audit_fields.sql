-- Add explicit retirement timestamps so operator lifecycle actions remain auditable.

alter table public.organizations
  add column if not exists retired_at timestamptz,
  add column if not exists retired_by uuid references auth.users(id) on delete set null;

comment on column public.organizations.lifecycle_reason is
  'Most recent operator-supplied reason for suspend, restore, or retire lifecycle changes.';

comment on column public.organizations.retired_at is
  'Timestamp when the organization was last moved into the retired lifecycle state.';

comment on column public.organizations.retired_by is
  'Admin user who last moved the organization into the retired lifecycle state.';
