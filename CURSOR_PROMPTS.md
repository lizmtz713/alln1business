# ALLN1 BUSINESS - COMPLETE CURSOR PROMPTS
## The Ultimate AI-Powered Business Management App

**Owner:** Elizabeth Martinez
**Domain:** Alln1business.com
**Vision:** One app to run your entire business - simple, fast, AI-powered

---

# WHAT MAKES ALLN1 DIFFERENT

## The Problem
Small business owners juggle 10+ apps: QuickBooks for accounting, DocuSign for contracts, Bill.com for bills, spreadsheets for everything else. It's expensive, confusing, and nothing talks to each other.

## The Solution
ONE app that does it all - but keeps it simple. AI handles the complexity. You just run your business.

## Why Users Love It
- "Finally, everything in one place"
- "The AI actually understands my business"
- "I set it up in 5 minutes"
- "It's like having a business assistant in my pocket"
- "Tax time went from 2 weeks to 2 hours"

## What Users Wish It Did
- "Connect to my bank automatically" (coming: Plaid)
- "File my taxes for me" (coming: tax integration)
- "Pay my bills automatically" (coming: bill pay)

## What Competitors Would Say
- "How did they make it so simple?"
- "Their AI categorization is scary accurate"
- "They're giving away features we charge $50/month for"
- "The document generation is surprisingly good"

## The Future of Business Management (2025-2030)
- AI auto-categorizes 99% of transactions
- Voice-first: "Hey Alln1, invoice John $500 for the logo project"
- Predictive cash flow: know problems weeks ahead
- Auto-negotiation: AI negotiates your bills down
- One-tap tax filing
- AI writes contracts and NDAs customized to your business
- Compliance monitoring - never miss a deadline
- AI CFO advice based on YOUR data

---

# COMPLETE FEATURE LIST

## 💰 FINANCIAL MANAGEMENT
1. **Dashboard** - At-a-glance business health
2. **Transactions** - All income and expenses
3. **Bank Statement Upload** - CSV/PDF import with AI categorization
4. **Bank Reconciliation** - Match statements to records
5. **Invoicing** - Create, send, track invoices
6. **Bills Tracking** - All bills in one place with reminders
7. **Expense Categories** - Smart AI categorization
8. **Profit & Loss** - Simple P&L reports
9. **Tax Prep** - Deductions tracker, quarterly estimates

## 📄 DOCUMENTS & CONTRACTS
10. **Document Vault** - Store all business docs
11. **Contract Generator** - AI-powered contracts
12. **NDA Generator** - Customizable NDAs
13. **Agreement Templates** - Service agreements, etc.
14. **Invoice Templates** - Professional invoices
15. **Purchase Orders** - Create and track POs
16. **W-9 Management** - Request, store, track W-9s
17. **Tax Exemption Forms** - Sales tax certificates

## 👥 CONTACTS & RELATIONSHIPS
18. **Customer Database** - All customer info
19. **Vendor Database** - All vendor info with W-9 status
20. **Customer Applications** - Onboard new customers
21. **Vendor Applications** - Onboard new vendors

## 🏢 BUSINESS OPERATIONS
22. **Business Profile** - EIN, entity type, addresses
23. **HR Basics** - Employee records (if applicable)
24. **Compliance Calendar** - Never miss deadlines
25. **Freight/Shipping Quotes** - Request and compare
26. **Mileage Tracking** - Auto-track business miles

## 🤖 AI FEATURES
27. **AI Chat Assistant** - Ask anything about your business
28. **Smart Categorization** - Auto-categorize everything
29. **Natural Language Input** - "Spent $50 at Office Depot"
30. **Document Scanner** - OCR receipts, invoices, docs
31. **AI Insights** - Proactive tips and alerts
32. **AI Contract Review** - Explain contracts in plain English

---

# TECHNICAL ARCHITECTURE

```
┌─────────────────────────────────────┐
│         MOBILE APP                   │
│    React Native + Expo SDK 52        │
│    TypeScript + Expo Router          │
│    NativeWind (Tailwind CSS)         │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│          SUPABASE                    │
│  • Auth (email, Google, Apple)       │
│  • PostgreSQL Database               │
│  • Storage (documents, receipts)     │
│  • Edge Functions (AI processing)    │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│        EXTERNAL APIS                 │
│  • OpenAI (GPT-4o) - AI features     │
│  • Plaid (future) - bank connection  │
│  • Resend - email sending            │
└─────────────────────────────────────┘
```

---

# DATABASE SCHEMA

Copy this ENTIRE block into Supabase SQL Editor:

