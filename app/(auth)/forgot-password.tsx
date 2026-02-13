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
} from 'react-native';
import { Link, router } from 'expo-router';
import { useAuth } from '../../src/providers/AuthProvider';
import { useToast } from '../../src/components/ui';
import { sanitizeEmail, isValidEmailFormat } from '../../src/lib/sanitize';

export default function ForgotPasswordScreen() {
  const { resetPassword, hasSupabaseConfig } = useAuth();
  const toast = useToast();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async () => {
    const safeEmail = sanitizeEmail(email);
    if (!safeEmail) {
      toast.show('Enter your email address.', 'error');
      return;
    }
    if (!isValidEmailFormat(safeEmail)) {
      toast.show('Please enter a valid email address.', 'error');
      return;
    }
    setLoading(true);
    setSent(false);
    const { error } = await resetPassword(safeEmail);
    setLoading(false);
    if (error) {
      toast.show(error, 'error');
    } else {
      setSent(true);
      toast.show('Check your email for the reset link.', 'success');
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
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24 }}
        keyboardShouldPersistTaps="handled"
      >
        <Link href={'/(auth)/login' as never} asChild>
          <TouchableOpacity className="mb-6">
            <Text className="text-blue-400">Back to Login</Text>
          </TouchableOpacity>
        </Link>

        <Text className="mb-2 text-2xl font-bold text-white">Forgot Password?</Text>
        <Text className="mb-6 text-slate-400">
          Enter your email and we will send you a link to reset your password.
        </Text>

        {sent ? (
          <View className="mb-6 rounded-lg bg-green-500/20 p-4">
            <Text className="text-green-400">
              Check your email for a reset link. It may take a few minutes to arrive.
            </Text>
          </View>
        ) : (
          <>
            <TextInput
              className="mb-6 rounded-xl border border-slate-600 bg-slate-800 px-4 py-3 text-white"
              placeholder="Email"
              placeholderTextColor="#94A3B8"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
              editable={!loading}
            />

            <TouchableOpacity
              className="rounded-xl bg-blue-500 py-3"
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text className="text-center font-semibold text-white">Send Reset Link</Text>
              )}
            </TouchableOpacity>
          </>
        )}

        <TouchableOpacity
          onPress={() => router.replace('/(auth)/login' as never)}
          className="mt-6"
        >
          <Text className="text-center text-slate-400">Back to Login</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
