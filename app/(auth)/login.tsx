import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../../src/providers/AuthProvider';
import { GoogleSignInButton } from '../../src/components/GoogleSignInButton';

export default function LoginScreen() {
  const { signIn, hasSupabaseConfig } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignIn = async () => {
    setError(null);
    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();
    if (!trimmedEmail || !trimmedPassword) {
      setError('Please enter email and password.');
      return;
    }
    setLoading(true);
    try {
      const { error: err } = await signIn(trimmedEmail, trimmedPassword);
      setLoading(false);
      if (err) {
        setError(err.message ?? 'Sign in failed.');
        Alert.alert('Sign In Failed', err.message ?? 'Sign in failed.');
      } else {
        router.replace('/');
      }
    } catch (e) {
      setLoading(false);
      const msg = (e as Error)?.message ?? 'Sign in failed.';
      setError(msg);
      Alert.alert('Sign In Failed', msg);
    }
  };

  if (!hasSupabaseConfig) {
    return (
      <View style={styles.container}>
        <View style={styles.center}>
          <Text style={styles.title}>Alln1Home</Text>
          <Text style={styles.tagline}>Your household, simplified.</Text>
          <Text style={styles.configError}>
            Add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY to .env.local, then restart.
          </Text>
        </View>
        <Text style={styles.debug}>Supabase: not configured</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.center}>
          <Text style={styles.title}>Alln1Home</Text>
          <Text style={styles.tagline}>Your household, simplified.</Text>

          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor="#94A3B8"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
            editable={!loading}
          />
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor="#94A3B8"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete="password"
            editable={!loading}
          />

          <TouchableOpacity
            style={[styles.primaryButton, loading && styles.primaryButtonDisabled]}
            onPress={handleSignIn}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.primaryButtonText}>Sign In</Text>
            )}
          </TouchableOpacity>

          <View style={styles.dividerWrap}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or continue with</Text>
            <View style={styles.dividerLine} />
          </View>

          <View style={styles.googleWrap}>
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
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A' },
  scrollContent: { flexGrow: 1, justifyContent: 'center', padding: 24, paddingBottom: 48 },
  center: { alignItems: 'center' },
  title: { fontSize: 32, fontWeight: '700', color: '#F8FAFC' },
  tagline: { marginTop: 8, fontSize: 16, color: '#94A3B8' },
  configError: { marginTop: 24, textAlign: 'center', color: '#94A3B8', paddingHorizontal: 16 },
  errorBox: { marginTop: 16, padding: 12, backgroundColor: 'rgba(239,68,68,0.2)', borderRadius: 8, maxWidth: '100%', width: '100%' },
  errorText: { color: '#FCA5A5' },
  input: {
    width: '100%',
    maxWidth: 320,
    marginTop: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
    backgroundColor: '#1E293B',
    color: '#F8FAFC',
    fontSize: 16,
  },
  primaryButton: {
    width: '100%',
    maxWidth: 320,
    marginTop: 20,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonDisabled: { opacity: 0.7 },
  primaryButtonText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  dividerWrap: { flexDirection: 'row', alignItems: 'center', width: '100%', maxWidth: 320, marginTop: 24 },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#334155' },
  dividerText: { marginHorizontal: 12, fontSize: 14, color: '#64748B' },
  googleWrap: { marginTop: 16, width: '100%', maxWidth: 320 },
  debug: {
    marginTop: 24,
    paddingTop: 24,
    textAlign: 'center',
    fontSize: 12,
    color: '#64748B',
  },
});