```sql
-- =============================================
-- ALLN1 BUSINESS - COMPLETE DATABASE SCHEMA
-- Run this in Supabase SQL Editor
-- =============================================

-- Enable extensions
create extension if not exists "uuid-ossp";

-- =============================================
-- 1. PROFILES (extends Supabase auth)
-- =============================================
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  full_name text,
  business_name text,
  business_type text,
  entity_type text, -- LLC, Sole Prop, Corp, etc.
  ein text, -- Federal EIN
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
create policy "Users can manage own profile" on public.profiles
  for all using (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- =============================================
-- 2. TRANSACTIONS
-- =============================================
create table public.transactions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users on delete cascade not null,
  date date not null,
  vendor text,
  description text,
  amount decimal(12,2) not null,
  type text check (type in ('income', 'expense')) not null,
  category text,
  subcategory text,
  payment_method text, -- cash, card, check, transfer
  reference_number text, -- check number, confirmation, etc.
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
create policy "Users can manage own transactions" on public.transactions
  for all using (auth.uid() = user_id);

create index idx_transactions_user_date on public.transactions(user_id, date desc);
create index idx_transactions_category on public.transactions(user_id, category);

-- =============================================
-- 3. BANK ACCOUNTS
-- =============================================
create table public.bank_accounts (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users on delete cascade not null,
  account_name text not null, -- "Chase Business Checking"
  account_type text, -- checking, savings, credit
  bank_name text,
  last_four text, -- last 4 digits
  current_balance decimal(12,2),
  is_primary boolean default false,
  plaid_account_id text, -- for future Plaid integration
  created_at timestamptz default now()
);

alter table public.bank_accounts enable row level security;
create policy "Users can manage own accounts" on public.bank_accounts
  for all using (auth.uid() = user_id);

-- =============================================
-- 4. BANK STATEMENTS (for reconciliation)
-- =============================================
create table public.bank_statements (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users on delete cascade not null,
  bank_account_id uuid references public.bank_accounts,
  filename text,
  file_url text,
  statement_date date,
  start_date date,
  end_date date,
  starting_balance decimal(12,2),
  ending_balance decimal(12,2),
  total_deposits decimal(12,2),
  total_withdrawals decimal(12,2),
  transaction_count integer,
  reconciled boolean default false,
  reconciled_date timestamptz,
  created_at timestamptz default now()
);

alter table public.bank_statements enable row level security;
create policy "Users can manage own statements" on public.bank_statements
  for all using (auth.uid() = user_id);

-- =============================================
-- 5. CUSTOMERS
-- =============================================
create table public.customers (
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
  country text default 'US',
  tax_exempt boolean default false,
  tax_exempt_number text,
  payment_terms text default 'due_on_receipt', -- net_15, net_30, etc.
  notes text,
  total_revenue decimal(12,2) default 0,
  total_invoices integer default 0,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.customers enable row level security;
create policy "Users can manage own customers" on public.customers
  for all using (auth.uid() = user_id);

-- =============================================
-- 6. VENDORS
-- =============================================
create table public.vendors (
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
  country text default 'US',
  ein text, -- Their EIN (from W-9)
  w9_received boolean default false,
  w9_received_date date,
  w9_file_url text,
  vendor_type text, -- supplier, contractor, service
  payment_method text, -- check, ach, card
  account_number text, -- your account with them
  website text,
  notes text,
  total_spent decimal(12,2) default 0,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.vendors enable row level security;
create policy "Users can manage own vendors" on public.vendors
  for all using (auth.uid() = user_id);

-- =============================================
-- 7. INVOICES
-- =============================================
create table public.invoices (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users on delete cascade not null,
  customer_id uuid references public.customers,
  invoice_number text not null,
  invoice_date date not null,
  due_date date not null,
  status text default 'draft', -- draft, sent, viewed, paid, overdue, cancelled
  subtotal decimal(12,2) not null,
  tax_rate decimal(5,2) default 0,
  tax_amount decimal(12,2) default 0,
  discount_amount decimal(12,2) default 0,
  total decimal(12,2) not null,
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
create policy "Users can manage own invoices" on public.invoices
  for all using (auth.uid() = user_id);

-- =============================================
-- 8. INVOICE LINE ITEMS
-- =============================================
create table public.invoice_items (
  id uuid primary key default uuid_generate_v4(),
  invoice_id uuid references public.invoices on delete cascade not null,
  description text not null,
  quantity decimal(10,2) default 1,
  unit_price decimal(12,2) not null,
  amount decimal(12,2) not null,
  sort_order integer default 0
);

alter table public.invoice_items enable row level security;
create policy "Users can manage own invoice items" on public.invoice_items
  for all using (
    exists (
      select 1 from public.invoices
      where invoices.id = invoice_items.invoice_id
      and invoices.user_id = auth.uid()
    )
  );

-- =============================================
-- 9. BILLS
-- =============================================
create table public.bills (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users on delete cascade not null,
  vendor_id uuid references public.vendors,
  bill_name text not null, -- "Electric Bill", "Internet", etc.
  provider_name text, -- Company name
  account_number text, -- Your account number with them
  provider_phone text,
  provider_email text,
  provider_website text,
  payment_url text, -- Direct link to pay
  bill_date date, -- Statement date
  due_date date not null,
  amount decimal(12,2) not null,
  status text default 'pending', -- pending, paid, overdue, cancelled
  is_recurring boolean default false,
  recurrence_interval text, -- monthly, quarterly, yearly
  auto_pay boolean default false,
  category text, -- utilities, rent, insurance, software, etc.
  payment_method text,
  confirmation_number text,
  paid_date date,
  paid_amount decimal(12,2),
  notes text,
  attachment_url text,
  reminder_days integer default 3, -- days before due to remind
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.bills enable row level security;
create policy "Users can manage own bills" on public.bills
  for all using (auth.uid() = user_id);

create index idx_bills_due_date on public.bills(user_id, due_date);

-- =============================================
-- 10. DOCUMENTS
-- =============================================
create table public.documents (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users on delete cascade not null,
  name text not null,
  description text,
  doc_type text not null, -- contract, nda, agreement, w9, tax_form, license, certificate, receipt, invoice, other
  category text, -- customer, vendor, employee, tax, legal, other
  related_customer_id uuid references public.customers,
  related_vendor_id uuid references public.vendors,
  file_url text not null,
  file_type text, -- pdf, doc, jpg, png
  file_size integer,
  expiration_date date, -- for licenses, certificates
  is_template boolean default false,
  is_signed boolean default false,
  signed_date date,
  signed_by text,
  tags text[], -- array of tags for search
  ai_summary text, -- AI-generated summary
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.documents enable row level security;
create policy "Users can manage own documents" on public.documents
  for all using (auth.uid() = user_id);

-- =============================================
-- 11. PURCHASE ORDERS
-- =============================================
create table public.purchase_orders (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users on delete cascade not null,
  vendor_id uuid references public.vendors,
  po_number text not null,
  po_date date not null,
  expected_date date,
  status text default 'draft', -- draft, sent, confirmed, received, cancelled
  subtotal decimal(12,2),
  tax_amount decimal(12,2) default 0,
  shipping_amount decimal(12,2) default 0,
  total decimal(12,2),
  shipping_address text,
  notes text,
  terms text,
  pdf_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.purchase_orders enable row level security;
create policy "Users can manage own POs" on public.purchase_orders
  for all using (auth.uid() = user_id);

-- =============================================
-- 12. PURCHASE ORDER ITEMS
-- =============================================
create table public.po_items (
  id uuid primary key default uuid_generate_v4(),
  po_id uuid references public.purchase_orders on delete cascade not null,
  description text not null,
  sku text,
  quantity decimal(10,2) default 1,
  unit_price decimal(12,2) not null,
  amount decimal(12,2) not null,
  sort_order integer default 0
);

alter table public.po_items enable row level security;
create policy "Users can manage own PO items" on public.po_items
  for all using (
    exists (
      select 1 from public.purchase_orders
      where purchase_orders.id = po_items.po_id
      and purchase_orders.user_id = auth.uid()
    )
  );

-- =============================================
-- 13. COMPLIANCE ITEMS
-- =============================================
create table public.compliance_items (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users on delete cascade not null,
  name text not null, -- "Quarterly Tax Payment", "Business License Renewal"
  description text,
  category text, -- tax, license, insurance, legal, hr
  due_date date,
  recurrence text, -- once, monthly, quarterly, yearly
  status text default 'pending', -- pending, completed, overdue
  completed_date date,
  reminder_days integer default 7,
  notes text,
  document_id uuid references public.documents,
  created_at timestamptz default now()
);

alter table public.compliance_items enable row level security;
create policy "Users can manage own compliance" on public.compliance_items
  for all using (auth.uid() = user_id);

-- =============================================
-- 14. EMPLOYEES (Basic HR)
-- =============================================
create table public.employees (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users on delete cascade not null,
  full_name text not null,
  email text,
  phone text,
  position text,
  department text,
  hire_date date,
  employment_type text, -- full_time, part_time, contractor
  pay_rate decimal(12,2),
  pay_type text, -- hourly, salary
  address text,
  city text,
  state text,
  zip text,
  ssn_last_four text, -- for identification only
  w4_on_file boolean default false,
  i9_on_file boolean default false,
  is_active boolean default true,
  termination_date date,
  notes text,
  created_at timestamptz default now()
);

alter table public.employees enable row level security;
create policy "Users can manage own employees" on public.employees
  for all using (auth.uid() = user_id);

-- =============================================
-- 15. MILEAGE LOG
-- =============================================
create table public.mileage_log (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users on delete cascade not null,
  date date not null,
  start_location text,
  end_location text,
  purpose text not null,
  miles decimal(8,2) not null,
  rate_per_mile decimal(4,3) default 0.67, -- IRS rate
  total_deduction decimal(10,2),
  customer_id uuid references public.customers,
  is_round_trip boolean default false,
  notes text,
  created_at timestamptz default now()
);

alter table public.mileage_log enable row level security;
create policy "Users can manage own mileage" on public.mileage_log
  for all using (auth.uid() = user_id);

-- =============================================
-- 16. CHAT MESSAGES (AI Assistant)
-- =============================================
create table public.chat_messages (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users on delete cascade not null,
  role text check (role in ('user', 'assistant', 'system')) not null,
  content text not null,
  tokens_used integer,
  created_at timestamptz default now()
);

alter table public.chat_messages enable row level security;
create policy "Users can manage own messages" on public.chat_messages
  for all using (auth.uid() = user_id);

-- =============================================
-- 17. RECEIPTS
-- =============================================
create table public.receipts (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users on delete cascade not null,
  image_url text not null,
  vendor text,
  amount decimal(12,2),
  date date,
  category text,
  ocr_text text,
  transaction_id uuid references public.transactions,
  created_at timestamptz default now()
);

alter table public.receipts enable row level security;
create policy "Users can manage own receipts" on public.receipts
  for all using (auth.uid() = user_id);

-- =============================================
-- 18. CATEGORIES (Reference table)
-- =============================================
create table public.categories (
  id text primary key,
  name text not null,
  icon text,
  color text,
  type text, -- income, expense, both
  is_tax_deductible boolean default true,
  parent_category text
);

-- Insert default categories
insert into public.categories (id, name, icon, color, type, is_tax_deductible) values
  ('income', 'Income', '💰', '#10B981', 'income', false),
  ('sales', 'Sales Revenue', '🛒', '#10B981', 'income', false),
  ('services', 'Service Revenue', '💼', '#10B981', 'income', false),
  ('other_income', 'Other Income', '💵', '#10B981', 'income', false),
  ('supplies', 'Supplies', '📦', '#3B82F6', 'expense', true),
  ('travel', 'Travel', '✈️', '#8B5CF6', 'expense', true),
  ('meals', 'Meals & Entertainment', '🍔', '#F59E0B', 'expense', true),
  ('utilities', 'Utilities', '💡', '#EC4899', 'expense', true),
  ('software', 'Software & Subscriptions', '💻', '#6366F1', 'expense', true),
  ('contractors', 'Contractors', '👷', '#14B8A6', 'expense', true),
  ('marketing', 'Marketing & Advertising', '📣', '#F97316', 'expense', true),
  ('insurance', 'Insurance', '🛡️', '#64748B', 'expense', true),
  ('rent', 'Rent & Lease', '🏢', '#78716C', 'expense', true),
  ('equipment', 'Equipment', '🔧', '#0EA5E9', 'expense', true),
  ('professional', 'Professional Services', '👔', '#7C3AED', 'expense', true),
  ('taxes', 'Taxes & Licenses', '📋', '#DC2626', 'expense', true),
  ('payroll', 'Payroll', '👥', '#059669', 'expense', true),
  ('shipping', 'Shipping & Freight', '📦', '#0891B2', 'expense', true),
  ('vehicle', 'Vehicle Expenses', '🚗', '#4F46E5', 'expense', true),
  ('office', 'Office Expenses', '🏠', '#9333EA', 'expense', true),
  ('bank_fees', 'Bank & Merchant Fees', '🏦', '#BE185D', 'expense', true),
  ('other', 'Other', '📋', '#94A3B8', 'expense', true);

-- =============================================
-- USEFUL FUNCTIONS
-- =============================================

-- Get current month stats
create or replace function get_monthly_stats(p_user_id uuid, p_year int, p_month int)
returns table (
  total_income decimal,
  total_expenses decimal,
  profit decimal,
  transaction_count bigint
) as $$
begin
  return query
  select 
    coalesce(sum(case when type = 'income' then amount else 0 end), 0),
    coalesce(sum(case when type = 'expense' then amount else 0 end), 0),
    coalesce(sum(case when type = 'income' then amount else -amount end), 0),
    count(*)
  from public.transactions
  where user_id = p_user_id
    and extract(year from date) = p_year
    and extract(month from date) = p_month;
end;
$$ language plpgsql security definer;

-- Get upcoming bills
create or replace function get_upcoming_bills(p_user_id uuid, p_days int default 30)
returns setof public.bills as $$
begin
  return query
  select * from public.bills
  where user_id = p_user_id
    and status = 'pending'
    and due_date <= current_date + p_days
  order by due_date;
end;
$$ language plpgsql security definer;

-- Get overdue invoices
create or replace function get_overdue_invoices(p_user_id uuid)
returns setof public.invoices as $$
begin
  return query
  select * from public.invoices
  where user_id = p_user_id
    and status in ('sent', 'viewed')
    and due_date < current_date
  order by due_date;
end;
$$ language plpgsql security definer;
```

