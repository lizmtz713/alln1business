import { useEffect } from 'react';
import { TouchableOpacity, Text, ActivityIndicator, Image } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import Constants from 'expo-constants';
import { supabase, hasSupabaseConfig } from '../services/supabase';

WebBrowser.maybeCompleteAuthSession();

const scheme = Constants.expoConfig?.scheme ?? 'alln1business';
const redirectUrl = `${scheme}://google-auth`;

function extractParamsFromUrl(url: string) {
  const parsedUrl = new URL(url);
  const hash = parsedUrl.hash.substring(1);
  const params = new URLSearchParams(hash);
  return {
    access_token: params.get('access_token'),
    refresh_token: params.get('refresh_token'),
  };
}

type GoogleSignInButtonProps = {
  onSuccess?: () => void;
  onError?: (error: string) => void;
  disabled?: boolean;
  loading?: boolean;
};

export function GoogleSignInButton({
  onSuccess,
  onError,
  disabled = false,
  loading = false,
}: GoogleSignInButtonProps) {
  useEffect(() => {
    WebBrowser.warmUpAsync();
    return () => {
      WebBrowser.coolDownAsync();
    };
  }, []);

  async function handlePress() {
    if (!hasSupabaseConfig) {
      onError?.('Supabase not configured.');
      return;
    }

    const res = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl,
        queryParams: { prompt: 'consent' },
        skipBrowserRedirect: true,
      },
    });

    const googleOAuthUrl = res.data?.url;

    if (!googleOAuthUrl) {
      onError?.(res.error?.message ?? 'Could not start Google sign in.');
      return;
    }

    const result = await WebBrowser.openAuthSessionAsync(
      googleOAuthUrl,
      redirectUrl,
      { showInRecents: true }
    );

    if (result?.type === 'success') {
      const { access_token, refresh_token } = extractParamsFromUrl(result.url);

      if (access_token && refresh_token) {
        const { error } = await supabase.auth.setSession({
          access_token,
          refresh_token,
        });
        if (error) {
          onError?.(error.message);
        } else {
          onSuccess?.();
        }
      } else {
        onError?.('Sign in was cancelled or failed.');
      }
    } else if (result?.type === 'cancel') {
      // User cancelled - no need to show error
    } else {
      onError?.('Sign in was cancelled or failed.');
    }
  }

  return (
    <TouchableOpacity
      onPress={handlePress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      className="flex-row items-center justify-center rounded-xl border border-slate-600 bg-white py-3 px-4"
      style={{
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
      }}
    >
      {loading ? (
        <ActivityIndicator color="#757575" />
      ) : (
        <>
          <Image
            source={{ uri: 'https://www.google.com/favicon.ico' }}
            style={{ width: 20, height: 20, marginRight: 12 }}
            resizeMode="contain"
          />
          <Text className="font-medium text-slate-600">Continue with Google</Text>
        </>
      )}
    </TouchableOpacity>
  );
}
