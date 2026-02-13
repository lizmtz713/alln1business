import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../../src/providers/AuthProvider';
import { supabase } from '../../src/services/supabase';

const HOUSEHOLD_TYPES = [
  { id: 'family', label: 'Family with kids', icon: '👨‍👩‍👧‍👦' },
  { id: 'couple', label: 'Me and my partner', icon: '👫' },
  { id: 'solo', label: 'Just me', icon: '🏠' },
  { id: 'roommates', label: 'Roommates', icon: '🔑' },
  { id: 'other', label: 'Other', icon: '📦' },
];

const ENTITY_TYPES = [
  'Just me',
  'Me and my partner',
  'Family with kids',
  'Roommates',
  'Not sure yet',
];

const CHALLENGES = [
  { id: 'expenses', label: 'Tracking expenses', icon: '🧾' },
  { id: 'bills', label: 'Managing bills', icon: '📄' },
  { id: 'organized', label: 'Staying organized', icon: '📋' },
  { id: 'documents', label: 'Documents & records', icon: '📁' },
  { id: 'all', label: 'All of it!', icon: '🤯' },
];

export default function OnboardingScreen() {
  const { user, refreshProfile, profileLoadError } = useAuth();

  useEffect(() => {
    if (!user?.id) {
      router.replace('/(auth)/login' as never);
    }
  }, [user?.id]);
  const [step, setStep] = useState(0);
  const [householdName, setHouseholdName] = useState('');
  const [householdType, setHouseholdType] = useState<string | null>(null);
  const [entityType, setEntityType] = useState<string | null>(null);
  const [challenge, setChallenge] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [saveError, setSaveError] = useState<string | null>(null);

  const handleComplete = async () => {
    if (!user?.id) return;
    if (profileLoadError === 'profiles_table_missing') return;
    setSaveError(null);
    setSaving(true);
    try {
      const basePayload = {
        id: user.id,
        email: (user as { email?: string }).email ?? '',
        business_name: householdName || null,
        business_type: householdType,
        entity_type: entityType,
        onboarding_completed: true,
        updated_at: new Date().toISOString(),
      };
      const { error } = await supabase
        .from('profiles')
        .upsert(
          challenge
            ? { ...basePayload, onboarding_challenge: challenge }
            : basePayload,
          { onConflict: 'id' }
        );
      if (error) {
        const msg = error.message ?? '';
        const isTableMissing = /relation.*does not exist|42P01/i.test(msg);
        const isUnknownCol = /column.*onboarding_challenge|42703/i.test(msg);
        let errText = msg;
        if (isTableMissing) errText = 'Profiles table missing. Run docs/supabase-profiles-schema.sql in Supabase.';
        else if (isUnknownCol) {
          // Retry without challenge so onboarding completes
          const { error: retryErr } = await supabase
            .from('profiles')
            .upsert(basePayload, { onConflict: 'id' });
          if (!retryErr) {
            await refreshProfile();
            router.replace('/(tabs)' as never);
            return;
          }
          errText = 'Run docs/supabase-profiles-onboarding-challenge-migration.sql to save challenge.';
        }
        setSaveError(errText);
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

  if (profileLoadError === 'profiles_table_missing') {
    return (
      <View className="flex-1 items-center justify-center bg-slate-900 p-8">
        <Text className="mb-4 text-center text-xl font-bold text-white">Database Setup Required</Text>
        <Text className="mb-6 text-center text-slate-400">
          The profiles table is missing. Run the schema in Supabase before completing onboarding.
        </Text>
        <Text className="mb-2 text-center text-sm text-slate-500">File to run:</Text>
        <Text className="mb-6 font-mono text-blue-400" selectable>
          docs/supabase-profiles-schema.sql
        </Text>
        <Text className="text-center text-slate-500 text-sm">
          Supabase Dashboard → SQL Editor → paste schema → Run
        </Text>
        <TouchableOpacity
          className="mt-8 rounded-xl bg-slate-700 py-3 px-6"
          onPress={() => router.replace('/(auth)/login')}
        >
          <Text className="text-white">Back to Login</Text>
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
        contentContainerStyle={{ padding: 24, paddingTop: 48, paddingBottom: 48 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {step === 0 && (
          <>
            <Text className="mb-2 text-2xl font-bold text-white">
              What should we call your household?
            </Text>
            <TextInput
              className="mb-6 rounded-xl border border-slate-600 bg-slate-800 px-4 py-3 text-white"
              placeholder="Household or your name"
              placeholderTextColor="#94A3B8"
              value={householdName}
              onChangeText={setHouseholdName}
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
              What best describes your household?
            </Text>
            {HOUSEHOLD_TYPES.map((t) => (
              <TouchableOpacity
                key={t.id}
                className="mb-3 flex-row items-center rounded-xl border border-slate-600 bg-slate-800 p-4"
                onPress={() => {
                  setHouseholdType(t.id);
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
              Who uses this app?
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
              What do you want help with most?
            </Text>
            {CHALLENGES.map((c) => {
              const isSelected = challenge === c.id;
              return (
                <Pressable
                  key={c.id}
                  onPress={() => setChallenge(c.id)}
                  style={({ pressed }) => ({
                    flexDirection: 'row',
                    alignItems: 'center',
                    padding: 16,
                    marginBottom: 12,
                    borderRadius: 12,
                    borderWidth: 2,
                    borderColor: isSelected ? '#3B82F6' : '#334155',
                    backgroundColor: isSelected ? '#1E3A5F' : pressed ? '#334155' : '#1E293B',
                  })}
                >
                  <Text style={{ fontSize: 24, marginRight: 12 }}>{c.icon}</Text>
                  <Text style={{ color: '#F8FAFC', fontSize: 16 }}>{c.label}</Text>
                  {isSelected && (
                    <Text style={{ marginLeft: 'auto', color: '#3B82F6', fontWeight: '600' }}>✓</Text>
                  )}
                </Pressable>
              );
            })}
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
    </KeyboardAvoidingView>
  );
}
