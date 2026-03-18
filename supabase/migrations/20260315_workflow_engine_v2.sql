create table if not exists workflow_definitions (
  row_id uuid primary key default gen_random_uuid(),
  id uuid not null,
  org_id uuid not null references organizations(id) on delete cascade,
  name text not null,
  description text not null default '',
  version integer not null default 1,
  definition jsonb not null default '{}'::jsonb,
  enabled boolean not null default true,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists idx_workflow_definitions_id_version
  on workflow_definitions(id, version);

create table if not exists workflow_executions (
  id uuid primary key default gen_random_uuid(),
  workflow_id uuid not null references workflow_definitions(id) on delete cascade,
  org_id uuid not null references organizations(id) on delete cascade,
  trigger_event jsonb not null default '{}'::jsonb,
  workflow_version integer not null default 1,
  status text not null default 'running'
    check (status in ('running', 'completed', 'failed', 'cancelled', 'waiting_approval', 'waiting_delay', 'paused')),
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  error text,
  current_step_id text,
  execution_trace jsonb not null default '{"steps":[],"logs":[]}'::jsonb,
  context_snapshot jsonb not null default '{}'::jsonb
);

create table if not exists workflow_approvals (
  id uuid primary key default gen_random_uuid(),
  execution_id uuid not null references workflow_executions(id) on delete cascade,
  step_id text not null,
  approvers jsonb not null default '[]'::jsonb,
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected', 'timed_out', 'escalated')),
  approved_by uuid references auth.users(id),
  approved_at timestamptz,
  timeout_at timestamptz,
  decision text check (decision in ('approve', 'reject')),
  comment text
);

create index if not exists idx_workflow_definitions_org_id
  on workflow_definitions(org_id, enabled, updated_at desc);

create index if not exists idx_workflow_definitions_trigger_type
  on workflow_definitions ((definition->'trigger'->>'type'));

create index if not exists idx_workflow_executions_workflow_id
  on workflow_executions(workflow_id, started_at desc);

create index if not exists idx_workflow_executions_org_status
  on workflow_executions(org_id, status, started_at desc);

create index if not exists idx_workflow_approvals_execution_status
  on workflow_approvals(execution_id, status, timeout_at);

alter table workflow_definitions enable row level security;
alter table workflow_executions enable row level security;
alter table workflow_approvals enable row level security;

drop policy if exists "workflow_definitions_select_org" on workflow_definitions;
create policy "workflow_definitions_select_org"
  on workflow_definitions
  for select
  using (
    org_id in (
      select organization_id from org_members where user_id = auth.uid()
    )
  );

drop policy if exists "workflow_definitions_manage_org" on workflow_definitions;
create policy "workflow_definitions_manage_org"
  on workflow_definitions
  for all
  using (
    org_id in (
      select organization_id
      from org_members
      where user_id = auth.uid()
        and role in ('owner', 'admin', 'compliance_officer')
    )
  )
  with check (
    org_id in (
      select organization_id
      from org_members
      where user_id = auth.uid()
        and role in ('owner', 'admin', 'compliance_officer')
    )
  );

drop policy if exists "workflow_executions_select_org" on workflow_executions;
create policy "workflow_executions_select_org"
  on workflow_executions
  for select
  using (
    org_id in (
      select organization_id from org_members where user_id = auth.uid()
    )
  );

drop policy if exists "workflow_executions_manage_org" on workflow_executions;
create policy "workflow_executions_manage_org"
  on workflow_executions
  for all
  using (
    org_id in (
      select organization_id
      from org_members
      where user_id = auth.uid()
        and role in ('owner', 'admin', 'compliance_officer')
    )
  )
  with check (
    org_id in (
      select organization_id
      from org_members
      where user_id = auth.uid()
        and role in ('owner', 'admin', 'compliance_officer')
    )
  );

drop policy if exists "workflow_approvals_select_org" on workflow_approvals;
create policy "workflow_approvals_select_org"
  on workflow_approvals
  for select
  using (
    execution_id in (
      select id
      from workflow_executions
      where org_id in (
        select organization_id from org_members where user_id = auth.uid()
      )
    )
  );

drop policy if exists "workflow_approvals_manage_org" on workflow_approvals;
create policy "workflow_approvals_manage_org"
  on workflow_approvals
  for all
  using (
    execution_id in (
      select id
      from workflow_executions
      where org_id in (
        select organization_id
        from org_members
        where user_id = auth.uid()
          and role in ('owner', 'admin', 'compliance_officer')
      )
    )
  )
  with check (
    execution_id in (
      select id
      from workflow_executions
      where org_id in (
        select organization_id
        from org_members
        where user_id = auth.uid()
          and role in ('owner', 'admin', 'compliance_officer')
      )
    )
  );

create or replace function set_workflow_definition_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists workflow_definitions_set_updated_at on workflow_definitions;
create trigger workflow_definitions_set_updated_at
before update on workflow_definitions
for each row
execute function set_workflow_definition_updated_at();
