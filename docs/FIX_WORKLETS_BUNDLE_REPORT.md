# Fix report: react-native-worklets/plugin bundle error

## Problem
App failed to bundle with: **Cannot find module 'react-native-worklets/plugin'**

This comes from `react-native-reanimated`: its Babel plugin (`react-native-reanimated/plugin`) does `require('react-native-worklets/plugin')`, so both packages must be installed and resolvable.

---

## What was done

### 1. `npx expo install react-native-reanimated react-native-worklets`
- **Result:** Success (exit 0).
- Expo installed SDK 54–compatible versions. It reported “Removed 2 packages, and audited 908 packages” and “found 0 vulnerabilities”.
- **Note:** First attempt failed with `EPERM` writing to `~/.expo/native-modules-cache` when run in a sandbox; the command was re-run with full permissions and succeeded.

### 2. Versions (package.json)
- **expo:** ^54.0.33 (SDK 54)
- **react-native-reanimated:** ~4.1.1 (resolved to 4.1.6 in node_modules)
- **react-native-worklets:** 0.5.1

No manual pinning was needed; Expo chose compatible versions.

### 3. Babel config (babel.config.js)
- **Checked:** `react-native-reanimated/plugin` is already the **last** plugin (after `nativewind/babel`).
- No change made.

```js
plugins: [
  'nativewind/babel',
  'react-native-reanimated/plugin',  // last, as required
],
```

### 4. Cache clear and bundle verification
- Removed `node_modules/.cache` (and `.expo` where possible).
- Ran **`npx expo export --platform web`** to force a full bundle:
  - Metro completed successfully: **“Bundled 51485ms … (2054 modules)”**.
  - No “Cannot find module 'react-native-worklets/plugin'” error during the bundle step.
- Export then failed at **runtime** during static rendering: `TypeError: n.default.getValueWithKeyAsync is not a function` in `expo-secure-store` (Node/SSG context). That is unrelated to the worklets plugin.

### 5. `npm install --legacy-peer-deps`
- **Not run.** The worklets plugin resolution issue was already resolved by step 1; `legacy-peer-deps` was not required.

### 6. Sanity check
- From project root, `require('react-native-worklets/plugin')` in Node runs without error.
- `node_modules/react-native-worklets/plugin/index.js` exists.

---

## Conclusion

- **Cause:** Reanimated’s plugin depends on `react-native-worklets/plugin`. Ensuring both are installed via `npx expo install react-native-reanimated react-native-worklets` (with permissions that allow writing to `~/.expo` if needed) fixed the missing module error.
- **Bundle:** The app **bundles successfully**; Metro built 2054 modules with no worklets resolution error.
- **Suggested dev check:** Run `npx expo start --clear` (and choose another port if 8081 is in use) to confirm the dev server and on-device bundle also work.

---

## If the error comes back

1. Re-run:  
   `npx expo install react-native-reanimated react-native-worklets`
2. Clear caches:  
   `rm -rf node_modules/.cache && npx expo start --clear`
3. If resolution still fails, try:  
   `npm install --legacy-peer-deps`
4. Keep `react-native-reanimated/plugin` as the **last** entry in `babel.config.js` plugins.
