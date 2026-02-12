-- Run in Supabase SQL Editor AFTER creating the receipts bucket.
--
-- 1. Create bucket: Dashboard > Storage > New bucket
--    - Name: receipts
--    - Public: Yes (for getPublicUrl)
--
-- 2. Run these policies:

create policy "Users can upload receipts"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'receipts'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "Public can view receipts"
on storage.objects for select
to public
using (bucket_id = 'receipts');
