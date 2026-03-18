create table if not exists public.compliance_frameworks (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  title text not null,
  description text,
  created_at timestamptz not null default now()
);

create table if not exists public.compliance_controls (
  id uuid primary key default gen_random_uuid(),
  framework_id uuid not null references public.compliance_frameworks (id) on delete cascade,
  code text not null,
  title text not null,
  description text,
  category text,
  risk_level text not null default 'medium',
  weight numeric not null default 1,
  required_evidence_count integer not null default 1,
  is_mandatory boolean not null default true,
  created_at timestamptz not null default now(),
  unique (framework_id, code)
);

create table if not exists public.control_evidence (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  control_id uuid not null references public.compliance_controls (id) on delete cascade,
  evidence_id uuid,
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, control_id, evidence_id),
  constraint control_evidence_status_check check (status in ('pending', 'approved', 'rejected'))
);

create table if not exists public.control_tasks (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  control_id uuid not null references public.compliance_controls (id) on delete cascade,
  task_id uuid,
  created_at timestamptz not null default now(),
  unique (organization_id, control_id, task_id)
);

create index if not exists compliance_controls_framework_id_idx
  on public.compliance_controls (framework_id);

create index if not exists control_evidence_org_control_idx
  on public.control_evidence (organization_id, control_id);

create index if not exists control_tasks_org_control_idx
  on public.control_tasks (organization_id, control_id);
