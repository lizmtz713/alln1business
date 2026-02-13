-- Store generated monthly reports for "run on 1st", push, and share
create extension if not exists "uuid-ossp";

create table if not exists public.monthly_reports (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users on delete cascade not null,
  report_month date not null,
  summary_text text not null,
  suggestions jsonb default '[]',
  highlights jsonb default '[]',
  cost_analysis jsonb,
  share_token text unique,
  created_at timestamptz default now()
);

alter table public.monthly_reports enable row level security;

drop policy if exists "Users can manage own monthly reports" on public.monthly_reports;
create policy "Users can manage own monthly reports" on public.monthly_reports
  for all using (auth.uid() = user_id);

create unique index if not exists idx_monthly_reports_user_month_unique on public.monthly_reports(user_id, report_month);
create index if not exists idx_monthly_reports_user_month on public.monthly_reports(user_id, report_month desc);
create index if not exists idx_monthly_reports_share_token on public.monthly_reports(share_token) where share_token is not null;

comment on column public.monthly_reports.share_token is 'Optional token for shareable link (e.g. UUID)';
comment on column public.monthly_reports.suggestions is 'Array of AI suggestions, e.g. ["Your Netflix and Hulu cost $30/month - consider bundling?"]';
