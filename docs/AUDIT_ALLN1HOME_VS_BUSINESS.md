# Codebase Audit: Alln1Home (Household) vs Business

**Purpose:** Categorize every file, screen, service, component, and database table as **HOUSEHOLD** (belongs in Alln1Home), **BUSINESS** (does not belong; remove for household app), or **SHARED** (works for both).  
**No deletions** — use this to decide what to keep or remove.

**Scope:** Main app only (`app/`, `src/`, `docs/*.sql`). Excludes legacy nested apps (e.g. former lifeos-app, now removed), `components/` (Expo template), and other non-app folders.

---

## Master file list by category (quick reference)

**HOUSEHOLD**  
`app/(modals)/add-bill.tsx` · `app/(modals)/edit-bill/[id].tsx` · `app/bill/[id].tsx` · `app/(modals)/upload-document.tsx` · `app/(modals)/edit-document/[id].tsx` · `app/document/[id].tsx` · `app/(tabs)/documents.tsx` (documents part)  
`src/hooks/useBills.ts` · `src/hooks/useDocuments.ts`  
`src/types/bills.ts` · `src/types/documents.ts`  
`src/services/storage.ts` · `src/services/pdf.ts` (generic) · `src/services/documentsIndexExport.ts`  
SQL: `supabase-bills-schema` · `supabase-documents-schema` · `supabase-receipts-schema` · `supabase-storage-documents` · `supabase-storage-receipts` · `supabase-pdf-migration` · `supabase-documents-templates-migration`

**BUSINESS**  
Screens: `add-customer` · `edit-customer/[id]` · `customers` · `add-vendor` · `edit-vendor/[id]` · `vendors` · `create-invoice` · `edit-invoice/[id]` · `invoice/[id]` · `add-bank-account` · `reconciliation` · `upload-statement` · `taxes` · `estimates` · `year-end` · `compliance` · `rules` · `templates` · `use-template/[id]` · `ai-draft`  
Hooks: `useCustomers` · `useVendors` · `useInvoices` · `useBankAccounts` · `useBankStatements` · `useReconciliation` · `useUploadStatement` · `useQuarterlyEstimates` · `useTaxSummary` · `useYearEndPackage` · `useCompliance`  
Types: `contacts` · `invoices` · `tax` · `banking`  
Services: `export` · `taxReportPdf` · `tax` · `quarterlyEstimates` · `insights` (business context) · `lib/templates` (W9)  
SQL: `supabase-customers-vendors-schema` · `supabase-invoices-schema` · `supabase-bank-reconciliation-schema` · `supabase-tax-settings-schema` · `supabase-quarterly-estimates-schema`

**SHARED**  
Screens: `index` · `_layout` · auth (`login` · `signup` · `forgot-password` · `reset-password` · `intro` · `onboarding` · `google-auth`) · tabs (`index` · `transactions` · `documents` tab shell · `more` · `chat`) · modals (`add-expense` · `add-income` · `transaction/[id]` · `scan-receipt`) · `settings` · `change-password` · `status` · `error` · `+not-found` · `+html`  
Hooks: `useTransactions` · `useGlobalSearch` · `useInsights` · `useCategoryRules` · `useChat` · `useDocumentTemplates` · `useNetworkStatus`  
Types: `transactions` · `categoryRules`  
Components: `AppErrorBoundary` · `GoogleSignInButton` · `OfflineBanner` · `LearnCategoryPrompt` · `ui/*`  
Providers: `AuthProvider` · `ThemeProvider` · `QueryProvider` · `AuthErrorHandler`  
Services: `supabase` · `env` · `configGuard` · `openai` · `aiContext` · `parser` · `notificationSchedule` · `rules`  
Lib: `constants` · `errors` · `haptics` · `sanitize` · `categories`  
SQL: `supabase-profiles-schema` · `supabase-profiles-onboarding-challenge-migration` · `supabase-transactions-schema` · `supabase-chat-schema` · `supabase-insights-schema` · `supabase-category-rules-schema` · `supabase-rls-audit`

---

## Category definitions

| Category | Meaning |
|----------|--------|
| **HOUSEHOLD** | Belongs in Alln1Home: bills, documents, household contacts, vehicles, pets, insurance, medical, appointments, home services. |
| **BUSINESS** | Does NOT belong in a household app: invoices, vendors, W9s, bank reconciliation, tax reports, quarterly estimates, customers as business clients. |
| **SHARED** | Works for both: auth, navigation, dashboard, settings, UI components, providers, generic transactions/receipts. |

---

# 1. HOUSEHOLD

