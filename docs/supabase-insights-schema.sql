-- Phase 4B: Smart Dashboard Insights
-- Run in Supabase SQL Editor.

create extension if not exists "uuid-ossp";

create table if not exists public.dashboard_insights (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users on delete cascade not null,
  insight_date date not null,
  title text not null,
  body text not null,
  insight_type text not null check (insight_type in ('win','warning','tip','action')),
  source text not null check (source in ('rule','ai')),
  cta_label text,
  cta_route text,
  dismissed boolean default false,
  created_at timestamptz default now(),
  unique (user_id, insight_date, title)
);

alter table public.dashboard_insights enable row level security;

drop policy if exists "Users can manage own insights" on public.dashboard_insights;
create policy "Users can manage own insights" on public.dashboard_insights
  for all using (auth.uid() = user_id);

create index if not exists idx_dashboard_insights_user_date
  on public.dashboard_insights(user_id, insight_date desc);

create index if not exists idx_dashboard_insights_user_dismissed_date
  on public.dashboard_insights(user_id, dismissed, insight_date desc);
