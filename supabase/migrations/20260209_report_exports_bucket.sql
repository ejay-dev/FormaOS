-- Report exports bucket
insert into storage.buckets (id, name, public)
values ('report-exports', 'report-exports', false)
on conflict (id) do nothing;

drop policy if exists "report_exports_read" on storage.objects;
drop policy if exists "report_exports_insert" on storage.objects;
drop policy if exists "report_exports_delete" on storage.objects;

create policy "report_exports_read"
  on storage.objects
  for select
  using (
    bucket_id = 'report-exports'
    and exists (
      select 1
      from public.org_members m
      where m.user_id = auth.uid()
        and m.organization_id::text = split_part(storage.objects.name, '/', 1)
    )
  );

create policy "report_exports_insert"
  on storage.objects
  for insert
  with check (
    bucket_id = 'report-exports'
    and exists (
      select 1
      from public.org_members m
      where m.user_id = auth.uid()
        and m.organization_id::text = split_part(storage.objects.name, '/', 1)
    )
  );

create policy "report_exports_delete"
  on storage.objects
  for delete
  using (
    bucket_id = 'report-exports'
    and exists (
      select 1
      from public.org_members m
      where m.user_id = auth.uid()
        and m.organization_id::text = split_part(storage.objects.name, '/', 1)
    )
  );

