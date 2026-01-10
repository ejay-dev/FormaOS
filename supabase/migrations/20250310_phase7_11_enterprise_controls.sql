create table if not exists public.rbac_permissions (
  key text primary key,
  description text
);

create table if not exists public.rbac_roles (
  key text primary key,
  description text
);

create table if not exists public.rbac_role_permissions (
  role_key text not null references public.rbac_roles (key) on delete cascade,
  permission_key text not null references public.rbac_permissions (key) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (role_key, permission_key)
);

create table if not exists public.org_audit_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  actor_user_id uuid,
  actor_role text,
  entity_type text,
  entity_id uuid,
  action_type text not null,
  before_state jsonb,
  after_state jsonb,
  reason text,
  created_at timestamptz not null default now()
);

create table if not exists public.org_entities (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  name text not null,
  entity_type text not null,
  parent_id uuid,
  created_at timestamptz not null default now(),
  constraint org_entities_type_check check (entity_type in ('organization', 'business_unit', 'site', 'team'))
);

create table if not exists public.org_entity_members (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  entity_id uuid not null references public.org_entities (id) on delete cascade,
  user_id uuid not null,
  role text,
  created_at timestamptz not null default now(),
  unique (entity_id, user_id)
);

create table if not exists public.compliance_playbooks (
  id uuid primary key default gen_random_uuid(),
  framework_id uuid not null references public.compliance_frameworks (id) on delete cascade,
  name text not null,
  review_cadence_days integer,
  required_evidence_types text[],
  created_at timestamptz not null default now(),
  unique (framework_id, name)
);

create table if not exists public.compliance_playbook_controls (
  id uuid primary key default gen_random_uuid(),
  playbook_id uuid not null references public.compliance_playbooks (id) on delete cascade,
  control_id uuid not null references public.compliance_controls (id) on delete cascade,
  required_evidence_count integer,
  required_evidence_types text[],
  review_cadence_days integer,
  created_at timestamptz not null default now(),
  unique (playbook_id, control_id)
);

