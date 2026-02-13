import { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useInsurancePolicy, useUpdateInsurancePolicy } from '../../../src/hooks/useInsurance';
import { useAuth } from '../../../src/providers/AuthProvider';
import { hasSupabaseEnv } from '../../../src/services/env';

const inputStyle = { backgroundColor: '#1E293B' as const, borderRadius: 12, padding: 12, color: '#F8FAFC' as const, marginBottom: 16, borderWidth: 1, borderColor: '#334155' as const };

export default function EditInsuranceScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const pid = Array.isArray(id) ? id[0] : id;
  const { data: pol, isLoading } = useInsurancePolicy(pid);
  const { user } = useAuth();
  const update = useUpdateInsurancePolicy();
  const [provider, setProvider] = useState('');
  const [policyNumber, setPolicyNumber] = useState('');
  const [policyType, setPolicyType] = useState('');
  const [premiumAmount, setPremiumAmount] = useState('');
  const [premiumFrequency, setPremiumFrequency] = useState('');
  const [renewalDate, setRenewalDate] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (pol) {
      setProvider(pol.provider ?? '');
      setPolicyNumber(pol.policy_number ?? '');
      setPolicyType(pol.policy_type ?? '');
      setPremiumAmount(pol.premium_amount != null ? String(pol.premium_amount) : '');
      setPremiumFrequency(pol.premium_frequency ?? '');
      setRenewalDate(pol.renewal_date?.split('T')[0] ?? '');
      setNotes(pol.notes ?? '');
    }
  }, [pol]);

  const canSave = hasSupabaseEnv && pid && user && provider.trim();

  const handleSave = async () => {
    if (!canSave || !pid) return;
    try {
      await update.mutateAsync({
        id: pid,
        updates: {
          provider: provider.trim(),
          policy_number: policyNumber.trim() || null,
          policy_type: policyType.trim() || null,
          premium_amount: premiumAmount.trim() ? parseFloat(premiumAmount) : null,
          premium_frequency: premiumFrequency.trim() || null,
          renewal_date: renewalDate.trim() || null,
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
  if (isLoading || !pol) {
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
        <Text style={{ color: '#F8FAFC', fontSize: 24, fontWeight: 'bold', marginBottom: 24 }}>Edit Insurance</Text>
        <Text style={{ color: '#94A3B8', marginBottom: 8 }}>Provider *</Text>
        <TextInput style={inputStyle} value={provider} onChangeText={setProvider} placeholder="e.g. State Farm" placeholderTextColor="#64748B" />
        <Text style={{ color: '#94A3B8', marginBottom: 8 }}>Policy number</Text>
        <TextInput style={inputStyle} value={policyNumber} onChangeText={setPolicyNumber} placeholder="Optional" placeholderTextColor="#64748B" />
        <Text style={{ color: '#94A3B8', marginBottom: 8 }}>Type</Text>
        <TextInput style={inputStyle} value={policyType} onChangeText={setPolicyType} placeholder="e.g. Auto, Home" placeholderTextColor="#64748B" />
        <Text style={{ color: '#94A3B8', marginBottom: 8 }}>Premium amount</Text>
        <TextInput style={inputStyle} value={premiumAmount} onChangeText={setPremiumAmount} placeholder="0.00" placeholderTextColor="#64748B" keyboardType="decimal-pad" />
        <Text style={{ color: '#94A3B8', marginBottom: 8 }}>Frequency</Text>
        <TextInput style={inputStyle} value={premiumFrequency} onChangeText={setPremiumFrequency} placeholder="e.g. monthly, annual" placeholderTextColor="#64748B" />
        <Text style={{ color: '#94A3B8', marginBottom: 8 }}>Renewal date (yyyy-MM-dd)</Text>
        <TextInput style={inputStyle} value={renewalDate} onChangeText={setRenewalDate} placeholder="Optional" placeholderTextColor="#64748B" />
        <Text style={{ color: '#94A3B8', marginBottom: 8 }}>Notes</Text>
        <TextInput style={[inputStyle, { minHeight: 80, textAlignVertical: 'top' }]} value={notes} onChangeText={setNotes} placeholder="Optional" placeholderTextColor="#64748B" multiline />
        <TouchableOpacity onPress={handleSave} disabled={!canSave || update.isPending} style={{ backgroundColor: canSave ? '#3B82F6' : '#334155', borderRadius: 12, padding: 16, alignItems: 'center' }}>
          {update.isPending ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff', fontWeight: '600' }}>Save</Text>}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
