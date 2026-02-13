# Production Readiness — Engineering Report

**Project:** Alln1 Business  
**Scope:** Auth, tab navigation, modals, Supabase services, data flow  
**Review type:** Senior full-stack production readiness

---

## 1. Authentication

### 1.1 Does it work as-is?

**Yes, for the main paths.**

- **Email/password sign in** — `signIn()` calls `supabase.auth.signInWithPassword`; errors surfaced; on success login screen calls `router.replace('/')`, and root `app/index.tsx` sends authenticated users to `/(tabs)` or onboarding.
- **Email/password sign up** — `signUp()` calls `supabase.auth.signUp`; validation (length, match); on success `router.replace('/')`. Works when Supabase has “Confirm email” **disabled**.
- **Google OAuth** — `signInWithGoogle()` uses `AuthSession.makeRedirectUri` + `WebBrowser.openAuthSessionAsync`, extracts tokens from callback URL, calls `setSession`. `(auth)/google-auth.tsx` handles redirect (Linking) and sets session. Works with correct Supabase redirect URLs.
- **Session persistence** — Auth uses `ExpoSecureStoreAdapter` in `supabase.ts`; sessions survive app restarts.
- **Profile loading** — After auth, `fetchProfile(userId)` loads `profiles` row; missing table yields `profileLoadError: 'profiles_table_missing'` and a clear setup screen.
- **Onboarding** — Saves `business_name`, `business_type`, `entity_type`, `onboarding_completed` (and optional `onboarding_challenge` with migration fallback). Then `refreshProfile()` and `router.replace('/(tabs)')`.
- **Password reset** — Forgot-password → `resetPasswordForEmail` with redirect; reset-password screen reads recovery tokens from URL and shows “Set new password”; `updatePassword()` then `router.replace('/')`.
- **Change password (in-app)** — Uses `updatePassword()`; shows “Sign In Required” when `!user` and offers “Go Back”.
- **Sign out** — `signOut()` clears Supabase session and local state; More screen calls `router.replace('/')` so user lands on root and is sent to login.

### 1.2 What’s broken or incomplete?

- **Email confirmation not handled**  
  When Supabase “Confirm email” is **enabled**, `signUp` can succeed without a session (user unconfirmed). The app still does `router.replace('/')`. Root index then sees `!session` and sends to login—but the user is not told to “check your email.” So the flow works only when confirmation is disabled, or users get no explanation.

- **Single gate at root only**  
  Protection is only in `app/index.tsx`. Routes like `/(tabs)`, `/(modals)/*`, `/invoice/[id]`, `/document/[id]`, etc. are **not** behind a guard. If someone deep-links to `/(tabs)` or session expires while on a tab, they can see the shell until the next navigation or data fetch. Hooks (e.g. `useTransactions`) use `user?.id` and return empty or throw, but the UI can still render.

- **No Apple Sign-In**  
  Only Google is implemented; App Store may require Apple if you offer other social sign-in.

- **Duplicate auth screens**  
  `(auth)/login 2.tsx`, `signup 2.tsx`, `forgot-password 2.tsx`, `onboarding 2.tsx`, `reset-password 2.tsx` exist next to the main ones. They are not in the `_layout` Stack, but they add noise and risk (wrong file edited, accidental routing).

### 1.3 Recommendations for production

1. **Support “confirm email”**  
   In signup, check `data.user && !data.session` (or Supabase’s equivalent). Show a “Check your email to confirm” screen and **do not** call `router.replace('/')` until the user has confirmed (or resend flow).

2. **Central auth guard**  
   In `app/(tabs)/_layout.tsx` (and optionally `(modals)/_layout.tsx`), read `session` from `useAuth()`. If `!session && hasSupabaseConfig`, call `router.replace('/')`. That way tabs/modals are safe even with deep links or expired session.

