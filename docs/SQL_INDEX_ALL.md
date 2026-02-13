# All SQL Files in docs/ — Full Contents & Run Order

Use this index to run scripts in **Supabase → SQL Editor**.  
**Recommended order** (dependencies first): see "Run order" below.

---

## Run order (bootstrap → migrations)

1. **supabase-profiles-schema.sql** — Run FIRST (profiles + trigger).
2. **supabase-transactions-schema.sql** — Core transactions table.
3. **supabase-customers-vendors-schema.sql** — Customers + vendors (Phase 3A).
4. **supabase-invoices-schema.sql** — Invoices + invoice_items (Phase 3B, needs customers).
5. **supabase-bills-schema.sql** — Bills (Phase 3C, needs vendors).
6. **supabase-documents-schema.sql** — Documents (Phase 3D, needs customers/vendors).
7. **supabase-bank-reconciliation-schema.sql** — Bank accounts, statements, reconciliation (Phase 2.75).
8. **supabase-pdf-migration.sql** — Add pdf_url / txt_file_url to invoices & documents (Phase 3F).
9. **supabase-documents-templates-migration.sql** — Add content_text, template_id, generated_by_ai to documents (Phase 3E).
10. **supabase-chat-schema.sql** — Chat messages (Phase 4A).
11. **supabase-insights-schema.sql** — Dashboard insights (Phase 4B).
12. **supabase-receipts-schema.sql** — Receipts table (Phase 4C); fix typo `(y` → `(` if present.
13. **supabase-category-rules-schema.sql** — Category rules (Phase 4D).
14. **supabase-tax-settings-schema.sql** — Tax settings (Phase 4E).
15. **supabase-quarterly-estimates-schema.sql** — Tax settings extensions, estimated_tax_payments, compliance_items (Phase 4G).
16. **supabase-profiles-onboarding-challenge-migration.sql** — Add onboarding_challenge to profiles.
17. **supabase-rls-audit.sql** — Enable RLS + policies on all tables (idempotent; run after tables exist).
18. **supabase-storage-documents.sql** — Storage policies for bucket `documents` (create bucket in Dashboard first).
19. **supabase-storage-receipts.sql** — Storage policies for bucket `receipts` (create bucket in Dashboard first).

---

## 1. supabase-profiles-schema.sql (RUN FIRST)

```sql
-- Run this FIRST in Supabase SQL Editor.
-- Profiles table + trigger to auto-create profile on signup.
-- Required for login and onboarding to work.

create extension if not exists "uuid-ossp";

create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  full_name text,
  business_name text,
  business_type text,
  entity_type text,
  ein text,
  state_tax_id text,
  business_address text,
  business_city text,
  business_state text,
  business_zip text,
  business_phone text,
  business_email text,
  website text,
  industry text,
  year_started integer,
  onboarding_completed boolean default false,
  subscription_tier text default 'free',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.profiles enable row level security;

drop policy if exists "Users can manage own profile" on public.profiles;
create policy "Users can manage own profile" on public.profiles
  for all using (auth.uid() = id);

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email)
  values (new.id, coalesce(new.email, ''));
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
```

---

## 2. supabase-transactions-schema.sql

```sql
-- Run this in Supabase SQL Editor if the transactions table doesn't exist.
-- From CURSOR_PROMPTS.md schema.

create extension if not exists "uuid-ossp";

create table if not exists public.transactions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users on delete cascade not null,
  date date not null,
  vendor text,
  description text,
  amount decimal(12,2) not null,
  type text check (type in ('income', 'expense')) not null,
  category text,
  subcategory text,
  payment_method text,
  reference_number text,
  is_reconciled boolean default false,
  reconciled_date date,
  receipt_url text,
  invoice_id uuid,
  bill_id uuid,
  ai_categorized boolean default false,
  ai_confidence decimal(3,2),
  tax_deductible boolean default true,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.transactions enable row level security;

drop policy if exists "Users can manage own transactions" on public.transactions;
create policy "Users can manage own transactions" on public.transactions
  for all using (auth.uid() = user_id);

create index if not exists idx_transactions_user_date on public.transactions(user_id, date desc);
create index if not exists idx_transactions_category on public.transactions(user_id, category);
```

