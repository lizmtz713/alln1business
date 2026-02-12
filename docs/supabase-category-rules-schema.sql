-- Phase 4D: Category Rules (Learning Categorization)
-- Run in Supabase SQL Editor.

create extension if not exists "uuid-ossp";

create table if not exists public.category_rules (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users on delete cascade not null,
  match_type text not null check (match_type in ('vendor_exact','vendor_contains','description_contains')),
  match_value text not null,
  category text not null,
  subcategory text,
  applies_to text not null default 'expense' check (applies_to in ('expense','income','both')),
  confidence_source text not null default 'user' check (confidence_source in ('user','ai')),
  priority int not null default 100,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.category_rules enable row level security;

drop policy if exists "Users can manage own category rules" on public.category_rules;
create policy "Users can manage own category rules" on public.category_rules
  for all using (auth.uid() = user_id);

create unique index if not exists idx_category_rules_unique
  on public.category_rules(user_id, match_type, lower(match_value), category);

create index if not exists idx_category_rules_user_active on public.category_rules(user_id, is_active);
create index if not exists idx_category_rules_user_match on public.category_rules(user_id, match_type);
