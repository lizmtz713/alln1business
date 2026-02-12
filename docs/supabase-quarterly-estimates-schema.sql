-- Phase 4G: Quarterly Estimates + Compliance
-- Run in Supabase SQL Editor.
-- Idempotent: safe to run multiple times.

create extension if not exists "uuid-ossp";

-- A) Extend tax_settings (Phase 4E may have created it)
create table if not exists public.tax_settings (
  user_id uuid primary key references auth.users on delete cascade,
  tax_year int not null default extract(year from now())::int,
  entity_type text,
  state text,
  default_deductible_rate_meals decimal(4,2) default 0.50,
  mileage_rate decimal(4,3) default 0.67,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.tax_settings enable row level security;
drop policy if exists "Users can manage own tax_settings" on public.tax_settings;
create policy "Users can manage own tax_settings" on public.tax_settings
  for all using (auth.uid() = user_id);

-- Add Phase 4G columns (idempotent)
do $$
begin
  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='tax_settings' and column_name='effective_tax_rate') then
    alter table public.tax_settings add column effective_tax_rate decimal(5,4) default 0.25;
  end if;
  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='tax_settings' and column_name='include_meals_50') then
    alter table public.tax_settings add column include_meals_50 boolean default true;
  end if;
  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='tax_settings' and column_name='include_mileage') then
    alter table public.tax_settings add column include_mileage boolean default true;
  end if;
  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='tax_settings' and column_name='state_estimated_tax_rate') then
    alter table public.tax_settings add column state_estimated_tax_rate decimal(5,4) default 0.00;
  end if;
end $$;

-- B) estimated_tax_payments
create table if not exists public.estimated_tax_payments (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users on delete cascade,
  tax_year int not null,
  quarter int not null check (quarter in (1,2,3,4)),
  due_date date not null,
  estimated_amount decimal(12,2) not null,
  state_estimated_amount decimal(12,2) default 0,
  total_estimated decimal(12,2) not null,
  paid boolean default false,
  paid_date date,
  paid_amount decimal(12,2),
  payment_method text,
  confirmation_number text,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (user_id, tax_year, quarter)
);

alter table public.estimated_tax_payments enable row level security;
drop policy if exists "Users can manage own estimated_tax_payments" on public.estimated_tax_payments;
create policy "Users can manage own estimated_tax_payments" on public.estimated_tax_payments
  for all using (auth.uid() = user_id);

create index if not exists idx_estimated_tax_payments_user_year
  on public.estimated_tax_payments(user_id, tax_year);

-- C) compliance_items (create if not exists, then add columns)
create table if not exists public.compliance_items (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users on delete cascade,
  name text not null,
  description text,
  category text,
  due_date date,
  recurrence text default 'once',
  status text default 'pending',
  completed_date date,
  reminder_days integer default 7,
  notes text,
  created_at timestamptz default now()
);

alter table public.compliance_items enable row level security;
drop policy if exists "Users can manage own compliance_items" on public.compliance_items;
create policy "Users can manage own compliance_items" on public.compliance_items
  for all using (auth.uid() = user_id);

do $$
begin
  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='compliance_items' and column_name='source') then
    alter table public.compliance_items add column source text default 'manual';
  end if;
  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='compliance_items' and column_name='related_estimate_id') then
    alter table public.compliance_items add column related_estimate_id uuid references public.estimated_tax_payments(id) on delete set null;
  end if;
end $$;
