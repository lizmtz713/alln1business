import { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../src/providers/AuthProvider';

const INTRO_SEEN_KEY = 'alln1_intro_seen';
const ONBOARDING_PAUSED_KEY = 'alln1_onboarding_paused';

export default function IndexScreen() {
  const router = useRouter();
  const { session, profile, profileLoadError, loading, hasSupabaseConfig } = useAuth();
  const [introChecked, setIntroChecked] = useState(false);
  const [pausedChecked, setPausedChecked] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!hasSupabaseConfig) return;

    if (!session) {
      AsyncStorage.getItem(INTRO_SEEN_KEY).then((seen) => {
        setIntroChecked(true);
        router.replace((seen === 'true' ? '/(auth)/login' : '/(auth)/intro') as never);
      });
      return;
    }

    if (profileLoadError === 'profiles_table_missing') return;

    if (!profile?.onboarding_completed) {
      AsyncStorage.getItem(ONBOARDING_PAUSED_KEY).then((paused) => {
        setPausedChecked(true);
        if (paused === 'true') {
          router.replace('/(tabs)' as never);
        } else {
          router.replace('/(auth)/voice-onboarding' as never);
        }
      });
      return;
    }

    router.replace('/(tabs)' as never);
  }, [loading, session, profile?.onboarding_completed, profileLoadError, hasSupabaseConfig, router]);

  const waitingForPausedCheck = !profile?.onboarding_completed && !pausedChecked && session;

  if (loading || (!session && !introChecked) || waitingForPausedCheck) {
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
