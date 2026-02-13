# Supabase bootstrap order

Run these in the **Supabase SQL Editor** in this order. Create storage buckets in the Dashboard (Storage) before running the bucket policy scripts.

## 1. Core (required for login and app shell)

| Order | File | Purpose |
|-------|------|--------|
| 1 | `docs/supabase-profiles-schema.sql` | Profiles table + trigger to create profile on signup. **Run first.** |
| 2 | `docs/supabase-transactions-schema.sql` | Transactions table + RLS |
| 3 | `docs/supabase-invoices-schema.sql` | Invoices + invoice_items + RLS |
| 4 | `docs/supabase-bills-schema.sql` | Bills table + RLS |
| 5 | `docs/supabase-documents-schema.sql` | Documents table + RLS |
| 6 | `docs/supabase-customers-vendors-schema.sql` | Customers + vendors tables + RLS |
| 7 | `docs/supabase-bank-reconciliation-schema.sql` | bank_accounts + bank_statements + RLS |
| 8 | `docs/supabase-receipts-schema.sql` | Receipts table + RLS |

## 2. Storage buckets

In **Supabase Dashboard → Storage**:

- Create bucket **receipts** (public).
- Create bucket **documents** (public or private; app uses public URL for documents).

Then run:

| Order | File | Purpose |
|-------|------|--------|
| 9 | `docs/supabase-storage-receipts.sql` | RLS policies for receipts bucket |
| 10 | `docs/supabase-storage-documents.sql` | RLS policies for documents bucket |

## 3. Optional features

| Order | File | Purpose |
|-------|------|--------|
| 11 | `docs/supabase-profiles-onboarding-challenge-migration.sql` | Add onboarding_challenge to profiles (optional) |
| 12 | `docs/supabase-category-rules-schema.sql` | Category rules for auto-categorization |
| 13 | `docs/supabase-insights-schema.sql` | Dashboard insights table + RLS |
| 14 | `docs/supabase-chat-schema.sql` | Chat messages for AI assistant |
| 15 | `docs/supabase-tax-settings-schema.sql` | Tax settings table + RLS |
| 16 | `docs/supabase-quarterly-estimates-schema.sql` | estimated_tax_payments, compliance_items, etc. |
| 17 | `docs/supabase-documents-templates-migration.sql` | Template-related columns on documents (if needed) |
| 18 | `docs/supabase-pdf-migration.sql` | PDF-related columns (if needed) |

## 4. Auth redirect URLs (Dashboard)

In **Authentication → URL Configuration → Redirect URLs**, add:

- Your app’s redirect URL (e.g. `alln1business://google-auth`, `alln1business://reset-password`).
- For development: Expo’s redirect (see `docs/SUPABASE_AUTH_SETUP.md`).

## Quick copy-paste order (SQL only)

1. `supabase-profiles-schema.sql`
2. `supabase-transactions-schema.sql`
3. `supabase-invoices-schema.sql`
4. `supabase-bills-schema.sql`
5. `supabase-documents-schema.sql`
6. `supabase-customers-vendors-schema.sql`
7. `supabase-bank-reconciliation-schema.sql`
8. `supabase-receipts-schema.sql`
9. Create buckets then: `supabase-storage-receipts.sql`, `supabase-storage-documents.sql`
10. Optional: remaining migrations and feature schemas as needed.

See also: **`docs/VERIFY.md`** for end-to-end verification after setup.
