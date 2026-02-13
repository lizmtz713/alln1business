-- Growth tracking for kids/family (shoe size, height, shirt size) for AI size predictions
create table if not exists public.growth_records (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users on delete cascade not null,
  name text not null,
  record_date date not null,
  shoe_size text,
  height_inches numeric,
  shirt_size text,
  notes text,
  created_at timestamptz default now()
);

alter table public.growth_records enable row level security;

drop policy if exists "Users can manage own growth records" on public.growth_records;
create policy "Users can manage own growth records" on public.growth_records
  for all using (auth.uid() = user_id);

create index if not exists idx_growth_records_user on public.growth_records(user_id);
create index if not exists idx_growth_records_name_date on public.growth_records(user_id, name, record_date);