*Belongs in Alln1Home. Keep or adapt for household use.*

## 1.1 Screens / Routes (app/)

| File | Notes |
|------|--------|
| `app/(modals)/add-bill.tsx` | Add bill — household bills (utilities, etc.). *Current impl ties to vendors; can be refactored to household payees.* |
| `app/(modals)/edit-bill/[id].tsx` | Edit bill. |
| `app/bill/[id].tsx` | Bill detail. |
| `app/(modals)/upload-document.tsx` | Upload document — document vault. |
| `app/(modals)/edit-document/[id].tsx` | Edit document. |
| `app/document/[id].tsx` | Document detail. |
| `app/(tabs)/documents.tsx` | Documents tab — lists invoices, bills, documents. *Keep documents section; invoices/bills segments are mixed (see BUSINESS).* |

## 1.2 Hooks (src/hooks/)

| File | Notes |
|------|--------|
| `src/hooks/useBills.ts` | Bills CRUD + stats. Household bills. |
| `src/hooks/useDocuments.ts` | Documents CRUD, upload, templates. Document vault. |

## 1.3 Types (src/types/)

| File | Notes |
|------|--------|
| `src/types/bills.ts` | Bill types. |
| `src/types/documents.ts` | Document types. *Some doc_type values (e.g. w9, invoice) are business-oriented; enum can be extended for household.* |

## 1.4 Services (src/services/)

| File | Notes |
|------|--------|
| `src/services/storage.ts` | Upload to Supabase Storage (documents, receipts buckets). Shared storage layer. |
| `src/services/pdf.ts` | PDF generation. *Used for invoice PDF (business) and text-doc PDF (household); split or keep generic.* |
| `src/services/documentsIndexExport.ts` | Export documents index (e.g. CSV). Can serve household doc list export. |

## 1.5 Database tables (docs/*.sql)

| Table | Schema file | Notes |
|-------|-------------|--------|
| `public.bills` | supabase-bills-schema.sql | Household bills. *Current schema has vendor_id, provider_*; can simplify for household.* |
| `public.documents` | supabase-documents-schema.sql | Document vault. |
| `public.receipts` | supabase-receipts-schema.sql | Receipt scans. Household receipts. |

## 1.6 Docs (SQL)

| File | Notes |
|------|--------|
| docs/supabase-bills-schema.sql | Bills table. |
| docs/supabase-documents-schema.sql | Documents table. |
| docs/supabase-receipts-schema.sql | Receipts table. |
| docs/supabase-storage-documents.sql | Storage policies for documents bucket. |
| docs/supabase-storage-receipts.sql | Storage policies for receipts bucket. |
| docs/supabase-pdf-migration.sql | pdf_url / txt_file_url on invoices & documents — documents part is household. |
| docs/supabase-documents-templates-migration.sql | content_text, template_id, generated_by_ai on documents. |

---

# 2. BUSINESS

*Does NOT belong in Alln1Home. Remove or replace for household app.*

## 2.1 Screens / Routes (app/)

| File | Notes |
|------|--------|
| `app/(modals)/add-customer.tsx` | Add customer (business client). |
| `app/(modals)/edit-customer/[id].tsx` | Edit customer. |
| `app/customers.tsx` | Customers list screen. |
| `app/(modals)/add-vendor.tsx` | Add vendor (W9, payment method, etc.). |
| `app/(modals)/edit-vendor/[id].tsx` | Edit vendor. |
| `app/vendors.tsx` | Vendors list screen. |
| `app/(modals)/create-invoice.tsx` | Create invoice. |
| `app/(modals)/edit-invoice/[id].tsx` | Edit invoice. |
| `app/invoice/[id].tsx` | Invoice detail (status, record payment, cancel). |
| `app/(modals)/add-bank-account.tsx` | Bank account (used for reconciliation). |
| `app/reconciliation.tsx` | Bank reconciliation. |
| `app/(modals)/upload-statement.tsx` | Upload bank statement (reconciliation). |
| `app/taxes.tsx` | Tax prep / tax summary. |
| `app/estimates.tsx` | Quarterly tax estimates. |
| `app/year-end.tsx` | Year-end tax package. |
| `app/compliance.tsx` | Tax compliance calendar / reminders. |
| `app/rules.tsx` | Categorization rules. *Feature is SHARED; screen is generic. Current copy/rules are business-oriented.* |
| `app/templates.tsx` | Document templates list. *Templates include W9 request, invoice; business-focused.* |
| `app/(modals)/use-template/[id].tsx` | Use template (AI draft). *W9/invoice templates = business.* |
| `app/(modals)/ai-draft.tsx` | AI draft document. *Tied to business templates.* |

