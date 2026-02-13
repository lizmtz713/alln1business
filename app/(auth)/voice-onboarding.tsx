import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  TextInput,
  StyleSheet,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/providers/AuthProvider';
import { supabase } from '../../src/services/supabase';
import {
  sendOnboardingMessage,
  hasVoiceOnboarding,
  type OnboardingStep,
  type OnboardingMember,
  type OnboardingPet,
  type OnboardingBill,
} from '../../src/services/voiceOnboarding';
import {
  loadOnboardingState,
  saveOnboardingState,
  clearOnboardingState,
  getDefaultState,
  getWelcomeMessage,
  type PersistedOnboardingState,
} from '../../src/services/onboardingState';
import { transcribeWithWhisper } from '../../src/services/voiceToData';
import { useCreateBill } from '../../src/hooks/useBills';
import { useCreatePet } from '../../src/hooks/usePets';
import { useCreateHouseholdMember } from '../../src/hooks/useHouseholdMembers';
import { useToast } from '../../src/components/ui';
import { format, setDate, addMonths } from 'date-fns';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ONBOARDING_PAUSED_KEY = 'alln1_onboarding_paused';

const STEPS: { key: OnboardingStep; label: string }[] = [
  { key: 'household', label: 'Household' },
  { key: 'pets', label: 'Pets' },
  { key: 'bills', label: 'Bills' },
  { key: 'review', label: 'Review' },
];

