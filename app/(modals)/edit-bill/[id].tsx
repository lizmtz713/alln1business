import { useState, useEffect } from 'react';
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
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useBill, useUpdateBill } from '../../../src/hooks/useBills';
import { useVendors } from '../../../src/hooks/useVendors';
import { useAuth } from '../../../src/providers/AuthProvider';
import { hasSupabaseEnv } from '../../../src/services/env';
import { uploadDocument } from '../../../src/services/storage';
import { EXPENSE_CATEGORIES } from '../../../src/lib/categories';
import { format, addDays } from 'date-fns';

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

export default function EditBillScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: bill, isLoading } = useBill(id);
  const { data: vendors = [] } = useVendors();
  const { user } = useAuth();
  const updateBill = useUpdateBill();

  const [billName, setBillName] = useState('');
  const [vendorId, setVendorId] = useState<string | null>(null);
  const [providerName, setProviderName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [providerPhone, setProviderPhone] = useState('');
  const [providerEmail, setProviderEmail] = useState('');
  const [providerWebsite, setProviderWebsite] = useState('');
  const [paymentUrl, setPaymentUrl] = useState('');
  const [amount, setAmount] = useState('');
  const [billDate, setBillDate] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [category, setCategory] = useState('utilities');
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrenceInterval, setRecurrenceInterval] = useState<string | null>(null);
  const [reminderDays, setReminderDays] = useState('3');
  const [notes, setNotes] = useState('');
  const [attachmentUrl, setAttachmentUrl] = useState<string | null>(null);
  const [uploadingAttachment, setUploadingAttachment] = useState(false);

  useEffect(() => {
    if (bill) {
      setBillName(bill.bill_name ?? '');
      setVendorId(bill.vendor_id);
      setProviderName(bill.provider_name ?? '');
      setAccountNumber(bill.account_number ?? '');
      setProviderPhone(bill.provider_phone ?? '');
      setProviderEmail(bill.provider_email ?? '');
      setProviderWebsite(bill.provider_website ?? '');
      setPaymentUrl(bill.payment_url ?? '');
      setAmount(bill.amount ? String(bill.amount) : '');
      setBillDate(bill.bill_date?.split('T')[0] ?? '');
      setDueDate(bill.due_date?.split('T')[0] ?? format(addDays(new Date(), 7), 'yyyy-MM-dd'));
      setCategory(bill.category ?? 'utilities');
      setIsRecurring(bill.is_recurring ?? false);
      setRecurrenceInterval(bill.recurrence_interval);
      setReminderDays(String(bill.reminder_days ?? 3));
      setNotes(bill.notes ?? '');
      setAttachmentUrl(bill.attachment_url);
    }
  }, [bill]);

  const canSave = hasSupabaseEnv && id && billName.trim() && amount && parseFloat(amount) > 0 && dueDate;

  const handleSave = async () => {
    if (!canSave) return;
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) return;

    try {
      const billId = Array.isArray(id) ? id[0] : id;
      await updateBill.mutateAsync({
        id: billId!,
        updates: {
          bill_name: billName.trim(),
          vendor_id: vendorId,
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
        },
      });
      router.back();
    } catch (e) {
      Alert.alert('Error', (e as Error).message);
    }
  };

  const pickAttachment = async () => {
    if (!user) return;
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['image/*', 'application/pdf'],
        copyToCacheDirectory: true,
      });
      if (result.canceled) return;
      setUploadingAttachment(true);
      const url = await uploadDocument(user.id, result.assets[0].uri);
      if (url) setAttachmentUrl(url);
    } catch {
      Alert.alert('Error', 'Failed to upload attachment');
    } finally {
      setUploadingAttachment(false);
    }
  };

  if (!hasSupabaseEnv || !id) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0F172A', padding: 24 }}>
        <TouchableOpacity onPress={() => router.back()} style={{ marginBottom: 16 }}>
          <Text style={{ color: '#3B82F6' }}>← Back</Text>
        </TouchableOpacity>
        <Text style={{ color: '#94A3B8' }}>Connect Supabase to edit bills.</Text>
      </View>
    );
  }

  if (isLoading || !bill) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0F172A', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#0F172A' }}>
      <ScrollView contentContainerStyle={{ padding: 24 }}>
        <TouchableOpacity onPress={() => router.back()} style={{ marginBottom: 24 }}>
          <Text style={{ color: '#3B82F6', fontSize: 16 }}>← Back</Text>
        </TouchableOpacity>

        <Text style={{ color: '#F8FAFC', fontSize: 24, fontWeight: 'bold', marginBottom: 24 }}>Edit Bill</Text>

        <Text style={{ color: '#94A3B8', marginBottom: 8 }}>Bill Name *</Text>
        <TextInput style={inputStyle} value={billName} onChangeText={setBillName} placeholder="e.g. Electric Bill" placeholderTextColor="#64748B" />

        <Text style={{ color: '#94A3B8', marginBottom: 8 }}>Vendor (optional)</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
          <TouchableOpacity onPress={() => setVendorId(null)} style={{ paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12, backgroundColor: !vendorId ? '#3B82F6' : '#1E293B', marginRight: 8 }}>
            <Text style={{ color: '#F8FAFC' }}>None</Text>
          </TouchableOpacity>
          {vendors.map((v) => (
            <TouchableOpacity key={v.id} onPress={() => setVendorId(v.id)} style={{ paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12, backgroundColor: vendorId === v.id ? '#3B82F6' : '#1E293B', marginRight: 8 }}>
              <Text style={{ color: '#F8FAFC' }} numberOfLines={1}>{v.company_name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Text style={{ color: '#94A3B8', marginBottom: 8 }}>Provider Name</Text>
        <TextInput style={inputStyle} value={providerName} onChangeText={setProviderName} placeholder="Optional" placeholderTextColor="#64748B" />

        <Text style={{ color: '#94A3B8', marginBottom: 8 }}>Account Number</Text>
        <TextInput style={inputStyle} value={accountNumber} onChangeText={setAccountNumber} placeholder="Optional" placeholderTextColor="#64748B" />

        <Text style={{ color: '#94A3B8', marginBottom: 8 }}>Amount *</Text>
        <TextInput style={inputStyle} value={amount} onChangeText={setAmount} placeholder="0.00" placeholderTextColor="#64748B" keyboardType="decimal-pad" />

        <Text style={{ color: '#94A3B8', marginBottom: 8 }}>Due Date *</Text>
        <TextInput style={inputStyle} value={dueDate} onChangeText={setDueDate} placeholder="yyyy-MM-dd" placeholderTextColor="#64748B" />

        <Text style={{ color: '#94A3B8', marginBottom: 8 }}>Category</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
          {EXPENSE_CATEGORIES.slice(0, 8).map((c) => (
            <TouchableOpacity key={c.id} onPress={() => setCategory(c.id)} style={{ paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, backgroundColor: category === c.id ? '#3B82F6' : '#1E293B', marginRight: 8 }}>
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
              <TouchableOpacity key={r.id} onPress={() => setRecurrenceInterval(r.id)} style={{ paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, backgroundColor: recurrenceInterval === r.id ? '#3B82F6' : '#1E293B' }}>
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

        <TouchableOpacity onPress={handleSave} disabled={!canSave || updateBill.isPending} style={{ backgroundColor: canSave ? '#3B82F6' : '#334155', borderRadius: 12, padding: 16, alignItems: 'center' }}>
          {updateBill.isPending ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff', fontWeight: '600', fontSize: 16 }}>Save</Text>}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}