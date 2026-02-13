-- Appointments/reminders: title, date, time, location, notes, recurring
create extension if not exists "uuid-ossp";

create table if not exists public.appointments (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users on delete cascade not null,
  title text not null,
  appointment_date date not null,
  appointment_time time,
  location text,
  notes text,
  is_recurring boolean default false,
  recurring_rule text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.appointments enable row level security;

drop policy if exists "Users can manage own appointments" on public.appointments;
create policy "Users can manage own appointments" on public.appointments
  for all using (auth.uid() = user_id);

create index if not exists idx_appointments_user on public.appointments(user_id);
create index if not exists idx_appointments_date on public.appointments(user_id, appointment_date);
