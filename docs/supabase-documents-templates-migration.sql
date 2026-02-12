-- Phase 3E: Document Templates + AI Generation
-- Adds columns to documents table for generated text content.

alter table public.documents
  add column if not exists content_text text,
  add column if not exists template_id text,
  add column if not exists generated_by_ai boolean default false;

create index if not exists idx_documents_user_template
  on public.documents(user_id, template_id)
  where template_id is not null;
