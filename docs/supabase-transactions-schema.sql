-- Run this in Supabase SQL Editor if the transactions table doesn't exist.
-- From CURSOR_PROMPTS.md schema.

create extension if not exists "uuid-ossp";

create table if not exists public.transactions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users on delete cascade not null,
  date date not null,
  vendor text,
  description text,
  amount decimal(12,2) not null,
  type text check (type in ('income', 'expense')) not null,
  category text,
  subcategory text,
  payment_method text,
  reference_number text,
  is_reconciled boolean default false,
  reconciled_date date,
  receipt_url text,
  invoice_id uuid,
  bill_id uuid,
  ai_categorized boolean default false,
  ai_confidence decimal(3,2),
  tax_deductible boolean default true,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.transactions enable row level security;

drop policy if exists "Users can manage own transactions" on public.transactions;
create policy "Users can manage own transactions" on public.transactions
  for all using (auth.uid() = user_id);

create index if not exists idx_transactions_user_date on public.transactions(user_id, date desc);
create index if not exists idx_transactions_category on public.transactions(user_id, category);