---

# CURSOR PROMPT - PHASE 1: FOUNDATION
## Project Setup + Auth + Navigation

Copy everything below into Cursor:

```
# ALLN1 BUSINESS APP - PHASE 1: FOUNDATION

Build a React Native mobile app for comprehensive business management.

## TECH STACK
- Expo SDK 52 with TypeScript (strict mode)
- Expo Router v4 (file-based navigation)
- Supabase (Auth + PostgreSQL + Storage)
- NativeWind v4 (Tailwind CSS for React Native)
- React Query v5 (data fetching/caching)
- Zod (validation)

## PROJECT SETUP

1. Create new Expo project:
```bash
npx create-expo-app@latest alln1-business --template tabs
cd alln1-business
```

2. Install dependencies:
```bash
npx expo install @supabase/supabase-js expo-secure-store
npm install nativewind tailwindcss
npm install @tanstack/react-query zod date-fns
npx expo install expo-camera expo-document-picker expo-image-picker
npx expo install react-native-reanimated
```

3. Create file structure:
```
alln1-business/
├── app/
│   ├── _layout.tsx           # Root layout with providers
│   ├── index.tsx             # Entry redirect
│   ├── (auth)/
│   │   ├── _layout.tsx
│   │   ├── login.tsx
│   │   ├── signup.tsx
│   │   └── onboarding.tsx
│   ├── (tabs)/
│   │   ├── _layout.tsx       # Tab navigator
│   │   ├── index.tsx         # Dashboard
│   │   ├── transactions.tsx
│   │   ├── documents.tsx
│   │   ├── chat.tsx
│   │   └── more.tsx          # Settings & more features
│   └── (modals)/
│       ├── add-expense.tsx
│       ├── add-income.tsx
│       ├── scan-receipt.tsx
│       ├── upload-statement.tsx
│       ├── create-invoice.tsx
│       ├── add-bill.tsx
│       └── transaction/[id].tsx
├── src/
│   ├── components/
│   │   ├── ui/               # Button, Card, Input, Modal, etc.
│   │   ├── dashboard/        # Stats cards, recent items
│   │   ├── transactions/     # List items, filters
│   │   ├── documents/        # Document cards, upload
│   │   └── chat/             # Message bubbles, input
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useProfile.ts
│   │   ├── useTransactions.ts
│   │   ├── useInvoices.ts
│   │   ├── useBills.ts
│   │   ├── useDocuments.ts
│   │   ├── useCustomers.ts
│   │   ├── useVendors.ts
│   │   └── useChat.ts
│   ├── services/
│   │   ├── supabase.ts       # Supabase client
│   │   ├── openai.ts         # AI functions
│   │   ├── parser.ts         # CSV/document parsing
│   │   └── storage.ts        # File upload helpers
│   ├── lib/
│   │   ├── constants.ts      # Colors, categories
│   │   ├── formatters.ts     # Money, dates
│   │   └── validators.ts     # Zod schemas
│   ├── types/
│   │   └── index.ts          # TypeScript types
│   └── providers/
│       ├── AuthProvider.tsx
│       └── QueryProvider.tsx
└── .env.local
```

## ENVIRONMENT VARIABLES (.env.local)
```
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
EXPO_PUBLIC_OPENAI_API_KEY=your_openai_key
```

## DESIGN SYSTEM

Colors (dark theme):
- background: #0F172A (slate-900)
- surface: #1E293B (slate-800)
- surfaceHover: #334155 (slate-700)
- primary: #3B82F6 (blue-500)
- text: #F8FAFC (slate-50)
- textSecondary: #94A3B8 (slate-400)
- success: #10B981 (green-500)
- warning: #F59E0B (amber-500)
- error: #EF4444 (red-500)

## BUILD THESE SCREENS

### 1. Login Screen (app/(auth)/login.tsx)
- Logo at top
- Email input
- Password input with visibility toggle
- "Sign In" button (primary)
- "Forgot password?" link
- Divider with "or"
- "Continue with Google" button
- "Don't have an account? Sign up" link
- Error message display
- Loading state on button

### 2. Signup Screen (app/(auth)/signup.tsx)
- Back button
- "Create Account" header
- Email input
- Password input (with requirements hint)
- Confirm password input
- "Create Account" button
- "Continue with Google" button
- "Already have an account? Sign in" link
- Terms/Privacy links at bottom

### 3. Onboarding Screen (app/(auth)/onboarding.tsx)
Multi-step wizard (4 steps):

Step 1 - Business Name:
- "What's your business name?"
- Text input
- "Continue" button
- "Skip" link

Step 2 - Business Type:
- "What type of business?"
- Selection cards:
  - 💼 Freelance / Consulting
  - 🛠 Service Business
  - 🛒 Retail / E-commerce
  - 📦 Other
- Auto-advance on selection

Step 3 - Entity Type:
- "How is your business structured?"
- Selection cards:
  - Sole Proprietorship
  - LLC
  - Corporation
  - Partnership
  - Not sure yet

Step 4 - Primary Challenge:
- "What's your biggest challenge?"
- Selection cards:
  - 🧾 Tracking expenses
  - 💰 Managing taxes
  - 📄 Invoicing clients
  - 📋 Staying organized
  - 🤯 All of it!
- "Let's Get Started!" button

### 4. Tab Navigator (app/(tabs)/_layout.tsx)
5 tabs with icons:
- Home (house icon) → Dashboard
- Transactions (dollar icon)
- Documents (folder icon)
- Chat (message icon)
- More (menu icon)

### 5. Dashboard (app/(tabs)/index.tsx)
Components:
- Header: "Good morning, {name}" with date
- Quick Stats Row (horizontal scroll):
  - This Month Income (green)
  - This Month Expenses (red)
  - Profit (green/red based on value)
  - Pending Invoices
  - Upcoming Bills
- AI Insight Card (dismissible)
- Recent Transactions (5 items + "See all")
- Quick Actions Grid (2x3):
  - Add Expense
  - Add Income
  - Scan Receipt
  - Create Invoice
  - Upload Statement
  - Add Bill

### 6. Supabase Client (src/services/supabase.ts)
```typescript
import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';

