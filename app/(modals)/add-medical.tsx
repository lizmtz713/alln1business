import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCreateMedicalRecord } from '../../src/hooks/useMedical';
import { useAuth } from '../../src/providers/AuthProvider';
import { hasSupabaseEnv } from '../../src/services/env';
import { SmartPhotoCapture, type SmartPhotoCaptureResult } from '../../src/components/SmartPhotoCapture';
import { hasScanApi } from '../../src/services/scanDocument';
import { hapticLight } from '../../src/lib/haptics';

const inputStyle = { backgroundColor: '#1E293B' as const, borderRadius: 12, padding: 12, color: '#F8FAFC' as const, marginBottom: 16, borderWidth: 1, borderColor: '#334155' as const };

export default function AddMedicalScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const create = useCreateMedicalRecord();
  const [provider, setProvider] = useState('');
  const [recordDate, setRecordDate] = useState('');
  const [recordType, setRecordType] = useState('');
  const [notes, setNotes] = useState('');
  const [nextAppointment, setNextAppointment] = useState('');
  const [scanVisible, setScanVisible] = useState(false);

  const canSave = hasSupabaseEnv && user;

  const applyScanResult = (result: SmartPhotoCaptureResult) => {
    const f = result.fields;
    if (f.provider != null || f.vet_name != null) setProvider(String(f.provider ?? f.vet_name));
    if (f.record_date != null || f.visit_date != null) setRecordDate(String(f.record_date ?? f.visit_date).slice(0, 10));
    if (f.record_type != null) setRecordType(String(f.record_type));
    if (f.notes != null) setNotes(String(f.notes));
    setScanVisible(false);
  };

  const handleSave = async () => {
    if (!canSave) return;
    try {
      await create.mutateAsync({
        provider: provider.trim() || null,
        record_date: recordDate.trim() || null,
        record_type: recordType.trim() || null,
        notes: notes.trim() || null,
        next_appointment: nextAppointment.trim() || null,
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
        <Text style={{ color: '#F8FAFC', fontSize: 24, fontWeight: 'bold', marginBottom: 24 }}>Add Medical Record</Text>
        {hasScanApi && (
          <TouchableOpacity onPress={() => { hapticLight(); setScanVisible(true); }} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#334155', borderRadius: 12, padding: 14, marginBottom: 24 }}>
            <Ionicons name="scan" size={22} color="#3B82F6" />
            <Text style={{ color: '#3B82F6', fontWeight: '600', fontSize: 16 }}>Scan medical / vet record</Text>
          </TouchableOpacity>
        )}
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
        <TouchableOpacity onPress={handleSave} disabled={!canSave || create.isPending} style={{ backgroundColor: canSave ? '#3B82F6' : '#334155', borderRadius: 12, padding: 16, alignItems: 'center' }}>
          {create.isPending ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff', fontWeight: '600' }}>Save</Text>}
        </TouchableOpacity>
        <SmartPhotoCapture visible={scanVisible} onClose={() => setScanVisible(false)} onExtracted={applyScanResult} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