## 2.2 Hooks (src/hooks/)

| File | Notes |
|------|--------|
| `src/hooks/useCustomers.ts` | Customers CRUD (business clients). |
| `src/hooks/useVendors.ts` | Vendors CRUD (business vendors). |
| `src/hooks/useInvoices.ts` | Invoices + invoice_items CRUD, stats, record payment. |
| `src/hooks/useBankAccounts.ts` | Bank accounts (reconciliation context). |
| `src/hooks/useBankStatements.ts` | Bank statements. |
| `src/hooks/useReconciliation.ts` | Reconciliation (match transactions to statement). |
| `src/hooks/useUploadStatement.ts` | Upload and parse statement, create transactions. |
| `src/hooks/useQuarterlyEstimates.ts` | Tax settings + estimated tax payments. |
| `src/hooks/useTaxSummary.ts` | Tax summary (transactions by period, deductible, etc.). |
| `src/hooks/useYearEndPackage.ts` | Year-end package (tax CSV, tax PDF, documents index). |
| `src/hooks/useCompliance.ts` | Compliance items (tax deadlines, quarterly reminders). |

## 2.3 Types (src/types/)

| File | Notes |
|------|--------|
| `src/types/contacts.ts` | Customer + Vendor types (business contacts). |
| `src/types/invoices.ts` | Invoice, InvoiceItem, status, etc. |
| `src/types/tax.ts` | TaxSummary, TaxPeriod, TaxCategorySummary (tax reporting). |
| `src/types/banking.ts` | BankAccount, BankStatement (reconciliation). |

## 2.4 Services (src/services/)

| File | Notes |
|------|--------|
| `src/services/export.ts` | Export tax CSV, export all transactions CSV. *Tax/transaction export = business.* |
| `src/services/taxReportPdf.ts` | Tax summary PDF. |
| `src/services/tax.ts` | computeTaxSummary, getDefaultPeriods (tax reporting). |
| `src/services/quarterlyEstimates.ts` | Quarterly estimate calculations. |
| `src/services/insights.ts` | Dashboard insights. *References estimated_tax_payments, business context; can be refactored for household insights.* |
| `src/lib/templates.ts` | Prompt templates for AI; includes W9 request letter. Business-oriented. |

## 2.5 Database tables (docs/*.sql)

| Table | Schema file | Notes |
|-------|-------------|--------|
| `public.customers` | supabase-customers-vendors-schema.sql | Business clients. |
| `public.vendors` | supabase-customers-vendors-schema.sql | Business vendors. |
| `public.invoices` | supabase-invoices-schema.sql | Invoices. |
| `public.invoice_items` | supabase-invoices-schema.sql | Invoice line items. |
| `public.bank_accounts` | supabase-bank-reconciliation-schema.sql | Used for reconciliation. |
| `public.bank_statements` | supabase-bank-reconciliation-schema.sql | Bank reconciliation. |
| `public.tax_settings` | supabase-tax-settings-schema.sql, supabase-quarterly-estimates-schema.sql | Tax year, rates, etc. |
| `public.estimated_tax_payments` | supabase-quarterly-estimates-schema.sql | Quarterly tax payments. |
| `public.compliance_items` | supabase-quarterly-estimates-schema.sql | Tax compliance reminders. |

## 2.6 Docs (SQL)

| File | Notes |
|------|--------|
| docs/supabase-customers-vendors-schema.sql | customers + vendors tables. |
| docs/supabase-invoices-schema.sql | invoices + invoice_items. |
| docs/supabase-bank-reconciliation-schema.sql | bank_accounts, bank_statements, transaction columns. |
| docs/supabase-tax-settings-schema.sql | tax_settings. |
| docs/supabase-quarterly-estimates-schema.sql | tax_settings extensions, estimated_tax_payments, compliance_items. |

---

# 3. SHARED

*Works for both household and business. Keep.*

## 3.1 Screens / Routes (app/)

