-- Phase 3A: Customers + Vendors
-- Run in Supabase SQL Editor. Idempotent where possible.

create extension if not exists "uuid-ossp";

-- =============================================
-- 1. CUSTOMERS
-- =============================================
create table if not exists public.customers (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users on delete cascade not null,
  company_name text,
  contact_name text not null,
  email text,
  phone text,
  address text,
  city text,
  state text,
  zip text,
  tax_exempt boolean default false,
  tax_exempt_number text,
  payment_terms text check (payment_terms in ('due_on_receipt', 'net_15', 'net_30', 'net_45', 'net_60')),
  notes text,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.customers enable row level security;

drop policy if exists "Users can manage own customers" on public.customers;
create policy "Users can manage own customers" on public.customers
  for all using (auth.uid() = user_id);

create index if not exists idx_customers_user on public.customers(user_id, created_at desc);
create index if not exists idx_customers_user_company on public.customers(user_id, company_name);

-- =============================================
-- 2. VENDORS
-- =============================================
create table if not exists public.vendors (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users on delete cascade not null,
  company_name text not null,
  contact_name text,
  email text,
  phone text,
  address text,
  city text,
  state text,
  zip text,
  ein text,
  w9_requested boolean default false,
  w9_received boolean default false,
  w9_received_date date,
  w9_file_url text,
  vendor_type text check (vendor_type in ('supplier', 'contractor', 'service', 'other')),
  payment_method text check (payment_method in ('check', 'ach', 'card', 'other')),
  notes text,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.vendors enable row level security;

drop policy if exists "Users can manage own vendors" on public.vendors;
create policy "Users can manage own vendors" on public.vendors
  for all using (auth.uid() = user_id);

create index if not exists idx_vendors_user on public.vendors(user_id, created_at desc);
create index if not exists idx_vendors_user_company on public.vendors(user_id, company_name);
