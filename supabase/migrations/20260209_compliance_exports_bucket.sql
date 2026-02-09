-- Compliance export bundles bucket
insert into storage.buckets (id, name, public)
values ('compliance-exports', 'compliance-exports', false)
on conflict (id) do nothing;

drop policy if exists "compliance_exports_read" on storage.objects;
drop policy if exists "compliance_exports_insert" on storage.objects;
drop policy if exists "compliance_exports_delete" on storage.objects;

create policy "compliance_exports_read"
  on storage.objects
  for select
  using (
    bucket_id = 'compliance-exports'
    and exists (
      select 1
      from public.org_members m
      where m.user_id = auth.uid()
        and m.organization_id::text = split_part(storage.objects.name, '/', 1)
    )
  );

create policy "compliance_exports_insert"
  on storage.objects
  for insert
  with check (
    bucket_id = 'compliance-exports'
    and exists (
      select 1
      from public.org_members m
      where m.user_id = auth.uid()
        and m.organization_id::text = split_part(storage.objects.name, '/', 1)
    )
  );

create policy "compliance_exports_delete"
  on storage.objects
  for delete
  using (
    bucket_id = 'compliance-exports'
    and exists (
      select 1
      from public.org_members m
      where m.user_id = auth.uid()
        and m.organization_id::text = split_part(storage.objects.name, '/', 1)
    )
  );

