import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCreateAppointment } from '../../src/hooks/useAppointments';
import { useAuth } from '../../src/providers/AuthProvider';
import { hasSupabaseEnv } from '../../src/services/env';
import { SmartPhotoCapture, type SmartPhotoCaptureResult } from '../../src/components/SmartPhotoCapture';
import { hasScanApi } from '../../src/services/scanDocument';
import { hapticLight } from '../../src/lib/haptics';

const inputStyle = { backgroundColor: '#1E293B' as const, borderRadius: 12, padding: 12, color: '#F8FAFC' as const, marginBottom: 16, borderWidth: 1, borderColor: '#334155' as const };

export default function AddAppointmentScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const create = useCreateAppointment();
  const [title, setTitle] = useState('');
  const [appointmentDate, setAppointmentDate] = useState('');
  const [appointmentTime, setAppointmentTime] = useState('');
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringRule, setRecurringRule] = useState('');
  const [scanVisible, setScanVisible] = useState(false);

  const canSave = hasSupabaseEnv && user && title.trim();

  const applyScanResult = (result: SmartPhotoCaptureResult) => {
    const f = result.fields;
    if (f.title != null) setTitle(String(f.title));
    if (f.appointment_date != null) setAppointmentDate(String(f.appointment_date).slice(0, 10));
    if (f.appointment_time != null) setAppointmentTime(String(f.appointment_time).slice(0, 5));
    if (f.location != null) setLocation(String(f.location));
    if (f.notes != null) setNotes(String(f.notes));
    setScanVisible(false);
  };

  const handleSave = async () => {
    if (!canSave) return;
    try {
      await create.mutateAsync({
        title: title.trim(),
        appointment_date: appointmentDate.trim() || new Date().toISOString().slice(0, 10),
        appointment_time: appointmentTime.trim() || null,
        location: location.trim() || null,
        notes: notes.trim() || null,
        is_recurring: isRecurring,
        recurring_rule: recurringRule.trim() || null,
      });
      router.back();
    } catch (e) {
      Alert.alert('Error', (e as Error).message);
    }
  };

  if (!hasSupabaseEnv) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0F172A', padding: 24 }}>
        <TouchableOpacity onPress={() => router.back()}><Text style={{ color: '#3B82F6' }}>← Back</Text></TouchableOpacity>
        <Text style={{ color: '#94A3B8' }}>Connect Supabase.</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: '#0F172A' }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={{ padding: 24 }} keyboardShouldPersistTaps="handled">
        <TouchableOpacity onPress={() => router.back()} style={{ marginBottom: 24 }}><Text style={{ color: '#3B82F6', fontSize: 16 }}>← Back</Text></TouchableOpacity>
        <Text style={{ color: '#F8FAFC', fontSize: 24, fontWeight: 'bold', marginBottom: 24 }}>Add Appointment</Text>
        {hasScanApi && (
          <TouchableOpacity onPress={() => { hapticLight(); setScanVisible(true); }} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#334155', borderRadius: 12, padding: 14, marginBottom: 24 }}>
            <Ionicons name="scan" size={22} color="#3B82F6" />
            <Text style={{ color: '#3B82F6', fontWeight: '600', fontSize: 16 }}>Scan appointment card</Text>
          </TouchableOpacity>
        )}
        <Text style={{ color: '#94A3B8', marginBottom: 8 }}>Title *</Text>
        <TextInput style={inputStyle} value={title} onChangeText={setTitle} placeholder="Appointment title" placeholderTextColor="#64748B" />
        <Text style={{ color: '#94A3B8', marginBottom: 8 }}>Date (yyyy-MM-dd)</Text>
        <TextInput style={inputStyle} value={appointmentDate} onChangeText={setAppointmentDate} placeholder="Optional, defaults to today" placeholderTextColor="#64748B" />
        <Text style={{ color: '#94A3B8', marginBottom: 8 }}>Time</Text>
        <TextInput style={inputStyle} value={appointmentTime} onChangeText={setAppointmentTime} placeholder="e.g. 14:00" placeholderTextColor="#64748B" />
        <Text style={{ color: '#94A3B8', marginBottom: 8 }}>Location</Text>
        <TextInput style={inputStyle} value={location} onChangeText={setLocation} placeholder="Optional" placeholderTextColor="#64748B" />
        <TouchableOpacity onPress={() => setIsRecurring(!isRecurring)} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
          <Text style={{ color: '#F8FAFC', marginRight: 8 }}>Recurring</Text>
          <View style={{ width: 24, height: 24, borderRadius: 4, borderWidth: 2, borderColor: '#334155', backgroundColor: isRecurring ? '#3B82F6' : 'transparent' }} />
        </TouchableOpacity>
        {isRecurring && (
          <>
            <Text style={{ color: '#94A3B8', marginBottom: 8 }}>Recurring rule</Text>
            <TextInput style={inputStyle} value={recurringRule} onChangeText={setRecurringRule} placeholder="e.g. Weekly, Monthly" placeholderTextColor="#64748B" />
          </>
        )}
        <Text style={{ color: '#94A3B8', marginBottom: 8 }}>Notes</Text>
        <TextInput style={[inputStyle, { minHeight: 80, textAlignVertical: 'top' }]} value={notes} onChangeText={setNotes} placeholder="Optional" placeholderTextColor="#64748B" multiline />
        <TouchableOpacity onPress={handleSave} disabled={!canSave || create.isPending} style={{ backgroundColor: canSave ? '#3B82F6' : '#334155', borderRadius: 12, padding: 16, alignItems: 'center' }}>
          {create.isPending ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff', fontWeight: '600' }}>Save</Text>}
        </TouchableOpacity>
        <SmartPhotoCapture visible={scanVisible} onClose={() => setScanVisible(false)} onExtracted={applyScanResult} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
