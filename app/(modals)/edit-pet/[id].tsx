import { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { usePet, useUpdatePet } from '../../../src/hooks/usePets';
import { useAuth } from '../../../src/providers/AuthProvider';
import { hasSupabaseEnv } from '../../../src/services/env';

const inputStyle = { backgroundColor: '#1E293B' as const, borderRadius: 12, padding: 12, color: '#F8FAFC' as const, marginBottom: 16, borderWidth: 1, borderColor: '#334155' as const };

export default function EditPetScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: p, isLoading } = usePet(Array.isArray(id) ? id[0] : id);
  const { user } = useAuth();
  const update = useUpdatePet();
  const [name, setName] = useState('');
  const [type, setType] = useState('');
  const [breed, setBreed] = useState('');
  const [vetName, setVetName] = useState('');
  const [vetPhone, setVetPhone] = useState('');
  const [vaccinationDates, setVaccinationDates] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (p) {
      setName(p.name ?? '');
      setType(p.type ?? '');
      setBreed(p.breed ?? '');
      setVetName(p.vet_name ?? '');
      setVetPhone(p.vet_phone ?? '');
      setVaccinationDates(p.vaccination_dates ?? '');
      setNotes(p.notes ?? '');
    }
  }, [p]);

  const canSave = hasSupabaseEnv && id && user && name.trim();

  const handleSave = async () => {
    if (!canSave) return;
    const petId = Array.isArray(id) ? id[0] : id;
    if (!petId) return;
    try {
      await update.mutateAsync({
        id: petId,
        updates: { name: name.trim(), type: type.trim() || null, breed: breed.trim() || null, vet_name: vetName.trim() || null, vet_phone: vetPhone.trim() || null, vaccination_dates: vaccinationDates.trim() || null, notes: notes.trim() || null },
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
        <Text style={{ color: '#F8FAFC', fontSize: 24, fontWeight: 'bold', marginBottom: 24 }}>Edit Pet</Text>
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
        <TouchableOpacity onPress={handleSave} disabled={!canSave || update.isPending} style={{ backgroundColor: canSave ? '#3B82F6' : '#334155', borderRadius: 12, padding: 16, alignItems: 'center' }}>
          {update.isPending ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff', fontWeight: '600' }}>Save</Text>}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
