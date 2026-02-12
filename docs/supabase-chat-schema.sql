-- Phase 4A: AI Chat Assistant
-- Run in Supabase SQL Editor.

create extension if not exists "uuid-ossp";

create table if not exists public.chat_messages (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users on delete cascade not null,
  role text not null check (role in ('user', 'assistant', 'system')),
  content text not null,
  tokens_used int,
  created_at timestamptz default now()
);

alter table public.chat_messages enable row level security;

drop policy if exists "Users can manage own chat messages" on public.chat_messages;
create policy "Users can manage own chat messages" on public.chat_messages
  for all using (auth.uid() = user_id);

create index if not exists idx_chat_messages_user_created
  on public.chat_messages(user_id, created_at desc);
