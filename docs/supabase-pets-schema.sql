create extension if not exists "uuid-ossp";

create table if not exists public.pets (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users on delete cascade not null,
  name text not null,
  type text,
  breed text,
  vet_name text,
  vet_phone text,
  vaccination_dates text,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.pets enable row level security;

drop policy if exists "Users can manage own pets" on public.pets;
create policy "Users can manage own pets" on public.pets
  for all using (auth.uid() = user_id);

create index if not exists idx_pets_user on public.pets(user_id);
