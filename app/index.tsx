import { useEffect } from 'react';
import { View, Text, ActivityIndicator, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../src/providers/AuthProvider';

export default function IndexScreen() {
  const router = useRouter();
  const { session, profile, profileLoadError, loading, hasSupabaseConfig } = useAuth();

  useEffect(() => {
    if (loading) return;

    if (!hasSupabaseConfig) return;

    if (!session) {
      router.replace('/(auth)/login' as never);
      return;
    }

    if (profileLoadError === 'profiles_table_missing') return;

    if (!profile?.onboarding_completed) {
      router.replace('/(auth)/onboarding' as never);
      return;
    }

    router.replace('/(tabs)' as never);
  }, [loading, session, profile?.onboarding_completed, profileLoadError, hasSupabaseConfig, router]);

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-900">
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text className="mt-4 text-slate-400">Loading...</Text>
      </View>
    );
  }

  if (!hasSupabaseConfig) {
    return (
      <ScrollView contentContainerStyle={{ flex: 1, justifyContent: 'center', padding: 24 }} className="flex-1 bg-slate-900">
        <Text className="mb-4 text-2xl font-bold text-white">Connect Supabase</Text>
        <Text className="mb-6 text-slate-400">
          Add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY to .env.local, then restart.
        </Text>
        <Text className="text-sm text-slate-500">Get keys: Supabase Dashboard → Project Settings → API</Text>
      </ScrollView>
    );
  }

  if (session && profileLoadError === 'profiles_table_missing') {
    return (
      <ScrollView contentContainerStyle={{ flex: 1, justifyContent: 'center', padding: 24 }} className="flex-1 bg-slate-900">
        <Text className="mb-4 text-2xl font-bold text-white">Database Setup Required</Text>
        <Text className="mb-6 text-slate-400">Run the profiles schema in Supabase, then re-open the app.</Text>
        <Text className="text-sm text-slate-500">File: docs/supabase-profiles-schema.sql</Text>
        <Text className="mt-4 text-sm text-slate-500">Supabase → SQL Editor → paste schema → Run</Text>
      </ScrollView>
    );
  }

  return (
    <View className="flex-1 items-center justify-center bg-slate-900">
      <ActivityIndicator size="large" color="#3B82F6" />
    </View>
  );
}