const ExpoSecureStoreAdapter = {
  getItem: (key: string) => SecureStore.getItemAsync(key),
  setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
  removeItem: (key: string) => SecureStore.deleteItemAsync(key),
};

export const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      storage: ExpoSecureStoreAdapter,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  }
);
```

### 7. Auth Hook (src/hooks/useAuth.ts)
- signIn(email, password)
- signUp(email, password)
- signOut()
- resetPassword(email)
- session state
- user state
- loading state
- Listen to auth state changes

### 8. Auth Flow Logic
In root _layout.tsx:
- If no session → show auth screens
- If session but !onboarding_completed → show onboarding
- If session and onboarding_completed → show main app

## DELIVERABLES
After Phase 1:
- User can sign up with email/password
- User can log in
- User completes onboarding
- User sees dashboard with placeholder data
- Tab navigation works
- Dark theme applied throughout
- All data persists in Supabase
```

---

# CURSOR PROMPT - PHASE 2: TRANSACTIONS & RECONCILIATION
## Core Financial Features

```
# ALLN1 BUSINESS - PHASE 2: TRANSACTIONS & BANK RECONCILIATION

Building on Phase 1, add transaction management and bank statement reconciliation.

## NEW SCREENS TO BUILD

### 1. Transactions List (app/(tabs)/transactions.tsx)

Header:
- "Transactions" title
- Filter icon (opens filter sheet)
- Search icon (expands search bar)

Search Bar (when expanded):
- "Search by vendor or description..."
- Clear button
- Real-time filtering

Filter Chips (horizontal scroll):
- Date: This Month | Last Month | This Year | Custom
- Type: All | Income | Expenses
- Category: All | [category picker]
- Status: All | Reconciled | Unreconciled

Transaction List:
- Grouped by date: Today, Yesterday, This Week, Earlier, [Month names]
- Each item shows:
  - Category icon (colored circle)
  - Vendor name (bold)
  - Description (if any, truncated)
  - Category label
  - Amount (right aligned)
    - Green with + for income
    - Red with - for expenses
  - Reconciled checkmark if reconciled
  - AI badge if ai_categorized
- Pull to refresh
- Infinite scroll for pagination

Floating Action Button:
- + icon
- Opens bottom sheet with: Add Expense, Add Income, Scan Receipt

Empty State:
- Illustration
- "No transactions yet"
- "Add your first expense or upload a bank statement"
- Two buttons: Add Expense, Upload Statement

### 2. Transaction Detail (app/(modals)/transaction/[id].tsx)

Full screen modal:
- Header with back button and delete icon
- Amount (large, colored)
- Vendor name (editable)
- Date (date picker)
- Category (dropdown with icons)
- Type (Income/Expense toggle)
- Description (text input)
- Payment method (dropdown)
- Reference # (text input)
- Tax deductible toggle
- Reconciled toggle
- Receipt section:
  - If has receipt: show thumbnail, tap to view full
  - If no receipt: "Add Receipt" button → camera or gallery
- Notes (multiline text)
- Save button (sticky bottom)
- Delete confirmation modal

### 3. Add Expense (app/(modals)/add-expense.tsx)

Two modes:

**Natural Language Mode (default):**
- Large text input: "What did you spend?"
- Placeholder: "e.g., $47 at Staples for printer ink"
- As user types, show AI parsing below:
  - Amount: $47.00 ✓
  - Vendor: Staples ✓
  - Category: Supplies (tap to change)
  - Description: printer ink
- "Add Receipt" button (optional)
- "Save" button

**Form Mode:**
- Toggle at top: "Switch to form"
- Date picker
- Amount input
- Vendor input
- Category picker
- Description input
- "Save" button

### 4. Add Income (app/(modals)/add-income.tsx)
Similar to Add Expense but:
- Different placeholder: "e.g., $1,200 from Client ABC for logo design"
- Category defaults to income categories
- Optional: link to customer
- Optional: link to invoice

### 5. Upload Statement (app/(modals)/upload-statement.tsx)

Step 1 - Select File:
- Large drop zone / file picker
- "Select CSV or PDF file"
- Supported formats note
- OR "Connect Bank" button (coming soon badge)

Step 2 - Processing:
- Progress indicator
- "Analyzing your statement..."
- Show bank name if detected

Step 3 - Review Transactions:
- Statement summary card:
  - Bank: Chase Business
  - Period: Jan 1 - Jan 31, 2026
  - Starting Balance: $5,432.10
  - Ending Balance: $6,234.56
  - Deposits: 12 ($4,200.00)
  - Withdrawals: 34 ($3,397.54)
  
- Transaction list (scrollable):
  Each row shows:
  - Checkbox (selected by default)
  - Date
  - Description
  - Amount
  - AI Category (editable dropdown)
  - Confidence badge (high/medium/low)
  
- Batch actions:
  - Select All / Deselect All
  - Bulk category change

Step 4 - Import:
- "Import X Transactions" button
- Progress during import
- Success screen with summary

### 6. Bank Reconciliation Screen (app/reconciliation.tsx)

Access from: More tab → Bank Reconciliation

Header:
- "Reconciliation"
- Bank account selector dropdown

Reconciliation Card:
- Statement: [Select Statement dropdown]
- Statement Period: Jan 1-31, 2026
- Statement Ending Balance: $6,234.56
- Book Balance: $6,180.12
- Difference: $54.44 (red if not zero)

Transaction Matching:
- Two columns layout (or tabs on mobile):

Left: Unmatched Book Transactions
- Transactions in your records not matched to statement
- Each shows: date, vendor, amount
- Checkbox to mark as cleared

Right: Unmatched Statement Items
- Items on statement not in your records
- Each shows: date, description, amount
- "Add as Transaction" button

Auto-Match Suggestions:
- AI suggests matches based on amount + date
- "These look like they match:"
- Show pairs with "Confirm Match" button

Summary:
- Reconciled: X transactions
- Unmatched in books: X
- Unmatched on statement: X
- "Complete Reconciliation" button (enabled when difference = 0)

## HOOKS TO CREATE

### useTransactions.ts
```typescript
export function useTransactions(filters?: TransactionFilters) {
  // Fetch transactions with filters
  // Return: data, isLoading, error, refetch
}

