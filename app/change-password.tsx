import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../src/providers/AuthProvider';
import { useToast } from '../src/components/ui';
import { hapticSuccess } from '../src/lib/haptics';
import { sanitizePasswordInput } from '../src/lib/sanitize';

export default function ChangePasswordScreen() {
  const router = useRouter();
  const { updatePassword, hasSupabaseConfig, user } = useAuth();
  const toast = useToast();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    const safeNew = sanitizePasswordInput(newPassword);
    const safeConfirm = sanitizePasswordInput(confirmPassword);
    if (safeNew.length < 6) {
      toast.show('Password must be at least 6 characters.', 'error');
      return;
    }
    if (safeNew !== safeConfirm) {
      toast.show('Passwords do not match.', 'error');
      return;
    }

    setLoading(true);
    const { error } = await updatePassword(safeNew);
    setLoading(false);

    if (error) {
      toast.show(error, 'error');
    } else {
      hapticSuccess();
      toast.show('Password updated successfully.', 'success');
      router.back();
    }
  };

  if (!hasSupabaseConfig) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-900 p-8">
        <Text className="mb-4 text-2xl font-bold text-white">Connect Supabase</Text>
        <Text className="text-center text-slate-400">Supabase is required.</Text>
      </View>
    );
  }

  if (!user) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-900 p-8">
        <Text className="mb-4 text-2xl font-bold text-white">Sign In Required</Text>
        <Text className="text-center text-slate-400">You must be signed in to change your password.</Text>
        <TouchableOpacity onPress={() => router.back()} className="mt-4">
          <Text className="text-blue-400">Go Back</Text>
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
        contentContainerStyle={{ flexGrow: 1, padding: 24, paddingTop: 48 }}
        keyboardShouldPersistTaps="handled"
      >
        <TouchableOpacity onPress={() => router.back()} className="mb-6">
          <Text className="text-blue-400">← Back</Text>
        </TouchableOpacity>

        <Text className="mb-2 text-2xl font-bold text-white">Change Password</Text>
        <Text className="mb-6 text-slate-400">Enter and confirm your new password.</Text>

        <Text className="mb-2 text-slate-400">New password</Text>
        <TextInput
          className="mb-4 rounded-xl border border-slate-600 bg-slate-800 px-4 py-3 text-white"
          placeholder="Min 6 characters"
          placeholderTextColor="#94A3B8"
          value={newPassword}
          onChangeText={setNewPassword}
          secureTextEntry
          autoComplete="new-password"
          editable={!loading}
        />

        <Text className="mb-2 text-slate-400">Confirm new password</Text>
        <TextInput
          className="mb-6 rounded-xl border border-slate-600 bg-slate-800 px-4 py-3 text-white"
          placeholder="Confirm password"
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
