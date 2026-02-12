import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import * as Linking from 'expo-linking';
import { router } from 'expo-router';
import { useAuth } from '../../src/providers/AuthProvider';
import { useToast } from '../../src/components/ui';
import { supabase, hasSupabaseConfig } from '../../src/services/supabase';
import { hapticSuccess } from '../../src/lib/haptics';

function extractParamsFromUrl(url: string): { access_token?: string; refresh_token?: string; type?: string } {
  try {
    const parsed = new URL(url);
    const hash = parsed.hash?.substring(1) ?? '';
    const params = new URLSearchParams(hash);
    return {
      access_token: params.get('access_token') ?? undefined,
      refresh_token: params.get('refresh_token') ?? undefined,
      type: params.get('type') ?? undefined,
    };
  } catch {
    return {};
  }
}

export default function ResetPasswordScreen() {
  const { updatePassword, hasSupabaseConfig } = useAuth();
  const toast = useToast();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkingUrl, setCheckingUrl] = useState(true);
  const [hasRecoverySession, setHasRecoverySession] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function checkInitialUrl() {
      if (!hasSupabaseConfig) {
        setCheckingUrl(false);
        return;
      }

      try {
        const url = await Linking.getInitialURL();
        if (url && !cancelled) {
          const { access_token, refresh_token, type } = extractParamsFromUrl(url);
          if (access_token && refresh_token && type === 'recovery') {
            const { error } = await supabase.auth.setSession({ access_token, refresh_token });
            if (!error) setHasRecoverySession(true);
          }
        }
      } catch {
        // ignore
      }
      if (!cancelled) setCheckingUrl(false);
    }

    checkInitialUrl();
    return () => { cancelled = true; };
  }, [hasSupabaseConfig]);

  useEffect(() => {
    const sub = Linking.addEventListener('url', (event) => {
      const { access_token, refresh_token, type } = extractParamsFromUrl(event.url);
      if (access_token && refresh_token && type === 'recovery') {
        supabase.auth.setSession({ access_token, refresh_token }).then(({ error }) => {
          if (!error) setHasRecoverySession(true);
        });
      }
    });
    return () => sub.remove();
  }, []);

  const handleSubmit = async () => {
    if (newPassword.length < 6) {
      toast.show('Password must be at least 6 characters.', 'error');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.show('Passwords do not match.', 'error');
      return;
    }

    setLoading(true);
    const { error } = await updatePassword(newPassword);
    setLoading(false);

    if (error) {
      toast.show(error, 'error');
    } else {
      hapticSuccess();
      toast.show('Password updated successfully.', 'success');
      router.replace('/');
    }
  };

  if (!hasSupabaseConfig) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-900 p-8">
        <Text className="mb-4 text-2xl font-bold text-white">Connect Supabase</Text>
        <Text className="text-center text-slate-400">Supabase is required for password reset.</Text>
      </View>
    );
  }

  if (checkingUrl) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-900">
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text className="mt-4 text-slate-400">Loading...</Text>
      </View>
    );
  }

  if (!hasRecoverySession) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-900 p-8">
        <Text className="mb-4 text-2xl font-bold text-white">Invalid or Expired Link</Text>
        <Text className="mb-6 text-center text-slate-400">
          This reset link may have expired. Request a new one from the login screen.
        </Text>
        <TouchableOpacity onPress={() => router.replace('/(auth)/login' as never)}>
          <Text className="text-blue-400">Back to Login</Text>
        </TouchableOpacity>
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
        <Text className="mb-2 text-2xl font-bold text-white">Set New Password</Text>
        <Text className="mb-6 text-slate-400">Enter your new password below.</Text>

        <TextInput
          className="mb-4 rounded-xl border border-slate-600 bg-slate-800 px-4 py-3 text-white"
          placeholder="New password (min 6 characters)"
          placeholderTextColor="#94A3B8"
          value={newPassword}
          onChangeText={setNewPassword}
          secureTextEntry
          autoComplete="new-password"
          editable={!loading}
        />

        <TextInput
          className="mb-6 rounded-xl border border-slate-600 bg-slate-800 px-4 py-3 text-white"
          placeholder="Confirm new password"
          placeholderTextColor="#94A3B8"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
          autoComplete="new-password"
          editable={!loading}
        />

        <TouchableOpacity
          className="rounded-xl bg-blue-500 py-3"
          onPress={handleSubmit}
          disabled={loading}
        >
          <Text className="text-center font-semibold text-white">
            {loading ? 'Updating...' : 'Update Password'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
