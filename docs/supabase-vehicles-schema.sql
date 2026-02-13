create extension if not exists "uuid-ossp";

create table if not exists public.vehicles (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users on delete cascade not null,
  year integer,
  make text,
  model text,
  vin text,
  insurance_provider text,
  insurance_expiry date,
  registration_expiry date,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.vehicles enable row level security;

drop policy if exists "Users can manage own vehicles" on public.vehicles;
create policy "Users can manage own vehicles" on public.vehicles
  for all using (auth.uid() = user_id);

create index if not exists idx_vehicles_user on public.vehicles(user_id);
create index if not exists idx_vehicles_insurance_expiry on public.vehicles(user_id, insurance_expiry);
create index if not exists idx_vehicles_registration_expiry on public.vehicles(user_id, registration_expiry);
