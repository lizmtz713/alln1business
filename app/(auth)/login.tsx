import { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Alert } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../../src/providers/AuthProvider';
import { GoogleSignInButton } from '../../src/components/GoogleSignInButton';

export default function LoginScreen() {
  const { signInWithGoogle, hasSupabaseConfig } = useAuth();
  const [error, setError] = useState<string | null>(null);

  if (!hasSupabaseConfig) {
    return (
      <View style={styles.container}>
        <View style={styles.center}>
          <Text style={styles.title}>Alln1Home</Text>
          <Text style={styles.tagline}>Your household, in one place.</Text>
          <Text style={styles.configError}>
            Add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY to .env.local, then restart.
          </Text>
        </View>
        <Text style={styles.debug}>Supabase: not configured</Text>
      </View>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={styles.scrollContent}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.center}>
        <Text style={styles.title}>Alln1Home</Text>
        <Text style={styles.tagline}>Your household, in one place.</Text>

        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <View style={styles.buttonWrap}>
          <GoogleSignInButton
            onSuccess={() => router.replace('/')}
            onError={(msg) => {
              setError(msg);
              Alert.alert('Google Sign In Failed', msg);
            }}
          />
        </View>
      </View>

      <Text style={styles.debug}>Supabase: connected</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A' },
  scrollContent: { flexGrow: 1, justifyContent: 'center', padding: 24, paddingBottom: 48 },
  center: { alignItems: 'center' },
  title: { fontSize: 32, fontWeight: '700', color: '#F8FAFC' },
  tagline: { marginTop: 8, fontSize: 16, color: '#94A3B8' },
  configError: { marginTop: 24, textAlign: 'center', color: '#94A3B8', paddingHorizontal: 16 },
  errorBox: { marginTop: 16, padding: 12, backgroundColor: 'rgba(239,68,68,0.2)', borderRadius: 8, maxWidth: '100%' },
  errorText: { color: '#FCA5A5' },
  buttonWrap: { marginTop: 32, width: '100%', maxWidth: 320 },
  debug: {
    marginTop: 'auto',
    paddingTop: 24,
    textAlign: 'center',
    fontSize: 12,
    color: '#64748B',
  },
});
