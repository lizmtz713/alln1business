import { useMemo, useState } from 'react';
import {
  Alert,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '@/src/providers/AuthProvider';
import { supabase } from '@/src/services/supabase';

const STEP_LABELS = [
  'Business name',
  'Business type',
  'Business structure',
  'Primary challenge',
];

export default function OnboardingScreen() {
  const { user, refreshProfile } = useAuth();
  const [stepIndex, setStepIndex] = useState(0);
  const [businessName, setBusinessName] = useState('');
  const [businessType, setBusinessType] = useState('');
  const [businessStructure, setBusinessStructure] = useState('');
  const [primaryChallenge, setPrimaryChallenge] = useState('');
  const [saving, setSaving] = useState(false);

  const progress = useMemo(
    () => `${stepIndex + 1} / ${STEP_LABELS.length}`,
    [stepIndex]
  );

  const handleNext = () => {
    if (stepIndex < STEP_LABELS.length - 1) {
      setStepIndex(stepIndex + 1);
    }
  };

  const handleBack = () => {
    if (stepIndex > 0) {
      setStepIndex(stepIndex - 1);
    }
  };

  const handleFinish = async () => {
    if (!user) {
      Alert.alert('Sign in required', 'Please sign in to continue.');
      return;
    }

    setSaving(true);
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert(
        {
          id: user.id,
          onboarding_completed: true,
        },
        { onConflict: 'id' }
      );

    const { error: userError } = await supabase.auth.updateUser({
      data: {
        business_name: businessName,
        business_type: businessType,
        business_structure: businessStructure,
        primary_challenge: primaryChallenge,
      },
    });

    setSaving(false);

    if (profileError || userError) {
      Alert.alert(
        'Onboarding failed',
        profileError?.message || userError?.message || 'Please try again.'
      );
      return;
    }

    await refreshProfile();
  };

  const stepBody = () => {
    switch (stepIndex) {
      case 0:
        return (
          <TextInput
            className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 text-white"
            placeholder="Alln1 Coffee Co."
            placeholderTextColor="#64748b"
            value={businessName}
            onChangeText={setBusinessName}
          />
        );
      case 1:
        return (
          <TextInput
            className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 text-white"
            placeholder="Retail, Service, SaaS..."
            placeholderTextColor="#64748b"
            value={businessType}
            onChangeText={setBusinessType}
          />
        );
      case 2:
        return (
          <TextInput
            className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 text-white"
            placeholder="LLC, Partnership, Solo..."
            placeholderTextColor="#64748b"
            value={businessStructure}
            onChangeText={setBusinessStructure}
          />
        );
      case 3:
        return (
          <TextInput
            className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 text-white"
            placeholder="Hiring, cash flow, marketing..."
            placeholderTextColor="#64748b"
            value={primaryChallenge}
            onChangeText={setPrimaryChallenge}
          />
        );
      default:
        return null;
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-900 px-6 py-10">
      <View className="flex-1 gap-6">
        <View>
          <Text className="text-sm uppercase tracking-widest text-indigo-400">
            Onboarding {progress}
          </Text>
          <Text className="mt-2 text-3xl font-semibold text-white">
            {STEP_LABELS[stepIndex]}
          </Text>
          <Text className="mt-2 text-slate-400">
            We&apos;ll personalize your workspace with these details.
          </Text>
        </View>

        <View className="gap-4">{stepBody()}</View>

        <View className="mt-auto flex-row items-center gap-3">
          <Pressable
            className="flex-1 rounded-lg border border-slate-700 py-3"
            onPress={handleBack}
            disabled={stepIndex === 0 || saving}
          >
            <Text className="text-center text-base font-semibold text-slate-200">
              Back
            </Text>
          </Pressable>
          {stepIndex < STEP_LABELS.length - 1 ? (
            <Pressable
              className="flex-1 rounded-lg bg-indigo-500 py-3"
              onPress={handleNext}
              disabled={saving}
            >
              <Text className="text-center text-base font-semibold text-white">
                Next
              </Text>
            </Pressable>
          ) : (
            <Pressable
              className={`flex-1 rounded-lg py-3 ${
                saving ? 'bg-slate-700' : 'bg-indigo-500'
              }`}
              onPress={handleFinish}
              disabled={saving}
            >
              <Text className="text-center text-base font-semibold text-white">
                {saving ? 'Finishing...' : 'Finish'}
              </Text>
            </Pressable>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}
