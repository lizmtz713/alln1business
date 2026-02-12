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

export default function LoginScreen() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignIn = async () => {
    setError(null);
    if (!email.trim() || !password) {
      setError('Please enter email and password.');
      return;
    }
    setLoading(true);
    const { error: err } = await signIn(email.trim(), password);
    setLoading(false);
    if (err) {
      setError(err.message ?? 'Sign in failed.');
    } else {
      router.replace('/');
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-slate-900"
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24 }}
        keyboardShouldPersistTaps="handled"
      >
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

        <View className="mt-8 items-center">
          <Text className="text-slate-500">or</Text>
          <TouchableOpacity className="mt-3 rounded-xl border border-slate-600 px-6 py-3">
            <Text className="text-slate-300">Continue with Google (coming soon)</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
