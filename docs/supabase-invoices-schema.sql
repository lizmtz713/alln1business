-- Phase 3B: Invoices
-- Run in Supabase SQL Editor. Requires customers table (Phase 3A).

create extension if not exists "uuid-ossp";

-- =============================================
-- 1. INVOICES
-- =============================================
create table if not exists public.invoices (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users on delete cascade not null,
  customer_id uuid references public.customers(id) on delete set null,
  invoice_number text not null,
  invoice_date date not null,
  due_date date not null,
  status text not null default 'draft' check (status in ('draft','sent','viewed','paid','overdue','cancelled')),
  subtotal decimal(12,2) not null default 0,
  tax_rate decimal(5,2) default 0,
  tax_amount decimal(12,2) default 0,
  discount_amount decimal(12,2) default 0,
  total decimal(12,2) not null default 0,
  amount_paid decimal(12,2) default 0,
  balance_due decimal(12,2),
  currency text default 'USD',
  notes text,
  terms text,
  payment_instructions text,
  sent_date timestamptz,
  viewed_date timestamptz,
  paid_date date,
  pdf_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.invoices enable row level security;

drop policy if exists "Users can manage own invoices" on public.invoices;
create policy "Users can manage own invoices" on public.invoices
  for all using (auth.uid() = user_id);

create index if not exists idx_invoices_user_date on public.invoices(user_id, invoice_date desc);
create index if not exists idx_invoices_user_status on public.invoices(user_id, status);
create unique index if not exists idx_invoices_user_number on public.invoices(user_id, invoice_number);

-- =============================================
-- 2. INVOICE_ITEMS
-- =============================================
create table if not exists public.invoice_items (
  id uuid primary key default uuid_generate_v4(),
  invoice_id uuid references public.invoices(id) on delete cascade not null,
  description text not null,
  quantity decimal(10,2) default 1,
  unit_price decimal(12,2) not null,
  amount decimal(12,2) not null,
  sort_order int default 0
);

alter table public.invoice_items enable row level security;

drop policy if exists "Users can manage invoice items for own invoices" on public.invoice_items;
create policy "Users can manage invoice items for own invoices" on public.invoice_items
  for all using (
    exists (
      select 1 from public.invoices
      where invoices.id = invoice_items.invoice_id
      and invoices.user_id = auth.uid()
    )
  );

create index if not exists idx_invoice_items_invoice on public.invoice_items(invoice_id);
