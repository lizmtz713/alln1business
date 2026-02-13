import { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useMedicalRecord, useUpdateMedicalRecord } from '../../../src/hooks/useMedical';
import { useAuth } from '../../../src/providers/AuthProvider';
import { hasSupabaseEnv } from '../../../src/services/env';

const inputStyle = { backgroundColor: '#1E293B' as const, borderRadius: 12, padding: 12, color: '#F8FAFC' as const, marginBottom: 16, borderWidth: 1, borderColor: '#334155' as const };

export default function EditMedicalScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: p, isLoading } = useMedicalRecord(Array.isArray(id) ? id[0] : id);
  const { user } = useAuth();
  const update = useUpdateMedicalRecord();
  const [provider, setProvider] = useState('');
  const [recordDate, setRecordDate] = useState('');
  const [recordType, setRecordType] = useState('');
  const [notes, setNotes] = useState('');
  const [nextAppointment, setNextAppointment] = useState('');

  useEffect(() => {
    if (p) {
      setProvider(p.provider ?? '');
      setRecordDate(p.record_date ?? '');
      setRecordType(p.record_type ?? '');
      setNotes(p.notes ?? '');
      setNextAppointment(p.next_appointment ?? '');
    }
  }, [p]);

  const canSave = hasSupabaseEnv && id && user;

  const handleSave = async () => {
    if (!canSave) return;
    const recordId = Array.isArray(id) ? id[0] : id;
    if (!recordId) return;
    try {
      await update.mutateAsync({
        id: recordId,
        updates: { provider: provider.trim() || null, record_date: recordDate.trim() || null, record_type: recordType.trim() || null, notes: notes.trim() || null, next_appointment: nextAppointment.trim() || null },
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
        <Text style={{ color: '#F8FAFC', fontSize: 24, fontWeight: 'bold', marginBottom: 24 }}>Edit Medical Record</Text>
        <Text style={{ color: '#94A3B8', marginBottom: 8 }}>Provider</Text>
        <TextInput style={inputStyle} value={provider} onChangeText={setProvider} placeholder="e.g. Dr. Smith" placeholderTextColor="#64748B" />
        <Text style={{ color: '#94A3B8', marginBottom: 8 }}>Date (yyyy-MM-dd)</Text>
        <TextInput style={inputStyle} value={recordDate} onChangeText={setRecordDate} placeholder="Optional" placeholderTextColor="#64748B" />
        <Text style={{ color: '#94A3B8', marginBottom: 8 }}>Type</Text>
        <TextInput style={inputStyle} value={recordType} onChangeText={setRecordType} placeholder="e.g. Checkup, Lab" placeholderTextColor="#64748B" />
        <Text style={{ color: '#94A3B8', marginBottom: 8 }}>Notes</Text>
        <TextInput style={[inputStyle, { minHeight: 80, textAlignVertical: 'top' }]} value={notes} onChangeText={setNotes} placeholder="Optional" placeholderTextColor="#64748B" multiline />
        <Text style={{ color: '#94A3B8', marginBottom: 8 }}>Next appointment (yyyy-MM-dd)</Text>
        <TextInput style={inputStyle} value={nextAppointment} onChangeText={setNextAppointment} placeholder="Optional" placeholderTextColor="#64748B" />
        <TouchableOpacity onPress={handleSave} disabled={!canSave || update.isPending} style={{ backgroundColor: canSave ? '#3B82F6' : '#334155', borderRadius: 12, padding: 16, alignItems: 'center' }}>
          {update.isPending ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff', fontWeight: '600' }}>Save</Text>}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
