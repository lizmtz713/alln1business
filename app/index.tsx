import { useEffect } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../src/providers/AuthProvider';

export default function IndexScreen() {
  const router = useRouter();
  const { session, profile, loading } = useAuth();

  useEffect(() => {
    if (loading) return;

    if (!session) {
      router.replace('/(auth)/login' as never);
      return;
    }

    if (!profile?.onboarding_completed) {
      router.replace('/(auth)/onboarding' as never);
      return;
    }

    router.replace('/(tabs)' as never);
  }, [loading, session, profile?.onboarding_completed, router]);

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-900">
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text className="mt-4 text-slate-400">Loading...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 items-center justify-center bg-slate-900">
      <ActivityIndicator size="large" color="#3B82F6" />
    </View>
  );
}
