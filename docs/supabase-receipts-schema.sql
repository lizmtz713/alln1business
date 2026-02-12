-- Phase 4C: Receipts table (optional but recommended)
-- Run in Supabase SQL Editor.
-- Stores raw OCR + parsed fields from receipt scans. receipt_url on transactions links to Storage.

create extension if not exists "uuid-ossp";

create table if not exists public.receipts (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users on delete cascade not null,
  image_url text not null,
  vendor text,
  amount decimal(12,2),
  date date,
  category text,
  ocr_text text,
  transaction_id uuid references public.transactions(id) on delete set null,
  created_at timestamptz default now()
);

alter table public.receipts enable row level security;

drop policy if exists "Users can manage own receipts" on public.receipts;
create policy "Users can manage own receipts" on public.receipts
  for all using (auth.uid() = user_id);

create index if not exists idx_receipts_user_created on public.receipts(user_id, created_at desc);
create index if not exists idx_receipts_user_transaction on public.receipts(user_id, transaction_id);
