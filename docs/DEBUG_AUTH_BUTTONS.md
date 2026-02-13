# Auth Buttons Debug Summary

## Changes made

### 1. AuthProvider
- **signInWithGoogle():** `console.log('[Auth] signInWithGoogle() called')` at start; log when Supabase not configured.
- **signUp():** `console.log('[Auth] signUp() called', { email: '***' })` at start; log when Supabase not configured.
- **signIn():** `console.log('[Auth] signIn() called', { email: '***' })` at start.

### 2. GoogleSignInButton
- **handlePress:** `console.log('[GoogleSignInButton] handlePress called')` at start.
- Guard: if `signInWithGoogle` is undefined, `console.error` and return.
- **try/catch** around `signInWithGoogle()`: on throw, log with `console.error`, show toast, call `onError`, reset loading.

### 3. Login screen (app/(auth)/login.tsx)
- **handleSignIn:** `console.log('[Login] handleSignIn called')` at start.
- **try/catch** around `signIn(safeEmail, safePassword)`: on throw, log, setError, Alert.alert.

### 4. Signup screen (app/(auth)/signup.tsx)
- **handleSignUp:** `console.log('[Signup] handleSignUp called')` at start (already present).
- **try/catch** around `signUp(...)`: on throw, log, setError, Alert.alert (already present).

## Wiring check

- **GoogleSignInButton:** `onPress={handlePress}`; `handlePress` calls `signInWithGoogle()` from `useAuth()`. Correct.
- **Signup submit:** `onPress={handleSignUp}`; `handleSignUp` calls `signUp(safeEmail, safePassword)` from `useAuth()`. Correct.
- **Login submit:** `onPress={handleSignIn}`; `handleSignIn` calls `signIn(safeEmail, safePassword)` from `useAuth()`. Correct.

## Supabase URL test

- **URL tested:** `https://fqsbpnptarbcutxtdepp.supabase.co/auth/v1/health`
- **Result:** HTTP **401** (reached server; 401 is normal without anon key for some routes). So the host is **reachable**.
- **Note:** Your app uses `EXPO_PUBLIC_SUPABASE_URL` from `.env.local`. If your project ID differs, set that in `.env.local` and restart Expo.

## What to do next

1. Run the app: `npx expo start --clear --port 8085`
2. Open login, tap **Sign In** (with or without email/password):
   - Expect console: `[Login] handleSignIn called` then `[Auth] signIn() called`.
3. Open signup, tap **Create Account**:
   - Expect console: `[Signup] handleSignUp called` then `[Auth] signUp() called`.
4. Tap **Continue with Google** on either screen:
   - Expect console: `[GoogleSignInButton] handlePress called` then `[Auth] signInWithGoogle() called`.

If a log is missing, the tap isn’t reaching that handler (e.g. overlay, wrong component, or touch not firing). If you see the handler log but not the AuthProvider log, the context or function reference may be wrong. If you see both and then an error, the try/catch and Alert will show it.
