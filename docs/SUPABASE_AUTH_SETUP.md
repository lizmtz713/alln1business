# Supabase Auth Configuration

## A) Supabase Dashboard Checklist

### 1. Enable Google Provider

1. Go to [Supabase Dashboard](https://supabase.com/dashboard) → your project
2. **Authentication** → **Providers**
3. Find **Google** → enable it
4. Add your **Client ID** and **Client Secret** from [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
   - Create OAuth 2.0 Client ID (Web application)
   - Authorized redirect URI: `https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback`
   - Copy Client ID and Secret into Supabase

### 2. Redirect URLs (Auth → URL Configuration)

Add these to **Authentication** → **URL Configuration** → **Redirect URLs**:

| Environment | Redirect URL |
|-------------|--------------|
| **App (dev/prod build)** | `alln1business://google-auth` |
| **App (dev/prod build)** | `alln1business://reset-password` |
| **Expo Go (LAN)** | `exp://192.168.x.x:8081/--/google-auth` (replace with your dev machine IP) |
| **Expo Go (tunnel)** | `https://YOUR-SUBDOMAIN.exp.direct/--/google-auth` |
| **Expo Go (tunnel)** | `https://YOUR-SUBDOMAIN.exp.direct/--/reset-password` |

To get your Expo Go redirect URL, run `npx expo start` and check the printed URL, or use `npx expo start --tunnel` for a public URL.

### 3. Site URL

Set **Site URL** (Auth → URL Configuration) to your production URL, or for development:

- `exp://192.168.1.1:8081` (Expo Go on LAN)
- Or your production domain when deployed

### 4. Email Templates (optional)

For password reset, the default email template works. Customize under **Authentication** → **Email Templates** → **Reset Password** if needed.

---

## B) Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create project or select existing
3. **APIs & Services** → **Credentials** → **Create Credentials** → **OAuth client ID**
4. Application type: **Web application**
5. **Authorized redirect URIs**: add `https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback`
6. Copy Client ID and Client Secret to Supabase (Auth → Providers → Google)

---

## Verification

1. **Google sign-in**: Login screen → Continue with Google → completes without error
2. **Forgot password**: Login → Forgot password? → enter email → receive reset email
3. **Reset password**: Click link in email → app opens → Set new password → works
4. **Change password**: More → Change Password → enter new password → success toast
