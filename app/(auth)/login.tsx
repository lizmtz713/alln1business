import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Pressable,
  Alert,
} from 'react-native';
import { Link, router } from 'expo-router';
import { useAuth } from '../../src/providers/AuthProvider';
import { GoogleSignInButton } from '../../src/components/GoogleSignInButton';
import { sanitizeEmail, isValidEmailFormat, sanitizePasswordInput } from '../../src/lib/sanitize';

export default function LoginScreen() {
  const { signIn, hasSupabaseConfig } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignIn = async () => {
    console.log('[Login] handleSignIn called');
    setError(null);
    const safeEmail = sanitizeEmail(email);
    const safePassword = sanitizePasswordInput(password);
    if (!safeEmail || !safePassword) {
      setError('Please enter email and password.');
      return;
    }
    if (!isValidEmailFormat(safeEmail)) {
      setError('Please enter a valid email address.');
      return;
    }
    setLoading(true);
    try {
      const { error: err } = await signIn(safeEmail, safePassword);
      setLoading(false);
      if (err) {
        const msg = err?.message ?? 'Sign in failed.';
        setError(msg);
        Alert.alert('Sign In Failed', msg);
      } else {
        router.replace('/');
      }
    } catch (e) {
      setLoading(false);
      const msg = (e as Error)?.message ?? 'Sign in failed.';
      console.error('[Login] handleSignIn threw:', e);
      setError(msg);
      Alert.alert('Sign In Failed', msg);
    }
  };

  if (!hasSupabaseConfig) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-900 p-8">
        <Text className="mb-4 text-2xl font-bold text-white">Connect Supabase</Text>
        <Text className="text-center text-slate-400">
          Add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY to .env.local, then restart.
        </Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-slate-900"
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* DEBUG: tap this to verify touches work. Remove when done debugging. */}
        <TouchableOpacity
          onPress={() => Alert.alert('TEST', 'Button works')}
          style={{ backgroundColor: 'red', padding: 12, marginBottom: 16, borderRadius: 8 }}
        >
          <Text style={{ color: 'white', fontWeight: '600' }}>TEST TOUCH (tap me)</Text>
        </TouchableOpacity>

        <View className="mb-8 items-center">
          <Text className="text-3xl font-bold text-white">ALLN1 Business</Text>
          <Text className="mt-2 text-slate-400">Sign in to continue</Text>
        </View>

        {error ? (
          <View className="mb-4 rounded-lg bg-red-500/20 p-3">
            <Text className="text-red-400">{error}</Text>
          </View>
        ) : null}

        <TextInput
          className="mb-4 rounded-xl border border-slate-600 bg-slate-800 px-4 py-3 text-white"
          placeholder="Email"
          placeholderTextColor="#94A3B8"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          autoComplete="email"
          editable={!loading}
        />

        <View className="relative mb-6">
          <TextInput
            className="rounded-xl border border-slate-600 bg-slate-800 px-4 py-3 pr-12 text-white"
            placeholder="Password"
            placeholderTextColor="#94A3B8"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            autoComplete="password"
            editable={!loading}
          />
          <TouchableOpacity
            className="absolute right-3 top-0 h-full justify-center"
            onPress={() => setShowPassword(!showPassword)}
          >
            <Text className="text-blue-400">{showPassword ? 'Hide' : 'Show'}</Text>
          </TouchableOpacity>
        </View>

        <Link href={'/(auth)/forgot-password' as never} asChild>
          <TouchableOpacity className="mb-4 self-end">
            <Text className="text-blue-400 text-sm">Forgot password?</Text>
          </TouchableOpacity>
        </Link>

        <TouchableOpacity
          className="mb-4 rounded-xl bg-blue-500 py-3"
          onPress={handleSignIn}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="text-center font-semibold text-white">Sign In</Text>
          )}
        </TouchableOpacity>

        <Link href={'/(auth)/signup' as never} asChild>
          <Pressable>
            <Text className="text-center text-slate-400">
              Don&apos;t have an account? <Text className="text-blue-400">Sign up</Text>
            </Text>
          </Pressable>
        </Link>

        <View className="mt-8 w-full">
          <View className="mb-3 flex-row items-center gap-3">
            <View className="h-px flex-1 bg-slate-600" />
            <Text className="text-slate-500">or continue with</Text>
            <View className="h-px flex-1 bg-slate-600" />
          </View>
          <GoogleSignInButton
            onSuccess={() => router.replace('/')}
            onError={(msg) => {
              setError(msg);
              Alert.alert('Google Sign In Failed', msg);
            }}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
