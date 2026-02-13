import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../providers/AuthProvider';
import { useCreateBill } from '../hooks/useBills';
import { useCreateVehicle } from '../hooks/useVehicles';
import { useCreatePet } from '../hooks/usePets';
import { useCreateAppointment } from '../hooks/useAppointments';
import { useCreateHomeServiceContact } from '../hooks/useHomeServices';
import {
  hasVoiceApi,
  voiceToDataFromAudio,
  voiceToDataFromText,
  type VoiceToDataResult,
  type VoiceCategory,
} from '../services/voiceToData';
import { useToast } from './ui';
import { hapticLight } from '../lib/haptics';
import { addMonths, setDate, parseISO, isValid, format } from 'date-fns';

const CATEGORY_LABELS: Record<string, string> = {
  bill: 'Bill',
  family_member: 'Family member',
  vehicle: 'Vehicle',
  pet: 'Pet',
  appointment: 'Appointment',
  contact: 'Contact',
  document: 'Document',
  reminder: 'Reminder',
};

function normalizeDueDate(fields: Record<string, unknown>): string | null {
  const due = fields.due_date;
  if (typeof due === 'string' && due.length >= 10) return due.slice(0, 10);
  const day = fields.due_day_of_month;
  if (typeof day === 'number' && day >= 1 && day <= 31) {
    const d = setDate(new Date(), day);
    if (d < new Date()) return format(addMonths(d, 1), 'yyyy-MM-dd');
    return format(d, 'yyyy-MM-dd');
  }
  return null;
}

function normalizeDate(field: unknown): string | null {
  if (typeof field !== 'string') return null;
  const s = field.slice(0, 10);
  if (s.length === 10) return s;
  return null;
}

