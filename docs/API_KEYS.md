# API Keys Setup

All API keys go in `.env.local` in the project root. Expo loads this file automatically.

## Quick start

1. Copy the example:
   ```bash
   cp .env.example .env.local
   ```
2. Edit `.env.local` with your real values
3. Restart the dev server: `npx expo start`

---

## Required keys

### Supabase (auth, database, storage)

Without these, the app won't sign in, load data, or work properly.

| Variable | Where to get it |
|----------|-----------------|
| `EXPO_PUBLIC_SUPABASE_URL` | Supabase Dashboard → Project Settings → API → Project URL |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Supabase Dashboard → Project Settings → API → anon public key |

Example:
```
EXPO_PUBLIC_SUPABASE_URL=https://abcdefgh.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## Optional keys

### OpenAI (AI chat and document drafting)

| Variable | Where to get it | Used for |
|----------|-----------------|----------|
| `EXPO_PUBLIC_OPENAI_API_KEY` | [platform.openai.com/api-keys](https://platform.openai.com/api-keys) | Chat tab, AI document generation, insights |

If you leave this empty:
- Chat tab shows a message to add the key
- AI document drafting is disabled (you can still use templates)
- AI-powered insights are disabled

---

## No other keys needed

The main app uses only Supabase and (optionally) OpenAI. Google login is configured in the Supabase Dashboard (not via env vars). Firebase and RevenueCat appear only in legacy backup code, not in the active app.
