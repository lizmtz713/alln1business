import { useState } from 'react';
import { View, Text, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/providers/AuthProvider';
import { Button, Input } from '../../src/components/ui';
import { colors, spacing, fontSize } from '../../src/lib/constants';

export default function LoginScreen() {
  const router = useRouter();
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSignIn = async () => {
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }
    setLoading(true);
    setError('');
    const { error: signInError } = await signIn(email, password);
    setLoading(false);
    if (signInError) {
      setError(signInError.message);
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
        {/* Logo / Title */}
        <View style={{ alignItems: 'center', marginBottom: spacing.xxxl }}>
          <Text style={{ fontSize: 48, marginBottom: spacing.sm }}>🏠</Text>
          <Text style={{ fontSize: fontSize.xxxl, fontWeight: 'bold', color: colors.text }}>
            Life OS
          </Text>
          <Text style={{ fontSize: fontSize.base, color: colors.textMuted, marginTop: spacing.xs }}>
            Your entire life, simplified
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

          {error ? (
            <Text style={{ color: colors.error, fontSize: fontSize.sm }}>{error}</Text>
          ) : null}

          <Button title="Sign In" onPress={handleSignIn} loading={loading} />

          <TouchableOpacity onPress={() => router.push('/(auth)/signup')}>
            <Text style={{ color: colors.textMuted, textAlign: 'center', fontSize: fontSize.sm }}>
              Don't have an account? <Text style={{ color: colors.accent }}>Sign up</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