export function UniversalVoiceInput() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const toast = useToast();
  const [modalVisible, setModalVisible] = useState(false);
  const [listening, setListening] = useState(false);
  const [recording, setRecording] = useState<import('expo-av').Recording | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<VoiceToDataResult | null>(null);
  const [textInput, setTextInput] = useState('');

  const createBill = useCreateBill();
  const createVehicle = useCreateVehicle();
  const createPet = useCreatePet();
  const createAppointment = useCreateAppointment();
  const createContact = useCreateHomeServiceContact();

  const startRecording = useCallback(async () => {
    hapticLight();
    try {
      const { Audio } = await import('expo-av');
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        toast.show('Microphone permission is required for voice input.');
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
      const msg = e instanceof Error ? e.message : 'Could not start recording';
      toast.show(msg);
    }
  }, [toast]);

  const stopRecordingAndParse = useCallback(async () => {
    if (!recording) return;
    setLoading(true);
    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecording(null);
      setListening(false);
      if (!uri) {
        toast.show('No recording saved.');
        return;
      }
      const parsed = await voiceToDataFromAudio(uri);
      setResult(parsed);
      setModalVisible(true);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Voice parse failed';
      toast.show(msg);
    } finally {
      setLoading(false);
    }
  }, [recording, toast]);

  const parseText = useCallback(async () => {
    const t = textInput.trim();
    if (!t) {
      toast.show('Enter or speak something to parse.');
      return;
    }
    hapticLight();
    setLoading(true);
    try {
      const parsed = await voiceToDataFromText(t);
      setResult(parsed);
      setModalVisible(true);
      setTextInput('');
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Parse failed';
      toast.show(msg);
    } finally {
      setLoading(false);
    }
  }, [textInput, toast]);

  const closeModal = useCallback(() => {
    setModalVisible(false);
    setResult(null);
  }, []);

  const handleSave = useCallback(async () => {
    if (!result || !user) return;
    hapticLight();
    const cat = result.category as VoiceCategory;
    const f = result.fields;

    try {
      if (cat === 'bill') {
        const due = normalizeDueDate(f) ?? format(addMonths(new Date(), 1), 'yyyy-MM-dd');
        await createBill.mutateAsync({
          bill_name: (f.bill_name as string) || (f.provider_name as string) || 'Bill',
          provider_name: (f.provider_name as string) ?? null,
          amount: Number(f.amount) || 0,
          due_date: due,
          auto_pay: Boolean(f.auto_pay),
          status: 'pending',
        });
        toast.show('Bill added.');
      } else if (cat === 'vehicle') {
        const regExp = (f.registration_expiry as string) ?? null;
        let regDate: string | null = null;
        if (regExp && typeof regExp === 'string') {
          const parsed = regExp.slice(0, 10);
          if (parsed.length === 10) regDate = parsed;
          else if (/[A-Za-z]+\s*\d{4}/.test(regExp)) {
            try {
              const d = new Date(regExp);
              if (isValid(d)) regDate = format(d, 'yyyy-MM-dd');
            } catch {}
          }
        }
        const notes = [f.color, f.license_plate, f.notes].filter(Boolean).join(' · ') || null;
        await createVehicle.mutateAsync({
          year: typeof f.year === 'number' ? f.year : null,
          make: (f.make as string) ?? null,
          model: (f.model as string) ?? null,
          registration_expiry: regDate,
          notes: notes || (f.notes as string) || null,
        });
        toast.show('Vehicle added.');
      } else if (cat === 'pet') {
        const notes = [f.age ? `Age: ${f.age}` : null, f.notes].filter(Boolean).join(' · ') || null;
        await createPet.mutateAsync({
          name: (f.name as string) || 'Pet',
          type: (f.type as string) ?? null,
          breed: (f.breed as string) ?? null,
          vet_name: (f.vet_name as string) ?? null,
          vet_phone: (f.vet_phone as string) ?? null,
          notes: notes || (f.notes as string) || null,
        });
        toast.show('Pet added.');
      } else if (cat === 'appointment') {
        const date = normalizeDate(f.appointment_date) ?? format(new Date(), 'yyyy-MM-dd');
        let time: string | null = null;
        const t = f.appointment_time;
        if (typeof t === 'string') {
          if (/^\d{1,2}:\d{2}/.test(t)) time = t.slice(0, 5);
          else if (/^\d{1,2}\s*(am|pm)/i.test(t)) {
            const match = t.match(/(\d{1,2})\s*(am|pm)/i);
            if (match) {
              let h = parseInt(match[1], 10);
              if (match[2].toLowerCase() === 'pm' && h < 12) h += 12;
              if (match[2].toLowerCase() === 'am' && h === 12) h = 0;
              time = `${String(h).padStart(2, '0')}:00`;
            }
          }
        }
        await createAppointment.mutateAsync({
          title: (f.title as string) || 'Appointment',
          appointment_date: date,
          appointment_time: time,
          location: (f.location as string) ?? null,
          notes: (f.notes as string) ?? null,
        });
        toast.show('Appointment added.');
      } else if (cat === 'contact') {
        const st = (f.service_type as string)?.toLowerCase();
        const serviceType = ['plumber', 'electrician', 'hvac', 'lawn', 'other'].includes(st)
          ? st
          : 'other';
        await createContact.mutateAsync({
          name: (f.name as string) || 'Contact',
          service_type: serviceType,
          phone: (f.phone as string) ?? null,
          email: (f.email as string) ?? null,
          notes: (f.notes as string) ?? null,
        });
        toast.show('Contact added.');
      } else {
        toast.show(`${CATEGORY_LABELS[cat] || cat} can be added from the app for now.`);
        return;
      }
      closeModal();
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Save failed';
      toast.show(msg);
    }
  }, [
    result,
    user,
    createBill,
    createVehicle,
    createPet,
    createAppointment,
    createContact,
    closeModal,
    toast,
  ]);

  const supportedSave = result && ['bill', 'vehicle', 'pet', 'appointment', 'contact'].includes(result.category);

  if (!hasVoiceApi || !user) return null;

  return (
    <>
      <TouchableOpacity
        onPress={() => setModalVisible(true)}
        activeOpacity={0.8}
        style={[
          styles.fab,
          {
            bottom: (Platform.OS === 'ios' ? insets.bottom : 24) + 56,
            right: 20,
          },
        ]}
      >
        <Ionicons name="mic" size={28} color="#fff" />
      </TouchableOpacity>

      {listening && (
        <Modal transparent visible animationType="fade">
          <View style={styles.listeningOverlay}>
            <View style={styles.listeningBox}>
              <ActivityIndicator size="large" color="#3B82F6" />
              <Text style={styles.listeningText}>Listening…</Text>
              <TouchableOpacity
                onPress={stopRecordingAndParse}
                style={styles.stopButton}
              >
                <Text style={styles.stopButtonText}>Stop & parse</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}

      {loading && !listening && (
        <Modal transparent visible animationType="fade">
          <View style={styles.listeningOverlay}>
            <ActivityIndicator size="large" color="#3B82F6" />
            <Text style={styles.listeningText}>Parsing…</Text>
          </View>
        </Modal>
      )}

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { paddingBottom: insets.bottom + 24 }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Voice input</Text>
              <TouchableOpacity onPress={closeModal} hitSlop={12}>
                <Ionicons name="close" size={28} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            {!result ? (
              <>
                <Text style={styles.hint}>Speak or type household data, e.g. bills, pets, appointments.</Text>
                <TouchableOpacity
                  onPress={startRecording}
                  style={[styles.primaryButton, { marginTop: 16 }]}
                >
                  <Ionicons name="mic" size={22} color="#fff" />
                  <Text style={styles.primaryButtonText}>Tap to speak</Text>
                </TouchableOpacity>
                <Text style={styles.or}>or</Text>
                <ScrollView style={styles.textInputContainer} keyboardShouldPersistTaps="handled">
                  <TextInput
                    placeholder="Paste or type: “Add my electric bill, TXU Energy, $180, due on the 15th”"
                    placeholderTextColor="#64748B"
                    value={textInput}
                    onChangeText={setTextInput}
                    multiline
                    style={styles.textInput}
                  />
                </ScrollView>
                <TouchableOpacity
                  onPress={parseText}
                  style={[styles.primaryButton, { marginTop: 12 }]}
                >
                  <Text style={styles.primaryButtonText}>Parse text</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    {CATEGORY_LABELS[result.category] ?? result.category}
                  </Text>
                </View>
                <ScrollView style={styles.fieldsScroll}>
                  {Object.entries(result.fields).map(([key, value]) => {
                    if (value == null || value === '') return null;
                    return (
                      <View key={key} style={styles.fieldRow}>
                        <Text style={styles.fieldKey}>{key}</Text>
                        <Text style={styles.fieldValue}>
                          {Array.isArray(value) ? value.join(', ') : String(value)}
                        </Text>
                      </View>
                    );
                  })}
                </ScrollView>
                <View style={styles.modalActions}>
                  <TouchableOpacity onPress={() => setResult(null)} style={styles.secondaryButton}>
                    <Text style={styles.secondaryButtonText}>Edit / Try again</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handleSave}
                    style={[styles.primaryButton, !supportedSave && styles.primaryButtonDisabled]}
                    disabled={!supportedSave}
                  >
                    <Text style={styles.primaryButtonText}>
                      {supportedSave ? 'Save' : 'Not supported yet'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  listeningOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  listeningBox: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    minWidth: 200,
  },
  listeningText: {
    color: '#F8FAFC',
    fontSize: 18,
    marginTop: 16,
  },
  stopButton: {
    marginTop: 24,
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: '#EF4444',
    borderRadius: 12,
  },
  stopButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#0F172A',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    color: '#F8FAFC',
    fontSize: 20,
    fontWeight: 'bold',
  },
  hint: {
    color: '#94A3B8',
    fontSize: 14,
  },
  or: {
    color: '#64748B',
    marginTop: 16,
    textAlign: 'center',
  },
  textInputContainer: {
    maxHeight: 120,
    marginTop: 8,
  },
  textInput: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 16,
    color: '#F8FAFC',
    fontSize: 16,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#3B82F6',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  primaryButtonDisabled: {
    opacity: 0.6,
  },
  primaryButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  secondaryButton: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    backgroundColor: '#334155',
  },
  secondaryButtonText: {
    color: '#F8FAFC',
    fontWeight: '500',
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: '#334155',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 16,
  },
  badgeText: {
    color: '#3B82F6',
    fontWeight: '600',
    fontSize: 14,
    textTransform: 'capitalize',
  },
  fieldsScroll: {
    maxHeight: 280,
    marginBottom: 24,
  },
  fieldRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  fieldKey: {
    color: '#94A3B8',
    fontSize: 13,
    textTransform: 'none',
    marginRight: 12,
  },
  fieldValue: {
    color: '#F8FAFC',
    fontSize: 14,
    flex: 1,
    textAlign: 'right',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'flex-end',
  },
});
