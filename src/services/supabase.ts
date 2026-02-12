import 'react-native-url-polyfill/auto';
import * as SecureStore from 'expo-secure-store';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

const hasConfig = Boolean(supabaseUrl && supabaseAnonKey);
if (!hasConfig && __DEV__) {
  console.warn(
    '[Supabase] Missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY. ' +
      'Add them to .env.local. Auth will not work until configured.'
  );
}

const ExpoSecureStoreAdapter = {
  getItem: (key: string) => SecureStore.getItemAsync(key),
  setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
  removeItem: (key: string) => SecureStore.deleteItemAsync(key),
};

function createSupabaseClient(): SupabaseClient {
  if (!hasConfig) {
    return createClient(
      'https://placeholder.supabase.co',
      'placeholder-anon-key',
      {
        auth: {
          storage: ExpoSecureStoreAdapter,
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: false,
        },
      }
    );
  }
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      storage: ExpoSecureStoreAdapter,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  });
}

export const supabase = createSupabaseClient();
