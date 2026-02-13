-- Shopping list for household assistant (add_to_list action)
create table if not exists public.shopping_list (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users on delete cascade not null,
  item text not null,
  completed boolean default false,
  added_at timestamptz default now()
);

alter table public.shopping_list enable row level security;

drop policy if exists "Users can manage own shopping list" on public.shopping_list;
create policy "Users can manage own shopping list" on public.shopping_list
  for all using (auth.uid() = user_id);

create index if not exists idx_shopping_list_user on public.shopping_list(user_id);
