import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCreatePet } from '../../src/hooks/usePets';
import { useAuth } from '../../src/providers/AuthProvider';
import { hasSupabaseEnv } from '../../src/services/env';
import { SmartPhotoCapture, type SmartPhotoCaptureResult } from '../../src/components/SmartPhotoCapture';
import { hasScanApi } from '../../src/services/scanDocument';
import { hapticLight } from '../../src/lib/haptics';

const inputStyle = { backgroundColor: '#1E293B' as const, borderRadius: 12, padding: 12, color: '#F8FAFC' as const, marginBottom: 16, borderWidth: 1, borderColor: '#334155' as const };

export default function AddPetScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const create = useCreatePet();
  const [name, setName] = useState('');
  const [type, setType] = useState('');
  const [breed, setBreed] = useState('');
  const [vetName, setVetName] = useState('');
  const [vetPhone, setVetPhone] = useState('');
  const [vaccinationDates, setVaccinationDates] = useState('');
  const [notes, setNotes] = useState('');
  const [scanVisible, setScanVisible] = useState(false);

  const canSave = hasSupabaseEnv && user && name.trim();

  const applyScanResult = (result: SmartPhotoCaptureResult) => {
    if (result.documentType !== 'vet_record' && result.documentType !== 'other') return;
    const f = result.fields;
    if (f.pet_name != null) setName(String(f.pet_name));
    if (f.vet_name != null) setVetName(String(f.vet_name));
    if (f.vet_phone != null) setVetPhone(String(f.vet_phone));
    if (f.vaccines != null) setVaccinationDates(Array.isArray(f.vaccines) ? f.vaccines.join('; ') : String(f.vaccines));
    else if (f.visit_date != null) setVaccinationDates(String(f.visit_date));
    if (f.notes != null) setNotes(String(f.notes));
    setScanVisible(false);
  };

  const handleSave = async () => {
    if (!canSave) return;
    try {
      await create.mutateAsync({
        name: name.trim(),
        type: type.trim() || null,
        breed: breed.trim() || null,
        vet_name: vetName.trim() || null,
        vet_phone: vetPhone.trim() || null,
        vaccination_dates: vaccinationDates.trim() || null,
        notes: notes.trim() || null,
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
        <Text style={{ color: '#F8FAFC', fontSize: 24, fontWeight: 'bold', marginBottom: 24 }}>Add Pet</Text>
        {hasScanApi && (
          <TouchableOpacity onPress={() => { hapticLight(); setScanVisible(true); }} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#334155', borderRadius: 12, padding: 14, marginBottom: 24 }}>
            <Ionicons name="scan" size={22} color="#3B82F6" />
            <Text style={{ color: '#3B82F6', fontWeight: '600', fontSize: 16 }}>Scan vet record</Text>
          </TouchableOpacity>
        )}
        <Text style={{ color: '#94A3B8', marginBottom: 8 }}>Name *</Text>
        <TextInput style={inputStyle} value={name} onChangeText={setName} placeholder="Pet name" placeholderTextColor="#64748B" />
        <Text style={{ color: '#94A3B8', marginBottom: 8 }}>Type</Text>
        <TextInput style={inputStyle} value={type} onChangeText={setType} placeholder="e.g. Dog, Cat" placeholderTextColor="#64748B" />
        <Text style={{ color: '#94A3B8', marginBottom: 8 }}>Breed</Text>
        <TextInput style={inputStyle} value={breed} onChangeText={setBreed} placeholder="Optional" placeholderTextColor="#64748B" />
        <Text style={{ color: '#94A3B8', marginBottom: 8 }}>Vet name</Text>
        <TextInput style={inputStyle} value={vetName} onChangeText={setVetName} placeholder="Optional" placeholderTextColor="#64748B" />
        <Text style={{ color: '#94A3B8', marginBottom: 8 }}>Vet phone</Text>
        <TextInput style={inputStyle} value={vetPhone} onChangeText={setVetPhone} placeholder="Optional" placeholderTextColor="#64748B" keyboardType="phone-pad" />
        <Text style={{ color: '#94A3B8', marginBottom: 8 }}>Vaccination dates</Text>
        <TextInput style={inputStyle} value={vaccinationDates} onChangeText={setVaccinationDates} placeholder="e.g. Rabies 2024-01" placeholderTextColor="#64748B" />
        <Text style={{ color: '#94A3B8', marginBottom: 8 }}>Notes</Text>
        <TextInput style={[inputStyle, { minHeight: 80, textAlignVertical: 'top' }]} value={notes} onChangeText={setNotes} placeholder="Optional" placeholderTextColor="#64748B" multiline />
        <TouchableOpacity onPress={handleSave} disabled={!canSave || create.isPending} style={{ backgroundColor: canSave ? '#3B82F6' : '#334155', borderRadius: 12, padding: 16, alignItems: 'center' }}>
          {create.isPending ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff', fontWeight: '600' }}>Save</Text>}
        </TouchableOpacity>
        <SmartPhotoCapture visible={scanVisible} onClose={() => setScanVisible(false)} onExtracted={applyScanResult} expectedType="pet" />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
