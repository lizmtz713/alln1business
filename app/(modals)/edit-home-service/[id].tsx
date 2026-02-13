import { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useHomeServiceContact, useUpdateHomeServiceContact } from '../../../src/hooks/useHomeServices';
import { useAuth } from '../../../src/providers/AuthProvider';
import { hasSupabaseEnv } from '../../../src/services/env';

const inputStyle = { backgroundColor: '#1E293B' as const, borderRadius: 12, padding: 12, color: '#F8FAFC' as const, marginBottom: 16, borderWidth: 1, borderColor: '#334155' as const };

const SERVICE_TYPES = ['plumber', 'electrician', 'hvac', 'lawn', 'other'];

export default function EditHomeServiceScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: p, isLoading } = useHomeServiceContact(Array.isArray(id) ? id[0] : id);
  const { user } = useAuth();
  const update = useUpdateHomeServiceContact();
  const [serviceType, setServiceType] = useState('plumber');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [notes, setNotes] = useState('');
  const [lastServiceDate, setLastServiceDate] = useState('');

  useEffect(() => {
    if (p) {
      setServiceType(p.service_type ?? 'plumber');
      setName(p.name ?? '');
      setPhone(p.phone ?? '');
      setEmail(p.email ?? '');
      setNotes(p.notes ?? '');
      setLastServiceDate(p.last_service_date ?? '');
    }
  }, [p]);

  const canSave = hasSupabaseEnv && id && user && name.trim();

  const handleSave = async () => {
    if (!canSave) return;
    const contactId = Array.isArray(id) ? id[0] : id;
    if (!contactId) return;
    try {
      await update.mutateAsync({
        id: contactId,
        updates: { service_type: serviceType, name: name.trim(), phone: phone.trim() || null, email: email.trim() || null, notes: notes.trim() || null, last_service_date: lastServiceDate.trim() || null },
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
        <Text style={{ color: '#F8FAFC', fontSize: 24, fontWeight: 'bold', marginBottom: 24 }}>Edit Home Service</Text>
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
        <TouchableOpacity onPress={handleSave} disabled={!canSave || update.isPending} style={{ backgroundColor: canSave ? '#3B82F6' : '#334155', borderRadius: 12, padding: 16, alignItems: 'center' }}>
          {update.isPending ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff', fontWeight: '600' }}>Save</Text>}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