export function useTransaction(id: string) {
  // Fetch single transaction
}

export function useCreateTransaction() {
  // Mutation to create transaction
}

export function useUpdateTransaction() {
  // Mutation to update transaction
}

export function useDeleteTransaction() {
  // Mutation to delete transaction
}

export function useTransactionStats(year: number, month: number) {
  // Get monthly stats
}
```

### useBankStatements.ts
```typescript
export function useBankStatements() {
  // List all statements
}

export function useUploadStatement() {
  // Upload and process statement
}

export function useReconciliation(statementId: string) {
  // Get reconciliation data
}

export function useCompleteReconciliation() {
  // Mark statement as reconciled
}
```

## AI FUNCTIONS (src/services/openai.ts)

### categorizeTransaction
```typescript
export async function categorizeTransaction(
  vendor: string,
  amount: number,
  description?: string
): Promise<{ category: string; confidence: number }> {
  const prompt = `Categorize this business transaction.
  
Vendor: ${vendor}
Amount: $${Math.abs(amount)}
${description ? `Description: ${description}` : ''}
Type: ${amount > 0 ? 'INCOME' : 'EXPENSE'}

Categories for expenses: supplies, travel, meals, utilities, software, contractors, marketing, insurance, rent, equipment, professional, taxes, payroll, shipping, vehicle, office, bank_fees, other

Categories for income: sales, services, other_income

Return JSON only: {"category": "supplies", "confidence": 0.95}`;

  // Call GPT-4o-mini
}
```

### categorizeTransactionsBatch
```typescript
export async function categorizeTransactionsBatch(
  transactions: Array<{ vendor: string; amount: number; description?: string }>
): Promise<Array<{ category: string; confidence: number }>> {
  // Batch categorize for statement import (more efficient)
}
```

### parseExpenseInput
```typescript
export async function parseExpenseInput(input: string): Promise<{
  amount: number | null;
  vendor: string | null;
  category: string | null;
  description: string | null;
}> {
  const prompt = `Extract expense details from: "${input}"
  
Return JSON: {
  "amount": 47.50,
  "vendor": "Staples",
  "category": "supplies",
  "description": "printer ink"
}

Use null for any field you can't determine.`;

  // Call GPT-4o-mini
}
```

## CSV PARSER (src/services/parser.ts)

```typescript
export function parseCSVStatement(csvContent: string): {
  transactions: Array<{
    date: string;
    description: string;
    amount: number;
    type: 'income' | 'expense';
  }>;
  metadata: {
    startDate?: string;
    endDate?: string;
    startingBalance?: number;
    endingBalance?: number;
  };
} {
  // Detect column headers
  // Common patterns: Date, Description, Amount, Debit, Credit
  // Normalize dates
  // Handle negative amounts
  // Return structured data
}
```

## DELIVERABLES
After Phase 2:
- Full transaction CRUD
- Search and filter transactions
- Natural language expense entry with AI
- CSV statement upload with AI categorization
- Bank reconciliation workflow
- Transaction receipts (camera + gallery)
```

---

# CURSOR PROMPT - PHASE 3: INVOICES, BILLS & DOCUMENTS
## Business Documents & Cash Flow

