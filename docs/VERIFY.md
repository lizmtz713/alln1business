# Alln1 Business — Verification Checklist

Use this checklist to verify the app works end-to-end before release or demo.

## Production Usability (iPhone / Expo Go)

### Onboarding
- [ ] Challenge screen: tap options show selected state (blue border, checkmark)
- [ ] "Let's Get Started" proceeds and completes onboarding
- [ ] Keyboard dismisses on tap outside, KeyboardAvoidingView works

### Add Expense / Add Income
- [ ] Modal opens from Transactions FAB
- [ ] Form saves successfully with toast "Saved"
- [ ] Keyboard dismisses on tap, Save button visible
- [ ] Receipt upload: permissions requested, toast on failure
- [ ] Never freezes; errors show in toast

### Receipt Scan
- [ ] Take Photo / Choose Library: permissions requested, toast on deny
- [ ] Upload to receipts bucket works (run docs/supabase-storage-receipts.sql if needed)
- [ ] Clear toast if bucket/policy missing
- [ ] Review step saves transaction

### Navigation
- [ ] Back button below notch (SafeAreaView)
- [ ] Swipe-from-left gesture goes back on modals
- [ ] Transactions: "All Types" / "All Status" filters (no duplicate "All" labels)

### Documents
- [ ] Document detail: Open PDF/File with guards, toast on failure
- [ ] Share PDF button opens share sheet (expo-sharing)
- [ ] Generate PDF: error handling, toast on failure

### Invoices
- [ ] Invoice PDF: Generate, Open, Share PDF
- [ ] Share PDF opens share sheet

## Auth Flow
- [ ] Sign up creates account
- [ ] Login works with correct credentials
- [ ] Logout clears session
- [ ] Protected routes redirect to login when unauthenticated

## Transactions CRUD
- [ ] Add expense saves and appears in list
- [ ] Add income saves and appears in list
- [ ] Edit transaction updates correctly
- [ ] Delete transaction removes from list
- [ ] Toast shows on save/delete
- [ ] Haptic feedback on success

## Statement Import
- [ ] Upload bank statement parses transactions
- [ ] Transactions appear after import
- [ ] Duplicate detection works (if applicable)

## Reconciliation
- [ ] Bank reconciliation screen loads
- [ ] Mark items reconciled
- [ ] Reconciliation summary accurate

## Customers / Vendors CRUD
- [ ] Add customer saves
- [ ] Edit customer updates
- [ ] Delete customer removes
- [ ] Add vendor saves
- [ ] Edit vendor updates
- [ ] Delete vendor removes

## Invoices / Bills / Documents / Templates
- [ ] Create invoice works
- [ ] Send invoice (email/link)
- [ ] Record payment updates status
- [ ] Add bill works
- [ ] Mark bill paid
- [ ] Upload document
- [ ] Edit document
- [ ] Use template generates draft
- [ ] AI draft generates content (when key present)

## Receipt Scan
- [ ] Camera opens for receipt scan
- [ ] Receipt data extracted (when OpenAI key present)
- [ ] Creates transaction from receipt

## Taxes Export
- [ ] Tax Prep screen loads YTD
- [ ] Period selector works
- [ ] Export CSV creates file
- [ ] Share opens share sheet

## Year-End Package
- [ ] Year-End screen loads
- [ ] Generate Package creates 3 files (Tax CSV, PDF, Documents Index)
- [ ] Share Package opens share sheet
- [ ] PDF preview opens

## Offline Mode
- [ ] Offline banner shows when disconnected
- [ ] Cached lists still viewable
- [ ] Create/update disabled with toast when offline

## Polish
- [ ] No redbox errors
- [ ] No fatal console warnings
- [ ] Skeleton loaders show while fetching
- [ ] Empty states show with CTAs where appropriate
- [ ] Modals have Cancel/Close
- [ ] Keyboard avoids inputs (KeyboardAvoidingView)

## Expo Go Limitations
- [ ] App runs in Expo Go
- [ ] Dev build guidance shown for notifications/push (if applicable)
- [ ] No silent failures when features require dev build

## Supabase Migrations / Buckets Required

- **profiles**: Run `docs/supabase-profiles-schema.sql` first.
- **profiles (optional)**: Run `docs/supabase-profiles-onboarding-challenge-migration.sql` to persist onboarding challenge.
- **receipts bucket**: Create bucket "receipts" (public), run `docs/supabase-storage-receipts.sql` for policies.
- **documents bucket**: Create bucket "documents", run `docs/supabase-storage-documents.sql` for policies.