---

## 3. supabase-customers-vendors-schema.sql (Phase 3A)

```sql
-- Phase 3A: Customers + Vendors
-- Run in Supabase SQL Editor. Idempotent where possible.

create extension if not exists "uuid-ossp";

-- =============================================
-- 1. CUSTOMERS
-- =============================================
create table if not exists public.customers (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users on delete cascade not null,
  company_name text,
  contact_name text not null,
  email text,
  phone text,
  address text,
  city text,
  state text,
  zip text,
  tax_exempt boolean default false,
  tax_exempt_number text,
  payment_terms text check (payment_terms in ('due_on_receipt', 'net_15', 'net_30', 'net_45', 'net_60')),
  notes text,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.customers enable row level security;

drop policy if exists "Users can manage own customers" on public.customers;
create policy "Users can manage own customers" on public.customers
  for all using (auth.uid() = user_id);

create index if not exists idx_customers_user on public.customers(user_id, created_at desc);
create index if not exists idx_customers_user_company on public.customers(user_id, company_name);

-- =============================================
-- 2. VENDORS
-- =============================================
create table if not exists public.vendors (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users on delete cascade not null,
  company_name text not null,
  contact_name text,
  email text,
  phone text,
  address text,
  city text,
  state text,
  zip text,
  ein text,
  w9_requested boolean default false,
  w9_received boolean default false,
  w9_received_date date,
  w9_file_url text,
  vendor_type text check (vendor_type in ('supplier', 'contractor', 'service', 'other')),
  payment_method text check (payment_method in ('check', 'ach', 'card', 'other')),
  notes text,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.vendors enable row level security;

drop policy if exists "Users can manage own vendors" on public.vendors;
create policy "Users can manage own vendors" on public.vendors
  for all using (auth.uid() = user_id);

create index if not exists idx_vendors_user on public.vendors(user_id, created_at desc);
create index if not exists idx_vendors_user_company on public.vendors(user_id, company_name);
```

---

## 4. supabase-invoices-schema.sql (Phase 3B)

```sql
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
create index if exists idx_invoices_user_status on public.invoices(user_id, status);
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
```

---

## 5. supabase-bills-schema.sql (Phase 3C)

```sql
-- Phase 3C: Bills
-- Run in Supabase SQL Editor. Requires vendors table (Phase 3A).

create extension if not exists "uuid-ossp";

create table if not exists public.bills (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users on delete cascade not null,
  vendor_id uuid references public.vendors(id) on delete set null,
  bill_name text not null,
  provider_name text,
  account_number text,
  provider_phone text,
  provider_email text,
  provider_website text,
  payment_url text,
  bill_date date,
  due_date date not null,
  amount decimal(12,2) not null,
  status text not null default 'pending' check (status in ('pending','paid','overdue','cancelled')),
  is_recurring boolean default false,
  recurrence_interval text,
  auto_pay boolean default false,
  category text,
  payment_method text,
  confirmation_number text,
  paid_date date,
  paid_amount decimal(12,2),
  notes text,
  attachment_url text,
  reminder_days integer default 3,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.bills enable row level security;

drop policy if exists "Users can manage own bills" on public.bills;
create policy "Users can manage own bills" on public.bills
  for all using (auth.uid() = user_id);

create index if not exists idx_bills_user_due on public.bills(user_id, due_date);
create index if not exists idx_bills_user_status on public.bills(user_id, status);
create index if not exists idx_bills_user_vendor on public.bills(user_id, vendor_id);
```

---

## 6. supabase-documents-schema.sql (Phase 3D)

