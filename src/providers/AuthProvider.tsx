import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import { supabase, hasSupabaseConfig } from '../services/supabase';

WebBrowser.maybeCompleteAuthSession();

export type Profile = {
  id: string;
  email: string | null;
  full_name: string | null;
  business_name: string | null;
  business_type: string | null;
  entity_type: string | null;
  onboarding_completed: boolean;
  subscription_tier: string | null;
} | null;

type AuthContextType = {
  session: { user: { id: string; email?: string } } | null;
  user: { id: string; email?: string } | null;
  profile: Profile;
  profileLoadError: string | null;
  loading: boolean;
  hasSupabaseConfig: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  signInWithGoogle: () => Promise<{ error: string | null }>;
  resetPassword: (email: string) => Promise<{ error: string | null }>;
  updatePassword: (newPassword: string) => Promise<{ error: string | null }>;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

async function fetchProfile(userId: string): Promise<{ data: Profile; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, email, full_name, business_name, business_type, entity_type, onboarding_completed, subscription_tier')
      .eq('id', userId)
      .single();

    if (error) {
      if (__DEV__) console.warn('[Auth] Profile fetch failed:', error.message);
      const isTableMissing = /relation.*does not exist|42P01/i.test(error.message ?? '');
      return { data: null, error: isTableMissing ? 'profiles_table_missing' : null };
    }
    return { data: data as Profile, error: null };
  } catch (e) {
    const msg = String((e as Error)?.message ?? '');
    const isTableMissing = /relation.*does not exist|42P01/i.test(msg);
    return { data: null, error: isTableMissing ? 'profiles_table_missing' : null };
  }
}

function extractParamsFromUrl(url: string): { access_token?: string; refresh_token?: string; type?: string } {
  try {
    const parsed = new URL(url);
    const hash = parsed.hash?.substring(1) ?? '';
    const params = new URLSearchParams(hash);
    return {
      access_token: params.get('access_token') ?? undefined,
      refresh_token: params.get('refresh_token') ?? undefined,
      type: params.get('type') ?? undefined,
    };
  } catch {
    return {};
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<AuthContextType['session']>(null);
  const [profile, setProfile] = useState<Profile>(null);
  const [profileLoadError, setProfileLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshProfile = useCallback(async () => {
    if (session?.user?.id) {
      setProfileLoadError(null);
      const { data: p, error } = await fetchProfile(session.user.id);
      setProfile(p);
      setProfileLoadError(error);
    } else {
      setProfile(null);
      setProfileLoadError(null);
    }
  }, [session?.user?.id]);

  useEffect(() => {
    if (!hasSupabaseConfig) {
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      if (s?.user?.id) {
        fetchProfile(s.user.id).then(({ data: p, error }) => {
          setProfile(p);
          setProfileLoadError(error);
        });
      } else {
        setProfile(null);
        setProfileLoadError(null);
      }
      setLoading(false);
    }).catch(() => {
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, s) => {
      setSession(s);
      if (s?.user?.id) {
        fetchProfile(s.user.id).then(({ data: p, error }) => {
          setProfile(p);
          setProfileLoadError(error);
        });
      } else {
        setProfile(null);
        setProfileLoadError(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    if (!hasSupabaseConfig) {
      return { error: new Error('Supabase not configured. Add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY to .env.local') };
    }
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  }, []);

  const signUp = useCallback(async (email: string, password: string) => {
    if (!hasSupabaseConfig) {
      return { error: new Error('Supabase not configured.') };
    }
    const { error } = await supabase.auth.signUp({ email, password });
    return { error };
  }, []);

  const signOut = useCallback(async () => {
    if (hasSupabaseConfig) await supabase.auth.signOut();
    setProfile(null);
    setSession(null);
  }, []);

  const signInWithGoogle = useCallback(async (): Promise<{ error: string | null }> => {
    if (!hasSupabaseConfig) {
      return { error: 'Supabase not configured.' };
    }

    const redirectTo = AuthSession.makeRedirectUri({
      path: 'google-auth',
      scheme: 'alln1business',
    });
    if (__DEV__) console.log('[Auth] Google redirectTo:', redirectTo);

    const res = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo,
        queryParams: { prompt: 'consent' },
        skipBrowserRedirect: true,
      },
    });

    const url = res.data?.url;
    if (!url) {
      return { error: res.error?.message ?? 'Could not start Google sign in.' };
    }

    const result = await WebBrowser.openAuthSessionAsync(url, redirectTo, { showInRecents: true });

    if (result?.type === 'success') {
      const { access_token, refresh_token } = extractParamsFromUrl(result.url);
      if (access_token && refresh_token) {
        const { error } = await supabase.auth.setSession({ access_token, refresh_token });
        if (error) return { error: error.message };
        return { error: null };
      }
      return { error: 'Sign in was cancelled or failed.' };
    }
    if (result?.type === 'cancel') return { error: null };
    return { error: 'Sign in was cancelled or failed.' };
  }, []);

  const resetPassword = useCallback(async (email: string): Promise<{ error: string | null }> => {
    if (!hasSupabaseConfig) return { error: 'Supabase not configured.' };

    const redirectTo = AuthSession.makeRedirectUri({
      path: 'reset-password',
      scheme: 'alln1business',
    });

    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo });
    if (error) return { error: error.message };
    return { error: null };
  }, []);

  const updatePassword = useCallback(async (newPassword: string): Promise<{ error: string | null }> => {
    if (!hasSupabaseConfig) return { error: 'Supabase not configured.' };

    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) return { error: error.message };
    return { error: null };
  }, []);

  return (
    <AuthContext.Provider
      value={{
        session,
        user: session?.user ?? null,
        profile,
        profileLoadError,
        loading,
        hasSupabaseConfig,
        signIn,
        signUp,
        signOut,
        signInWithGoogle,
        resetPassword,
        updatePassword,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (ctx === undefined) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
