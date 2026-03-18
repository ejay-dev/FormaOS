do $$
begin
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'org_members') then
    execute 'alter table public.org_members enable row level security';
  end if;
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'org_tasks') then
    execute 'alter table public.org_tasks enable row level security';
  end if;
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'org_evidence') then
    execute 'alter table public.org_evidence enable row level security';
  end if;
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'org_policies') then
    execute 'alter table public.org_policies enable row level security';
  end if;
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'org_assets') then
    execute 'alter table public.org_assets enable row level security';
  end if;
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'org_risks') then
    execute 'alter table public.org_risks enable row level security';
  end if;
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'org_training_records') then
    execute 'alter table public.org_training_records enable row level security';
  end if;
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'org_control_evaluations') then
    execute 'alter table public.org_control_evaluations enable row level security';
  end if;
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'org_compliance_blocks') then
    execute 'alter table public.org_compliance_blocks enable row level security';
  end if;
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'control_evidence') then
    execute 'alter table public.control_evidence enable row level security';
  end if;
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'control_tasks') then
    execute 'alter table public.control_tasks enable row level security';
  end if;
end
$$;

drop policy if exists "org_members_select" on public.org_members;
drop policy if exists "org_members_insert" on public.org_members;
drop policy if exists "org_members_update" on public.org_members;
drop policy if exists "org_members_delete" on public.org_members;

create policy "org_members_select"
on public.org_members
for select
using (
  user_id = auth.uid()
  or exists (
    select 1
    from public.org_members m
    where m.user_id = auth.uid()
      and m.organization_id = org_members.organization_id
  )
);

create policy "org_members_insert"
on public.org_members
for insert
with check (
  exists (
    select 1
    from public.org_members m
    where m.user_id = auth.uid()
      and m.organization_id = org_members.organization_id
      and m.role in ('owner', 'admin', 'compliance_officer', 'manager')
  )
);

create policy "org_members_update"
on public.org_members
for update
using (
  exists (
    select 1
    from public.org_members m
    where m.user_id = auth.uid()
      and m.organization_id = org_members.organization_id
      and m.role in ('owner', 'admin')
  )
);

create policy "org_members_delete"
on public.org_members
for delete
using (
  exists (
    select 1
    from public.org_members m
    where m.user_id = auth.uid()
      and m.organization_id = org_members.organization_id
      and m.role in ('owner', 'admin')
  )
);

drop policy if exists "org_tasks_select" on public.org_tasks;
drop policy if exists "org_tasks_insert" on public.org_tasks;
drop policy if exists "org_tasks_update" on public.org_tasks;
drop policy if exists "org_tasks_delete" on public.org_tasks;

create policy "org_tasks_select"
on public.org_tasks
for select
using (
  exists (
    select 1
    from public.org_members m
    where m.user_id = auth.uid()
      and m.organization_id = org_tasks.organization_id
  )
);

create policy "org_tasks_insert"
on public.org_tasks
for insert
with check (
  exists (
    select 1
    from public.org_members m
    where m.user_id = auth.uid()
      and m.organization_id = org_tasks.organization_id
  )
);

create policy "org_tasks_update"
on public.org_tasks
for update
using (
  exists (
    select 1
    from public.org_members m
    where m.user_id = auth.uid()
      and m.organization_id = org_tasks.organization_id
  )
);

create policy "org_tasks_delete"
on public.org_tasks
for delete
using (
  exists (
    select 1
    from public.org_members m
    where m.user_id = auth.uid()
      and m.organization_id = org_tasks.organization_id
  )
);

drop policy if exists "org_evidence_select" on public.org_evidence;
drop policy if exists "org_evidence_insert" on public.org_evidence;
drop policy if exists "org_evidence_update" on public.org_evidence;
drop policy if exists "org_evidence_delete" on public.org_evidence;

create policy "org_evidence_select"
on public.org_evidence
for select
using (
  exists (
    select 1
    from public.org_members m
    where m.user_id = auth.uid()
      and m.organization_id = org_evidence.organization_id
  )
);

create policy "org_evidence_insert"
on public.org_evidence
for insert
with check (
  exists (
    select 1
    from public.org_members m
    where m.user_id = auth.uid()
      and m.organization_id = org_evidence.organization_id
  )
);

create policy "org_evidence_update"
on public.org_evidence
for update
using (
  exists (
    select 1
    from public.org_members m
    where m.user_id = auth.uid()
      and m.organization_id = org_evidence.organization_id
  )
);

create policy "org_evidence_delete"
on public.org_evidence
for delete
using (
  exists (
    select 1
    from public.org_members m
    where m.user_id = auth.uid()
      and m.organization_id = org_evidence.organization_id
  )
);