```sql
-- Phase 3D: Document Vault
-- Run in Supabase SQL Editor. Requires customers + vendors tables (Phase 3A).

create extension if not exists "uuid-ossp";

create table if not exists public.documents (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users on delete cascade not null,
  name text not null,
  description text,
  doc_type text not null check (doc_type in ('contract','nda','agreement','w9','tax_form','license','certificate','receipt','invoice','other')),
  category text check (category in ('customer','vendor','employee','tax','legal','other')),
  related_customer_id uuid references public.customers(id) on delete set null,
  related_vendor_id uuid references public.vendors(id) on delete set null,
  file_url text not null,
  file_type text,
  file_size integer,
  expiration_date date,
  is_template boolean default false,
  is_signed boolean default false,
  signed_date date,
  signed_by text,
  tags text[],
  ai_summary text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.documents enable row level security;

drop policy if exists "Users can manage own documents" on public.documents;
create policy "Users can manage own documents" on public.documents
  for all using (auth.uid() = user_id);

create index if not exists idx_documents_user_created on public.documents(user_id, created_at desc);
create index if not exists idx_documents_user_type on public.documents(user_id, doc_type);
create index if not exists idx_documents_user_category on public.documents(user_id, category);
```

---

## 7. supabase-bank-reconciliation-schema.sql (Phase 2.75)

```sql
-- Phase 2.75: Bank Accounts, Statements, Reconciliation
-- Run in Supabase SQL Editor. Idempotent where possible.

create extension if not exists "uuid-ossp";

-- =============================================
-- 1. BANK ACCOUNTS
-- =============================================
create table if not exists public.bank_accounts (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users on delete cascade not null,
  account_name text not null,
  account_type text,
  bank_name text,
  last_four text,
  current_balance decimal(12,2),
  is_primary boolean default false,
  plaid_account_id text,
  created_at timestamptz default now()
);

alter table public.bank_accounts enable row level security;

drop policy if exists "Users can manage own bank accounts" on public.bank_accounts;
create policy "Users can manage own bank accounts" on public.bank_accounts
  for all using (auth.uid() = user_id);

create index if not exists idx_bank_accounts_user on public.bank_accounts(user_id, created_at desc);

-- =============================================
-- 2. BANK STATEMENTS
-- =============================================
create table if not exists public.bank_statements (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users on delete cascade not null,
  bank_account_id uuid references public.bank_accounts on delete set null,
  filename text,
  file_url text,
  statement_date date,
  start_date date,
  end_date date,
  starting_balance decimal(12,2),
  ending_balance decimal(12,2),
  total_deposits decimal(12,2),
  total_withdrawals decimal(12,2),
  transaction_count integer default 0,
  reconciled boolean default false,
  reconciled_date timestamptz,
  created_at timestamptz default now()
);

alter table public.bank_statements enable row level security;

drop policy if exists "Users can manage own bank statements" on public.bank_statements;
create policy "Users can manage own bank statements" on public.bank_statements
  for all using (auth.uid() = user_id);

create index if not exists idx_bank_statements_user on public.bank_statements(user_id, created_at desc);
create index if not exists idx_bank_statements_account on public.bank_statements(bank_account_id, statement_date desc);

-- =============================================
-- 3. ALTER TRANSACTIONS: add bank_statement_id
-- =============================================
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'transactions' and column_name = 'bank_statement_id'
  ) then
    alter table public.transactions
    add column bank_statement_id uuid references public.bank_statements(id) on delete set null;
  end if;
end $$;

create index if not exists idx_transactions_bank_statement on public.transactions(bank_statement_id);

-- Add is_reconciled and reconciled_date if missing (idempotent)
do $$
begin
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'transactions' and column_name = 'is_reconciled') then
    alter table public.transactions add column is_reconciled boolean default false;
  end if;
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'transactions' and column_name = 'reconciled_date') then
    alter table public.transactions add column reconciled_date date;
  end if;
end $$;
```

---

## 8. supabase-pdf-migration.sql (Phase 3F)

```sql
-- Phase 3F: PDF Generation
-- Adds pdf_url columns for invoices and documents.
-- txt_file_url stores original .txt URL when file_url is replaced by PDF.

alter table public.invoices
  add column if not exists pdf_url text;

alter table public.documents
  add column if not exists pdf_url text,
  add column if not exists txt_file_url text;
```

---

## 9. supabase-documents-templates-migration.sql (Phase 3E)

