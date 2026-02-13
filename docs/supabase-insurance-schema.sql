-- Insurance policies: provider, policy number, type, premium, renewal date
create extension if not exists "uuid-ossp";

create table if not exists public.insurance_policies (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users on delete cascade not null,
  provider text not null,
  policy_number text,
  policy_type text,
  premium_amount decimal(12,2),
  premium_frequency text,
  renewal_date date,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.insurance_policies enable row level security;

drop policy if exists "Users can manage own insurance" on public.insurance_policies;
create policy "Users can manage own insurance" on public.insurance_policies
  for all using (auth.uid() = user_id);

create index if not exists idx_insurance_user on public.insurance_policies(user_id);
create index if not exists idx_insurance_renewal on public.insurance_policies(user_id, renewal_date);