3. **Add Apple Sign-In**  
   If you ship Google OAuth on iOS, add Apple per App Store guidelines (expo-auth-session / Supabase Apple provider and redirect).

4. **Remove or ignore duplicates**  
   Delete `(auth)/* 2.tsx` (and any `* 2.ts` in `src`) or move them to a `/legacy` folder so only the canonical screens are in the auth layout.

5. **Document Supabase Auth**  
   In `docs/SUPABASE_AUTH_SETUP.md`, state: redirect URLs for Google (and Apple), and whether “Confirm email” is on or off and how the app behaves in each case.

---

## 2. Tab navigation

### 2.1 Does it work as-is?

**Yes.**

- **Expo Router** — Root `_layout.tsx` renders a Stack with `index`, `(auth)`, `(tabs)`, `(modals)`, and other routes; headers off.
- **Tabs layout** — `(tabs)/_layout.tsx` defines five tabs: Home, Transactions, Documents, Chat, More; Ionicons; dark theme (slate/blue).
- **Entry** — Root `index.tsx` redirects authenticated, onboarded users to `/(tabs)`; so in normal use users only see tabs after login + onboarding.

### 2.2 What’s broken or incomplete?

- **No in-layout auth check**  
  Tabs don’t verify `session`. Direct navigation to `/(tabs)` (e.g. deep link or state glitch) can show the tab bar and screens; data hooks will just return empty or loading.

- **More screen**  
  Uses `hasSupabaseEnv && user` to show Account / Bank accounts / Taxes, etc. When Supabase is not configured or user is missing, most of the list is hidden; no redirect.

### 2.3 Recommendations for production

1. **Guard (tabs) layout**  
   In `(tabs)/_layout.tsx`, use `useAuth()`. If `hasSupabaseConfig && !session`, `router.replace('/')` once (e.g. in a `useEffect`). Then tabs are only visible when the app has decided the user is logged in.

2. **Keep More’s conditional UI**  
   Keeping “only show sections when `user`” is fine; the layout guard above ensures in practice `user` is set when tabs are visible.

---

## 3. Modals

### 3.1 Does it work as-is?

**Yes for flows that are implemented.**

- **Layout** — `(modals)/_layout.tsx` is a Stack: `headerShown: false`, `gestureEnabled: true`, `fullScreenGestureEnabled: true`, `animation: 'slide_from_right'`. Screens include add-expense, add-income, scan-receipt, create-invoice, add-bill, upload-statement, transaction/[id], use-template/[id], etc.
- **Add expense/income** — Forms call `useCreateTransaction`; category rules; receipt upload (add-expense); toasts and haptics; redirect back or to transaction.
- **Scan receipt** — Image picker/camera, upload to storage, optional AI extraction, create transaction.
- **Create invoice / add bill** — Use `useInvoices` / `useBills`; full forms and Supabase inserts.
- **Edit modals** — e.g. `edit-invoice/[id]`, `edit-customer/[id]` load by id and `user_id` and update via hooks.
- **Modals are presented over tabs** — Pushed from tabs (e.g. Transactions FAB → add-expense); back/swipe closes.

### 3.2 What’s broken or incomplete?

- **No modal-level auth guard**  
  If a user lands on a modal route without a session (e.g. deep link), the screen renders; hooks that need `user?.id` no-op or throw. So you can see the form or a loading/error state instead of being sent to login.

- **Stale or empty state**  
  Some modals assume they’re opened from a parent that already validated auth; they don’t redirect when `!user`, they just disable submit or show toasts (“You must be signed in…”). That’s consistent but not ideal for production (better to redirect once at layout level).

### 3.3 Recommendations for production

1. **Optional guard in (modals) layout**  
   In `(modals)/_layout.tsx`, if `hasSupabaseConfig && !session`, call `router.replace('/')`. Then all modals are only reachable when the app has a session.

2. **Keep per-screen checks**  
   Keeping `if (!user?.id) return` / disabled buttons in add-expense, add-income, etc. is still good for robustness (e.g. session expires while the modal is open).