```sql
-- Phase 3E: Document Templates + AI Generation
-- Adds columns to documents table for generated text content.

alter table public.documents
  add column if not exists content_text text,
  add column if not exists template_id text,
  add column if not exists generated_by_ai boolean default false;

create index if not exists idx_documents_user_template
  on public.documents(user_id, template_id)
  where template_id is not null;
```

---

## 10. supabase-chat-schema.sql (Phase 4A)

```sql
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
```

---

## 11. supabase-insights-schema.sql (Phase 4B)

```sql
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
```

---

## 12. supabase-receipts-schema.sql (Phase 4C)

```sql
-- Phase 4C: Receipts table (optional but recommended)
-- Run in Supabase SQL Editor.
-- Stores raw OCR + parsed fields from receipt scans. receipt_url on transactions links to Storage.

create extension if not exists "uuid-ossp";

create table if not exists public.receipts (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users on delete cascade not null,
  image_url text not null,
  vendor text,
  amount decimal(12,2),
  date date,
  category text,
  ocr_text text,
  transaction_id uuid references public.transactions(id) on delete set null,
  created_at timestamptz default now()
);

alter table public.receipts enable row level security;

drop policy if exists "Users can manage own receipts" on public.receipts;
create policy "Users can manage own receipts" on public.receipts
  for all using (auth.uid() = user_id);

create index if not exists idx_receipts_user_created on public.receipts(user_id, created_at desc);
create index if not exists idx_receipts_user_transaction on public.receipts(user_id, transaction_id);
```

---

## 13. supabase-category-rules-schema.sql (Phase 4D)

```sql
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
```

---

## 14. supabase-tax-settings-schema.sql (Phase 4E)

```sql
-- Phase 4E: Tax Settings (optional)
-- Run in Supabase SQL Editor.
-- Skip if you prefer hardcoded defaults (meals=50%, mileage=0.67).

create extension if not exists "uuid-ossp";

create table if not exists public.tax_settings (
  user_id uuid primary key references auth.users on delete cascade,
  tax_year int not null default extract(year from now())::int,
  entity_type text,
  state text,
  default_deductible_rate_meals decimal(4,2) default 0.50,
  mileage_rate decimal(4,3) default 0.67,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.tax_settings enable row level security;

drop policy if exists "Users can manage own tax_settings" on public.tax_settings;
create policy "Users can manage own tax_settings" on public.tax_settings
  for all using (auth.uid() = user_id);
```

---

## 15. supabase-quarterly-estimates-schema.sql (Phase 4G)

