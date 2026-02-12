import { useState } from 'react';
import { View, Text, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/providers/AuthProvider';
import { Button, Input } from '../../src/components/ui';
import { colors, spacing, fontSize } from '../../src/lib/constants';

export default function SignupScreen() {
  const router = useRouter();
  const { signUp } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSignUp = async () => {
    if (!email || !password || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    setError('');
    const { error: signUpError } = await signUp(email, password);
    setLoading(false);
    if (signUpError) {
      setError(signUpError.message);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: spacing.xl }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Title */}
        <View style={{ alignItems: 'center', marginBottom: spacing.xxxl }}>
          <Text style={{ fontSize: fontSize.xxxl, fontWeight: 'bold', color: colors.text }}>
            Create Account
          </Text>
          <Text style={{ fontSize: fontSize.base, color: colors.textMuted, marginTop: spacing.xs }}>
            Start organizing your life
          </Text>
        </View>

        {/* Form */}
        <View style={{ gap: spacing.lg }}>
          <Input
            label="Email"
            placeholder="you@example.com"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <Input
            label="Password"
            placeholder="••••••••"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
          <Input
            label="Confirm Password"
            placeholder="••••••••"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
          />

          {error ? (
            <Text style={{ color: colors.error, fontSize: fontSize.sm }}>{error}</Text>
          ) : null}

          <Button title="Create Account" onPress={handleSignUp} loading={loading} />

          <TouchableOpacity onPress={() => router.back()}>
            <Text style={{ color: colors.textMuted, textAlign: 'center', fontSize: fontSize.sm }}>
              Already have an account? <Text style={{ color: colors.accent }}>Sign in</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
