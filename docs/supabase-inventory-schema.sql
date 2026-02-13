-- Home insurance inventory: walkthroughs and items (voice-parsed or manual).
-- Run in Supabase SQL Editor. Use with docs/supabase-storage-inventory.sql for item photos.

create extension if not exists "uuid-ossp";

-- One walkthrough = one recording session (e.g. "Living room + Kitchen" or full home).
create table if not exists public.inventory_walkthroughs (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users on delete cascade not null,
  name text,
  created_at timestamptz default now()
);

alter table public.inventory_walkthroughs enable row level security;

drop policy if exists "Users can manage own inventory walkthroughs" on public.inventory_walkthroughs;
create policy "Users can manage own inventory walkthroughs" on public.inventory_walkthroughs
  for all using (auth.uid() = user_id);

create index if not exists idx_inventory_walkthroughs_user on public.inventory_walkthroughs(user_id, created_at desc);

-- Each item: room, name, brand, year, value, category (auto), optional photo.
create table if not exists public.inventory_items (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users on delete cascade not null,
  walkthrough_id uuid references public.inventory_walkthroughs(id) on delete set null,
  room text not null,
  item_name text not null,
  brand text,
  purchase_year integer,
  value numeric not null default 0,
  category text,
  photo_url text,
  notes text,
  sort_order integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.inventory_items enable row level security;

drop policy if exists "Users can manage own inventory items" on public.inventory_items;
create policy "Users can manage own inventory items" on public.inventory_items
  for all using (auth.uid() = user_id);

create index if not exists idx_inventory_items_user on public.inventory_items(user_id);
create index if not exists idx_inventory_items_walkthrough on public.inventory_items(walkthrough_id, sort_order);

comment on column public.inventory_items.category is 'Auto-categorized: electronics, furniture, appliances, decor, etc.';
comment on column public.inventory_items.photo_url is 'Optional photo for insurance; stored in inventory bucket';