```sql
-- Phase 4G: Quarterly Estimates + Compliance
-- Run in Supabase SQL Editor.
-- Idempotent: safe to run multiple times.

create extension if not exists "uuid-ossp";

-- A) Extend tax_settings (Phase 4E may have created it)
create table if not exists public.tax_settings (
  user_id uuid primary key references auth.users on delete cascade,
  tax_year int not null default extract(year from now())::int,
  entity_type text,
  state text,
  default_deductible_rate_meals decimal(4,2) default 0.50,
  mileage_rate decimal(4,3) default 0.67,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.tax_settings enable row level security;
drop policy if exists "Users can manage own tax_settings" on public.tax_settings;
create policy "Users can manage own tax_settings" on public.tax_settings
  for all using (auth.uid() = user_id);

-- Add Phase 4G columns (idempotent)
do $$
begin
  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='tax_settings' and column_name='effective_tax_rate') then
    alter table public.tax_settings add column effective_tax_rate decimal(5,4) default 0.25;
  end if;
  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='tax_settings' and column_name='include_meals_50') then
    alter table public.tax_settings add column include_meals_50 boolean default true;
  end if;
  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='tax_settings' and column_name='include_mileage') then
    alter table public.tax_settings add column include_mileage boolean default true;
  end if;
  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='tax_settings' and column_name='state_estimated_tax_rate') then
    alter table public.tax_settings add column state_estimated_tax_rate decimal(5,4) default 0.00;
  end if;
end $$;

-- B) estimated_tax_payments
create table if not exists public.estimated_tax_payments (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users on delete cascade,
  tax_year int not null,
  quarter int not null check (quarter in (1,2,3,4)),
  due_date date not null,
  estimated_amount decimal(12,2) not null,
  state_estimated_amount decimal(12,2) default 0,
  total_estimated decimal(12,2) not null,
  paid boolean default false,
  paid_date date,
  paid_amount decimal(12,2),
  payment_method text,
  confirmation_number text,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (user_id, tax_year, quarter)
);

alter table public.estimated_tax_payments enable row level security;
drop policy if exists "Users can manage own estimated_tax_payments" on public.estimated_tax_payments;
create policy "Users can manage own estimated_tax_payments" on public.estimated_tax_payments
  for all using (auth.uid() = user_id);

create index if not exists idx_estimated_tax_payments_user_year
  on public.estimated_tax_payments(user_id, tax_year);

-- C) compliance_items (create if not exists, then add columns)
create table if not exists public.compliance_items (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users on delete cascade,
  name text not null,
  description text,
  category text,
  due_date date,
  recurrence text default 'once',
  status text default 'pending',
  completed_date date,
  reminder_days integer default 7,
  notes text,
  created_at timestamptz default now()
);

alter table public.compliance_items enable row level security;
drop policy if exists "Users can manage own compliance_items" on public.compliance_items;
create policy "Users can manage own compliance_items" on public.compliance_items
  for all using (auth.uid() = user_id);

do $$
begin
  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='compliance_items' and column_name='source') then
    alter table public.compliance_items add column source text default 'manual';
  end if;
  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='compliance_items' and column_name='related_estimate_id') then
    alter table public.compliance_items add column related_estimate_id uuid references public.estimated_tax_payments(id) on delete set null;
  end if;
end $$;
```

---

## 16. supabase-profiles-onboarding-challenge-migration.sql

```sql
-- Optional: add onboarding_challenge to store user's biggest challenge from onboarding.
-- Run after docs/supabase-profiles-schema.sql.
alter table public.profiles add column if not exists onboarding_challenge text;
```

---

## 17. supabase-rls-audit.sql (RLS for all tables)

