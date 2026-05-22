insert into storage.buckets (id, name, public)
values ('user-avatars', 'user-avatars', false)
on conflict (id) do nothing;

drop policy if exists "user_avatars_read" on storage.objects;
drop policy if exists "user_avatars_insert" on storage.objects;
drop policy if exists "user_avatars_update" on storage.objects;
drop policy if exists "user_avatars_delete" on storage.objects;

create policy "user_avatars_read"
  on storage.objects
  for select
  using (
    bucket_id = 'user-avatars'
    and exists (
      select 1
      from public.org_members m
      where m.user_id = auth.uid()
        and m.organization_id::text = split_part(storage.objects.name, '/', 1)
    )
  );

create policy "user_avatars_insert"
  on storage.objects
  for insert
  with check (
    bucket_id = 'user-avatars'
    and exists (
      select 1
      from public.org_members m
      where m.user_id = auth.uid()
        and m.organization_id::text = split_part(storage.objects.name, '/', 1)
    )
  );

create policy "user_avatars_update"
  on storage.objects
  for update
  using (
    bucket_id = 'user-avatars'
    and exists (
      select 1
      from public.org_members m
      where m.user_id = auth.uid()
        and m.organization_id::text = split_part(storage.objects.name, '/', 1)
    )
  );

create policy "user_avatars_delete"
  on storage.objects
  for delete
  using (
    bucket_id = 'user-avatars'
    and exists (
      select 1
      from public.org_members m
      where m.user_id = auth.uid()
        and m.organization_id::text = split_part(storage.objects.name, '/', 1)
    )
  );
