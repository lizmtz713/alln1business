# End-to-End Auth Debug Report

## 1. GoogleSignInButton in JSX

### login.tsx
- **Imported:** Line 16 — `import { GoogleSignInButton } from '../../src/components/GoogleSignInButton';`
- **Rendered:** Lines 151–164 (inside the main return, after the "or continue with" divider):
```jsx
<View className="mt-8 w-full">
  <View className="mb-3 flex-row items-center gap-3">
    <View className="h-px flex-1 bg-slate-600" />
    <Text className="text-slate-500">or continue with</Text>
    <View className="h-px flex-1 bg-slate-600" />
  </View>
  <GoogleSignInButton
    onSuccess={() => router.replace('/')}
    onError={(msg) => {
      setError(msg);
      Alert.alert('Google Sign In Failed', msg);
    }}
  />
</View>
```
- **Condition:** This block is only rendered when `hasSupabaseConfig` is true. When `hasSupabaseConfig` is false, the screen returns early at lines 59–68 with "Connect Supabase" and **no form and no Google button**.

### signup.tsx
- **Imported:** Line 16 — `import { GoogleSignInButton } from '../../src/components/GoogleSignInButton';`
- **Rendered:** Lines 192–206 (same structure as login):
```jsx
<View className="mt-8 w-full">
  ...
  <GoogleSignInButton
    onSuccess={() => router.replace('/')}
    onError={(msg) => { setError(msg); Alert.alert('Google Sign In Failed', msg); }}
  />
</View>
```
- **Condition:** Same as login — only when `hasSupabaseConfig` is true. When false, early return at 75–82. When `needsConfirmation` is true, a different screen is shown (84–100) and the form/Google button are not visible.

---

## 2. Views / ScrollView / KeyboardAvoidingView and touch blocking

- **login.tsx**
  - **KeyboardAvoidingView** (71–75): wraps everything, no `pointerEvents` or zIndex. Unlikely to block.
  - **ScrollView** (76–78): `keyboardShouldPersistTaps="handled"` — correct so taps work while keyboard is open. No absolute/fixed overlay.
  - **Password row** (104–122): one child has `className="absolute right-3 top-0 h-full justify-center"` — it is inside that row only and does not cover the Sign In or Google buttons below.
- **signup.tsx**
  - Same layout: KeyboardAvoidingView → ScrollView → content. No overlay covering the Create Account or Google buttons.
- **Conclusion:** No obvious view covering the buttons or blocking touches. No stray `position: absolute` or high zIndex over the form.

---

## 3. &lt;form&gt; tag

- **login.tsx:** No `<form>` tag. Only RN components (View, TextInput, TouchableOpacity, etc.).
- **signup.tsx:** No `<form>` tag.
- **Conclusion:** Not applicable; no form tag to break React Native.

---

## 4. useAuth() and AuthProvider

- **AuthProvider context value** (AuthProvider.tsx 261–277): Exposes `signIn`, `signUp`, `signInWithGoogle`, `hasSupabaseConfig`, etc.
- **AuthContextType** (AuthProvider.tsx 26–40): Declares `signIn`, `signUp`, `signInWithGoogle`.
- **Root layout** (app/_layout.tsx 29–44): `QueryProvider` → `AuthProvider` → `ThemeProvider` → … → `RootNavigator`. Auth screens are under `(auth)` which is inside `RootNavigator`, so they are inside `AuthProvider`.
- **Conclusion:** useAuth() returns signIn, signUp, and signInWithGoogle, and AuthProvider wraps the whole app. No issue here.

---

## 5. Email signup and confirmation

- **signUp usage** (signup.tsx 54): `const { error: err, needsConfirmation: needs } = await signUp(safeEmail, safePassword);`
- **When needsConfirmation is true** (59–61): Sets `setConfirmedEmail(safeEmail)` and `setNeedsConfirmation(true)`.
- **When needsConfirmation is true** (84–100): Renders a **different screen**: "Check your email", message "We sent a confirmation link to {confirmedEmail}...", and "Go to Sign in" button. So the user **does** get a message to check email; it is not silent.
- **Conclusion:** Email confirmation is handled and the user is shown the "Check your email" UI. If signup "does nothing", possible causes: (1) Supabase not configured so user never sees the form, (2) tap not firing, (3) signUp throwing before returning, (4) network/API error not surfaced.

---

## 6. hasSupabaseConfig / conditional rendering

- **login.tsx**
  - Line 59: `if (!hasSupabaseConfig) { ... return ( ... "Connect Supabase" ... ); }`
  - When this runs, the **entire form and Google button are not rendered**. The user only sees the Connect Supabase message.
- **signup.tsx**
  - Line 75: Same — `if (!hasSupabaseConfig) { ... return ( ... "Connect Supabase" ... ); }`
- **GoogleSignInButton** is **not** wrapped in an extra `{hasSupabaseConfig && ...}`; it is in the same branch as the rest of the form. So when the form is visible, the Google button is visible.
- **Conclusion:** If `hasSupabaseConfig` is false (missing or wrong `EXPO_PUBLIC_SUPABASE_URL` / `EXPO_PUBLIC_SUPABASE_ANON_KEY`), the user never sees the Sign In, Create Account, or Google buttons — only "Connect Supabase". That can look like "nothing works". Fix: set both env vars in `.env.local` and restart Expo.

---

## 7. Test button added

- **login.tsx:** A bright red **TouchableOpacity** was added at the **top** of the ScrollView content (right after the opening `<ScrollView>`), with:
  - `onPress={() => Alert.alert('TEST', 'Button works')}`
  - Red background, white "TEST TOUCH (tap me)" text.
- **Purpose:** If this alert appears when tapped, touches work and the issue is likely with the specific handlers or Supabase. If it does not appear, something is blocking touches (e.g. overlay, or you are on the "Connect Supabase" screen where this block is not rendered).

---

## 8. Summary and what to check

| Check | Result |
|-------|--------|
| GoogleSignInButton in JSX (login) | Yes, lines 151–164, inside main return when hasSupabaseConfig |
| GoogleSignInButton in JSX (signup) | Yes, lines 192–206, same condition |
| Something covering buttons? | No overlay or zIndex found; ScrollView has keyboardShouldPersistTaps="handled" |
| &lt;form&gt; tag? | None in login or signup |
| useAuth() / AuthProvider | Context has signIn, signUp, signInWithGoogle; AuthProvider wraps app in _layout |
| Email confirmation UX | needsConfirmation shows "Check your email" screen; not silent |
| hasSupabaseConfig hiding form? | When false, entire form + Google button are not rendered; only "Connect Supabase" |

**Most likely cause:** `hasSupabaseConfig` is **false** (env vars missing or not loaded), so the app shows the "Connect Supabase" screen and the user never sees the Sign In / Create Account / Google buttons. Tapping on that screen does nothing useful because there are no buttons there.

**Next steps:**
1. Confirm `.env.local` has `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY`, then restart Expo.
2. Tap the red "TEST TOUCH (tap me)" on the login screen. If the alert shows, touches work; then test Sign In and Google again.
3. If you see the form but Sign In / Create Account still do nothing, check the console for the existing logs (`[Login] handleSignIn called`, `[Auth] signIn() called`, etc.) to see how far the flow gets.
