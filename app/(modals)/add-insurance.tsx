import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCreateInsurancePolicy } from '../../src/hooks/useInsurance';
import { useAuth } from '../../src/providers/AuthProvider';
import { hasSupabaseEnv } from '../../src/services/env';
import { SmartPhotoCapture, type SmartPhotoCaptureResult } from '../../src/components/SmartPhotoCapture';
import { hasScanApi } from '../../src/services/scanDocument';
import { hapticLight } from '../../src/lib/haptics';

const inputStyle = { backgroundColor: '#1E293B' as const, borderRadius: 12, padding: 12, color: '#F8FAFC' as const, marginBottom: 16, borderWidth: 1, borderColor: '#334155' as const };

export default function AddInsuranceScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const create = useCreateInsurancePolicy();
  const [provider, setProvider] = useState('');
  const [policyNumber, setPolicyNumber] = useState('');
  const [policyType, setPolicyType] = useState('');
  const [premiumAmount, setPremiumAmount] = useState('');
  const [renewalDate, setRenewalDate] = useState('');
  const [notes, setNotes] = useState('');
  const [scanVisible, setScanVisible] = useState(false);

  const canSave = hasSupabaseEnv && user && provider.trim();

  const applyScanResult = (result: SmartPhotoCaptureResult) => {
    if (result.documentType !== 'insurance_card' && result.documentType !== 'other') return;
    const f = result.fields;
    if (f.provider != null) setProvider(String(f.provider));
    if (f.policy_number != null) setPolicyNumber(String(f.policy_number));
    if (f.group_number != null) setNotes((prev) => (prev ? `${prev}\nGroup: ${f.group_number}` : `Group: ${f.group_number}`));
    if (f.phone != null) setNotes((prev) => (prev ? `${prev}\nPhone: ${f.phone}` : `Phone: ${f.phone}`));
    if (f.plan_name != null) setPolicyType(String(f.plan_name));
    if (f.renewal_date != null) setRenewalDate(String(f.renewal_date).slice(0, 10));
    setScanVisible(false);
  };

  const handleSave = async () => {
    if (!canSave) return;
    try {
      await create.mutateAsync({
        provider: provider.trim(),
        policy_number: policyNumber.trim() || null,
        policy_type: policyType.trim() || null,
        premium_amount: premiumAmount.trim() ? parseFloat(premiumAmount) : null,
        premium_frequency: null,
        renewal_date: renewalDate.trim() || null,
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
        <Text style={{ color: '#F8FAFC', fontSize: 24, fontWeight: 'bold', marginBottom: 24 }}>Add Insurance</Text>
        {hasScanApi && (
          <TouchableOpacity onPress={() => { hapticLight(); setScanVisible(true); }} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#334155', borderRadius: 12, padding: 14, marginBottom: 24 }}>
            <Ionicons name="scan" size={22} color="#3B82F6" />
            <Text style={{ color: '#3B82F6', fontWeight: '600', fontSize: 16 }}>Scan insurance card</Text>
          </TouchableOpacity>
        )}
        <Text style={{ color: '#94A3B8', marginBottom: 8 }}>Provider *</Text>
        <TextInput style={inputStyle} value={provider} onChangeText={setProvider} placeholder="e.g. State Farm" placeholderTextColor="#64748B" />
        <Text style={{ color: '#94A3B8', marginBottom: 8 }}>Policy number</Text>
        <TextInput style={inputStyle} value={policyNumber} onChangeText={setPolicyNumber} placeholder="Optional" placeholderTextColor="#64748B" />
        <Text style={{ color: '#94A3B8', marginBottom: 8 }}>Type</Text>
        <TextInput style={inputStyle} value={policyType} onChangeText={setPolicyType} placeholder="e.g. Auto, Home" placeholderTextColor="#64748B" />
        <Text style={{ color: '#94A3B8', marginBottom: 8 }}>Premium amount</Text>
        <TextInput style={inputStyle} value={premiumAmount} onChangeText={setPremiumAmount} placeholder="0.00" placeholderTextColor="#64748B" keyboardType="decimal-pad" />
        <Text style={{ color: '#94A3B8', marginBottom: 8 }}>Renewal date (yyyy-MM-dd)</Text>
        <TextInput style={inputStyle} value={renewalDate} onChangeText={setRenewalDate} placeholder="Optional" placeholderTextColor="#64748B" />
        <Text style={{ color: '#94A3B8', marginBottom: 8 }}>Notes</Text>
        <TextInput style={[inputStyle, { minHeight: 80, textAlignVertical: 'top' }]} value={notes} onChangeText={setNotes} placeholder="Optional" placeholderTextColor="#64748B" multiline />
        <TouchableOpacity onPress={handleSave} disabled={!canSave || create.isPending} style={{ backgroundColor: canSave ? '#3B82F6' : '#334155', borderRadius: 12, padding: 16, alignItems: 'center' }}>
          {create.isPending ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff', fontWeight: '600' }}>Save</Text>}
        </TouchableOpacity>
        <SmartPhotoCapture visible={scanVisible} onClose={() => setScanVisible(false)} onExtracted={applyScanResult} expectedType="insurance" />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
