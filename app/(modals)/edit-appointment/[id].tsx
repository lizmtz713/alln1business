import { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAppointment, useUpdateAppointment } from '../../../src/hooks/useAppointments';
import { useAuth } from '../../../src/providers/AuthProvider';
import { hasSupabaseEnv } from '../../../src/services/env';

const inputStyle = { backgroundColor: '#1E293B' as const, borderRadius: 12, padding: 12, color: '#F8FAFC' as const, marginBottom: 16, borderWidth: 1, borderColor: '#334155' as const };

export default function EditAppointmentScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: p, isLoading } = useAppointment(Array.isArray(id) ? id[0] : id);
  const { user } = useAuth();
  const update = useUpdateAppointment();
  const [title, setTitle] = useState('');
  const [appointmentDate, setAppointmentDate] = useState('');
  const [appointmentTime, setAppointmentTime] = useState('');
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringRule, setRecurringRule] = useState('');

  useEffect(() => {
    if (p) {
      setTitle(p.title ?? '');
      setAppointmentDate(p.appointment_date ?? '');
      setAppointmentTime(p.appointment_time ?? '');
      setLocation(p.location ?? '');
      setNotes(p.notes ?? '');
      setIsRecurring(p.is_recurring ?? false);
      setRecurringRule(p.recurring_rule ?? '');
    }
  }, [p]);

  const canSave = hasSupabaseEnv && id && user && title.trim();

  const handleSave = async () => {
    if (!canSave) return;
    const apptId = Array.isArray(id) ? id[0] : id;
    if (!apptId) return;
    try {
      await update.mutateAsync({
        id: apptId,
        updates: { title: title.trim(), appointment_date: appointmentDate.trim(), appointment_time: appointmentTime.trim() || null, location: location.trim() || null, notes: notes.trim() || null, is_recurring: isRecurring, recurring_rule: recurringRule.trim() || null },
      });
      router.back();
    } catch (e) {
      Alert.alert('Error', (e as Error).message);
    }
  };

  if (!hasSupabaseEnv || !id) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0F172A', padding: 24 }}>
        <TouchableOpacity onPress={() => router.back()}><Text style={{ color: '#3B82F6' }}>← Back</Text></TouchableOpacity>
        <Text style={{ color: '#94A3B8' }}>Connect Supabase.</Text>
      </View>
    );
  }
  if (isLoading || !p) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0F172A', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }
  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: '#0F172A' }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={{ padding: 24 }} keyboardShouldPersistTaps="handled">
        <TouchableOpacity onPress={() => router.back()} style={{ marginBottom: 24 }}><Text style={{ color: '#3B82F6', fontSize: 16 }}>← Back</Text></TouchableOpacity>
        <Text style={{ color: '#F8FAFC', fontSize: 24, fontWeight: 'bold', marginBottom: 24 }}>Edit Appointment</Text>
        <Text style={{ color: '#94A3B8', marginBottom: 8 }}>Title *</Text>
        <TextInput style={inputStyle} value={title} onChangeText={setTitle} placeholder="Appointment title" placeholderTextColor="#64748B" />
        <Text style={{ color: '#94A3B8', marginBottom: 8 }}>Date (yyyy-MM-dd)</Text>
        <TextInput style={inputStyle} value={appointmentDate} onChangeText={setAppointmentDate} placeholder="Required" placeholderTextColor="#64748B" />
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
        <TouchableOpacity onPress={handleSave} disabled={!canSave || update.isPending} style={{ backgroundColor: canSave ? '#3B82F6' : '#334155', borderRadius: 12, padding: 16, alignItems: 'center' }}>
          {update.isPending ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff', fontWeight: '600' }}>Save</Text>}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