```sql
-- =============================================================================
-- RLS AUDIT: Row Level Security for all app tables
-- Run in Supabase SQL Editor to ensure every table has RLS and user-scoped policies.
-- Idempotent: safe to run multiple times.
-- =============================================================================

-- 1. PROFILES (id = auth.uid())
alter table if exists public.profiles enable row level security;
drop policy if exists "Users can manage own profile" on public.profiles;
create policy "Users can manage own profile" on public.profiles
  for all using (auth.uid() = id);

-- 2. TRANSACTIONS
alter table if exists public.transactions enable row level security;
drop policy if exists "Users can manage own transactions" on public.transactions;
create policy "Users can manage own transactions" on public.transactions
  for all using (auth.uid() = user_id);

-- 3. CUSTOMERS
alter table if exists public.customers enable row level security;
drop policy if exists "Users can manage own customers" on public.customers;
create policy "Users can manage own customers" on public.customers
  for all using (auth.uid() = user_id);

-- 4. VENDORS
alter table if exists public.vendors enable row level security;
drop policy if exists "Users can manage own vendors" on public.vendors;
create policy "Users can manage own vendors" on public.vendors
  for all using (auth.uid() = user_id);

-- 5. INVOICES
alter table if exists public.invoices enable row level security;
drop policy if exists "Users can manage own invoices" on public.invoices;
create policy "Users can manage own invoices" on public.invoices
  for all using (auth.uid() = user_id);

-- 6. INVOICE_ITEMS (via invoice ownership)
alter table if exists public.invoice_items enable row level security;
drop policy if exists "Users can manage invoice items for own invoices" on public.invoice_items;
create policy "Users can manage invoice items for own invoices" on public.invoice_items
  for all using (
    exists (
      select 1 from public.invoices
      where invoices.id = invoice_items.invoice_id and invoices.user_id = auth.uid()
    )
  );

-- 7. BILLS
alter table if exists public.bills enable row level security;
drop policy if exists "Users can manage own bills" on public.bills;
create policy "Users can manage own bills" on public.bills
  for all using (auth.uid() = user_id);

-- 8. DOCUMENTS
alter table if exists public.documents enable row level security;
drop policy if exists "Users can manage own documents" on public.documents;
create policy "Users can manage own documents" on public.documents
  for all using (auth.uid() = user_id);

-- 9. BANK_ACCOUNTS
alter table if exists public.bank_accounts enable row level security;
drop policy if exists "Users can manage own bank accounts" on public.bank_accounts;
create policy "Users can manage own bank accounts" on public.bank_accounts
  for all using (auth.uid() = user_id);

-- 10. BANK_STATEMENTS
alter table if exists public.bank_statements enable row level security;
drop policy if exists "Users can manage own bank statements" on public.bank_statements;
create policy "Users can manage own bank statements" on public.bank_statements
  for all using (auth.uid() = user_id);

-- 11. DASHBOARD_INSIGHTS
alter table if exists public.dashboard_insights enable row level security;
drop policy if exists "Users can manage own insights" on public.dashboard_insights;
create policy "Users can manage own insights" on public.dashboard_insights
  for all using (auth.uid() = user_id);

-- 12. CHAT_MESSAGES
alter table if exists public.chat_messages enable row level security;
drop policy if exists "Users can manage own chat messages" on public.chat_messages;
create policy "Users can manage own chat messages" on public.chat_messages
  for all using (auth.uid() = user_id);

-- 13. CATEGORY_RULES
alter table if exists public.category_rules enable row level security;
drop policy if exists "Users can manage own category rules" on public.category_rules;
create policy "Users can manage own category rules" on public.category_rules
  for all using (auth.uid() = user_id);

-- 14. TAX_SETTINGS
alter table if exists public.tax_settings enable row level security;
drop policy if exists "Users can manage own tax_settings" on public.tax_settings;
create policy "Users can manage own tax_settings" on public.tax_settings
  for all using (auth.uid() = user_id);

-- 15. ESTIMATED_TAX_PAYMENTS
alter table if exists public.estimated_tax_payments enable row level security;
drop policy if exists "Users can manage own estimated_tax_payments" on public.estimated_tax_payments;
create policy "Users can manage own estimated_tax_payments" on public.estimated_tax_payments
  for all using (auth.uid() = user_id);

-- 16. COMPLIANCE_ITEMS
alter table if exists public.compliance_items enable row level security;
drop policy if exists "Users can manage own compliance_items" on public.compliance_items;
create policy "Users can manage own compliance_items" on public.compliance_items
  for all using (auth.uid() = user_id);
```

---

## 18. supabase-storage-documents.sql (Storage: documents bucket)

```sql
-- Phase 3D: Document Vault storage bucket
-- 1. Create bucket: Dashboard > Storage > New bucket
--    - Name: documents
--    - Public: Yes (for getPublicUrl)
--
-- 2. Run these policies (path must be: {userId}/{timestamp}-{filename}):

create policy "Users can upload documents"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'documents'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "Public can view documents"
on storage.objects for select
to public
using (bucket_id = 'documents');

create policy "Users can update own documents"
on storage.objects for update
to authenticated
using (
  bucket_id = 'documents'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "Users can delete own documents"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'documents'
  and (storage.foldername(name))[1] = auth.uid()::text
);
```

---

## 19. supabase-storage-receipts.sql (Storage: receipts bucket)

```sql
-- Run in Supabase SQL Editor AFTER creating the receipts bucket.
--
-- 1. Create bucket: Dashboard > Storage > New bucket
--    - Name: receipts
--    - Public: Yes (for getPublicUrl)
--
-- 2. Run these policies:

create policy "Users can upload receipts"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'receipts'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "Public can view receipts"
on storage.objects for select
to public
using (bucket_id = 'receipts');
```

---

**Note:** `supabase-quarterly-estimates-schema.sql` creates `tax_settings` if not exists; if you already ran `supabase-tax-settings-schema.sql`, that’s fine. The RLS audit script is idempotent and can be run last to lock down all tables.
