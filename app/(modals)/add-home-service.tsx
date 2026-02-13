import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCreateHomeServiceContact } from '../../src/hooks/useHomeServices';
import { useAuth } from '../../src/providers/AuthProvider';
import { hasSupabaseEnv } from '../../src/services/env';
import { SmartPhotoCapture, type SmartPhotoCaptureResult } from '../../src/components/SmartPhotoCapture';
import { hasScanApi } from '../../src/services/scanDocument';
import { hapticLight } from '../../src/lib/haptics';

const inputStyle = { backgroundColor: '#1E293B' as const, borderRadius: 12, padding: 12, color: '#F8FAFC' as const, marginBottom: 16, borderWidth: 1, borderColor: '#334155' as const };

const SERVICE_TYPES = ['plumber', 'electrician', 'hvac', 'lawn', 'other'];

export default function AddHomeServiceScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const create = useCreateHomeServiceContact();
  const [serviceType, setServiceType] = useState('plumber');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [notes, setNotes] = useState('');
  const [lastServiceDate, setLastServiceDate] = useState('');
  const [scanVisible, setScanVisible] = useState(false);

  const canSave = hasSupabaseEnv && user && name.trim();

  const applyScanResult = (result: SmartPhotoCaptureResult) => {
    const f = result.fields;
    if (f.name != null || f.provider != null) setName(String(f.name ?? f.provider));
    if (f.phone != null) setPhone(String(f.phone));
    if (f.email != null) setEmail(String(f.email));
    if (f.notes != null) setNotes(String(f.notes));
    setScanVisible(false);
  };

  const handleSave = async () => {
    if (!canSave) return;
    try {
      await create.mutateAsync({
        service_type: serviceType,
        name: name.trim(),
        phone: phone.trim() || null,
        email: email.trim() || null,
        notes: notes.trim() || null,
        last_service_date: lastServiceDate.trim() || null,
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
        <Text style={{ color: '#F8FAFC', fontSize: 24, fontWeight: 'bold', marginBottom: 24 }}>Add Home Service</Text>
        {hasScanApi && (
          <TouchableOpacity onPress={() => { hapticLight(); setScanVisible(true); }} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#334155', borderRadius: 12, padding: 14, marginBottom: 24 }}>
            <Ionicons name="scan" size={22} color="#3B82F6" />
            <Text style={{ color: '#3B82F6', fontWeight: '600', fontSize: 16 }}>Scan business card</Text>
          </TouchableOpacity>
        )}
        <Text style={{ color: '#94A3B8', marginBottom: 8 }}>Service type</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
          {SERVICE_TYPES.map((t) => (
            <TouchableOpacity key={t} onPress={() => setServiceType(t)} style={{ backgroundColor: serviceType === t ? '#3B82F6' : '#1E293B', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 }}>
              <Text style={{ color: '#F8FAFC', textTransform: 'capitalize' }}>{t}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={{ color: '#94A3B8', marginBottom: 8 }}>Name *</Text>
        <TextInput style={inputStyle} value={name} onChangeText={setName} placeholder="Company or contact name" placeholderTextColor="#64748B" />
        <Text style={{ color: '#94A3B8', marginBottom: 8 }}>Phone</Text>
        <TextInput style={inputStyle} value={phone} onChangeText={setPhone} placeholder="Optional" placeholderTextColor="#64748B" keyboardType="phone-pad" />
        <Text style={{ color: '#94A3B8', marginBottom: 8 }}>Email</Text>
        <TextInput style={inputStyle} value={email} onChangeText={setEmail} placeholder="Optional" placeholderTextColor="#64748B" keyboardType="email-address" />
        <Text style={{ color: '#94A3B8', marginBottom: 8 }}>Last service date (yyyy-MM-dd)</Text>
        <TextInput style={inputStyle} value={lastServiceDate} onChangeText={setLastServiceDate} placeholder="Optional" placeholderTextColor="#64748B" />
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
