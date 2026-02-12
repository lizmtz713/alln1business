import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { supabase, hasSupabaseConfig } from '../services/supabase';

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
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

async function fetchProfile(userId: string): Promise<Profile> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, email, full_name, business_name, business_type, entity_type, onboarding_completed, subscription_tier')
      .eq('id', userId)
      .single();

    if (error) {
      if (__DEV__) console.warn('[Auth] Profile fetch failed:', error.message);
      return null;
    }
    return data as Profile;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<AuthContextType['session']>(null);
  const [profile, setProfile] = useState<Profile>(null);
  const [loading, setLoading] = useState(true);

  const refreshProfile = useCallback(async () => {
    if (session?.user?.id) {
      const p = await fetchProfile(session.user.id);
      setProfile(p);
    } else {
      setProfile(null);
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
        fetchProfile(s.user.id).then(setProfile);
      } else {
        setProfile(null);
      }
      setLoading(false);
    }).catch(() => {
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, s) => {
      setSession(s);
      if (s?.user?.id) {
        fetchProfile(s.user.id).then(setProfile);
      } else {
        setProfile(null);
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
      return { error: new Error('Supabase not configured. Add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY to .env.local') };
    }
    const { error } = await supabase.auth.signUp({ email, password });
    return { error };
  }, []);

  const signOut = useCallback(async () => {
    if (hasSupabaseConfig) {
      await supabase.auth.signOut();
    }
    setProfile(null);
    setSession(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        session,
        user: session?.user ?? null,
        profile,
        loading,
        signIn,
        signUp,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (ctx === undefined) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
