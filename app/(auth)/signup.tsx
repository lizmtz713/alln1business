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
} from 'react-native';
import { Link, router } from 'expo-router';
import { useAuth } from '../../src/providers/AuthProvider';
import { GoogleSignInButton } from '../../src/components/GoogleSignInButton';

export default function SignupScreen() {
  const { signUp, hasSupabaseConfig } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignUp = async () => {
    setError(null);
    if (!email.trim() || !password || !confirmPassword) {
      setError('Please fill in all fields.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);
    const { error: err } = await signUp(email.trim(), password);
    setLoading(false);
    if (err) {
      setError(err.message ?? 'Sign up failed.');
    } else {
      router.replace('/');
    }
  };

  if (!hasSupabaseConfig) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-900 p-8">
        <Text className="mb-4 text-2xl font-bold text-white">Connect Supabase</Text>
        <Text className="text-center text-slate-400">
          Add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY to .env.local.
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
        contentContainerStyle={{ flexGrow: 1, padding: 24, paddingTop: 48 }}
        keyboardShouldPersistTaps="handled"
      >
        <Link href={'/(auth)/login' as never} asChild>
          <Pressable className="mb-6">
            <Text className="text-blue-400">← Back</Text>
          </Pressable>
        </Link>

        <Text className="mb-2 text-2xl font-bold text-white">Create Account</Text>
        <Text className="mb-6 text-slate-400">Get started with Alln1 Business</Text>

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

        <View className="relative mb-4">
          <TextInput
            className="rounded-xl border border-slate-600 bg-slate-800 px-4 py-3 pr-12 text-white"
            placeholder="Password (min 6 characters)"
            placeholderTextColor="#94A3B8"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            autoComplete="new-password"
            editable={!loading}
          />
          <TouchableOpacity
            className="absolute right-3 top-0 h-full justify-center"
            onPress={() => setShowPassword(!showPassword)}
          >
            <Text className="text-blue-400">{showPassword ? 'Hide' : 'Show'}</Text>
          </TouchableOpacity>
        </View>

        <TextInput
          className="mb-6 rounded-xl border border-slate-600 bg-slate-800 px-4 py-3 text-white"
          placeholder="Confirm password"
          placeholderTextColor="#94A3B8"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry={!showPassword}
          autoComplete="new-password"
          editable={!loading}
        />

        <TouchableOpacity
          className="mb-4 rounded-xl bg-blue-500 py-3"
          onPress={handleSignUp}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="text-center font-semibold text-white">Create Account</Text>
          )}
        </TouchableOpacity>

        <Link href={'/(auth)/login' as never} asChild>
          <Pressable>
            <Text className="text-center text-slate-400">
              Already have an account? <Text className="text-blue-400">Sign in</Text>
            </Text>
          </Pressable>
        </Link>

        <View className="mt-8 items-center">
          <Text className="text-slate-500">or</Text>
          <View className="mt-3 w-full">
            <GoogleSignInButton
              onSuccess={() => router.replace('/')}
              onError={(msg) => setError(msg)}
            />
          </View>
        </View>

        <Text className="mt-8 text-center text-xs text-slate-500">
          By signing up, you agree to our Terms and Privacy Policy
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
