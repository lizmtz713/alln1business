import { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useVehicle, useUpdateVehicle } from '../../../src/hooks/useVehicles';
import { useAuth } from '../../../src/providers/AuthProvider';
import { hasSupabaseEnv } from '../../../src/services/env';

const inputStyle = { backgroundColor: '#1E293B' as const, borderRadius: 12, padding: 12, color: '#F8FAFC' as const, marginBottom: 16, borderWidth: 1, borderColor: '#334155' as const };

export default function EditVehicleScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: v, isLoading } = useVehicle(Array.isArray(id) ? id[0] : id);
  const { user } = useAuth();
  const update = useUpdateVehicle();
  const [year, setYear] = useState('');
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [vin, setVin] = useState('');
  const [insuranceProvider, setInsuranceProvider] = useState('');
  const [insuranceExpiry, setInsuranceExpiry] = useState('');
  const [registrationExpiry, setRegistrationExpiry] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (v) {
      setYear(v.year != null ? String(v.year) : '');
      setMake(v.make ?? '');
      setModel(v.model ?? '');
      setVin(v.vin ?? '');
      setInsuranceProvider(v.insurance_provider ?? '');
      setInsuranceExpiry(v.insurance_expiry?.split('T')[0] ?? '');
      setRegistrationExpiry(v.registration_expiry?.split('T')[0] ?? '');
      setNotes(v.notes ?? '');
    }
  }, [v]);

  const canSave = hasSupabaseEnv && id && user && (make.trim() || model.trim());

  const handleSave = async () => {
    if (!canSave) return;
    const vehicleId = Array.isArray(id) ? id[0] : id;
    if (!vehicleId) return;
    try {
      await update.mutateAsync({
        id: vehicleId,
        updates: {
          year: year.trim() ? parseInt(year, 10) : null,
          make: make.trim() || null,
          model: model.trim() || null,
          vin: vin.trim() || null,
          insurance_provider: insuranceProvider.trim() || null,
          insurance_expiry: insuranceExpiry.trim() || null,
          registration_expiry: registrationExpiry.trim() || null,
          notes: notes.trim() || null,
        },
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

  if (isLoading || !v) {
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
        <Text style={{ color: '#F8FAFC', fontSize: 24, fontWeight: 'bold', marginBottom: 24 }}>Edit Vehicle</Text>
        <Text style={{ color: '#94A3B8', marginBottom: 8 }}>Year</Text>
        <TextInput style={inputStyle} value={year} onChangeText={setYear} placeholder="e.g. 2022" placeholderTextColor="#64748B" keyboardType="number-pad" />
        <Text style={{ color: '#94A3B8', marginBottom: 8 }}>Make</Text>
        <TextInput style={inputStyle} value={make} onChangeText={setMake} placeholder="e.g. Toyota" placeholderTextColor="#64748B" />
        <Text style={{ color: '#94A3B8', marginBottom: 8 }}>Model</Text>
        <TextInput style={inputStyle} value={model} onChangeText={setModel} placeholder="e.g. Camry" placeholderTextColor="#64748B" />
        <Text style={{ color: '#94A3B8', marginBottom: 8 }}>VIN</Text>
        <TextInput style={inputStyle} value={vin} onChangeText={setVin} placeholder="Optional" placeholderTextColor="#64748B" />
        <Text style={{ color: '#94A3B8', marginBottom: 8 }}>Insurance provider</Text>
        <TextInput style={inputStyle} value={insuranceProvider} onChangeText={setInsuranceProvider} placeholder="Optional" placeholderTextColor="#64748B" />
        <Text style={{ color: '#94A3B8', marginBottom: 8 }}>Insurance expiry (yyyy-MM-dd)</Text>
        <TextInput style={inputStyle} value={insuranceExpiry} onChangeText={setInsuranceExpiry} placeholder="Optional" placeholderTextColor="#64748B" />
        <Text style={{ color: '#94A3B8', marginBottom: 8 }}>Registration expiry (yyyy-MM-dd)</Text>
        <TextInput style={inputStyle} value={registrationExpiry} onChangeText={setRegistrationExpiry} placeholder="Optional" placeholderTextColor="#64748B" />
        <Text style={{ color: '#94A3B8', marginBottom: 8 }}>Notes</Text>
        <TextInput style={[inputStyle, { minHeight: 80, textAlignVertical: 'top' }]} value={notes} onChangeText={setNotes} placeholder="Optional" placeholderTextColor="#64748B" multiline />
        <TouchableOpacity onPress={handleSave} disabled={!canSave || update.isPending} style={{ backgroundColor: canSave ? '#3B82F6' : '#334155', borderRadius: 12, padding: 16, alignItems: 'center' }}>
          {update.isPending ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff', fontWeight: '600' }}>Save</Text>}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
