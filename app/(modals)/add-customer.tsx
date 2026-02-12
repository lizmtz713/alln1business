import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useCreateCustomer } from '../../src/hooks/useCustomers';
import { useAuth } from '../../src/providers/AuthProvider';
import { hasSupabaseEnv } from '../../src/services/env';
import type { PaymentTerms } from '../../src/types/contacts';

const PAYMENT_TERMS: { id: PaymentTerms; label: string }[] = [
  { id: 'due_on_receipt', label: 'Due on receipt' },
  { id: 'net_15', label: 'Net 15' },
  { id: 'net_30', label: 'Net 30' },
  { id: 'net_45', label: 'Net 45' },
  { id: 'net_60', label: 'Net 60' },
];

const inputStyle = {
  backgroundColor: '#1E293B' as const,
  borderRadius: 12,
  padding: 12,
  color: '#F8FAFC' as const,
  marginBottom: 16,
  borderWidth: 1,
  borderColor: '#334155' as const,
};

export default function AddCustomerScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const createCustomer = useCreateCustomer();
  const [contactName, setContactName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zip, setZip] = useState('');
  const [taxExempt, setTaxExempt] = useState(false);
  const [taxExemptNumber, setTaxExemptNumber] = useState('');
  const [paymentTerms, setPaymentTerms] = useState<PaymentTerms | null>(null);
  const [notes, setNotes] = useState('');

  const canSave = hasSupabaseEnv && user && contactName.trim();

  const handleSave = async () => {
    if (!canSave) return;
    try {
      await createCustomer.mutateAsync({
        contact_name: contactName.trim(),
        company_name: companyName.trim() || null,
        email: email.trim() || null,
        phone: phone.trim() || null,
        address: address.trim() || null,
        city: city.trim() || null,
        state: state.trim() || null,
        zip: zip.trim() || null,
        tax_exempt: taxExempt,
        tax_exempt_number: taxExemptNumber.trim() || null,
        payment_terms: paymentTerms,
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
        <TouchableOpacity onPress={() => router.back()} style={{ marginBottom: 16 }}>
          <Text style={{ color: '#3B82F6' }}>← Back</Text>
        </TouchableOpacity>
        <Text style={{ color: '#94A3B8' }}>Connect Supabase to add customers.</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#0F172A' }}>
      <ScrollView contentContainerStyle={{ padding: 24 }}>
        <TouchableOpacity onPress={() => router.back()} style={{ marginBottom: 24 }}>
          <Text style={{ color: '#3B82F6', fontSize: 16 }}>← Back</Text>
        </TouchableOpacity>

        <Text style={{ color: '#F8FAFC', fontSize: 24, fontWeight: 'bold', marginBottom: 24 }}>
          Add Customer
        </Text>

        <Text style={{ color: '#94A3B8', marginBottom: 8 }}>Contact Name *</Text>
        <TextInput style={inputStyle} value={contactName} onChangeText={setContactName} placeholder="e.g. Jane Doe" placeholderTextColor="#64748B" />

        <Text style={{ color: '#94A3B8', marginBottom: 8 }}>Company Name</Text>
        <TextInput style={inputStyle} value={companyName} onChangeText={setCompanyName} placeholder="Optional" placeholderTextColor="#64748B" />

        <Text style={{ color: '#94A3B8', marginBottom: 8 }}>Email</Text>
        <TextInput style={inputStyle} value={email} onChangeText={setEmail} placeholder="email@example.com" placeholderTextColor="#64748B" keyboardType="email-address" />

        <Text style={{ color: '#94A3B8', marginBottom: 8 }}>Phone</Text>
        <TextInput style={inputStyle} value={phone} onChangeText={setPhone} placeholder="Optional" placeholderTextColor="#64748B" keyboardType="phone-pad" />

        <Text style={{ color: '#94A3B8', marginBottom: 8 }}>Address</Text>
        <TextInput style={inputStyle} value={address} onChangeText={setAddress} placeholder="Street address" placeholderTextColor="#64748B" />
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <TextInput style={[inputStyle, { flex: 1 }]} value={city} onChangeText={setCity} placeholder="City" placeholderTextColor="#64748B" />
          <TextInput style={[inputStyle, { flex: 1 }]} value={state} onChangeText={setState} placeholder="State" placeholderTextColor="#64748B" />
          <TextInput style={[inputStyle, { flex: 1 }]} value={zip} onChangeText={setZip} placeholder="ZIP" placeholderTextColor="#64748B" keyboardType="number-pad" />
        </View>

        <TouchableOpacity onPress={() => setTaxExempt(!taxExempt)} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
          <View style={{ width: 24, height: 24, borderRadius: 6, borderWidth: 2, borderColor: taxExempt ? '#3B82F6' : '#64748B', backgroundColor: taxExempt ? '#3B82F6' : 'transparent', marginRight: 12, alignItems: 'center', justifyContent: 'center' }}>
            {taxExempt && <Text style={{ color: '#fff', fontSize: 14 }}>✓</Text>}
          </View>
          <Text style={{ color: '#F8FAFC' }}>Tax exempt</Text>
        </TouchableOpacity>

        {taxExempt && (
          <>
            <Text style={{ color: '#94A3B8', marginBottom: 8 }}>Tax Exempt Number</Text>
            <TextInput style={inputStyle} value={taxExemptNumber} onChangeText={setTaxExemptNumber} placeholder="e.g. 12-3456789" placeholderTextColor="#64748B" />
          </>
        )}

        <Text style={{ color: '#94A3B8', marginBottom: 8 }}>Payment Terms</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
          {PAYMENT_TERMS.map((t) => (
            <TouchableOpacity key={t.id} onPress={() => setPaymentTerms(t.id)} style={{ paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12, backgroundColor: paymentTerms === t.id ? '#3B82F6' : '#1E293B' }}>
              <Text style={{ color: '#F8FAFC' }}>{t.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={{ color: '#94A3B8', marginBottom: 8 }}>Notes</Text>
        <TextInput style={[inputStyle, { minHeight: 80, textAlignVertical: 'top' }]} value={notes} onChangeText={setNotes} placeholder="Optional notes" placeholderTextColor="#64748B" multiline />

        <TouchableOpacity onPress={handleSave} disabled={!canSave || createCustomer.isPending} style={{ backgroundColor: canSave ? '#3B82F6' : '#334155', borderRadius: 12, padding: 16, alignItems: 'center' }}>
          {createCustomer.isPending ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff', fontWeight: '600', fontSize: 16 }}>Save</Text>}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