3. **No functional bugs**  
  Modal flows (add, edit, scan receipt, templates) are wired to hooks and Supabase; no obvious missing screens or broken navigation in the reviewed paths.

---

## 4. Supabase services

### 4.1 Does it work as-is?

**Yes, once the project is configured and schemas are applied.**

- **Client** — Single `createClient` in `src/services/supabase.ts`; uses `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY`; `hasSupabaseConfig` is exported; auth uses `ExpoSecureStoreAdapter`; when config is missing a placeholder client is created so the app doesn’t crash (auth will fail at runtime).
- **Tables and RLS** — Docs under `docs/` include SQL for: profiles, transactions, invoices, invoice_items, bills, documents, customers, vendors, bank_accounts, bank_statements, receipts, category_rules, dashboard_insights, chat_messages, tax_settings, estimated_tax_payments, compliance_items. Each schema enables RLS and defines policies (e.g. “user can manage own rows” by `auth.uid() = user_id` or equivalent).
- **Hooks** — All data hooks (`useTransactions`, `useInvoices`, `useBills`, `useDocuments`, `useCustomers`, `useVendors`, `useBankAccounts`, `useReconciliation`, `useUploadStatement`, `useDocumentTemplates`, `useInsights`, `useChat`, `useCategoryRules`, `useQuarterlyEstimates`, `useTaxSummary`, `useYearEndPackage`, etc.) use `user?.id` from `useAuth()`, filter by `user_id` (or equivalent), and are `enabled: Boolean(userId)`. Missing tables are often handled (e.g. return `[]` or specific error) so the app doesn’t redbox.
- **Storage** — `src/services/storage.ts`: receipts bucket (upload, public URL), documents bucket (upload text, upload PDF). Buckets and RLS must be created via `docs/supabase-storage-receipts.sql` and `docs/supabase-storage-documents.sql`.
- **File system** — PDF and sharing code use `expo-file-system/legacy` (cacheDirectory, EncodingType) so they work with the current Expo/TypeScript set up.

### 4.2 What’s broken or incomplete?

- **Placeholder client when config missing**  
  With no env vars, the app creates a client pointing at `https://placeholder.supabase.co`. Any real request will 404 or fail. The app already shows “Connect Supabase” when `!hasSupabaseConfig` on the root index and login; no change strictly required, but be aware that any code path that doesn’t check `hasSupabaseConfig` could hit this client.

- **Schema and bucket order**  
  If a user runs SQL or creates buckets in the wrong order (e.g. storage before RLS), they can see permission or “relation does not exist” errors. The app handles many of these gracefully (empty list, toast, or setup message), but there’s no single “run these in this order” script.

- **No explicit 401/403 handling**  
  When the session is invalid or RLS denies access, Supabase returns an error. Hooks surface it (e.g. throw or set error state), but there’s no global “on 401/403, sign out and redirect to /”. So expired or revoked sessions can leave the user on a screen full of errors instead of a clean login redirect.

### 4.3 Recommendations for production

1. **Single “bootstrap” doc**  
   Add e.g. `docs/SUPABASE_BOOTSTRAP.md` (or one SQL file that references others) that lists: (1) Run `supabase-profiles-schema.sql` first, (2) then transactions, invoices, bills, documents, customers/vendors, etc., (3) then storage buckets and their RLS. Link from `VERIFY.md` and from the “Database Setup Required” screen.

2. **Optional global auth error handling**  
   In `QueryProvider` or a thin wrapper around Supabase, consider intercepting responses (or React Query `onError`) for 401/403 and then calling `signOut()` and `router.replace('/')` so expired sessions don’t leave the user stuck.

3. **Keep current RLS design**  
   Per-table RLS with `auth.uid() = user_id` (or equivalent) is appropriate; no need to change unless you add multi-tenant or sharing.

