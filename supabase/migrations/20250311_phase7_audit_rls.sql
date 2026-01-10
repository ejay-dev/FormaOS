alter table public.org_audit_events enable row level security;
alter table public.org_exports enable row level security;
alter table public.org_certifications enable row level security;
do $$
begin
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'org_audit_logs') then
    execute 'alter table public.org_audit_logs enable row level security';
  end if;
end
$$;

drop policy if exists "org_audit_events_select" on public.org_audit_events;
drop policy if exists "org_audit_events_insert" on public.org_audit_events;

create policy "org_audit_events_select"
on public.org_audit_events
for select
using (
  exists (
    select 1
    from public.org_members m
    where m.user_id = auth.uid()
      and m.organization_id = org_audit_events.organization_id
  )
);

create policy "org_audit_events_insert"
on public.org_audit_events
for insert
with check (
  exists (
    select 1
    from public.org_members m
    where m.user_id = auth.uid()
      and m.organization_id = org_audit_events.organization_id
  )
);

drop policy if exists "org_exports_select" on public.org_exports;
drop policy if exists "org_exports_insert" on public.org_exports;

create policy "org_exports_select"
on public.org_exports
for select
using (
  exists (
    select 1
    from public.org_members m
    where m.user_id = auth.uid()
      and m.organization_id = org_exports.organization_id
  )
);

create policy "org_exports_insert"
on public.org_exports
for insert
with check (
  exists (
    select 1
    from public.org_members m
    where m.user_id = auth.uid()
      and m.organization_id = org_exports.organization_id
  )
);

drop policy if exists "org_certifications_select" on public.org_certifications;
drop policy if exists "org_certifications_insert" on public.org_certifications;

create policy "org_certifications_select"
on public.org_certifications
for select
using (
  exists (
    select 1
    from public.org_members m
    where m.user_id = auth.uid()
      and m.organization_id = org_certifications.organization_id
  )
);

create policy "org_certifications_insert"
on public.org_certifications
for insert
with check (
  exists (
    select 1
    from public.org_members m
    where m.user_id = auth.uid()
      and m.organization_id = org_certifications.organization_id
  )
);

drop policy if exists "org_audit_logs_select" on public.org_audit_logs;
drop policy if exists "org_audit_logs_insert" on public.org_audit_logs;

create policy "org_audit_logs_select"
on public.org_audit_logs
for select
using (
  exists (
    select 1
    from public.org_members m
    where m.user_id = auth.uid()
      and m.organization_id = org_audit_logs.organization_id
  )
);

create policy "org_audit_logs_insert"
on public.org_audit_logs
for insert
with check (
  exists (
    select 1
    from public.org_members m
    where m.user_id = auth.uid()
      and m.organization_id = org_audit_logs.organization_id
  )
);
