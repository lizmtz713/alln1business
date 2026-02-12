-- Phase 3C: Bills
-- Run in Supabase SQL Editor. Requires vendors table (Phase 3A).

create extension if not exists "uuid-ossp";

create table if not exists public.bills (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users on delete cascade not null,
  vendor_id uuid references public.vendors(id) on delete set null,
  bill_name text not null,
  provider_name text,
  account_number text,
  provider_phone text,
  provider_email text,
  provider_website text,
  payment_url text,
  bill_date date,
  due_date date not null,
  amount decimal(12,2) not null,
  status text not null default 'pending' check (status in ('pending','paid','overdue','cancelled')),
  is_recurring boolean default false,
  recurrence_interval text,
  auto_pay boolean default false,
  category text,
  payment_method text,
  confirmation_number text,
  paid_date date,
  paid_amount decimal(12,2),
  notes text,
  attachment_url text,
  reminder_days integer default 3,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.bills enable row level security;

drop policy if exists "Users can manage own bills" on public.bills;
create policy "Users can manage own bills" on public.bills
  for all using (auth.uid() = user_id);

create index if not exists idx_bills_user_due on public.bills(user_id, due_date);
create index if not exists idx_bills_user_status on public.bills(user_id, status);
create index if not exists idx_bills_user_vendor on public.bills(user_id, vendor_id);