export default function VoiceOnboardingScreen() {
  const insets = useSafeAreaInsets();
  const { user, refreshProfile } = useAuth();
  const toast = useToast();
  const [state, setState] = useState<PersistedOnboardingState>(getDefaultState());
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [listening, setListening] = useState(false);
  const [recording, setRecording] = useState<import('expo-av').Recording | null>(null);
  const [textInput, setTextInput] = useState('');
  const [confirming, setConfirming] = useState(false);

  const createBill = useCreateBill();
  const createPet = useCreatePet();
  const createMember = useCreateHouseholdMember();

  // Load persisted state on mount
  useEffect(() => {
    let cancelled = false;
    loadOnboardingState().then((s) => {
      if (!cancelled && s) {
        setState(s);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!user?.id) {
      router.replace('/(auth)/login' as never);
      return;
    }
    setLoading(false);
  }, [user?.id]);

  const persist = useCallback(async (next: PersistedOnboardingState) => {
    setState(next);
    await saveOnboardingState(next);
  }, []);

  const startRecording = useCallback(async () => {
    try {
      const { Audio } = await import('expo-av');
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        toast.show('Microphone permission is required for voice setup.');
        return;
      }
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });
      const { recording: rec } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      setRecording(rec);
      setListening(true);
    } catch (e) {
      toast.show(e instanceof Error ? e.message : 'Could not start recording');
    }
  }, [toast]);

  const stopAndSend = useCallback(async () => {
    if (!recording) return;
    setSending(true);
    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecording(null);
      setListening(false);
      if (!uri) {
        toast.show('No recording saved.');
        setSending(false);
        return;
      }
      const transcript = await transcribeWithWhisper(uri);
      if (!transcript || transcript === 'No speech detected.') {
        toast.show('No speech detected. Try again.');
        setSending(false);
        return;
      }
      await submitMessage(transcript);
    } catch (e) {
      toast.show(e instanceof Error ? e.message : 'Voice failed');
    } finally {
      setSending(false);
    }
  }, [recording, state]);

  const submitMessage = useCallback(
    async (userMessage: string) => {
      if (!hasVoiceOnboarding) {
        toast.show('Add EXPO_PUBLIC_OPENAI_API_KEY or voice onboarding API URL to use voice setup.');
        return;
      }
      setSending(true);
      try {
        const collected = {
          members: state.members,
          pets: state.pets,
          bills: state.bills,
        };
        const res = await sendOnboardingMessage(state.step, collected, userMessage);

        const nextMembers = [...state.members];
        res.extracted.members.forEach((m) => {
          if (m.name && !nextMembers.some((x) => x.name === m.name)) {
            nextMembers.push({ name: m.name, relationship: m.relationship, age: m.age ?? null });
          }
        });
        const nextPets = [...state.pets];
        res.extracted.pets.forEach((p) => {
          if (p.name && !nextPets.some((x) => x.name === p.name)) {
            nextPets.push({ name: p.name, type: p.type });
          }
        });
        const nextBills = [...state.bills];
        res.extracted.bills.forEach((b) => {
          const key = `${b.bill_name}-${b.provider_name ?? ''}`;
          if (b.bill_name && !nextBills.some((x) => `${x.bill_name}-${x.provider_name ?? ''}` === key)) {
            nextBills.push({
              bill_name: b.bill_name,
              provider_name: b.provider_name,
              amount: b.amount ?? null,
            });
          }
        });

        await persist({
          step: res.nextStep,
          members: nextMembers,
          pets: nextPets,
          bills: nextBills,
          aiReply: res.aiReply,
          isInitialized: true,
        });
        setTextInput('');
      } catch (e) {
        toast.show(e instanceof Error ? e.message : 'Something went wrong');
      } finally {
        setSending(false);
      }
    },
    [state, persist, toast]
  );

  const handlePause = useCallback(async () => {
    await saveOnboardingState(state);
    await AsyncStorage.setItem(ONBOARDING_PAUSED_KEY, 'true');
    router.replace('/(tabs)' as never);
  }, [state]);

  const handleConfirm = useCallback(async () => {
    if (!user?.id) return;
    setConfirming(true);
    try {
      for (const m of state.members) {
        try {
          await createMember.mutateAsync({
            name: m.name,
            relationship: m.relationship ?? null,
            age: m.age ?? null,
          });
        } catch {
          // table may not exist
        }
      }
      for (const p of state.pets) {
        await createPet.mutateAsync({
          name: p.name,
          type: p.type ?? null,
        });
      }
      const defaultDue = format(addMonths(setDate(new Date(), 15), 1), 'yyyy-MM-dd');
      for (const b of state.bills) {
        await createBill.mutateAsync({
          bill_name: b.bill_name,
          provider_name: b.provider_name ?? null,
          amount: Number(b.amount) || 0,
          due_date: defaultDue,
          status: 'pending',
        });
      }

      await supabase
        .from('profiles')
        .update({
          onboarding_completed: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      await clearOnboardingState();
      await AsyncStorage.removeItem(ONBOARDING_PAUSED_KEY);
      await refreshProfile();
      router.replace('/(tabs)' as never);
    } catch (e) {
      toast.show(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setConfirming(false);
    }
  }, [
    user?.id,
    state.members,
    state.pets,
    state.bills,
    createMember,
    createPet,
    createBill,
    refreshProfile,
    toast,
  ]);

  if (!user?.id || loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  const currentStepIndex = STEPS.findIndex((s) => s.key === state.step);
  const isReview = state.step === 'review';
  const displayMessage = state.isInitialized ? state.aiReply : getWelcomeMessage();

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom + 24 }]}>
      {/* Progress */}
      <View style={styles.progressRow}>
        {STEPS.map((s, i) => (
          <View
            key={s.key}
            style={[
              styles.progressDot,
              i <= currentStepIndex && styles.progressDotActive,
              i < currentStepIndex && styles.progressDotDone,
            ]}
          />
        ))}
      </View>
      <Text style={styles.progressLabel}>
        Step {currentStepIndex + 1} of {STEPS.length}: {STEPS[currentStepIndex]?.label}
      </Text>

      {/* AI message */}
      <ScrollView
        style={styles.messageScroll}
        contentContainerStyle={styles.messageScrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.bubble}>
          <Text style={styles.bubbleText}>{displayMessage}</Text>
        </View>

        {isReview && (
          <View style={styles.reviewSection}>
            <Text style={styles.reviewTitle}>Review & confirm</Text>
            {state.members.length > 0 && (
              <>
                <Text style={styles.reviewSubtitle}>Household</Text>
                {state.members.map((m, i) => (
                  <Text key={i} style={styles.reviewItem}>
                    • {m.name}
                    {m.relationship ? ` (${m.relationship})` : ''}
                    {m.age != null ? `, ${m.age}` : ''}
                  </Text>
                ))}
              </>
            )}
            {state.pets.length > 0 && (
              <>
                <Text style={styles.reviewSubtitle}>Pets</Text>
                {state.pets.map((p, i) => (
                  <Text key={i} style={styles.reviewItem}>
                    • {p.name}
                    {p.type ? ` (${p.type})` : ''}
                  </Text>
                ))}
              </>
            )}
            {state.bills.length > 0 && (
              <>
                <Text style={styles.reviewSubtitle}>Bills</Text>
                {state.bills.map((b, i) => (
                  <Text key={i} style={styles.reviewItem}>
                    • {b.bill_name}
                    {b.provider_name ? ` — ${b.provider_name}` : ''}
                    {b.amount != null ? ` — $${b.amount}` : ''}
                  </Text>
                ))}
              </>
            )}
            <TouchableOpacity
              style={[styles.confirmButton, confirming && styles.buttonDisabled]}
              onPress={handleConfirm}
              disabled={confirming}
            >
              {confirming ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.confirmButtonText}>Confirm & finish setup</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {!isReview && (
        <>
          {/* Voice / text input */}
          {listening ? (
            <View style={styles.recordRow}>
              <ActivityIndicator size="small" color="#3B82F6" />
              <Text style={styles.recordLabel}>Listening…</Text>
              <TouchableOpacity style={styles.stopButton} onPress={stopAndSend}>
                <Text style={styles.stopButtonText}>Stop & send</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <TouchableOpacity
                style={[styles.micButton, sending && styles.buttonDisabled]}
                onPress={startRecording}
                disabled={sending}
              >
                {sending ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Ionicons name="mic" size={32} color="#fff" />
                )}
              </TouchableOpacity>
              <Text style={styles.micHint}>Tap to speak</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Or type your answer…"
                placeholderTextColor="#64748B"
                value={textInput}
                onChangeText={setTextInput}
                editable={!sending}
                onSubmitEditing={() => {
                  const t = textInput.trim();
                  if (t) submitMessage(t);
                }}
              />
              <TouchableOpacity
                style={[styles.sendTextButton, (!textInput.trim() || sending) && styles.buttonDisabled]}
                onPress={() => textInput.trim() && submitMessage(textInput.trim())}
                disabled={!textInput.trim() || sending}
              >
                <Text style={styles.sendTextButtonText}>Send</Text>
              </TouchableOpacity>
            </>
          )}
        </>
      )}

      {/* Pause */}
      <TouchableOpacity style={styles.pauseButton} onPress={handlePause}>
        <Ionicons name="pause-outline" size={18} color="#94A3B8" />
        <Text style={styles.pauseButtonText}>Pause and continue later</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.manualLink}
        onPress={() => router.replace('/(auth)/onboarding' as never)}
      >
        <Text style={styles.manualLinkText}>Prefer to set up manually?</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
    paddingHorizontal: 24,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#94A3B8',
    marginTop: 12,
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginTop: 16,
    marginBottom: 4,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#334155',
  },
  progressDotActive: {
    backgroundColor: '#3B82F6',
    width: 24,
  },
  progressDotDone: {
    backgroundColor: '#22C55E',
  },
  progressLabel: {
    color: '#94A3B8',
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 20,
  },
  messageScroll: {
    flex: 1,
  },
  messageScrollContent: {
    paddingBottom: 24,
  },
  bubble: {
    alignSelf: 'flex-start',
    maxWidth: '90%',
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 16,
    borderBottomLeftRadius: 4,
  },
  bubbleText: {
    color: '#F8FAFC',
    fontSize: 17,
    lineHeight: 24,
  },
  reviewSection: {
    marginTop: 24,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  reviewTitle: {
    color: '#F8FAFC',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  reviewSubtitle: {
    color: '#3B82F6',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 12,
    marginBottom: 4,
  },
  reviewItem: {
    color: '#E2E8F0',
    fontSize: 15,
    marginLeft: 4,
    marginBottom: 2,
  },
  confirmButton: {
    backgroundColor: '#22C55E',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 24,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  confirmButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  recordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 16,
  },
  recordLabel: {
    color: '#F8FAFC',
    fontSize: 16,
  },
  stopButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#EF4444',
    borderRadius: 10,
  },
  stopButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  micButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 8,
  },
  micHint: {
    color: '#94A3B8',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 12,
  },
  textInput: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 14,
    color: '#F8FAFC',
    fontSize: 16,
    marginBottom: 8,
  },
  sendTextButton: {
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#334155',
    alignItems: 'center',
  },
  sendTextButtonText: {
    color: '#F8FAFC',
    fontWeight: '600',
  },
  pauseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 20,
  },
  pauseButtonText: {
    color: '#94A3B8',
    fontSize: 14,
  },
  manualLink: {
    marginTop: 12,
    alignItems: 'center',
  },
  manualLinkText: {
    color: '#64748B',
    fontSize: 14,
  },
});
