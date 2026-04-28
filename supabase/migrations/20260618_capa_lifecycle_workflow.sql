-- CAPA phase 1: compliance-grade lifecycle, evidence attachment support,
-- and org-scoped activity trail. Idempotent repair migration.

create table if not exists public.org_capa_items (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  incident_id uuid,
  investigation_id uuid,
  type text not null default 'corrective',
  title text not null,
  description text,
  assigned_to uuid,
  due_date date,
  status text not null default 'open',
  verification_method text,
  verified_by uuid,
  verified_at timestamptz,
  effectiveness_check_date date,
  effectiveness_status text default 'pending',
  priority text not null default 'medium',
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.org_capa_items
  add column if not exists source_type text default 'manual',
  add column if not exists source_id uuid,
  add column if not exists severity text default 'medium',
  add column if not exists owner_id uuid,
  add column if not exists root_cause text,
  add column if not exists corrective_action text,
  add column if not exists preventive_action text,
  add column if not exists verification_notes text,
  add column if not exists closed_at timestamptz,
  add column if not exists archived_at timestamptz;

update public.org_capa_items
set owner_id = coalesce(owner_id, assigned_to)
where owner_id is null
  and assigned_to is not null;

update public.org_capa_items
set severity = coalesce(severity, priority, 'medium')
where severity is null;

update public.org_capa_items
set source_type = 'incident',
    source_id = incident_id
where source_id is null
  and incident_id is not null;

update public.org_capa_items
set source_type = coalesce(source_type, 'manual')
where source_type is null;

update public.org_capa_items
set status = case status
  when 'in_progress' then 'investigating'
  when 'implemented' then 'verification'
  when 'verified' then 'closed'
  else coalesce(status, 'open')
end;

alter table public.org_capa_items
  drop constraint if exists org_capa_items_type_check,
  drop constraint if exists org_capa_items_status_check,
  drop constraint if exists org_capa_items_priority_check,
  drop constraint if exists org_capa_items_effectiveness_status_check,
  drop constraint if exists org_capa_items_source_type_check,
  drop constraint if exists org_capa_items_severity_check;

alter table public.org_capa_items
  add constraint org_capa_items_type_check
    check (type in ('corrective', 'preventive')),
  add constraint org_capa_items_status_check
    check (status in ('draft', 'open', 'investigating', 'action_assigned', 'verification', 'closed', 'archived')),
  add constraint org_capa_items_priority_check
    check (priority in ('critical', 'high', 'medium', 'low')),
  add constraint org_capa_items_effectiveness_status_check
    check (effectiveness_status in ('pending', 'effective', 'ineffective', 'needs_revision')),
  add constraint org_capa_items_source_type_check
    check (source_type in ('incident', 'obligation', 'policy', 'manual')),
  add constraint org_capa_items_severity_check
    check (severity in ('critical', 'high', 'medium', 'low'));

create index if not exists idx_capa_org on public.org_capa_items(organization_id);
create index if not exists idx_capa_org_status on public.org_capa_items(organization_id, status);
create index if not exists idx_capa_org_owner on public.org_capa_items(organization_id, owner_id);
create index if not exists idx_capa_org_due_date on public.org_capa_items(organization_id, due_date);
create index if not exists idx_capa_org_source on public.org_capa_items(organization_id, source_type, source_id);

alter table public.org_capa_items enable row level security;

drop policy if exists "org_capa_items_org_isolation" on public.org_capa_items;
drop policy if exists "org_capa_items_select" on public.org_capa_items;
drop policy if exists "org_capa_items_insert" on public.org_capa_items;
drop policy if exists "org_capa_items_update" on public.org_capa_items;
drop policy if exists "org_capa_items_delete" on public.org_capa_items;

create policy "org_capa_items_select" on public.org_capa_items
  for select
  to authenticated
  using (
    organization_id in (
      select organization_id from public.org_members where user_id = auth.uid()
    )
  );

create policy "org_capa_items_insert" on public.org_capa_items
  for insert
  to authenticated
  with check (
    organization_id in (
      select organization_id from public.org_members where user_id = auth.uid()
    )
  );

create policy "org_capa_items_update" on public.org_capa_items
  for update
  to authenticated
  using (
    organization_id in (
      select organization_id from public.org_members where user_id = auth.uid()
    )
  )
  with check (
    organization_id in (
      select organization_id from public.org_members where user_id = auth.uid()
    )
  );

create policy "org_capa_items_delete" on public.org_capa_items
  for delete
  to authenticated
  using (
    organization_id in (
      select organization_id from public.org_members where user_id = auth.uid()
    )
  );

create table if not exists public.org_capa_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  capa_id uuid not null references public.org_capa_items(id) on delete cascade,
  event_type text not null,
  actor_id uuid,
  comment text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_capa_events_org_capa
  on public.org_capa_events(organization_id, capa_id, created_at desc);
create index if not exists idx_capa_events_org_type
  on public.org_capa_events(organization_id, event_type, created_at desc);

alter table public.org_capa_events enable row level security;

drop policy if exists "org_capa_events_select" on public.org_capa_events;
drop policy if exists "org_capa_events_insert" on public.org_capa_events;
drop policy if exists "org_capa_events_update" on public.org_capa_events;
drop policy if exists "org_capa_events_delete" on public.org_capa_events;

create policy "org_capa_events_select" on public.org_capa_events
  for select
  to authenticated
  using (
    organization_id in (
      select organization_id from public.org_members where user_id = auth.uid()
    )
  );

create policy "org_capa_events_insert" on public.org_capa_events
  for insert
  to authenticated
  with check (
    organization_id in (
      select organization_id from public.org_members where user_id = auth.uid()
    )
  );

create policy "org_capa_events_update" on public.org_capa_events
  for update
  to authenticated
  using (
    organization_id in (
      select organization_id from public.org_members where user_id = auth.uid()
    )
  )
  with check (
    organization_id in (
      select organization_id from public.org_members where user_id = auth.uid()
    )
  );

create policy "org_capa_events_delete" on public.org_capa_events
  for delete
  to authenticated
  using (
    organization_id in (
      select organization_id from public.org_members where user_id = auth.uid()
    )
  );

create index if not exists idx_org_evidence_capa_entity
  on public.org_evidence(organization_id, entity_id)
  where entity_type = 'capa';

comment on table public.org_capa_items is
  'Corrective and preventive actions with lifecycle, ownership, source links, verification, and closure metadata.';

comment on table public.org_capa_events is
  'CAPA-specific activity trail mirrored by org_audit_logs for immutable audit display.';

comment on column public.org_evidence.entity_type is
  'Entity kind that entity_id refers to: incident, capa, care_plan, staff_credential, ...';
