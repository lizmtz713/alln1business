import { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase, hasSupabaseConfig } from '../../src/services/supabase';

function extractParamsFromUrl(url: string): { access_token?: string; refresh_token?: string } {
  try {
    const parsed = new URL(url);
    const hash = parsed.hash?.substring(1) ?? '';
    const params = new URLSearchParams(hash);
    return {
      access_token: params.get('access_token') ?? undefined,
      refresh_token: params.get('refresh_token') ?? undefined,
    };
  } catch {
    return {};
  }
}

export default function GoogleAuthCallbackScreen() {
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!hasSupabaseConfig) {
      setStatus('error');
      setErrorMsg('Supabase not configured.');
      return;
    }

    let cancelled = false;
    let removeUrlListener: (() => void) | null = null;

    async function handleUrl(url: string | null) {
      if (!url || cancelled) return;

      const { access_token, refresh_token } = extractParamsFromUrl(url);
      if (!access_token || !refresh_token) {
        if (!cancelled) {
          setStatus('error');
          setErrorMsg('Missing tokens in callback URL.');
        }
        return;
      }

      const { error } = await supabase.auth.setSession({ access_token, refresh_token });
      if (cancelled) return;

      if (error) {
        setStatus('error');
        setErrorMsg(error.message);
        return;
      }

      setStatus('success');
      router.replace('/');
    }

    (async () => {
      const initialUrl = await Linking.getInitialURL();
      if (cancelled) return;
      await handleUrl(initialUrl);
      if (cancelled) return;
      const sub = Linking.addEventListener('url', ({ url }) => handleUrl(url));
      removeUrlListener = () => sub.remove();
    })();

    return () => {
      cancelled = true;
      removeUrlListener?.();
    };
  }, [router]);

  if (status === 'error') {
    return (
      <View className="flex-1 items-center justify-center bg-slate-900 p-8">
        <Text className="mb-4 text-center text-lg font-medium text-red-400">Google sign-in failed</Text>
        <Text className="mb-6 text-center text-slate-400">{errorMsg}</Text>
        <Text
          className="text-blue-400"
          onPress={() => router.replace('/(auth)/login')}
        >
          Back to Login
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-1 items-center justify-center bg-slate-900">
      <ActivityIndicator size="large" color="#3B82F6" />
      <Text className="mt-4 text-slate-400">Completing sign in...</Text>
    </View>
  );
}
