import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  StyleSheet,
  ScrollView,
  Linking,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useCommandBar } from '../contexts/CommandBarContext';
import { useBills, useMarkBillPaid } from '../hooks/useBills';
import { useGrowthRecords } from '../hooks/useGrowthRecords';
import { useVehicles } from '../hooks/useVehicles';
import { useHomeServiceContacts } from '../hooks/useHomeServices';
import { useAppointments } from '../hooks/useAppointments';
import { useTransactions } from '../hooks/useTransactions';
import { useCreateAppointment } from '../hooks/useAppointments';
import { useGlobalSearch } from '../hooks/useGlobalSearch';
import {
  parseCommand,
  executeCommand,
  buildSearchResultAnswer,
  type CommandResult,
  type CommandAction,
} from '../services/commandBar';
import { useToast } from './ui';
import { hapticLight } from '../lib/haptics';
import { format, subMonths } from 'date-fns';

export function CommandBar() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const toast = useToast();
  const { visible, close } = useCommandBar();
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CommandResult | null>(null);
  const [listening, setListening] = useState(false);
  const [recording, setRecording] = useState<import('expo-av').Recording | null>(null);

  const { data: bills = [] } = useBills();
  const { data: growthRecords = [] } = useGrowthRecords();
  const { data: vehicles = [] } = useVehicles();
  const { data: homeServiceContacts = [] } = useHomeServiceContacts();
  const { data: appointments = [] } = useAppointments();
  const createAppointment = useCreateAppointment();
  const markBillPaid = useMarkBillPaid();

  const lastMonthStart = format(subMonths(new Date(), 1), 'yyyy-MM-01');
  const lastMonthEnd = format(subMonths(new Date(), 1), 'yyyy-MM-dd');
  const { data: lastMonthTxns = [] } = useTransactions({
    type: 'expense',
    dateRange: { start: lastMonthStart, end: lastMonthEnd },
  });
  const spendingByCategory: Record<string, number> = {};
  let spendingTotal = 0;
  lastMonthTxns.forEach((t) => {
    const cat = t.category ?? 'other';
    const amt = Math.abs(Number(t.amount));
    spendingByCategory[cat] = (spendingByCategory[cat] ?? 0) + amt;
    spendingTotal += amt;
  });

  const searchQuery = query.trim().length >= 2 ? query.trim() : '';
  const searchResults = useGlobalSearch(searchQuery);

  const handleSubmit = useCallback(async (overrideQuery?: string) => {
    const q = (overrideQuery ?? query).trim();
    if (!q) return;
    if (overrideQuery) setQuery(overrideQuery);
    hapticLight();
    setLoading(true);
    setResult(null);
    try {
      const parsed = parseCommand(q);
      if (parsed.intent === 'search' && q.length >= 2) {
        const summary: Record<string, number> = {};
        if (searchResults.bills.length) summary['bills'] = searchResults.bills.length;
        if (searchResults.documents.length) summary['documents'] = searchResults.documents.length;
        if (searchResults.vehicles.length) summary['vehicles'] = searchResults.vehicles.length;
        if (searchResults.pets.length) summary['pets'] = searchResults.pets.length;
        if (searchResults.appointments.length) summary['appointments'] = searchResults.appointments.length;
        if (searchResults.homeServiceContacts.length) summary['contacts'] = searchResults.homeServiceContacts.length;
        const answer = buildSearchResultAnswer(summary);
        setResult({
          answer,
          actions: [
            ...(searchResults.bills.length ? [{ label: 'Show bills', type: 'navigate' as const, payload: '/(tabs)' }] : []),
            ...(searchResults.pets.length ? [{ label: 'Show pets', type: 'navigate' as const, payload: '/pets' }] : []),
            ...(searchResults.vehicles.length ? [{ label: 'Show vehicles', type: 'navigate' as const, payload: '/vehicles' }] : []),
          ].slice(0, 3),
        });
      } else {
        const data = {
          bills,
          growthRecords,
          vehicles,
          homeServiceContacts,
          appointments,
          spendingByCategory,
          spendingTotal,
        };
        const cmdResult = executeCommand(parsed, data);
        setResult(cmdResult);
      }
    } catch (e) {
      toast.show(e instanceof Error ? e.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }, [query, bills, growthRecords, vehicles, homeServiceContacts, spendingByCategory, spendingTotal, searchResults, toast]);

  const handleAction = useCallback(
    async (action: CommandAction) => {
      hapticLight();
      if (action.type === 'navigate') {
        close();
        const payload = action.payload;
        if (typeof payload === 'string') {
          router.push(payload as never);
        } else {
          router.push(payload.route as never);
        }
        return;
      }
      if (action.type === 'open_url' && typeof action.payload === 'string') {
        if (await Linking.canOpenURL(action.payload)) {
          await Linking.openURL(action.payload);
          close();
        } else {
          toast.show("Can't open that link.");
        }
        return;
      }
      if (action.type === 'call' && typeof action.payload === 'string') {
        if (action.payload && (await Linking.canOpenURL(action.payload))) {
          await Linking.openURL(action.payload);
          close();
        } else {
          toast.show('No phone number to call.');
        }
        return;
      }
      if (action.type === 'create_reminder' && typeof action.payload === 'string') {
        try {
          const { title, appointment_date } = JSON.parse(action.payload);
          await createAppointment.mutateAsync({
            title,
            appointment_date,
            appointment_time: null,
            location: null,
            notes: null,
            is_recurring: false,
            recurring_rule: null,
          });
          toast.show('Reminder added.');
          close();
        } catch {
          toast.show('Failed to add reminder.');
        }
        return;
      }
      if (action.type === 'mark_bill_paid' && typeof action.payload === 'string') {
        try {
          const { billId, amount } = JSON.parse(action.payload);
          if (!billId) {
            toast.show('Bill not found.');
            return;
          }
          await markBillPaid.mutateAsync({
            id: billId,
            paid_amount: Number(amount),
            paid_date: format(new Date(), 'yyyy-MM-dd'),
            payment_method: null,
            confirmation_number: null,
          });
          toast.show('Bill marked paid.');
          close();
        } catch {
          toast.show('Failed to mark bill paid.');
        }
      }
    },
    [close, router, createAppointment, markBillPaid, toast]
  );

  const startRecording = useCallback(async () => {
    try {
      const { Audio } = await import('expo-av');
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        toast.show('Microphone access is required.');
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

  const stopRecording = useCallback(async () => {
    if (!recording) return;
    setLoading(true);
    try {
      const { transcribeWithWhisper } = await import('../services/voiceToData');
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecording(null);
      setListening(false);
      if (uri) {
        const text = await transcribeWithWhisper(uri);
        setQuery(text || '');
        if (text) handleSubmit(text);
      }
    } catch {
      toast.show('Voice input failed');
    } finally {
      setLoading(false);
    }
  }, [recording, handleSubmit]);

  const handleClose = useCallback(() => {
    setQuery('');
    setResult(null);
    close();
  }, [close]);

  if (!visible) return null;

  return (
    <Modal visible transparent animationType="slide">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={[styles.overlay, { paddingBottom: insets.bottom + 16 }]}
      >
        <TouchableOpacity style={styles.backdrop} onPress={handleClose} activeOpacity={1} />
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>Ask or search</Text>
            <TouchableOpacity onPress={handleClose} hitSlop={12}>
              <Ionicons name="close" size={28} color="#94A3B8" />
            </TouchableOpacity>
          </View>

          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              placeholder="Bills due this week, Jake's shoe size, call dentist..."
              placeholderTextColor="#64748B"
              value={query}
              onChangeText={setQuery}
              onSubmitEditing={() => handleSubmit(undefined)}
              returnKeyType="search"
              autoFocus
              editable={!loading}
            />
            {listening ? (
              <TouchableOpacity style={styles.micBtnRecording} onPress={stopRecording}>
                <Ionicons name="stop" size={24} color="#fff" />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={styles.micBtn} onPress={startRecording} onLongPress={startRecording}>
                <Ionicons name="mic" size={24} color="#3B82F6" />
              </TouchableOpacity>
            )}
          </View>

          {loading && (
            <View style={styles.loadingRow}>
              <ActivityIndicator size="small" color="#3B82F6" />
              <Text style={styles.loadingText}>Finding that...</Text>
            </View>
          )}

          {result && !loading && (
            <ScrollView style={styles.resultScroll} contentContainerStyle={styles.resultContent} keyboardShouldPersistTaps="handled">
              <Text style={styles.answerLabel}>I found</Text>
              <Text style={styles.answerText}>{result.answer}</Text>
              {result.actions.length > 0 && (
                <View style={styles.actions}>
                  {result.actions.map((a, i) => (
                    <TouchableOpacity
                      key={i}
                      style={styles.actionBtn}
                      onPress={() => handleAction(a)}
                    >
                      <Text style={styles.actionBtnText}>{a.label}</Text>
                      <Ionicons name="chevron-forward" size={18} color="#3B82F6" />
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </ScrollView>
          )}

          <TouchableOpacity
            style={[styles.submitBtn, (!query.trim() || loading) && styles.submitBtnDisabled]}
            onPress={() => handleSubmit(undefined)}
            disabled={!query.trim() || loading}
          >
            <Text style={styles.submitBtnText}>Search / Run</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  sheet: {
    backgroundColor: '#0F172A',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 16,
    maxHeight: '85%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    color: '#F8FAFC',
    fontSize: 20,
    fontWeight: 'bold',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    borderRadius: 12,
    paddingHorizontal: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    color: '#F8FAFC',
    fontSize: 16,
  },
  micBtn: {
    padding: 8,
  },
  micBtnRecording: {
    padding: 8,
    backgroundColor: '#EF4444',
    borderRadius: 8,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 16,
  },
  loadingText: {
    color: '#94A3B8',
    fontSize: 14,
  },
  resultScroll: {
    maxHeight: 220,
    marginBottom: 12,
  },
  resultContent: {
    paddingVertical: 8,
  },
  answerLabel: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  answerText: {
    color: '#F8FAFC',
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 16,
  },
  actions: {
    gap: 8,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1E293B',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#334155',
  },
  actionBtnText: {
    color: '#3B82F6',
    fontWeight: '600',
    fontSize: 15,
  },
  submitBtn: {
    backgroundColor: '#3B82F6',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitBtnDisabled: {
    opacity: 0.5,
  },
  submitBtnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});