```
# ALLN1 BUSINESS - PHASE 3: INVOICES, BILLS & DOCUMENTS

Add invoicing, bill tracking, and document management.

## NEW SCREENS

### 1. Documents Tab (app/(tabs)/documents.tsx)

Segmented control at top:
- All | Invoices | Bills | Contracts | Forms

Search bar

Document Grid/List toggle

**Invoices View:**
- Stats row: Draft (X) | Sent (X) | Overdue (X) | Paid (X)
- Invoice cards:
  - Invoice #001
  - Customer name
  - Amount
  - Status badge (colored)
  - Due date
  - Tap to view/edit
- FAB: Create Invoice

**Bills View:**
- Stats row: Due Soon (X) | Overdue (X) | Paid (X)
- Bills grouped by status:
  - OVERDUE (red section)
  - DUE THIS WEEK
  - UPCOMING
  - PAID
- Each bill shows:
  - Bill name (Electric, Internet, etc.)
  - Provider
  - Amount
  - Due date
  - "Pay Now" button (links to payment URL)
- FAB: Add Bill

**Contracts/Forms View:**
- Document cards with:
  - Icon based on type
  - Name
  - Related customer/vendor
  - Date
  - Status (signed, pending, expired)
- FAB: Create Document

### 2. Create Invoice (app/(modals)/create-invoice.tsx)

Header:
- "New Invoice"
- Preview button

Invoice Number (auto-generated, editable)

Customer Section:
- "Bill To" label
- Customer search/select
- + Add New Customer
- Shows: name, email, address when selected

Dates:
- Invoice Date (default today)
- Due Date (default based on payment terms)
- Payment Terms dropdown (Due on Receipt, Net 15, Net 30, Net 45, Net 60)

Line Items:
- For each item:
  - Description (text input)
  - Qty (number)
  - Rate (currency)
  - Amount (calculated, display only)
  - Delete button
- "+ Add Line Item" button
- Subtotal
- Tax Rate % (optional)
- Tax Amount
- **Total** (large)

Notes/Terms (collapsible):
- Notes to customer (textarea)
- Payment instructions (textarea)

Actions:
- Save as Draft
- Send Invoice (opens send modal)

### 3. Send Invoice Modal

- To: customer email (editable)
- Subject: Invoice #001 from [Business Name]
- Message: (pre-filled, editable)
- [ ] Attach PDF
- [ ] Send copy to me
- Send button

### 4. Invoice Detail (app/invoice/[id].tsx)

Header:
- Back button
- Status badge
- More menu (Edit, Duplicate, Download PDF, Delete)

Invoice preview (styled like actual invoice)

Timeline:
- Created: Feb 1
- Sent: Feb 1
- Viewed: Feb 2
- Paid: -- 

Actions based on status:
- Draft: Edit, Send
- Sent: Resend, Record Payment
- Overdue: Send Reminder, Record Payment
- Paid: Download PDF

Record Payment Modal:
- Amount (default: full balance)
- Date
- Payment method
- Reference #
- Notes
- Record button

### 5. Add Bill (app/(modals)/add-bill.tsx)

Bill Name (e.g., "Electric Bill", "Internet")

Provider Info:
- Provider Name
- Account Number
- Phone
- Email
- Website
- Payment URL (direct link to pay)

Bill Details:
- Amount
- Bill Date (statement date)
- Due Date
- Category dropdown

Recurring:
- Toggle: "This is a recurring bill"
- If on:
  - Frequency: Monthly, Quarterly, Yearly
  - [ ] Auto-create next bill

Reminders:
- Remind me: 3 days before (adjustable)

Attachment:
- Upload bill image/PDF

Notes

Save button

### 6. Bill Detail (app/bill/[id].tsx)

All bill info displayed

Quick actions:
- "Pay Now" button (opens payment URL)
- "Mark as Paid" button
- Edit button

Payment history (if recurring)

### 7. Customer/Vendor Management

**Customers Screen (from More tab):**
- Search bar
- Customer cards:
  - Name/Company
  - Total revenue
  - Invoice count
  - Last invoice date
- Tap to view/edit
- FAB: Add Customer

**Add/Edit Customer:**
- Company Name
- Contact Name
- Email
- Phone
- Address, City, State, Zip
- Tax Exempt toggle + certificate number
- Payment Terms
- Notes
- Save

**Vendors Screen:**
- Similar to customers
- Additional fields:
  - W-9 Status (Requested, Received, Not Required)
  - W-9 Upload
  - EIN (from W-9)
  - Vendor Type

### 8. Document Templates (More → Documents → Templates)

Pre-built templates:
- NDA (Non-Disclosure Agreement)
- Service Agreement
- Independent Contractor Agreement
- W-9 Request Letter
- Tax Exemption Certificate Request

Each template:
- Preview
- "Use Template" → fills in your business info
- Generates PDF
- Option to send or save

### 9. Create Contract/Agreement (app/(modals)/create-document.tsx)

Type selector: NDA | Service Agreement | Custom

AI-Assisted:
- "Describe what you need..."
- AI generates appropriate document
- User reviews and edits

OR Manual:
- Upload existing document
- Fill in party names
- Set expiration date

Output:
- PDF preview
- "Send for Signature" (future: e-sign integration)
- "Download PDF"
- Save to vault

## HOOKS

### useInvoices.ts
- useInvoices(filters)
- useInvoice(id)
- useCreateInvoice()
- useUpdateInvoice()
- useSendInvoice()
- useRecordPayment()
- useInvoiceStats()

### useBills.ts
- useBills(filters)
- useBill(id)
- useCreateBill()
- useUpdateBill()
- useMarkBillPaid()
- useUpcomingBills()
- useBillReminders()

### useCustomers.ts
- useCustomers()
- useCustomer(id)
- useCreateCustomer()
- useUpdateCustomer()
- useCustomerStats(id)

### useVendors.ts
- useVendors()
- useVendor(id)
- useCreateVendor()
- useUpdateVendor()
- useVendorsNeedingW9()

### useDocuments.ts
- useDocuments(filters)
- useDocument(id)
- useUploadDocument()
- useGenerateDocument(templateId, data)
- useDocumentTemplates()

## AI FUNCTIONS

### generateInvoicePDF
```typescript
// Generate professional PDF from invoice data
```

### generateDocument
```typescript
export async function generateDocument(
  type: 'nda' | 'service_agreement' | 'contractor_agreement',
  data: {
    businessName: string;
    businessAddress: string;
    otherPartyName: string;
    otherPartyAddress: string;
    specificTerms?: string;
  }
): Promise<string> {
  // AI generates document text
  // Return formatted document content
}
```

### summarizeDocument
```typescript
export async function summarizeDocument(text: string): Promise<string> {
  // AI summarizes uploaded contract/document
  // "This is a 2-year service agreement with... Key terms include..."
}
```

## DELIVERABLES
After Phase 3:
- Create and send professional invoices
- Track invoice status (draft, sent, paid)
- Record payments
- Manage all bills with reminders
- Track W-9 status for vendors
- Generate contracts/NDAs from templates
- AI document summarization
- Customer and vendor database
```

---

# CURSOR PROMPT - PHASE 4: AI CHAT & SMART FEATURES
## AI Assistant & Intelligence Layer

