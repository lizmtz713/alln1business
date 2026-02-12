import { useEffect } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../src/providers/AuthProvider';
import { colors } from '../src/lib/constants';

export default function IndexScreen() {
  const router = useRouter();
  const { session, profile, loading } = useAuth();

  useEffect(() => {
    if (loading) return;

    if (!session) {
      router.replace('/(auth)/login');
      return;
    }

    if (!profile?.onboarding_completed) {
      router.replace('/(auth)/onboarding');
      return;
    }

    router.replace('/(tabs)');
  }, [loading, session, profile?.onboarding_completed, router]);

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}>
      <ActivityIndicator size="large" color={colors.accent} />
      <Text style={{ marginTop: 16, color: colors.textMuted }}>Loading...</Text>
    </View>
  );
}
