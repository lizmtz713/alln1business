-- Phase 3D: Document Vault
-- Run in Supabase SQL Editor. Requires customers + vendors tables (Phase 3A).

create extension if not exists "uuid-ossp";

create table if not exists public.documents (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users on delete cascade not null,
  name text not null,
  description text,
  doc_type text not null check (doc_type in ('contract','nda','agreement','w9','tax_form','license','certificate','receipt','invoice','other')),
  category text check (category in ('customer','vendor','employee','tax','legal','other')),
  related_customer_id uuid references public.customers(id) on delete set null,
  related_vendor_id uuid references public.vendors(id) on delete set null,
  file_url text not null,
  file_type text,
  file_size integer,
  expiration_date date,
  is_template boolean default false,
  is_signed boolean default false,
  signed_date date,
  signed_by text,
  tags text[],
  ai_summary text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.documents enable row level security;

drop policy if exists "Users can manage own documents" on public.documents;
create policy "Users can manage own documents" on public.documents
  for all using (auth.uid() = user_id);

create index if not exists idx_documents_user_created on public.documents(user_id, created_at desc);
create index if not exists idx_documents_user_type on public.documents(user_id, doc_type);
create index if not exists idx_documents_user_category on public.documents(user_id, category);
