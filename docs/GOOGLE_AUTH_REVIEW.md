# Google Sign-In Flow Review

## 1. GoogleSignInButton.tsx and Supabase OAuth

**Current behavior:**  
`GoogleSignInButton.tsx` does **not** call Supabase directly. It calls `signInWithGoogle()` from `useAuth()` (AuthProvider). The actual OAuth logic lives in **AuthProvider**.

**AuthProvider `signInWithGoogle` (correct Supabase flow):**
- Uses `supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo, skipBrowserRedirect: true, queryParams: { prompt: 'consent' } } })`.
- Builds `redirectTo` with `AuthSession.makeRedirectUri({ path: 'google-auth', scheme: 'alln1business' })`.
- Opens the OAuth URL in an in-app browser via `WebBrowser.openAuthSessionAsync(url, redirectTo, { showInRecents: true })`.
- On success, parses `result.url` for `access_token` and `refresh_token` (from hash), then calls `supabase.auth.setSession({ access_token, refresh_token })`.

**Verdict:** The app uses the correct **Supabase Google OAuth** method. The button is a thin wrapper; the flow is implemented in AuthProvider and is appropriate for Expo (custom scheme + in-app browser).

---

## 2. redirectTo URL vs Expo scheme in app.json

**app.json:**
```json
"scheme": "alln1business"
```
**Note:** Scheme is currently `alln1business`; when rebranding to Alln1Home, change to `alln1home` in app.json and in AuthProvider (Google and reset-password redirectTo).

**AuthProvider:**
```ts
const redirectTo = AuthSession.makeRedirectUri({
  path: 'google-auth',
  scheme: 'alln1business',
});
```

- `makeRedirectUri` with `scheme: 'alln1business'` and `path: 'google-auth'` produces **`alln1business://google-auth`** (or the native equivalent, e.g. `exp://...` in dev with Expo Go).
- The scheme **matches** app.json (`alln1business`).

**Verdict:** redirectTo is built from the same scheme as app.json. No change needed for scheme/path alignment.

**Caveat:** The **exact** redirect URL (e.g. `alln1business://google-auth`) must be **allowed** in Supabase:

- Dashboard → **Authentication** → **URL Configuration** → **Redirect URLs**.
- Add: `alln1business://google-auth` (and, if used, `alln1business://**` or the dev URL Expo prints in the `[Auth] Google redirectTo:` log).

---

## 3. app/(auth)/google-auth.tsx callback handling

**Role of this screen:**  
Used when the app is **opened from a deep link** (e.g. user returns from the browser and the OS opens the app with the OAuth callback URL). It does **not** run when the in-app browser returns and `WebBrowser.openAuthSessionAsync` resolves in AuthProvider; in that case AuthProvider handles the URL and sets the session.

**Current behavior:**
- Listens to `Linking.getInitialURL()` and `Linking.addEventListener('url', ...)`.
- Parses the URL with `extractParamsFromUrl(url)`, which reads **hash** (`parsed.hash`) and pulls `access_token` and `refresh_token`.
- Calls `supabase.auth.setSession({ access_token, refresh_token })`.
- On success: `router.replace('/')`.
- On error: shows message and “Back to Login”.

**Potential issue:**  
Supabase may return tokens in the **query string** instead of the **hash** on some flows or platforms. `extractParamsFromUrl` only checks the hash:

```ts
const hash = parsed.hash?.substring(1) ?? '';
const params = new URLSearchParams(hash);
```

If Supabase redirects with `?access_token=...&refresh_token=...`, this would miss the tokens. Same logic exists in AuthProvider’s `extractParamsFromUrl`.

**Recommendation:**  
In both `google-auth.tsx` and AuthProvider, parse **both** hash and query:

- Try `parsed.hash` first.
- If no tokens there, try `parsed.search` (query string).
- Then pass the combined params to the same `setSession` flow.

**Otherwise:** Callback screen is correctly wired: same Supabase client, same token parsing (hash), correct redirect to `/` and error handling.

---

## 4. Supabase client URL and anon key from .env

**supabase.ts:**
```ts
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';
// ...
return createClient(supabaseUrl, supabaseAnonKey, { auth: { storage: ExpoSecureStoreAdapter, ... } });
```

- Uses **`EXPO_PUBLIC_SUPABASE_URL`** and **`EXPO_PUBLIC_SUPABASE_ANON_KEY`**.
- Expo only exposes env vars that start with **`EXPO_PUBLIC_`** to the client, so the naming is correct.
- These are typically set in **`.env.local`** (or similar) and loaded by Expo at build/start.

**Verdict:** Supabase client is configured to use URL and anon key from env; no code change needed. Ensure:

- `.env.local` (or your env file) defines:
  - `EXPO_PUBLIC_SUPABASE_URL=https://<project>.supabase.co`
  - `EXPO_PUBLIC_SUPABASE_ANON_KEY=<anon key>`
- Restart the dev server after changing env.

---

## Summary: What’s correct and what might need to change

| Item | Status | Notes |
|------|--------|--------|
| Google OAuth via Supabase | OK | signInWithOAuth + openAuthSessionAsync + setSession in AuthProvider. |
| redirectTo vs app.json scheme | OK | scheme `alln1business` and path `google-auth` match app.json. |
| google-auth.tsx callback | OK with caveat | Handles deep link, parses hash, sets session, redirects. Consider also parsing query params if Supabase returns tokens there. |
| Supabase URL/anon key | OK | Read from EXPO_PUBLIC_* env; ensure .env.local and restart. |

**To make it work in production:**

1. **Supabase Dashboard**
   - Add redirect URL: `alln1business://google-auth`.
   - If you use Expo Go or a custom dev URL, add that too (or use a wildcard like `alln1business://**` if your Supabase plan allows).
   - Enable Google provider and set Google OAuth client ID/secret.

2. **Env**
   - Set `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` in `.env.local` (or equivalent) and restart Expo.

3. **Optional robustness**
   - In `extractParamsFromUrl` (AuthProvider and google-auth.tsx), also read `access_token` and `refresh_token` from `parsed.search` if they’re not in `parsed.hash`, so callbacks work whether Supabase uses hash or query.