```
# ALLN1 BUSINESS - PHASE 4: AI CHAT & SMART FEATURES

Add AI chat assistant and intelligent features throughout the app.

## AI CHAT SCREEN (app/(tabs)/chat.tsx)

Full chat interface:

Header:
- "AI Assistant"
- Clear chat button (with confirmation)

Message List:
- Scrollable, newest at bottom
- User messages: right-aligned, blue bubble
- AI messages: left-aligned, gray bubble with avatar
- Timestamps on messages
- Typing indicator when waiting

Suggested Questions (shown when chat is empty or after long pause):
Quick-tap cards:
- "Am I profitable this month?"
- "What can I deduct for taxes?"
- "Show me my biggest expenses"
- "Who owes me money?"
- "What bills are due soon?"
- "Help me with a contract"

Input Area:
- Text input
- Send button
- Microphone button (future: voice input)

Special AI Response Types:

**Transaction Summary:**
```
📊 This Month's Summary

Income:     $4,200.00
Expenses:   $2,850.00
Profit:     $1,350.00

Top expense: Software ($540)
```

**Invoice List:**
```
📄 Outstanding Invoices (3)

#001 - ABC Corp - $1,200 (overdue 5 days)
#002 - XYZ Inc - $800 (due in 3 days)
#003 - Smith Co - $450 (due in 10 days)

Total: $2,450

[View All Invoices]
```

**Bill Reminder:**
```
📋 Bills Due This Week

Electric Bill - $127.45 - Due Mon
Internet - $89.99 - Due Wed
Software Sub - $49.00 - Due Fri

Total: $266.44

[View All Bills]
```

**Quick Action:**
```
Would you like me to:
[Create Invoice] [Add Expense] [Upload Receipt]
```

## AI SYSTEM PROMPT

```typescript
const systemPrompt = `You are the Alln1 Business Assistant, an AI helper for small business owners.

## Your Personality
- Friendly, supportive, and encouraging
- Speak in plain English, never accounting jargon
- Be concise but thorough when needed
- Celebrate wins ("Nice! Your income is up 20%!")
- Gently flag concerns ("Heads up - you have an overdue invoice")
- If you don't have data, say so honestly

## User's Business Context
Business: ${profile.business_name}
Type: ${profile.business_type}
Entity: ${profile.entity_type}

## Current Financial Snapshot
This Month:
- Income: $${stats.income}
- Expenses: $${stats.expenses}
- Profit: $${stats.profit}

Outstanding:
- Unpaid Invoices: ${invoiceCount} ($${invoiceTotal})
- Upcoming Bills: ${billCount} ($${billTotal})

## Recent Activity
${recentTransactions.map(t => `- ${t.date}: ${t.vendor} $${t.amount} (${t.category})`).join('\n')}

## What You Can Do
- Answer questions about their finances
- Explain transactions and trends
- Give tax deduction advice (general, not legal)
- Help with invoicing and bills
- Generate documents (contracts, NDAs)
- Provide business tips
- Compare time periods
- Find specific transactions

## What You Can't Do
- Give specific legal or tax advice (recommend professionals)
- Access external bank accounts in real-time
- Make actual payments
- File taxes

## Response Format
- Keep responses concise (under 200 words usually)
- Use emojis sparingly for friendliness
- Format numbers nicely ($1,234.56)
- Use bullet points for lists
- Include actionable suggestions when relevant

Always be helpful and positive about their business journey!`;
```

## AI-POWERED FEATURES

### 1. Smart Dashboard Insights
Generate 1-3 daily insights:
- "Your income is up 15% from last month! 🎉"
- "You have 3 bills due this week ($340 total)"
- "Tip: That Adobe subscription might be tax deductible"
- "Client ABC hasn't paid Invoice #001 (12 days overdue)"

### 2. Intelligent Expense Categorization
When user types "Uber to client meeting":
- Extract: Uber, category: Travel (business transportation)
- If "lunch with Sarah to discuss project": Meals (50% deductible)
- Learn from corrections over time

### 3. Receipt Scanner with AI
```typescript
export async function processReceipt(imageBase64: string): Promise<{
  vendor: string;
  amount: number;
  date: string;
  items: string[];
  category: string;
}> {
  // Send to GPT-4o with vision
  // Extract all receipt details
  // Suggest category
}
```

### 4. Smart Invoice Suggestions
When creating invoice:
- Suggest line items based on past invoices to same customer
- Suggest due date based on customer's payment history
- Alert if customer has overdue invoices

### 5. Bill Predictions
- Track recurring bills
- Predict next bill amount based on history
- Alert for unusual amounts

### 6. Tax Preparation Helper
Chat command: "Help me with taxes" →
- Summarize deductible expenses by category
- Identify potential missing deductions
- Export tax-ready report
- Remind of deadlines (quarterly estimates, etc.)

### 7. Document AI

**Contract Generator:**
User: "I need an NDA for a freelancer"
AI: Asks clarifying questions, generates customized NDA

**Contract Review:**
Upload any contract → AI summarizes key terms, flags concerns

### 8. Voice Input (Future)
- Tap microphone
- "Add expense forty-seven dollars at Staples for ink"
- Processes and confirms

## MORE TAB FEATURES (app/(tabs)/more.tsx)

Settings sections:

**Business Profile**
- Edit business info (name, address, EIN, etc.)
- Logo upload
- Invoice customization

**Bank & Accounts**
- Bank accounts list
- Add bank account
- Connect bank (Plaid - coming soon)
- Bank reconciliation

**Team (Future)**
- Invite team members
- Manage permissions

**Customers & Vendors**
- Customer list
- Vendor list
- Import contacts

**Compliance**
- Compliance calendar
- Add compliance item
- Mark items complete

**Mileage Tracking**
- Mileage log
- Add trip
- IRS rate info

**Reports**
- Profit & Loss
- Expense by category
- Income by customer
- Tax summary

**Data**
- Export all data (CSV)
- Import data
- Backup status

**App Settings**
- Notifications
- Theme (dark/light)
- Currency

**Support**
- Help center
- Contact support
- Feature requests

**Account**
- Change password
- Sign out
- Delete account

## COMPLIANCE CALENDAR

Screen showing:
- Monthly calendar view
- Colored dots for compliance items
- List view below:
  - Quarterly Tax Payment - Due Apr 15
  - Business License Renewal - Due Jun 30
  - Insurance Renewal - Due Sep 1

Add Compliance Item:
- Name
- Category (Tax, License, Insurance, Legal, HR)
- Due date
- Recurrence
- Reminder days
- Notes
- Link document

## MILEAGE TRACKING

Mileage Log:
- List of trips
- Each shows: date, purpose, miles, deduction amount

Add Trip:
- Date
- Start location
- End location (or round trip toggle)
- Purpose/Business reason
- Miles driven
- Auto-calculate deduction (miles × IRS rate)
- Link to customer (optional)

Summary card:
- YTD Miles: 2,340
- YTD Deduction: $1,567.80
- IRS Rate: $0.67/mile

## HOOKS

### useChat.ts
```typescript
export function useChat() {
  // Fetch chat history
  // Send message mutation
  // Get AI response
  // Save to database
}
```

### useInsights.ts
```typescript
export function useDashboardInsights() {
  // Generate/fetch daily insights
}
```

### useCompliance.ts
```typescript
export function useComplianceItems()
export function useCreateComplianceItem()
export function useCompleteComplianceItem()
export function useUpcomingCompliance()
```

### useMileage.ts
```typescript
export function useMileageLog()
export function useCreateMileageEntry()
export function useMileageStats()
```

## DELIVERABLES
After Phase 4:
- Full AI chat assistant with business context
- Smart insights on dashboard
- AI-powered receipt scanning
- Intelligent categorization learning
- Document generation (NDA, contracts)
- Compliance calendar
- Mileage tracking
- All settings and preferences
- Data export
```

