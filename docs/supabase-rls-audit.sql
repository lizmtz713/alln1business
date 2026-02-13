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