| File | Notes |
|------|--------|
| `app/index.tsx` | Root redirect (auth / onboarding / tabs). |
| `app/_layout.tsx` | Root layout, Stack routes. |
| `app/(auth)/_layout.tsx` | Auth stack. |
| `app/(auth)/login.tsx` | Login. |
| `app/(auth)/signup.tsx` | Sign up. |
| `app/(auth)/forgot-password.tsx` | Forgot password. |
| `app/(auth)/reset-password.tsx` | Reset password. |
| `app/(auth)/intro.tsx` | Intro onboarding (3 value screens). |
| `app/(auth)/onboarding.tsx` | Post-signup onboarding (profile/business details). *Copy is business-oriented; flow is SHARED.* |
| `app/(auth)/google-auth.tsx` | Google OAuth callback. |
| `app/(tabs)/_layout.tsx` | Tabs layout. |
| `app/(tabs)/index.tsx` | Home / dashboard (insights, search, quick links). |
| `app/(tabs)/transactions.tsx` | Transactions list (income/expense). |
| `app/(tabs)/more.tsx` | More menu (Settings, Change password, links to Customers/Vendors/Bank/Reports/Sign out). *Remove business links; keep Settings, Change password, Sign out.* |
| `app/(tabs)/chat.tsx` | Chat assistant. |
| `app/(modals)/_layout.tsx` | Modals stack. |
| `app/(modals)/add-expense.tsx` | Add expense transaction. |
| `app/(modals)/add-income.tsx` | Add income transaction. |
| `app/(modals)/transaction/[id].tsx` | Edit transaction. |
| `app/(modals)/scan-receipt.tsx` | Scan receipt, create transaction. |
| `app/settings.tsx` | Settings (profile, notifications, theme, export, sign out, version). |
| `app/change-password.tsx` | Change password. |
| `app/status.tsx` | System status. |
| `app/error.tsx` | Error boundary fallback. |
| `app/+not-found.tsx` | 404. |
| `app/+html.tsx` | Web HTML shell. |

## 3.2 Hooks (src/hooks/)

| File | Notes |
|------|--------|
| `src/hooks/useTransactions.ts` | Transactions CRUD. Income/expense works for household. |
| `src/hooks/useGlobalSearch.ts` | Global search (bills, customers, vendors, documents). *Remove customers/vendors for household; keep bills + documents (and optionally transactions).* |
| `src/hooks/useInsights.ts` | Dashboard insights (read/dismiss). |
| `src/hooks/useCategoryRules.ts` | Category rules (learn categorization). |
| `src/hooks/useChat.ts` | Chat messages. |
| `src/hooks/useDocumentTemplates.ts` | Document templates (list, use). *Templates content is business; hook is generic.* |
| `src/hooks/useNetworkStatus.ts` | Offline detection. |

## 3.3 Types (src/types/)

| File | Notes |
|------|--------|
| `src/types/transactions.ts` | Transaction type. |
| `src/types/categoryRules.ts` | Category rule type. |

## 3.4 Components (src/components/)

| File | Notes |
|------|--------|
| `src/components/AppErrorBoundary.tsx` | Error boundary. |
| `src/components/GoogleSignInButton.tsx` | Google sign-in. |
| `src/components/OfflineBanner.tsx` | Offline banner. |
| `src/components/LearnCategoryPrompt.tsx` | “Remember this category” prompt. |
| `src/components/ui/Button.tsx` | Button. |
| `src/components/ui/Card.tsx` | Card. |
| `src/components/ui/Input.tsx` | Input. |
| `src/components/ui/SectionHeader.tsx` | Section header. |
| `src/components/ui/EmptyState.tsx` | Empty state. |
| `src/components/ui/Skeleton.tsx` | Skeleton loader. |
| `src/components/ui/ErrorState.tsx` | Error state. |
| `src/components/ui/ScreenFadeIn.tsx` | Fade-in animation. |
| `src/components/ui/Toast.tsx` | Toast + provider. |
| `src/components/ui/index.ts` | UI barrel. |

*Duplicate/legacy: `GoogleSignInButton 3.tsx`, `GoogleSignInButton 4.tsx` — treat as SHARED; consider removing duplicates.*

## 3.5 Providers (src/providers/)

| File | Notes |
|------|--------|
| `src/providers/AuthProvider.tsx` | Auth, session, profile, sign in/out, update profile. |
| `src/providers/ThemeProvider.tsx` | Theme (light/dark/system). |
| `src/providers/QueryProvider.tsx` | React Query. |
| `src/providers/AuthErrorHandler.tsx` | Auth error handling / redirect. |

## 3.6 Services (src/services/)

| File | Notes |
|------|--------|
| `src/services/supabase.ts` | Supabase client. |
| `src/services/env.ts` | Env flags (hasSupabaseEnv, etc.). |
| `src/services/configGuard.ts` | Config guard (Supabase, OpenAI). |
| `src/services/openai.ts` | OpenAI (e.g. CPA notes). *Usage can be household or business.* |
| `src/services/aiContext.ts` | AI context builder (profiles, transactions, invoices, bills, documents). *Remove business entities for household.* |
| `src/services/parser.ts` | CSV/statement parser. *Used for bank statement upload; if household has no reconciliation, could still use for import.* |
| `src/services/notificationSchedule.ts` | Notifications (bill reminders, compliance). *Keep bill reminders; drop tax compliance for household.* |
| `src/services/rules.ts` | Category rules service. |

