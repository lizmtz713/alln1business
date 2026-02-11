import { Link } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { supabase } from '@/src/services/supabase';

export default function SignupScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignup = async () => {
    if (!email || !password) {
      Alert.alert('Missing info', 'Enter both email and password.');
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
    });
    setLoading(false);

    if (error) {
      Alert.alert('Signup failed', error.message);
      return;
    }

    Alert.alert('Check your email', 'Confirm your account to continue.');
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-900 px-6 py-10">
      <View className="flex-1 gap-6">
        <View>
          <Text className="text-3xl font-semibold text-white">
            Create your account
          </Text>
          <Text className="mt-2 text-slate-400">
            Start building with Alln1 Business.
          </Text>
        </View>

        <View className="gap-4">
          <View>
            <Text className="text-sm text-slate-300">Email</Text>
            <TextInput
              className="mt-2 rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 text-white"
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              placeholder="you@company.com"
              placeholderTextColor="#64748b"
              value={email}
              onChangeText={setEmail}
            />
          </View>
          <View>
            <Text className="text-sm text-slate-300">Password</Text>
            <TextInput
              className="mt-2 rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 text-white"
              secureTextEntry
              placeholder="Create a password"
              placeholderTextColor="#64748b"
              value={password}
              onChangeText={setPassword}
            />
          </View>
        </View>

        <Pressable
          className={`rounded-lg py-3 ${
            loading ? 'bg-slate-700' : 'bg-indigo-500'
          }`}
          onPress={handleSignup}
          disabled={loading}
        >
          <Text className="text-center text-base font-semibold text-white">
            {loading ? 'Creating...' : 'Create Account'}
          </Text>
        </Pressable>

        <View className="flex-row justify-center gap-2">
          <Text className="text-slate-400">Already have an account?</Text>
          <Link href="/(auth)/login" className="text-indigo-400">
            Sign in
          </Link>
        </View>
      </View>
    </SafeAreaView>
  );
}
