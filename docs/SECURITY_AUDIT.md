# Security Audit — LIFE-OS App

Backend security audit and hardening: RLS, input sanitization, rate limiting awareness, logging, session handling, and env hygiene.

---

## 1. Supabase Row Level Security (RLS)

### Finding
- All app tables are intended to be protected by RLS so users only access their own data (`auth.uid() = user_id` or equivalent).
- Existing schema docs (`docs/supabase-*-schema.sql`) already define RLS and policies for: profiles, transactions, customers, vendors, invoices, invoice_items, bills, documents, bank_accounts, bank_statements, dashboard_insights, chat_messages, category_rules, tax_settings, estimated_tax_payments, compliance_items.

### Fix
- **`docs/supabase-rls-audit.sql`** added: a single, idempotent script that enables RLS and creates (or replaces) policies for every table used by the app. Run this in the Supabase SQL Editor to ensure no table is missing RLS.

### Tables covered
| Table | Policy |
|-------|--------|
| profiles | `auth.uid() = id` |
| transactions | `auth.uid() = user_id` |
| customers | `auth.uid() = user_id` |
| vendors | `auth.uid() = user_id` |
| invoices | `auth.uid() = user_id` |
| invoice_items | exists (invoices.id = invoice_id and invoices.user_id = auth.uid()) |
| bills | `auth.uid() = user_id` |
| documents | `auth.uid() = user_id` |
| bank_accounts | `auth.uid() = user_id` |
| bank_statements | `auth.uid() = user_id` |
| dashboard_insights | `auth.uid() = user_id` |
| chat_messages | `auth.uid() = user_id` |
| category_rules | `auth.uid() = user_id` |
| tax_settings | `auth.uid() = user_id` |
| estimated_tax_payments | `auth.uid() = user_id` |
| compliance_items | `auth.uid() = user_id` |

### Action
- Run **`docs/supabase-rls-audit.sql`** in your Supabase project if you have not already applied RLS to all of these tables.

---

## 2. Input sanitization

### Finding
- Auth forms (login, signup, forgot-password, reset-password, change-password) already trimmed and validated email format; no central sanitization or length limits.

### Fix
- **`src/lib/sanitize.ts`** added with:
  - **sanitizeEmail**: trim, lowercase, strip control characters, max length 320.
  - **sanitizeText**: trim, strip control chars, configurable max length (default 500).
  - **sanitizePasswordInput**: no modification of content; max length 512 to avoid oversized payloads.
  - **sanitizeForDisplay**: trim and strip control chars for display.
  - **isValidEmailFormat**: email regex check.
  - **MAX_LENGTHS**: email 320, password 512, shortText 500, longText 10_000, code 100.

- Auth flows now use these helpers:
  - **Login**: `sanitizeEmail`, `isValidEmailFormat`, `sanitizePasswordInput` before `signIn`.
  - **Signup**: same for email/password and confirm password.
  - **Forgot password**: `sanitizeEmail`, `isValidEmailFormat` before `resetPassword`.
  - **Reset password** (new password form): `sanitizePasswordInput` for new and confirm.
  - **Change password**: `sanitizePasswordInput` for new and confirm.

### Note
- Supabase client uses parameterized queries; SQL injection from client input is handled server-side. Sanitization guards length, control characters, and normalizes input for storage and display.

---

## 3. Rate limiting awareness (auth)

### Finding
- Supabase Auth applies server-side rate limiting. Clients could show raw error messages that are unclear when rate limited.

### Fix
- **`src/providers/AuthProvider.tsx`**:
  - **normalizeAuthError**: maps 429 status or message containing “rate limit” / “too many requests” / “too many attempts” to:  
    *“Too many attempts. Please wait a few minutes and try again.”*
  - **signIn**, **signUp**, **resetPassword** now return this user-facing message when rate limited.

### Result
- Users see a clear message when auth is rate limited; no need to change server configuration.

---

## 4. No sensitive data in console (production)

### Finding
- Most `console.log`/`console.warn`/`console.error` are already behind `__DEV__` (AuthProvider, storage, openai, supabase). AppErrorBoundary logged in all environments.

### Fix
- **AppErrorBoundary**: logging remains inside `if (__DEV__)`; log content limited to `error?.message` and `errorInfo?.componentStack` (no full error object that might carry sensitive data).
- **supabase.ts**: unchanged; already logs only when `__DEV__` and only a non-sensitive config message.

### Policy
- Do not log tokens, passwords, emails, or PII. Use `__DEV__` for any diagnostic logging so it is stripped in production builds.

---

## 5. Secure token refresh / session handling

### Finding
- Supabase client is created with `autoRefreshToken: true` and `persistSession: true`; session is stored in SecureStore. When refresh fails (e.g. network), session can become null and the app correctly shows logged-out state.

### Fix
- No code change required for refresh: Supabase JS client handles refresh; we already rely on `onAuthStateChange` to set session to null when the user is signed out or refresh fails.
- Documented in this audit so the behavior is explicit.

### Result
- Sessions do not “silently” expire without feedback: when session is null, the UI shows logged-out and the user must sign in again. Ensure auth routes (e.g. login) are reachable when session is null.

---

## 6. .env and .gitignore

### Finding
- `.gitignore` had `.env*.local` but not plain `.env`, so a root `.env` could be committed by mistake.

### Fix
- **`.gitignore`** updated to include:
  - `.env`
  - `.env*.local`
  - `.env.local`
  - `.env.development`
  - `.env.production`

### Verification
- Run: `git check-ignore -v .env .env.local` (or similar). All should be ignored.

---

## Summary

| Area | Status | Action |
|------|--------|--------|
| RLS | Hardened | Run `docs/supabase-rls-audit.sql` in Supabase |
| Input sanitization | Added | `src/lib/sanitize.ts`; auth forms use it |
| Rate limiting | Addressed | Auth errors normalized in AuthProvider |
| Console logging | Hardened | All logging dev-only; no sensitive data |
| Token refresh | Verified | autoRefreshToken + onAuthStateChange; doc added |
| .gitignore | Fixed | `.env` and variants ignored |

---

## Recommendations

1. **Run RLS audit script** in each Supabase environment (e.g. staging, production) and confirm all listed tables have RLS enabled and the expected policies.
2. **Extend sanitization** to other high-value forms (e.g. customer/vendor names, invoice notes) using `sanitizeText` / `sanitizeForDisplay` and `MAX_LENGTHS` where appropriate.
3. **Secrets**: Keep using `.env.local` (or env vars) for `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`, and any API keys; never commit them.
4. **Supabase Auth**: Rely on Supabase for password hashing, rate limiting, and session issuance; ensure redirect URLs and JWT expiry are configured in the Supabase dashboard.