drop policy if exists "org_policies_select" on public.org_policies;
drop policy if exists "org_policies_insert" on public.org_policies;
drop policy if exists "org_policies_update" on public.org_policies;
drop policy if exists "org_policies_delete" on public.org_policies;

create policy "org_policies_select"
on public.org_policies
for select
using (
  exists (
    select 1
    from public.org_members m
    where m.user_id = auth.uid()
      and m.organization_id = org_policies.organization_id
  )
);

create policy "org_policies_insert"
on public.org_policies
for insert
with check (
  exists (
    select 1
    from public.org_members m
    where m.user_id = auth.uid()
      and m.organization_id = org_policies.organization_id
  )
);

create policy "org_policies_update"
on public.org_policies
for update
using (
  exists (
    select 1
    from public.org_members m
    where m.user_id = auth.uid()
      and m.organization_id = org_policies.organization_id
  )
);

create policy "org_policies_delete"
on public.org_policies
for delete
using (
  exists (
    select 1
    from public.org_members m
    where m.user_id = auth.uid()
      and m.organization_id = org_policies.organization_id
  )
);

drop policy if exists "org_assets_select" on public.org_assets;
drop policy if exists "org_assets_insert" on public.org_assets;
drop policy if exists "org_assets_update" on public.org_assets;
drop policy if exists "org_assets_delete" on public.org_assets;

create policy "org_assets_select"
on public.org_assets
for select
using (
  exists (
    select 1
    from public.org_members m
    where m.user_id = auth.uid()
      and m.organization_id = org_assets.organization_id
  )
);

create policy "org_assets_insert"
on public.org_assets
for insert
with check (
  exists (
    select 1
    from public.org_members m
    where m.user_id = auth.uid()
      and m.organization_id = org_assets.organization_id
  )
);

create policy "org_assets_update"
on public.org_assets
for update
using (
  exists (
    select 1
    from public.org_members m
    where m.user_id = auth.uid()
      and m.organization_id = org_assets.organization_id
  )
);

create policy "org_assets_delete"
on public.org_assets
for delete
using (
  exists (
    select 1
    from public.org_members m
    where m.user_id = auth.uid()
      and m.organization_id = org_assets.organization_id
  )
);

drop policy if exists "org_risks_select" on public.org_risks;
drop policy if exists "org_risks_insert" on public.org_risks;
drop policy if exists "org_risks_update" on public.org_risks;
drop policy if exists "org_risks_delete" on public.org_risks;

create policy "org_risks_select"
on public.org_risks
for select
using (
  exists (
    select 1
    from public.org_members m
    where m.user_id = auth.uid()
      and m.organization_id = org_risks.organization_id
  )
);

create policy "org_risks_insert"
on public.org_risks
for insert
with check (
  exists (
    select 1
    from public.org_members m
    where m.user_id = auth.uid()
      and m.organization_id = org_risks.organization_id
  )
);

create policy "org_risks_update"
on public.org_risks
for update
using (
  exists (
    select 1
    from public.org_members m
    where m.user_id = auth.uid()
      and m.organization_id = org_risks.organization_id
  )
);

create policy "org_risks_delete"
on public.org_risks
for delete
using (
  exists (
    select 1
    from public.org_members m
    where m.user_id = auth.uid()
      and m.organization_id = org_risks.organization_id
  )
);

drop policy if exists "org_training_records_select" on public.org_training_records;
drop policy if exists "org_training_records_insert" on public.org_training_records;
drop policy if exists "org_training_records_update" on public.org_training_records;
drop policy if exists "org_training_records_delete" on public.org_training_records;

create policy "org_training_records_select"
on public.org_training_records
for select
using (
  exists (
    select 1
    from public.org_members m
    where m.user_id = auth.uid()
      and m.organization_id = org_training_records.organization_id
  )
);

create policy "org_training_records_insert"
on public.org_training_records
for insert
with check (
  exists (
    select 1
    from public.org_members m
    where m.user_id = auth.uid()
      and m.organization_id = org_training_records.organization_id
  )
);

create policy "org_training_records_update"
on public.org_training_records
for update
using (
  exists (
    select 1
    from public.org_members m
    where m.user_id = auth.uid()
      and m.organization_id = org_training_records.organization_id
  )
);

create policy "org_training_records_delete"
on public.org_training_records
for delete
using (
  exists (
    select 1
    from public.org_members m
    where m.user_id = auth.uid()
      and m.organization_id = org_training_records.organization_id
  )
);

drop policy if exists "org_control_evaluations_select" on public.org_control_evaluations;
drop policy if exists "org_control_evaluations_insert" on public.org_control_evaluations;
drop policy if exists "org_control_evaluations_update" on public.org_control_evaluations;
drop policy if exists "org_control_evaluations_delete" on public.org_control_evaluations;

