-- Phase 3D: Document Vault storage bucket
-- 1. Create bucket: Dashboard > Storage > New bucket
--    - Name: documents
--    - Public: Yes (for getPublicUrl)
--
-- 2. Run these policies (path must be: {userId}/{timestamp}-{filename}):

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

create policy "Users can update own documents"
on storage.objects for update
to authenticated
using (
  bucket_id = 'documents'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "Users can delete own documents"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'documents'
  and (storage.foldername(name))[1] = auth.uid()::text
);
