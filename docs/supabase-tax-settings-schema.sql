-- Phase 4E: Tax Settings (optional)
-- Run in Supabase SQL Editor.
-- Skip if you prefer hardcoded defaults (meals=50%, mileage=0.67).

create extension if not exists "uuid-ossp";

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
