-- =========================================================
-- Workflow Integrity: Evidence + Obligation attachment
-- =========================================================
-- Ensures the org_evidence schema has the columns the
-- obligation evidence drawer + vault upload paths rely on,
-- and provisions the `evidence` storage bucket with strict
-- per-organisation RLS so uploads from the obligations
-- register actually persist (and are not impersonable).
--
-- Idempotent: safe to re-run on environments where these
-- columns/buckets/policies already exist.

-- ----- Columns referenced by /api/v1/evidence + EvidenceDrawer ----------
do $$ begin
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'org_evidence') then
    alter table public.org_evidence
      add column if not exists title text,
      add column if not exists file_type text,
      add column if not exists file_size bigint,
      add column if not exists verification_status text default 'pending',
      add column if not exists status text default 'active',
      add column if not exists verified_by uuid,
      add column if not exists verified_at timestamptz;
  end if;
exception when others then null;
end $$;

-- ----- Storage bucket: evidence (private) -------------------------------
insert into storage.buckets (id, name, public)
values ('evidence', 'evidence', false)
on conflict (id) do nothing;

-- Members can read evidence files belonging to their org. Path layout is
-- {organization_id}/...  — the first path segment must match an org the
-- caller belongs to.
drop policy if exists "evidence_select" on storage.objects;
drop policy if exists "evidence_insert" on storage.objects;
drop policy if exists "evidence_update" on storage.objects;
drop policy if exists "evidence_delete" on storage.objects;

create policy "evidence_select"
  on storage.objects
  for select
  using (
    bucket_id = 'evidence'
    and exists (
      select 1
      from public.org_members m
      where m.user_id = auth.uid()
        and m.organization_id::text = split_part(storage.objects.name, '/', 1)
    )
  );

create policy "evidence_insert"
  on storage.objects
  for insert
  with check (
    bucket_id = 'evidence'
    and exists (
      select 1
      from public.org_members m
      where m.user_id = auth.uid()
        and m.organization_id::text = split_part(storage.objects.name, '/', 1)
    )
  );

create policy "evidence_update"
  on storage.objects
  for update
  using (
    bucket_id = 'evidence'
    and exists (
      select 1
      from public.org_members m
      where m.user_id = auth.uid()
        and m.organization_id::text = split_part(storage.objects.name, '/', 1)
    )
  );

create policy "evidence_delete"
  on storage.objects
  for delete
  using (
    bucket_id = 'evidence'
    and exists (
      select 1
      from public.org_members m
      where m.user_id = auth.uid()
        and m.organization_id::text = split_part(storage.objects.name, '/', 1)
    )
  );

-- ----- Evidence count per task (used by obligations register) -----------
create index if not exists idx_org_evidence_task_org
  on public.org_evidence (organization_id, task_id)
  where task_id is not null;
