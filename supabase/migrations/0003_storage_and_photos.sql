insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'pairview',
  'pairview',
  false,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp', 'image/avif']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

grant select, insert, update, delete on storage.objects to authenticated;

drop policy if exists "pair members can read pairview objects" on storage.objects;
drop policy if exists "pair members can create pairview objects" on storage.objects;
drop policy if exists "pair members can update pairview objects" on storage.objects;
drop policy if exists "pair members can delete pairview objects" on storage.objects;

create policy "pair members can read pairview objects"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'pairview'
  and name ~ '^[0-9a-fA-F-]{36}/'
  and public.is_pair_member((split_part(name, '/', 1))::uuid)
);

create policy "pair members can create pairview objects"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'pairview'
  and name ~ '^[0-9a-fA-F-]{36}/'
  and public.is_pair_member((split_part(name, '/', 1))::uuid)
);

create policy "pair members can update pairview objects"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'pairview'
  and name ~ '^[0-9a-fA-F-]{36}/'
  and public.is_pair_member((split_part(name, '/', 1))::uuid)
)
with check (
  bucket_id = 'pairview'
  and name ~ '^[0-9a-fA-F-]{36}/'
  and public.is_pair_member((split_part(name, '/', 1))::uuid)
);

create policy "pair members can delete pairview objects"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'pairview'
  and name ~ '^[0-9a-fA-F-]{36}/'
  and public.is_pair_member((split_part(name, '/', 1))::uuid)
);
