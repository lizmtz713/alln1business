-- Run in Supabase SQL Editor AFTER creating the inventory bucket.
--
-- 1. Create bucket: Dashboard > Storage > New bucket
--    - Name: inventory
--    - Public: Yes (for getPublicUrl)
--
-- 2. Run these policies:

create policy "Users can upload inventory photos"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'inventory'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "Users can update own inventory photos"
on storage.objects for update
to authenticated
using (
  bucket_id = 'inventory'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "Public can view inventory photos"
on storage.objects for select
to public
using (bucket_id = 'inventory');
