-- Phase 3F: PDF Generation
-- Adds pdf_url columns for invoices and documents.
-- txt_file_url stores original .txt URL when file_url is replaced by PDF.

alter table public.invoices
  add column if not exists pdf_url text;

alter table public.documents
  add column if not exists pdf_url text,
  add column if not exists txt_file_url text;
