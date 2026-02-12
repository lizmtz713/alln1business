import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Pressable,
} from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../../src/providers/AuthProvider';
import { supabase } from '../../src/services/supabase';

const BUSINESS_TYPES = [
  { id: 'freelance', label: 'Freelance / Consulting', icon: '💼' },
  { id: 'service', label: 'Service Business', icon: '🛠' },
  { id: 'retail', label: 'Retail / E-commerce', icon: '🛒' },
  { id: 'other', label: 'Other', icon: '📦' },
];

const ENTITY_TYPES = [
  'Sole Proprietorship',
  'LLC',
  'Corporation',
  'Partnership',
  'Not sure yet',
];

const CHALLENGES = [
  { id: 'expenses', label: 'Tracking expenses', icon: '🧾' },
  { id: 'taxes', label: 'Managing taxes', icon: '💰' },
  { id: 'invoicing', label: 'Invoicing clients', icon: '📄' },
  { id: 'organized', label: 'Staying organized', icon: '📋' },
  { id: 'all', label: 'All of it!', icon: '🤯' },
];

export default function OnboardingScreen() {
  const { user, refreshProfile } = useAuth();

  useEffect(() => {
    if (!user?.id) {
      router.replace('/(auth)/login' as never);
    }
  }, [user?.id]);
  const [step, setStep] = useState(0);
  const [businessName, setBusinessName] = useState('');
  const [businessType, setBusinessType] = useState<string | null>(null);
  const [entityType, setEntityType] = useState<string | null>(null);
  const [challenge, setChallenge] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [saveError, setSaveError] = useState<string | null>(null);

  const handleComplete = async () => {
    if (!user?.id) return;
    setSaveError(null);
    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .upsert(
          {
            id: user.id,
            email: (user as { email?: string }).email ?? '',
            business_name: businessName || null,
            business_type: businessType,
            entity_type: entityType,
            onboarding_completed: true,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'id' }
        );
      if (error) {
        const isTableMissing = /relation.*does not exist|42P01/i.test(error.message ?? '');
        setSaveError(isTableMissing ? 'Profiles table missing. Run docs/supabase-profiles-schema.sql in Supabase.' : error.message);
        setSaving(false);
        return;
      }
      await refreshProfile();
      router.replace('/(tabs)' as never);
    } catch (e) {
      const msg = (e as Error)?.message ?? 'Save failed';
      const isTableMissing = /relation.*does not exist|42P01/i.test(msg);
      setSaveError(isTableMissing ? 'Profiles table missing. Run docs/supabase-profiles-schema.sql in Supabase.' : msg);
    } finally {
      setSaving(false);
    }
  };

  if (!user?.id) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-900">
        <Text className="text-slate-400">Loading...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-slate-900">
      <ScrollView
        contentContainerStyle={{ padding: 24, paddingTop: 48 }}
        keyboardShouldPersistTaps="handled"
      >
        {step === 0 && (
          <>
            <Text className="mb-2 text-2xl font-bold text-white">
              What&apos;s your business name?
            </Text>
            <TextInput
              className="mb-6 rounded-xl border border-slate-600 bg-slate-800 px-4 py-3 text-white"
              placeholder="Enter business name"
              placeholderTextColor="#94A3B8"
              value={businessName}
              onChangeText={setBusinessName}
              autoFocus
            />
            <TouchableOpacity
              className="rounded-xl bg-blue-500 py-3"
              onPress={() => setStep(1)}
            >
              <Text className="text-center font-semibold text-white">Continue</Text>
            </TouchableOpacity>
            <Pressable onPress={() => setStep(1)} className="mt-4">
              <Text className="text-center text-slate-400">Skip</Text>
            </Pressable>
          </>
        )}

        {step === 1 && (
          <>
            <Text className="mb-6 text-2xl font-bold text-white">
              What type of business?
            </Text>
            {BUSINESS_TYPES.map((t) => (
              <TouchableOpacity
                key={t.id}
                className="mb-3 flex-row items-center rounded-xl border border-slate-600 bg-slate-800 p-4"
                onPress={() => {
                  setBusinessType(t.id);
                  setStep(2);
                }}
              >
                <Text className="mr-3 text-2xl">{t.icon}</Text>
                <Text className="text-white">{t.label}</Text>
              </TouchableOpacity>
            ))}
          </>
        )}

        {step === 2 && (
          <>
            <Text className="mb-6 text-2xl font-bold text-white">
              How is your business structured?
            </Text>
            {ENTITY_TYPES.map((e) => (
              <TouchableOpacity
                key={e}
                className="mb-3 flex-row items-center rounded-xl border border-slate-600 bg-slate-800 p-4"
                onPress={() => {
                  setEntityType(e);
                  setStep(3);
                }}
              >
                <Text className="text-white">{e}</Text>
              </TouchableOpacity>
            ))}
          </>
        )}

        {step === 3 && (
          <>
            <Text className="mb-6 text-2xl font-bold text-white">
              What&apos;s your biggest challenge?
            </Text>
            {CHALLENGES.map((c) => (
              <TouchableOpacity
                key={c.id}
                className="mb-3 flex-row items-center rounded-xl border border-slate-600 bg-slate-800 p-4"
                onPress={() => setChallenge(c.id)}
              >
                <Text className="mr-3 text-2xl">{c.icon}</Text>
                <Text className="text-white">{c.label}</Text>
              </TouchableOpacity>
            ))}
            {saveError ? (
              <View className="mb-4 rounded-lg bg-red-500/20 p-3">
                <Text className="text-red-400 text-sm">{saveError}</Text>
              </View>
            ) : null}
            <TouchableOpacity
              className="mt-6 rounded-xl bg-blue-500 py-3"
              onPress={handleComplete}
              disabled={saving}
            >
              <Text className="text-center font-semibold text-white">
                {saving ? 'Saving...' : "Let's Get Started!"}
              </Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </View>
  );
}