---

# CURSOR PROMPT - PHASE 5: POLISH & LAUNCH
## Final Polish and App Store Submission

```
# ALLN1 BUSINESS - PHASE 5: POLISH & LAUNCH

Final polish, optimization, and app store submission.

## LOADING STATES

Add skeleton loaders to:
- Dashboard stats
- Transaction list
- Invoice list
- Bill list
- Chat messages
- Document list

Add spinners to:
- Form submissions
- AI processing
- File uploads
- PDF generation

## EMPTY STATES

Create friendly empty states with illustrations:
- No transactions: "Add your first expense"
- No invoices: "Create your first invoice"
- No bills: "Track your first bill"
- No customers: "Add your first customer"
- No documents: "Upload your first document"
- No chat history: [Show suggested questions]

## ERROR HANDLING

Global error boundary with:
- Friendly error message
- "Try Again" button
- "Contact Support" link

Form validation:
- Inline errors
- Field highlighting
- Scroll to first error

Network errors:
- "No internet connection"
- Retry button
- Offline mode indicator

## ANIMATIONS

Add smooth animations:
- Screen transitions (shared element where possible)
- List item animations (fade in on load)
- Button press feedback (scale)
- Pull to refresh
- FAB expansion
- Modal open/close
- Tab switches
- Loading skeletons shimmer

Use react-native-reanimated for:
- Gesture-based interactions
- Complex transitions
- Performance

## HAPTICS

Add haptic feedback for:
- Button presses (light)
- Form submission (success: medium, error: heavy)
- Transaction saved (success)
- Invoice sent (success)
- Receipt captured (light)
- Pull to refresh (light)
- Delete confirmation (warning)

## ACCESSIBILITY

- All buttons have accessibilityLabel
- Images have alt text
- Sufficient color contrast (4.5:1 minimum)
- Touch targets minimum 44x44
- Screen reader support
- Support for large text
- Reduce motion option

## PERFORMANCE OPTIMIZATION

- Use FlashList for long lists (transactions, etc.)
- Image optimization (resize, compress)
- Lazy load screens
- Memoize expensive components
- Optimize re-renders
- Bundle size analysis

## OFFLINE SUPPORT (Basic)

- Cache recent data
- Queue actions when offline
- Sync when back online
- Show offline indicator

## PUSH NOTIFICATIONS (Setup)

Configure expo-notifications:
- Bill due reminders
- Invoice paid
- Overdue alerts
- Compliance deadlines

## APP CONFIGURATION

### app.json
```json
{
  "expo": {
    "name": "Alln1 Business",
    "slug": "alln1-business",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/images/icon.png",
    "scheme": "alln1",
    "userInterfaceStyle": "automatic",
    "splash": {
      "image": "./assets/images/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#0F172A"
    },
    "assetBundlePatterns": ["**/*"],
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.alln1.business",
      "buildNumber": "1",
      "infoPlist": {
        "NSCameraUsageDescription": "Alln1 needs camera access to scan receipts and documents",
        "NSPhotoLibraryUsageDescription": "Alln1 needs photo access to upload receipts and documents"
      }
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/images/adaptive-icon.png",
        "backgroundColor": "#0F172A"
      },
      "package": "com.alln1.business",
      "versionCode": 1,
      "permissions": ["CAMERA", "READ_EXTERNAL_STORAGE"]
    },
    "plugins": [
      "expo-router",
      "expo-camera",
      "expo-document-picker",
      "expo-image-picker",
      "expo-secure-store"
    ],
    "experiments": {
      "typedRoutes": true
    }
  }
}
```

### eas.json
```json
{
  "cli": {
    "version": ">= 5.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "ios": {
        "simulator": false
      }
    },
    "production": {
      "autoIncrement": true
    }
  },
  "submit": {
    "production": {}
  }
}
```

## BUILD & SUBMIT

### iOS

1. Configure EAS:
```bash
eas login
eas build:configure
```

2. Create app icons and splash:
- icon.png (1024x1024)
- adaptive-icon.png (1024x1024)
- splash.png (1284x2778)

3. Build for iOS:
```bash
eas build --platform ios --profile production
```

4. Submit to App Store:
```bash
eas submit --platform ios --latest
```

5. In App Store Connect:
- Add app description
- Add screenshots (6.7", 6.5", 5.5")
- Add keywords
- Set pricing (free)
- Submit for review

### Android

1. Build for Android:
```bash
eas build --platform android --profile production
```

2. Submit to Play Store:
```bash
eas submit --platform android --latest
```

3. In Play Console:
- Add store listing
- Add screenshots
- Set content rating
- Submit for review

## TESTING CHECKLIST

- [ ] Auth flow (signup, login, logout, password reset)
- [ ] Onboarding completion
- [ ] Dashboard loads with data
- [ ] Add expense (natural language and form)
- [ ] Add income
- [ ] Scan receipt
- [ ] Upload bank statement
- [ ] Transaction list, filter, search
- [ ] Edit/delete transaction
- [ ] Create invoice
- [ ] Send invoice
- [ ] Record payment
- [ ] Add bill
- [ ] Mark bill paid
- [ ] AI chat responds correctly
- [ ] Create document from template
- [ ] Customer CRUD
- [ ] Vendor CRUD
- [ ] Settings all work
- [ ] Sign out
- [ ] No console errors
- [ ] No crashes
- [ ] Offline behavior
- [ ] Deep links work

## FINAL DELIVERABLES

- Polished, production-ready app
- iOS TestFlight build
- Android APK/AAB
- App Store submission
- Play Store submission
- Marketing screenshots
```

---

# QUICK REFERENCE

## Tech Stack Summary
- **Frontend:** React Native, Expo SDK 52, TypeScript
- **Styling:** NativeWind (Tailwind)
- **Navigation:** Expo Router
- **Backend:** Supabase (Auth, Database, Storage)
- **AI:** OpenAI GPT-4o / GPT-4o-mini
- **Build:** EAS Build

## Key Commands
```bash
# Development
npx expo start

# Build iOS
eas build --platform ios

# Build Android
eas build --platform android

# Submit iOS
eas submit --platform ios

# Submit Android
eas submit --platform android
```

## Supabase Dashboard
- Project URL: [Your Supabase URL]
- Database: PostgreSQL
- Auth: Email/Password, Google
- Storage: receipts, statements, documents buckets

## OpenAI Models
- GPT-4o-mini: Fast, cheap - use for categorization, parsing
- GPT-4o: Powerful - use for chat, complex analysis, document generation

---

*This document is your complete blueprint. Each phase prompt is self-contained and can be given to Cursor or any AI to build that portion of the app.*

**Version:** 2.0
**Last Updated:** February 11, 2026
**Created for:** Elizabeth Martinez
