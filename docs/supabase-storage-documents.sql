-- Optional: Create a separate "documents" bucket for W-9, contracts, etc.
-- Currently W-9 uploads use the receipts bucket (userId/documents/...).
-- Run this if you prefer a dedicated documents bucket.
--
-- 1. Create bucket: Dashboard > Storage > New bucket
--    - Name: documents
--    - Public: Yes (for getPublicUrl)
--
-- 2. Run these policies:

create policy "Users can upload documents"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'documents'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "Public can view documents"
on storage.objects for select
to public
using (bucket_id = 'documents');
