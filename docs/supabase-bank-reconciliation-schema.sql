-- Phase 2.75: Bank Accounts, Statements, Reconciliation
-- Run in Supabase SQL Editor. Idempotent where possible.

create extension if not exists "uuid-ossp";

-- =============================================
-- 1. BANK ACCOUNTS
-- =============================================
create table if not exists public.bank_accounts (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users on delete cascade not null,
  account_name text not null,
  account_type text,
  bank_name text,
  last_four text,
  current_balance decimal(12,2),
  is_primary boolean default false,
  plaid_account_id text,
  created_at timestamptz default now()
);

alter table public.bank_accounts enable row level security;

drop policy if exists "Users can manage own bank accounts" on public.bank_accounts;
create policy "Users can manage own bank accounts" on public.bank_accounts
  for all using (auth.uid() = user_id);

create index if not exists idx_bank_accounts_user on public.bank_accounts(user_id, created_at desc);

-- =============================================
-- 2. BANK STATEMENTS
-- =============================================
create table if not exists public.bank_statements (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users on delete cascade not null,
  bank_account_id uuid references public.bank_accounts on delete set null,
  filename text,
  file_url text,
  statement_date date,
  start_date date,
  end_date date,
  starting_balance decimal(12,2),
  ending_balance decimal(12,2),
  total_deposits decimal(12,2),
  total_withdrawals decimal(12,2),
  transaction_count integer default 0,
  reconciled boolean default false,
  reconciled_date timestamptz,
  created_at timestamptz default now()
);

alter table public.bank_statements enable row level security;

drop policy if exists "Users can manage own bank statements" on public.bank_statements;
create policy "Users can manage own bank statements" on public.bank_statements
  for all using (auth.uid() = user_id);

create index if not exists idx_bank_statements_user on public.bank_statements(user_id, created_at desc);
create index if not exists idx_bank_statements_account on public.bank_statements(bank_account_id, statement_date desc);

-- =============================================
-- 3. ALTER TRANSACTIONS: add bank_statement_id
-- =============================================
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'transactions' and column_name = 'bank_statement_id'
  ) then
    alter table public.transactions
    add column bank_statement_id uuid references public.bank_statements(id) on delete set null;
  end if;
end $$;

create index if not exists idx_transactions_bank_statement on public.transactions(bank_statement_id);

-- Add is_reconciled and reconciled_date if missing (idempotent)
do $$
begin
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'transactions' and column_name = 'is_reconciled') then
    alter table public.transactions add column is_reconciled boolean default false;
  end if;
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'transactions' and column_name = 'reconciled_date') then
    alter table public.transactions add column reconciled_date date;
  end if;
end $$;