create table if not exists public.org_certifications (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  framework_id uuid,
  status text not null default 'issued',
  snapshot_hash text,
  issued_at timestamptz,
  issued_by uuid,
  entity_id uuid,
  reason text,
  evidence_manifest jsonb,
  controls_snapshot jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.org_exports (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  export_type text not null,
  framework_id uuid,
  status text not null default 'generated',
  entity_id uuid,
  created_by uuid,
  payload jsonb,
  created_at timestamptz not null default now()
);

insert into public.rbac_permissions (key, description) values
  ('VIEW_CONTROLS', 'View compliance controls and evaluations'),
  ('EDIT_CONTROLS', 'Edit controls, mappings, and playbooks'),
  ('UPLOAD_EVIDENCE', 'Upload compliance evidence'),
  ('APPROVE_EVIDENCE', 'Approve evidence submissions'),
  ('REJECT_EVIDENCE', 'Reject evidence submissions'),
  ('RESOLVE_COMPLIANCE_BLOCK', 'Resolve compliance blocks'),
  ('EXPORT_REPORTS', 'Export audit and compliance reports'),
  ('GENERATE_CERTIFICATIONS', 'Generate certification snapshots'),
  ('MANAGE_USERS', 'Manage organization users and roles'),
  ('VIEW_AUDIT_LOGS', 'View audit logs and compliance events')
on conflict (key) do nothing;

insert into public.rbac_roles (key, description) values
  ('OWNER', 'Full system owner'),
  ('COMPLIANCE_OFFICER', 'Compliance officer with enforcement authority'),
  ('MANAGER', 'Manager with operational authority'),
  ('STAFF', 'Standard staff member'),
  ('AUDITOR', 'Read-only auditor')
on conflict (key) do nothing;

insert into public.rbac_role_permissions (role_key, permission_key)
select role_key, permission_key from (
  values
    ('OWNER', 'VIEW_CONTROLS'),
    ('OWNER', 'EDIT_CONTROLS'),
    ('OWNER', 'UPLOAD_EVIDENCE'),
    ('OWNER', 'APPROVE_EVIDENCE'),
    ('OWNER', 'REJECT_EVIDENCE'),
    ('OWNER', 'RESOLVE_COMPLIANCE_BLOCK'),
    ('OWNER', 'EXPORT_REPORTS'),
    ('OWNER', 'GENERATE_CERTIFICATIONS'),
    ('OWNER', 'MANAGE_USERS'),
    ('OWNER', 'VIEW_AUDIT_LOGS'),
    ('COMPLIANCE_OFFICER', 'VIEW_CONTROLS'),
    ('COMPLIANCE_OFFICER', 'EDIT_CONTROLS'),
    ('COMPLIANCE_OFFICER', 'UPLOAD_EVIDENCE'),
    ('COMPLIANCE_OFFICER', 'APPROVE_EVIDENCE'),
    ('COMPLIANCE_OFFICER', 'REJECT_EVIDENCE'),
    ('COMPLIANCE_OFFICER', 'RESOLVE_COMPLIANCE_BLOCK'),
    ('COMPLIANCE_OFFICER', 'EXPORT_REPORTS'),
    ('COMPLIANCE_OFFICER', 'GENERATE_CERTIFICATIONS'),
    ('COMPLIANCE_OFFICER', 'VIEW_AUDIT_LOGS'),
    ('MANAGER', 'VIEW_CONTROLS'),
    ('MANAGER', 'EDIT_CONTROLS'),
    ('MANAGER', 'UPLOAD_EVIDENCE'),
    ('MANAGER', 'APPROVE_EVIDENCE'),
    ('MANAGER', 'REJECT_EVIDENCE'),
    ('MANAGER', 'RESOLVE_COMPLIANCE_BLOCK'),
    ('MANAGER', 'EXPORT_REPORTS'),
    ('MANAGER', 'VIEW_AUDIT_LOGS'),
    ('STAFF', 'VIEW_CONTROLS'),
    ('STAFF', 'UPLOAD_EVIDENCE'),
    ('AUDITOR', 'VIEW_CONTROLS'),
    ('AUDITOR', 'EXPORT_REPORTS'),
    ('AUDITOR', 'VIEW_AUDIT_LOGS')
) as perms(role_key, permission_key)
on conflict (role_key, permission_key) do nothing;

do $$
begin
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'org_tasks') then
    alter table public.org_tasks add column if not exists entity_id uuid;
  end if;
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'org_evidence') then
    alter table public.org_evidence
      add column if not exists entity_id uuid,
      add column if not exists quality_score integer,
      add column if not exists risk_flag text,
      add column if not exists ai_summary text,
      add column if not exists last_scored_at timestamptz;
  end if;
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'org_policies') then
    alter table public.org_policies add column if not exists entity_id uuid;
  end if;
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'org_audit_logs') then
    alter table public.org_audit_logs add column if not exists entity_id uuid;
  end if;
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'org_audit_log') then
    alter table public.org_audit_log add column if not exists entity_id uuid;
  end if;
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'org_control_evaluations') then
    alter table public.org_control_evaluations add column if not exists entity_id uuid;
  end if;
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'org_compliance_blocks') then
    alter table public.org_compliance_blocks add column if not exists entity_id uuid;
    alter table public.org_compliance_blocks add column if not exists created_by uuid;
  end if;
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'org_assets') then
    alter table public.org_assets add column if not exists entity_id uuid;
  end if;
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'org_risks') then
    alter table public.org_risks add column if not exists entity_id uuid;
  end if;
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'org_training_records') then
    alter table public.org_training_records add column if not exists entity_id uuid;
  end if;
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'control_evidence') then
    alter table public.control_evidence add column if not exists entity_id uuid;
  end if;
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'control_tasks') then
    alter table public.control_tasks add column if not exists entity_id uuid;
  end if;
end
$$;

create index if not exists org_audit_events_org_idx on public.org_audit_events (organization_id, created_at);
create index if not exists org_entities_org_idx on public.org_entities (organization_id, entity_type);
create index if not exists org_entity_members_entity_idx on public.org_entity_members (entity_id);
