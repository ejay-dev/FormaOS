create table if not exists public.org_patients (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  full_name text not null,
  external_id text,
  date_of_birth date,
  care_status text not null default 'active',
  risk_level text not null default 'low',
  emergency_flag boolean not null default false,
  health_indicators jsonb,
  flags jsonb,
  created_by uuid,
  updated_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint org_patients_care_status_check check (care_status in ('active', 'paused', 'discharged')),
  constraint org_patients_risk_level_check check (risk_level in ('low', 'medium', 'high', 'critical'))
);

create table if not exists public.org_progress_notes (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  patient_id uuid not null references public.org_patients (id) on delete cascade,
  staff_user_id uuid not null,
  note_text text not null,
  status_tag text not null default 'routine',
  signed_off_by uuid,
  signed_off_at timestamptz,
  created_at timestamptz not null default now(),
  constraint org_progress_notes_status_check check (status_tag in ('routine', 'follow_up', 'incident', 'risk')),
  constraint org_progress_notes_signoff_check check (
    (signed_off_by is null and signed_off_at is null)
    or (signed_off_by is not null and signed_off_at is not null)
  )
);

create table if not exists public.org_incidents (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  patient_id uuid references public.org_patients (id) on delete set null,
  reported_by uuid not null,
  severity text not null default 'low',
  status text not null default 'open',
  description text not null,
  occurred_at timestamptz not null default now(),
  resolved_at timestamptz,
  resolved_by uuid,
  created_at timestamptz not null default now(),
  constraint org_incidents_severity_check check (severity in ('low', 'medium', 'high', 'critical')),
  constraint org_incidents_status_check check (status in ('open', 'resolved'))
);

create table if not exists public.org_shifts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  patient_id uuid references public.org_patients (id) on delete set null,
  staff_user_id uuid not null,
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  constraint org_shifts_status_check check (status in ('active', 'complete'))
);

do $$
begin
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'org_tasks') then
    alter table public.org_tasks add column if not exists patient_id uuid;
    alter table public.org_tasks
      add constraint org_tasks_patient_id_fkey
      foreign key (patient_id)
      references public.org_patients (id) on delete set null;
  end if;

  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'org_evidence') then
    alter table public.org_evidence add column if not exists patient_id uuid;
    alter table public.org_evidence
      add constraint org_evidence_patient_id_fkey
      foreign key (patient_id)
      references public.org_patients (id) on delete set null;
  end if;
end $$;

create index if not exists org_patients_org_idx
  on public.org_patients (organization_id, full_name);

create index if not exists org_progress_notes_org_patient_idx
  on public.org_progress_notes (organization_id, patient_id, created_at);

create index if not exists org_incidents_org_patient_idx
  on public.org_incidents (organization_id, patient_id, occurred_at);

create index if not exists org_shifts_org_patient_idx
  on public.org_shifts (organization_id, patient_id, started_at);

create index if not exists org_tasks_patient_idx
  on public.org_tasks (organization_id, patient_id);

create index if not exists org_evidence_patient_idx
  on public.org_evidence (organization_id, patient_id);

alter table public.org_patients enable row level security;
alter table public.org_progress_notes enable row level security;
alter table public.org_incidents enable row level security;
alter table public.org_shifts enable row level security;

drop policy if exists "org_patients_select" on public.org_patients;
create policy "org_patients_select"
  on public.org_patients
  for select
  using (
    exists (
      select 1
      from public.org_members m
      where m.user_id = auth.uid()
        and m.organization_id = org_patients.organization_id
    )
  );

drop policy if exists "org_patients_insert" on public.org_patients;
create policy "org_patients_insert"
  on public.org_patients
  for insert
  with check (
    exists (
      select 1
      from public.org_members m
      where m.user_id = auth.uid()
        and m.organization_id = org_patients.organization_id
        and m.role in ('owner', 'admin', 'manager', 'compliance_officer', 'staff', 'member')
    )
  );

drop policy if exists "org_patients_update" on public.org_patients;
create policy "org_patients_update"
  on public.org_patients
  for update
  using (
    exists (
      select 1
      from public.org_members m
      where m.user_id = auth.uid()
        and m.organization_id = org_patients.organization_id
        and m.role in ('owner', 'admin', 'manager', 'compliance_officer', 'staff', 'member')
    )
  );

drop policy if exists "org_progress_notes_select" on public.org_progress_notes;
create policy "org_progress_notes_select"
  on public.org_progress_notes
  for select
  using (
    exists (
      select 1
      from public.org_members m
      where m.user_id = auth.uid()
        and m.organization_id = org_progress_notes.organization_id
    )
  );

drop policy if exists "org_progress_notes_insert" on public.org_progress_notes;
create policy "org_progress_notes_insert"
  on public.org_progress_notes
  for insert
  with check (
    exists (
      select 1
      from public.org_members m
      where m.user_id = auth.uid()
        and m.organization_id = org_progress_notes.organization_id
        and m.role in ('owner', 'admin', 'manager', 'compliance_officer', 'staff', 'member')
    )
  );

drop policy if exists "org_progress_notes_update" on public.org_progress_notes;
create policy "org_progress_notes_update"
  on public.org_progress_notes
  for update
  using (
    exists (
      select 1
      from public.org_members m
      where m.user_id = auth.uid()
        and m.organization_id = org_progress_notes.organization_id
        and m.role in ('owner', 'admin', 'manager', 'compliance_officer')
    )
  );

drop policy if exists "org_incidents_select" on public.org_incidents;
create policy "org_incidents_select"
  on public.org_incidents
  for select
  using (
    exists (
      select 1
      from public.org_members m
      where m.user_id = auth.uid()
        and m.organization_id = org_incidents.organization_id
    )
  );

drop policy if exists "org_incidents_insert" on public.org_incidents;
create policy "org_incidents_insert"
  on public.org_incidents
  for insert
  with check (
    exists (
      select 1
      from public.org_members m
      where m.user_id = auth.uid()
        and m.organization_id = org_incidents.organization_id
        and m.role in ('owner', 'admin', 'manager', 'compliance_officer', 'staff', 'member')
    )
  );

drop policy if exists "org_incidents_update" on public.org_incidents;
create policy "org_incidents_update"
  on public.org_incidents
  for update
  using (
    exists (
      select 1
      from public.org_members m
      where m.user_id = auth.uid()
        and m.organization_id = org_incidents.organization_id
        and m.role in ('owner', 'admin', 'manager', 'compliance_officer', 'staff', 'member')
    )
  );

drop policy if exists "org_shifts_select" on public.org_shifts;
create policy "org_shifts_select"
  on public.org_shifts
  for select
  using (
    exists (
      select 1
      from public.org_members m
      where m.user_id = auth.uid()
        and m.organization_id = org_shifts.organization_id
    )
  );

drop policy if exists "org_shifts_insert" on public.org_shifts;
create policy "org_shifts_insert"
  on public.org_shifts
  for insert
  with check (
    exists (
      select 1
      from public.org_members m
      where m.user_id = auth.uid()
        and m.organization_id = org_shifts.organization_id
        and m.role in ('owner', 'admin', 'manager', 'compliance_officer', 'staff', 'member')
    )
  );

drop policy if exists "org_shifts_update" on public.org_shifts;
create policy "org_shifts_update"
  on public.org_shifts
  for update
  using (
    exists (
      select 1
      from public.org_members m
      where m.user_id = auth.uid()
        and m.organization_id = org_shifts.organization_id
        and m.role in ('owner', 'admin', 'manager', 'compliance_officer', 'staff', 'member')
    )
  );
