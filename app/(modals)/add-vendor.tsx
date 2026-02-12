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
import * as DocumentPicker from 'expo-document-picker';
import { useRouter } from 'expo-router';
import { useCreateVendor } from '../../src/hooks/useVendors';
import { useAuth } from '../../src/providers/AuthProvider';
import { hasSupabaseEnv } from '../../src/services/env';
import { uploadDocument } from '../../src/services/storage';
import type { VendorType, PaymentMethod } from '../../src/types/contacts';
import { format } from 'date-fns';

const VENDOR_TYPES: { id: VendorType; label: string }[] = [
  { id: 'supplier', label: 'Supplier' },
  { id: 'contractor', label: 'Contractor' },
  { id: 'service', label: 'Service' },
  { id: 'other', label: 'Other' },
];

const PAYMENT_METHODS: { id: PaymentMethod; label: string }[] = [
  { id: 'check', label: 'Check' },
  { id: 'ach', label: 'ACH' },
  { id: 'card', label: 'Card' },
  { id: 'other', label: 'Other' },
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

export default function AddVendorScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const createVendor = useCreateVendor();
  const [companyName, setCompanyName] = useState('');
  const [contactName, setContactName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zip, setZip] = useState('');
  const [ein, setEin] = useState('');
  const [vendorType, setVendorType] = useState<VendorType | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);
  const [w9Requested, setW9Requested] = useState(false);
  const [w9Received, setW9Received] = useState(false);
  const [w9ReceivedDate, setW9ReceivedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [w9FileUrl, setW9FileUrl] = useState<string | null>(null);
  const [uploadingW9, setUploadingW9] = useState(false);
  const [notes, setNotes] = useState('');

  const canSave = hasSupabaseEnv && user && companyName.trim();

  const pickW9 = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['image/*', 'application/pdf'],
        copyToCacheDirectory: true,
      });
      if (result.canceled) return;
      setUploadingW9(true);
      const url = await uploadDocument(user!.id, result.assets[0].uri);
      if (url) {
        setW9FileUrl(url);
        setW9Received(true);
        setW9Requested(true);
        setW9ReceivedDate(format(new Date(), 'yyyy-MM-dd'));
      }
    } catch {
      Alert.alert('Error', 'Failed to upload W-9');
    } finally {
      setUploadingW9(false);
    }
  };

  const handleSave = async () => {
    if (!canSave) return;
    try {
      await createVendor.mutateAsync({
        company_name: companyName.trim(),
        contact_name: contactName.trim() || null,
        email: email.trim() || null,
        phone: phone.trim() || null,
        address: address.trim() || null,
        city: city.trim() || null,
        state: state.trim() || null,
        zip: zip.trim() || null,
        ein: ein.trim() || null,
        vendor_type: vendorType,
        payment_method: paymentMethod,
        w9_requested: w9Requested || w9Received,
        w9_received: w9Received,
        w9_received_date: w9Received ? w9ReceivedDate : null,
        w9_file_url: w9FileUrl,
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
        <Text style={{ color: '#94A3B8' }}>Connect Supabase to add vendors.</Text>
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
          Add Vendor
        </Text>

        <Text style={{ color: '#94A3B8', marginBottom: 8 }}>Company Name *</Text>
        <TextInput style={inputStyle} value={companyName} onChangeText={setCompanyName} placeholder="e.g. Acme Supplies" placeholderTextColor="#64748B" />

        <Text style={{ color: '#94A3B8', marginBottom: 8 }}>Contact Name</Text>
        <TextInput style={inputStyle} value={contactName} onChangeText={setContactName} placeholder="Optional" placeholderTextColor="#64748B" />

        <Text style={{ color: '#94A3B8', marginBottom: 8 }}>Email</Text>
        <TextInput style={inputStyle} value={email} onChangeText={setEmail} placeholder="Optional" placeholderTextColor="#64748B" keyboardType="email-address" />

        <Text style={{ color: '#94A3B8', marginBottom: 8 }}>Phone</Text>
        <TextInput style={inputStyle} value={phone} onChangeText={setPhone} placeholder="Optional" placeholderTextColor="#64748B" keyboardType="phone-pad" />

        <Text style={{ color: '#94A3B8', marginBottom: 8 }}>Address</Text>
        <TextInput style={inputStyle} value={address} onChangeText={setAddress} placeholder="Street address" placeholderTextColor="#64748B" />
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <TextInput style={[inputStyle, { flex: 1 }]} value={city} onChangeText={setCity} placeholder="City" placeholderTextColor="#64748B" />
          <TextInput style={[inputStyle, { flex: 1 }]} value={state} onChangeText={setState} placeholder="State" placeholderTextColor="#64748B" />
          <TextInput style={[inputStyle, { flex: 1 }]} value={zip} onChangeText={setZip} placeholder="ZIP" placeholderTextColor="#64748B" keyboardType="number-pad" />
        </View>

        <Text style={{ color: '#94A3B8', marginBottom: 8 }}>EIN</Text>
        <TextInput style={inputStyle} value={ein} onChangeText={setEin} placeholder="Optional" placeholderTextColor="#64748B" />

        <Text style={{ color: '#94A3B8', marginBottom: 8 }}>Vendor Type</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
          {VENDOR_TYPES.map((t) => (
            <TouchableOpacity key={t.id} onPress={() => setVendorType(t.id)} style={{ paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12, backgroundColor: vendorType === t.id ? '#3B82F6' : '#1E293B' }}>
              <Text style={{ color: '#F8FAFC' }}>{t.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={{ color: '#94A3B8', marginBottom: 8 }}>Payment Method</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
          {PAYMENT_METHODS.map((t) => (
            <TouchableOpacity key={t.id} onPress={() => setPaymentMethod(t.id)} style={{ paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12, backgroundColor: paymentMethod === t.id ? '#3B82F6' : '#1E293B' }}>
              <Text style={{ color: '#F8FAFC' }}>{t.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={{ color: '#94A3B8', marginBottom: 8 }}>W-9</Text>
        <TouchableOpacity onPress={() => setW9Requested(!w9Requested)} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
          <View style={{ width: 24, height: 24, borderRadius: 6, borderWidth: 2, borderColor: w9Requested ? '#3B82F6' : '#64748B', backgroundColor: w9Requested ? '#3B82F6' : 'transparent', marginRight: 12, alignItems: 'center', justifyContent: 'center' }}>
            {w9Requested && <Text style={{ color: '#fff', fontSize: 14 }}>✓</Text>}
          </View>
          <Text style={{ color: '#F8FAFC' }}>W-9 requested</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setW9Received(!w9Received)} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
          <View style={{ width: 24, height: 24, borderRadius: 6, borderWidth: 2, borderColor: w9Received ? '#3B82F6' : '#64748B', backgroundColor: w9Received ? '#3B82F6' : 'transparent', marginRight: 12, alignItems: 'center', justifyContent: 'center' }}>
            {w9Received && <Text style={{ color: '#fff', fontSize: 14 }}>✓</Text>}
          </View>
          <Text style={{ color: '#F8FAFC' }}>W-9 received</Text>
        </TouchableOpacity>
        {w9Received && (
          <>
            <Text style={{ color: '#94A3B8', marginBottom: 8 }}>Received Date</Text>
            <TextInput style={inputStyle} value={w9ReceivedDate} onChangeText={setW9ReceivedDate} placeholder="yyyy-MM-dd" placeholderTextColor="#64748B" />
            <TouchableOpacity onPress={pickW9} disabled={uploadingW9} style={{ backgroundColor: '#334155', borderRadius: 12, padding: 12, marginBottom: 16, alignItems: 'center' }}>
              {uploadingW9 ? <ActivityIndicator color="#3B82F6" /> : <Text style={{ color: '#3B82F6' }}>{w9FileUrl ? 'Replace W-9' : 'Upload W-9'}</Text>}
            </TouchableOpacity>
          </>
        )}

        <Text style={{ color: '#94A3B8', marginBottom: 8 }}>Notes</Text>
        <TextInput style={[inputStyle, { minHeight: 80, textAlignVertical: 'top' }]} value={notes} onChangeText={setNotes} placeholder="Optional notes" placeholderTextColor="#64748B" multiline />

        <TouchableOpacity onPress={handleSave} disabled={!canSave || createVendor.isPending} style={{ backgroundColor: canSave ? '#3B82F6' : '#334155', borderRadius: 12, padding: 16, alignItems: 'center' }}>
          {createVendor.isPending ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff', fontWeight: '600', fontSize: 16 }}>Save</Text>}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
