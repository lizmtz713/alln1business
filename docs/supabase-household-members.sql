-- Household members (family) for Life OS voice onboarding and household context
create extension if not exists "uuid-ossp";

create table if not exists public.household_members (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users on delete cascade not null,
  name text not null,
  relationship text,
  age integer,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.household_members enable row level security;

drop policy if exists "Users can manage own household members" on public.household_members;
create policy "Users can manage own household members" on public.household_members
  for all using (auth.uid() = user_id);

create index if not exists idx_household_members_user on public.household_members(user_id);