---

## 5. Data flow

### 5.1 Does it work as-is?

**Yes.**

- **React Query** — `QueryProvider` in root sets `staleTime: 30s`, `gcTime: 10m`, and retry that backs off on network/offline. All list/detail reads go through `useQuery`; writes use `useMutation` with `onSuccess` invalidating the right query keys (e.g. `[QUERY_KEY, userId]`).
- **Auth in hooks** — Every data hook takes `user` from `useAuth()` and uses `user?.id` for both the query key and the Supabase filter; `enabled: Boolean(userId)` prevents requests when logged out.
- **Mutations** — Create/update/delete mutations check `user?.id`, build the row with `user_id`, and invalidate the corresponding list (and sometimes detail) queries so the UI updates.
- **Feedback** — Toasts and haptics on save/delete; loading states on buttons and lists; empty states and error messages (e.g. “Profiles table missing”) are present.
- **Offline** — `OfflineBanner` uses `useNetworkStatus()` (NetInfo); shows “Offline — showing cached data” when disconnected. React Query serves cached data when refetch fails; retry logic reduces aggressive retries on network errors.

### 5.2 What’s broken or incomplete?

- **Signup success vs “confirm email”**  
  Data flow for signup is “call signUp → router.replace('/')”. When email confirmation is required, there is no session yet, so the user is sent to login with no “Check your email” message. So the only fully correct flow today is “email confirmation off.”

- **No global error boundary**  
  If a query or mutation throws (e.g. unhandled Supabase error or missing table in a path that doesn’t catch it), the error can bubble and redbox. There’s an `ErrorBoundary` export from expo-router in root layout but no custom boundary that shows a “Something went wrong” screen and a “Back” or “Sign out” action.

- **Duplicate/legacy files**  
  `src/services/taxReportPdf 2.ts`, `src/hooks/useYearEndPackage 2.ts`, etc. exist. They’re not imported by the main app (expo-router and imports point to the non-“2” files), but they can cause confusion and accidental edits.

### 5.3 Recommendations for production

1. **Align signup with email confirmation**  
   As in Section 1, treat “success but no session” as “confirm your email” and show a dedicated screen instead of replacing to `/`.

2. **Add an error boundary**  
   Wrap the main app (e.g. inside `ToastProvider`) in an error boundary that catches render and effect errors, shows a friendly message and a “Try again” / “Sign out” button, and optionally reports to your error service.

3. **Optional offline queue**  
   For production you could persist failed mutations (e.g. in AsyncStorage) and retry when back online; current behavior (toast on failure, user can retry) is acceptable for an initial release.

4. **Clean up “2” copies**  
   Remove or relocate `* 2.ts` / `* 2.tsx` in `src` and `app` so the codebase has a single source of truth for each feature.

---

## Summary table

| Area            | Works as-is | Broken / incomplete | Top recommendation |
|-----------------|------------|---------------------|--------------------|
| Auth            | Yes        | Email confirm; single gate; duplicates | Handle “confirm email”; add (tabs) auth guard |
| Tab navigation  | Yes        | No layout guard     | Redirect to `/` in (tabs) when !session |
| Modals          | Yes        | No layout guard     | Optional redirect in (modals) when !session |
| Supabase        | Yes        | Bootstrap order; no 401/403 handling | Bootstrap doc; optional global sign-out on 401 |
| Data flow       | Yes        | Signup vs confirm; no error boundary | “Confirm email” screen; error boundary |

---

## Verification

- **TypeScript:** `npx tsc --noEmit` passes with current fixes (legacy_src_backup excluded, expo-file-system/legacy, templates type assertions, taxReportPdf String(label)).
- **Bundle:** `npx expo export --platform ios` completes; Metro bundles without errors.
- **Manual:** Follow `docs/VERIFY.md` for end-to-end checks (auth, transactions, documents, invoices, receipts, offline banner, etc.) before release.
