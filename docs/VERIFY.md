# Alln1 Business — Verification Checklist

Use this checklist to verify the app works end-to-end before release or demo.

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