## 3.7 Lib (src/lib/)

| File | Notes |
|------|--------|
| `src/lib/constants.ts` | Colors, spacing, MIN_TOUCH_TARGET. |
| `src/lib/errors.ts` | normalizeError. |
| `src/lib/haptics.ts` | Haptic feedback. |
| `src/lib/sanitize.ts` | Input sanitization. |
| `src/lib/categories.ts` | EXPENSE_CATEGORIES, INCOME_CATEGORIES, getCategoryName. *Mix of household (utilities, insurance, vehicle) and business (payroll, marketing); can be adapted.* |

## 3.8 Database tables (docs/*.sql)

| Table | Schema file | Notes |
|-------|-------------|--------|
| `public.profiles` | supabase-profiles-schema.sql | User profile (auth). |
| `public.transactions` | supabase-transactions-schema.sql | Income/expense transactions. |
| `public.chat_messages` | supabase-chat-schema.sql | Chat. |
| `public.dashboard_insights` | supabase-insights-schema.sql | Dashboard insights. |
| `public.category_rules` | supabase-category-rules-schema.sql | Categorization rules. |

## 3.9 Docs (SQL)

| File | Notes |
|------|--------|
| docs/supabase-profiles-schema.sql | Profiles + trigger. |
| docs/supabase-profiles-onboarding-challenge-migration.sql | onboarding_challenge column. |
| docs/supabase-transactions-schema.sql | Transactions table. |
| docs/supabase-chat-schema.sql | chat_messages. |
| docs/supabase-insights-schema.sql | dashboard_insights. |
| docs/supabase-category-rules-schema.sql | category_rules. |
| docs/supabase-rls-audit.sql | RLS for all tables. *Run after tables; some tables will be removed for household.* |

---

# 4. Root / config (SHARED)

| File | Notes |
|------|--------|
| app.json | App config. |
| global.css | Styles. |
| tsconfig.json, nativewind-env.d.ts, expo-env.d.ts | Config / types. |

---

# 5. Summary counts

| Category | Screens | Hooks | Types | Services | Components | Providers | Lib | DB tables | SQL files |
|----------|---------|-------|-------|----------|------------|-----------|-----|-----------|-----------|
| **HOUSEHOLD** | 7 | 2 | 2 | 3* | 0 | 0 | 0 | 3 | 7* |
| **BUSINESS** | 20 | 11 | 4 | 5 | 0 | 0 | 1 | 9 | 5 |
| **SHARED** | 28 | 7 | 2 | 8 | 14 | 4 | 5 | 5 | 7 |

*Documents/storage/pdf/templates overlap with business; counted where primary use is household.*

---

# 6. Recommended next steps (no deletions in this doc)

1. **Remove or stub BUSINESS**  
   Delete or hide routes/screens, hooks, types, and services listed in §2. Remove or avoid creating BUSINESS tables in new environments.

2. **Adapt SHARED for household**  
   - `(tabs)/more.tsx`: Remove Customers, Vendors, Bank Accounts, Tax Prep, Year-End, Quarterly Estimates, Compliance, Rules (or replace with household equivalents).  
   - `(tabs)/documents.tsx`: Drop Invoices segment; keep Bills + Documents (and optionally “Contracts”/“Forms” as household).  
   - `useGlobalSearch.ts`: Drop customers/vendors; keep bills, documents (and optionally transactions).  
   - `onboarding.tsx`: Change copy from business to household.  
   - `aiContext.ts`: Remove invoices, vendors, customers from context for household.  
   - `lib/categories.ts`: Add household categories; remove or soften business-only ones.

3. **Keep HOUSEHOLD + SHARED**  
   Bills, documents, receipts, transactions, dashboard, chat, settings, auth, and all SHARED UI/providers stay; tune for household only where needed.

4. **Database**  
   For a household-only deploy: run only profiles, transactions, bills, documents, receipts, chat_messages, dashboard_insights, category_rules (and storage policies for documents/receipts). Omit customers, vendors, invoices, invoice_items, bank_accounts, bank_statements, tax_settings, estimated_tax_payments, compliance_items.

This audit is **reference only**; no code or assets were deleted.
