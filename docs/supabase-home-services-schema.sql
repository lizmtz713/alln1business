-- Home services: plumber, electrician, HVAC, lawn - name, phone, email, notes, last service date
create extension if not exists "uuid-ossp";

create table if not exists public.home_service_contacts (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users on delete cascade not null,
  service_type text not null,
  name text not null,
  phone text,
  email text,
  notes text,
  last_service_date date,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.home_service_contacts enable row level security;

drop policy if exists "Users can manage own home service contacts" on public.home_service_contacts;
create policy "Users can manage own home service contacts" on public.home_service_contacts
  for all using (auth.uid() = user_id);

create index if not exists idx_home_services_user on public.home_service_contacts(user_id);
create index if not exists idx_home_services_type on public.home_service_contacts(user_id, service_type);
