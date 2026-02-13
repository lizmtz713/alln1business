create extension if not exists "uuid-ossp";

create table if not exists public.medical_records (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users on delete cascade not null,
  provider text,
  record_date date,
  record_type text,
  notes text,
  next_appointment date,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.medical_records enable row level security;

drop policy if exists "Users can manage own medical records" on public.medical_records;
create policy "Users can manage own medical records" on public.medical_records
  for all using (auth.uid() = user_id);

create index if not exists idx_medical_user on public.medical_records(user_id);
create index if not exists idx_medical_next on public.medical_records(user_id, next_appointment);
