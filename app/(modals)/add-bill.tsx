import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCreateBill } from '../../src/hooks/useBills';
import { useAuth } from '../../src/providers/AuthProvider';
import { hasSupabaseEnv } from '../../src/services/env';
import { sanitizeText, MAX_LENGTHS } from '../../src/lib/sanitize';
import { uploadDocument } from '../../src/services/storage';
import { EXPENSE_CATEGORIES } from '../../src/lib/categories';
import { format, addDays } from 'date-fns';
import { SmartPhotoCapture, type SmartPhotoCaptureResult } from '../../src/components/SmartPhotoCapture';
import { hasScanApi } from '../../src/services/scanDocument';
import { hapticLight } from '../../src/lib/haptics';

const RECURRENCE_OPTIONS = [
  { id: 'monthly', label: 'Monthly' },
  { id: 'quarterly', label: 'Quarterly' },
  { id: 'yearly', label: 'Yearly' },
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

export default function AddBillScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const createBill = useCreateBill();

  const [billName, setBillName] = useState('');
  const [providerName, setProviderName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [providerPhone, setProviderPhone] = useState('');
  const [providerEmail, setProviderEmail] = useState('');
  const [providerWebsite, setProviderWebsite] = useState('');
  const [paymentUrl, setPaymentUrl] = useState('');
  const [amount, setAmount] = useState('');
  const [billDate, setBillDate] = useState('');
  const [dueDate, setDueDate] = useState(format(addDays(new Date(), 7), 'yyyy-MM-dd'));
  const [category, setCategory] = useState('utilities');
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrenceInterval, setRecurrenceInterval] = useState<string | null>(null);
  const [reminderDays, setReminderDays] = useState('3');
  const [notes, setNotes] = useState('');
  const [attachmentUrl, setAttachmentUrl] = useState<string | null>(null);
  const [uploadingAttachment, setUploadingAttachment] = useState(false);
  const [scanVisible, setScanVisible] = useState(false);

  const canSave = hasSupabaseEnv && user && billName.trim() && amount && parseFloat(amount) > 0 && dueDate;

  const applyScanResult = (result: SmartPhotoCaptureResult) => {
    if (result.documentType !== 'bill' && result.documentType !== 'receipt') return;
    const f = result.fields;
    if (f.provider_name != null) setProviderName(String(f.provider_name));
    if (f.bill_name != null) setBillName(String(f.bill_name));
    if (f.amount != null) setAmount(String(f.amount));
    if (f.due_date != null) setDueDate(String(f.due_date).slice(0, 10));
    if (f.account_number != null) setAccountNumber(String(f.account_number));
    if (f.payment_url != null) setPaymentUrl(String(f.payment_url));
    if (f.notes != null) setNotes(String(f.notes));
    if (result.storageUrl) setAttachmentUrl(result.storageUrl);
    setScanVisible(false);
  };

  const pickAttachment = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['image/*', 'application/pdf'],
        copyToCacheDirectory: true,
      });
      if (result.canceled) return;
      setUploadingAttachment(true);
      const url = await uploadDocument(user!.id, result.assets[0].uri);
      if (url) setAttachmentUrl(url);
    } catch {
      Alert.alert('Error', 'Failed to upload attachment');
    } finally {
      setUploadingAttachment(false);
    }
  };

  const handleSave = async () => {
    if (!canSave) return;
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) return;

    try {
      await createBill.mutateAsync({
        bill_name: sanitizeText(billName, MAX_LENGTHS.shortText),
        vendor_id: null,
        provider_name: providerName.trim() || null,
        account_number: accountNumber.trim() || null,
        provider_phone: providerPhone.trim() || null,
        provider_email: providerEmail.trim() || null,
        provider_website: providerWebsite.trim() || null,
        payment_url: paymentUrl.trim() || null,
        amount: amt,
        bill_date: billDate.trim() || null,
        due_date: dueDate,
        category: category || null,
        is_recurring: isRecurring,
        recurrence_interval: recurrenceInterval,
        reminder_days: parseInt(reminderDays, 10) || 3,
        notes: notes.trim() || null,
        attachment_url: attachmentUrl,
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
        <Text style={{ color: '#94A3B8' }}>Connect Supabase to add bills.</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: '#0F172A' }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={0}>
      <ScrollView contentContainerStyle={{ padding: 24 }} keyboardShouldPersistTaps="handled">
        <TouchableOpacity onPress={() => router.back()} style={{ marginBottom: 24 }}>
          <Text style={{ color: '#3B82F6', fontSize: 16 }}>← Back</Text>
        </TouchableOpacity>

        <Text style={{ color: '#F8FAFC', fontSize: 24, fontWeight: 'bold', marginBottom: 24 }}>
          Add Bill
        </Text>

        {hasScanApi && (
          <TouchableOpacity
            onPress={() => { hapticLight(); setScanVisible(true); }}
            style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#334155', borderRadius: 12, padding: 14, marginBottom: 24 }}
          >
            <Ionicons name="scan" size={22} color="#3B82F6" />
            <Text style={{ color: '#3B82F6', fontWeight: '600', fontSize: 16 }}>Scan bill or receipt</Text>
          </TouchableOpacity>
        )}

        <Text style={{ color: '#94A3B8', marginBottom: 8 }}>Bill Name *</Text>
        <TextInput style={inputStyle} value={billName} onChangeText={setBillName} placeholder="e.g. Electric Bill" placeholderTextColor="#64748B" maxLength={MAX_LENGTHS.shortText} />

        <Text style={{ color: '#94A3B8', marginBottom: 8 }}>Provider / Payee Name</Text>
        <TextInput style={inputStyle} value={providerName} onChangeText={setProviderName} placeholder="Optional" placeholderTextColor="#64748B" />

        <Text style={{ color: '#94A3B8', marginBottom: 8 }}>Account Number</Text>
        <TextInput style={inputStyle} value={accountNumber} onChangeText={setAccountNumber} placeholder="Optional" placeholderTextColor="#64748B" />

        <Text style={{ color: '#94A3B8', marginBottom: 8 }}>Provider Phone</Text>
        <TextInput style={inputStyle} value={providerPhone} onChangeText={setProviderPhone} placeholder="Optional" placeholderTextColor="#64748B" keyboardType="phone-pad" />

        <Text style={{ color: '#94A3B8', marginBottom: 8 }}>Provider Email</Text>
        <TextInput style={inputStyle} value={providerEmail} onChangeText={setProviderEmail} placeholder="Optional" placeholderTextColor="#64748B" keyboardType="email-address" />

        <Text style={{ color: '#94A3B8', marginBottom: 8 }}>Provider Website</Text>
        <TextInput style={inputStyle} value={providerWebsite} onChangeText={setProviderWebsite} placeholder="Optional" placeholderTextColor="#64748B" />

        <Text style={{ color: '#94A3B8', marginBottom: 8 }}>Payment URL</Text>
        <TextInput style={inputStyle} value={paymentUrl} onChangeText={setPaymentUrl} placeholder="Optional" placeholderTextColor="#64748B" />

        <Text style={{ color: '#94A3B8', marginBottom: 8 }}>Amount *</Text>
        <TextInput style={inputStyle} value={amount} onChangeText={setAmount} placeholder="0.00" placeholderTextColor="#64748B" keyboardType="decimal-pad" />

        <Text style={{ color: '#94A3B8', marginBottom: 8 }}>Bill Date</Text>
        <TextInput style={inputStyle} value={billDate} onChangeText={setBillDate} placeholder="yyyy-MM-dd" placeholderTextColor="#64748B" />

        <Text style={{ color: '#94A3B8', marginBottom: 8 }}>Due Date *</Text>
        <TextInput style={inputStyle} value={dueDate} onChangeText={setDueDate} placeholder="yyyy-MM-dd" placeholderTextColor="#64748B" />

        <Text style={{ color: '#94A3B8', marginBottom: 8 }}>Category</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
          {EXPENSE_CATEGORIES.slice(0, 8).map((c) => (
            <TouchableOpacity
              key={c.id}
              onPress={() => setCategory(c.id)}
              style={{ paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, backgroundColor: category === c.id ? '#3B82F6' : '#1E293B', marginRight: 8 }}
            >
              <Text style={{ color: '#F8FAFC', fontSize: 14 }}>{c.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <TouchableOpacity onPress={() => setIsRecurring(!isRecurring)} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
          <View style={{ width: 24, height: 24, borderRadius: 6, borderWidth: 2, borderColor: isRecurring ? '#3B82F6' : '#64748B', backgroundColor: isRecurring ? '#3B82F6' : 'transparent', marginRight: 12, alignItems: 'center', justifyContent: 'center' }}>
            {isRecurring && <Text style={{ color: '#fff', fontSize: 14 }}>✓</Text>}
          </View>
          <Text style={{ color: '#F8FAFC' }}>Recurring</Text>
        </TouchableOpacity>
        {isRecurring && (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
            {RECURRENCE_OPTIONS.map((r) => (
              <TouchableOpacity
                key={r.id}
                onPress={() => setRecurrenceInterval(r.id)}
                style={{ paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, backgroundColor: recurrenceInterval === r.id ? '#3B82F6' : '#1E293B' }}
              >
                <Text style={{ color: '#F8FAFC' }}>{r.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <Text style={{ color: '#94A3B8', marginBottom: 8 }}>Reminder (days before due)</Text>
        <TextInput style={inputStyle} value={reminderDays} onChangeText={setReminderDays} placeholder="3" placeholderTextColor="#64748B" keyboardType="number-pad" />

        <Text style={{ color: '#94A3B8', marginBottom: 8 }}>Attachment</Text>
        <TouchableOpacity onPress={pickAttachment} disabled={uploadingAttachment} style={{ backgroundColor: '#334155', borderRadius: 12, padding: 12, marginBottom: 16, alignItems: 'center' }}>
          {uploadingAttachment ? <ActivityIndicator color="#3B82F6" /> : <Text style={{ color: '#3B82F6' }}>{attachmentUrl ? 'Replace' : 'Upload'} Attachment</Text>}
        </TouchableOpacity>

        <Text style={{ color: '#94A3B8', marginBottom: 8 }}>Notes</Text>
        <TextInput style={[inputStyle, { minHeight: 80, textAlignVertical: 'top' }]} value={notes} onChangeText={setNotes} placeholder="Optional" placeholderTextColor="#64748B" multiline />

        <TouchableOpacity
          onPress={handleSave}
          disabled={!canSave || createBill.isPending}
          style={{ backgroundColor: canSave ? '#3B82F6' : '#334155', borderRadius: 12, padding: 16, alignItems: 'center' }}
        >
          {createBill.isPending ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff', fontWeight: '600', fontSize: 16 }}>Save</Text>}
        </TouchableOpacity>

        <SmartPhotoCapture
          visible={scanVisible}
          onClose={() => setScanVisible(false)}
          onExtracted={applyScanResult}
          expectedType="bill"
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