create policy "org_control_evaluations_select"
on public.org_control_evaluations
for select
using (
  exists (
    select 1
    from public.org_members m
    where m.user_id = auth.uid()
      and m.organization_id = org_control_evaluations.organization_id
  )
);

create policy "org_control_evaluations_insert"
on public.org_control_evaluations
for insert
with check (
  exists (
    select 1
    from public.org_members m
    where m.user_id = auth.uid()
      and m.organization_id = org_control_evaluations.organization_id
  )
);

create policy "org_control_evaluations_update"
on public.org_control_evaluations
for update
using (
  exists (
    select 1
    from public.org_members m
    where m.user_id = auth.uid()
      and m.organization_id = org_control_evaluations.organization_id
  )
);

create policy "org_control_evaluations_delete"
on public.org_control_evaluations
for delete
using (
  exists (
    select 1
    from public.org_members m
    where m.user_id = auth.uid()
      and m.organization_id = org_control_evaluations.organization_id
  )
);

drop policy if exists "org_compliance_blocks_select" on public.org_compliance_blocks;
drop policy if exists "org_compliance_blocks_insert" on public.org_compliance_blocks;
drop policy if exists "org_compliance_blocks_update" on public.org_compliance_blocks;
drop policy if exists "org_compliance_blocks_delete" on public.org_compliance_blocks;

create policy "org_compliance_blocks_select"
on public.org_compliance_blocks
for select
using (
  exists (
    select 1
    from public.org_members m
    where m.user_id = auth.uid()
      and m.organization_id = org_compliance_blocks.organization_id
  )
);

create policy "org_compliance_blocks_insert"
on public.org_compliance_blocks
for insert
with check (
  exists (
    select 1
    from public.org_members m
    where m.user_id = auth.uid()
      and m.organization_id = org_compliance_blocks.organization_id
  )
);

create policy "org_compliance_blocks_update"
on public.org_compliance_blocks
for update
using (
  exists (
    select 1
    from public.org_members m
    where m.user_id = auth.uid()
      and m.organization_id = org_compliance_blocks.organization_id
  )
);

create policy "org_compliance_blocks_delete"
on public.org_compliance_blocks
for delete
using (
  exists (
    select 1
    from public.org_members m
    where m.user_id = auth.uid()
      and m.organization_id = org_compliance_blocks.organization_id
  )
);

drop policy if exists "control_evidence_select" on public.control_evidence;
drop policy if exists "control_evidence_insert" on public.control_evidence;
drop policy if exists "control_evidence_update" on public.control_evidence;
drop policy if exists "control_evidence_delete" on public.control_evidence;

create policy "control_evidence_select"
on public.control_evidence
for select
using (
  exists (
    select 1
    from public.org_members m
    where m.user_id = auth.uid()
      and m.organization_id = control_evidence.organization_id
  )
);

create policy "control_evidence_insert"
on public.control_evidence
for insert
with check (
  exists (
    select 1
    from public.org_members m
    where m.user_id = auth.uid()
      and m.organization_id = control_evidence.organization_id
  )
);

create policy "control_evidence_update"
on public.control_evidence
for update
using (
  exists (
    select 1
    from public.org_members m
    where m.user_id = auth.uid()
      and m.organization_id = control_evidence.organization_id
  )
);

create policy "control_evidence_delete"
on public.control_evidence
for delete
using (
  exists (
    select 1
    from public.org_members m
    where m.user_id = auth.uid()
      and m.organization_id = control_evidence.organization_id
  )
);

drop policy if exists "control_tasks_select" on public.control_tasks;
drop policy if exists "control_tasks_insert" on public.control_tasks;
drop policy if exists "control_tasks_update" on public.control_tasks;
drop policy if exists "control_tasks_delete" on public.control_tasks;

create policy "control_tasks_select"
on public.control_tasks
for select
using (
  exists (
    select 1
    from public.org_members m
    where m.user_id = auth.uid()
      and m.organization_id = control_tasks.organization_id
  )
);

create policy "control_tasks_insert"
on public.control_tasks
for insert
with check (
  exists (
    select 1
    from public.org_members m
    where m.user_id = auth.uid()
      and m.organization_id = control_tasks.organization_id
  )
);

create policy "control_tasks_update"
on public.control_tasks
for update
using (
  exists (
    select 1
    from public.org_members m
    where m.user_id = auth.uid()
      and m.organization_id = control_tasks.organization_id
  )
);

create policy "control_tasks_delete"
on public.control_tasks
for delete
using (
  exists (
    select 1
    from public.org_members m
    where m.user_id = auth.uid()
      and m.organization_id = control_tasks.organization_id
  )
);
