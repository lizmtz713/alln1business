import { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  TextInput,
  Modal,
  Linking,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
  useBill,
  useUpdateBill,
  useMarkBillPaid,
  useDeleteBill,
  isOverdue,
} from '../../src/hooks/useBills';
import { hasSupabaseEnv } from '../../src/services/env';
import { getCategoryName } from '../../src/lib/categories';
import { format, parseISO } from 'date-fns';

const BILL_STATUS_COLORS: Record<string, string> = {
  pending: '#F59E0B',
  paid: '#10B981',
  overdue: '#EF4444',
  cancelled: '#94A3B8',
};

function StatusBadge({ bill }: { bill: { status: string } }) {
  const displayStatus = isOverdue(bill as any) ? 'overdue' : bill.status;
  const color = BILL_STATUS_COLORS[displayStatus] ?? '#64748B';
  return (
    <View style={{ backgroundColor: color, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 }}>
      <Text style={{ color: '#fff', fontSize: 12, fontWeight: '600', textTransform: 'capitalize' }}>
        {displayStatus}
      </Text>
    </View>
  );
}

export default function BillDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: bill, isLoading } = useBill(id);
  const updateBill = useUpdateBill();
  const markPaid = useMarkBillPaid();
  const deleteBill = useDeleteBill();

  const [showMarkPaid, setShowMarkPaid] = useState(false);
  const [paidAmount, setPaidAmount] = useState('');
  const [paidDate, setPaidDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [paymentMethod, setPaymentMethod] = useState('');
  const [confirmationNumber, setConfirmationNumber] = useState('');

  if (!hasSupabaseEnv || !id) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0F172A', padding: 24 }}>
        <TouchableOpacity onPress={() => router.back()} style={{ marginBottom: 16 }}>
          <Text style={{ color: '#3B82F6' }}>← Back</Text>
        </TouchableOpacity>
        <Text style={{ color: '#94A3B8' }}>Connect Supabase for bills.</Text>
      </View>
    );
  }

  if (isLoading || !bill) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0F172A', padding: 24 }}>
        <TouchableOpacity onPress={() => router.back()} style={{ marginBottom: 24 }}>
          <Text style={{ color: '#3B82F6', fontSize: 16 }}>← Back</Text>
        </TouchableOpacity>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#3B82F6" />
          {!isLoading && !bill && <Text style={{ color: '#94A3B8', marginTop: 12 }}>Bill not found</Text>}
        </View>
      </View>
    );
  }

  const vendor = bill.vendors as { company_name?: string; contact_name?: string } | null;
  const providerName = bill.provider_name || vendor?.company_name || vendor?.contact_name || '—';
  const canMarkPaid = bill.status === 'pending' || isOverdue(bill);

  const handleMarkPaid = async () => {
    const amt = paidAmount ? parseFloat(paidAmount) : Number(bill.amount);
    if (isNaN(amt) || amt <= 0) {
      Alert.alert('Error', 'Enter a valid amount.');
      return;
    }
    try {
      await markPaid.mutateAsync({
        id,
        paid_amount: amt,
        paid_date: paidDate,
        payment_method: paymentMethod.trim() || null,
        confirmation_number: confirmationNumber.trim() || null,
      });
      setShowMarkPaid(false);
      setPaidAmount('');
      setPaidDate(format(new Date(), 'yyyy-MM-dd'));
      setPaymentMethod('');
      setConfirmationNumber('');
    } catch (e) {
      Alert.alert('Error', (e as Error).message);
    }
  };

  const handleDelete = () => {
    Alert.alert('Delete Bill', 'Cancel this bill?', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Yes',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteBill.mutateAsync(id!);
            router.back();
          } catch (e) {
            Alert.alert('Error', (e as Error).message);
          }
        },
      },
    ]);
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#0F172A' }}>
      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 48 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={{ color: '#3B82F6', fontSize: 16 }}>← Back</Text>
          </TouchableOpacity>
          <StatusBadge bill={bill} />
        </View>

        <Text style={{ color: '#F8FAFC', fontSize: 22, fontWeight: 'bold', marginBottom: 8 }}>{bill.bill_name}</Text>
        <Text style={{ color: '#94A3B8', fontSize: 16 }}>{providerName}</Text>

        <View style={{ backgroundColor: '#1E293B', borderRadius: 12, padding: 16, marginTop: 20, marginBottom: 20 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
            <Text style={{ color: '#94A3B8' }}>Amount</Text>
            <Text style={{ color: '#EF4444', fontWeight: '600', fontSize: 20 }}>${Number(bill.amount).toFixed(2)}</Text>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
            <Text style={{ color: '#94A3B8' }}>Due Date</Text>
            <Text style={{ color: '#F8FAFC' }}>{format(parseISO(bill.due_date), 'MMM d, yyyy')}</Text>
          </View>
          {bill.bill_date && (
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
              <Text style={{ color: '#94A3B8' }}>Bill Date</Text>
              <Text style={{ color: '#F8FAFC' }}>{format(parseISO(bill.bill_date), 'MMM d, yyyy')}</Text>
            </View>
          )}
          {bill.category && (
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ color: '#94A3B8' }}>Category</Text>
              <Text style={{ color: '#F8FAFC' }}>{getCategoryName(bill.category)}</Text>
            </View>
          )}
        </View>

        {bill.payment_url && (
          <TouchableOpacity
            onPress={() => Linking.openURL(bill.payment_url!)}
            style={{ backgroundColor: '#3B82F6', borderRadius: 12, padding: 16, alignItems: 'center', marginBottom: 12 }}
          >
            <Text style={{ color: '#fff', fontWeight: '600' }}>Pay Now</Text>
          </TouchableOpacity>
        )}

        {bill.attachment_url && (
          <TouchableOpacity
            onPress={() => Linking.openURL(bill.attachment_url!)}
            style={{ marginBottom: 16 }}
          >
            <Text style={{ color: '#3B82F6' }}>View Attachment</Text>
          </TouchableOpacity>
        )}

        {bill.notes && (
          <View style={{ marginBottom: 24 }}>
            <Text style={{ color: '#94A3B8', fontSize: 12, marginBottom: 4 }}>Notes</Text>
            <Text style={{ color: '#F8FAFC' }}>{bill.notes}</Text>
          </View>
        )}

        {bill.status === 'paid' && bill.paid_date && (
          <Text style={{ color: '#10B981', marginBottom: 24 }}>Paid on {format(parseISO(bill.paid_date), 'MMM d, yyyy')}</Text>
        )}

        <View style={{ gap: 12 }}>
          {canMarkPaid && (
            <TouchableOpacity
              onPress={() => {
                setPaidAmount(String(bill.amount));
                setShowMarkPaid(true);
              }}
              style={{ backgroundColor: '#10B981', borderRadius: 12, padding: 16, alignItems: 'center' }}
            >
              <Text style={{ color: '#fff', fontWeight: '600' }}>Mark as Paid</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            onPress={() => router.push(`/(modals)/edit-bill/${id}` as never)}
            style={{ backgroundColor: '#334155', borderRadius: 12, padding: 16, alignItems: 'center' }}
          >
            <Text style={{ color: '#F8FAFC', fontWeight: '600' }}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleDelete}>
            <Text style={{ color: '#EF4444', textAlign: 'center' }}>Delete</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <Modal visible={showMarkPaid} transparent animationType="slide">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: '#0F172A', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '80%' }}>
            <Text style={{ color: '#F8FAFC', fontSize: 20, fontWeight: 'bold', marginBottom: 20 }}>Mark as Paid</Text>
            <Text style={{ color: '#94A3B8', marginBottom: 8 }}>Amount</Text>
            <TextInput
              style={{ backgroundColor: '#1E293B', borderRadius: 12, padding: 12, color: '#F8FAFC', marginBottom: 16, borderWidth: 1, borderColor: '#334155' }}
              value={paidAmount}
              onChangeText={setPaidAmount}
              placeholder={String(bill.amount)}
              placeholderTextColor="#64748B"
              keyboardType="decimal-pad"
            />
            <Text style={{ color: '#94A3B8', marginBottom: 8 }}>Date</Text>
            <TextInput
              style={{ backgroundColor: '#1E293B', borderRadius: 12, padding: 12, color: '#F8FAFC', marginBottom: 16, borderWidth: 1, borderColor: '#334155' }}
              value={paidDate}
              onChangeText={setPaidDate}
              placeholder="yyyy-MM-dd"
              placeholderTextColor="#64748B"
            />
            <Text style={{ color: '#94A3B8', marginBottom: 8 }}>Payment Method</Text>
            <TextInput
              style={{ backgroundColor: '#1E293B', borderRadius: 12, padding: 12, color: '#F8FAFC', marginBottom: 16, borderWidth: 1, borderColor: '#334155' }}
              value={paymentMethod}
              onChangeText={setPaymentMethod}
              placeholder="Optional"
              placeholderTextColor="#64748B"
            />
            <Text style={{ color: '#94A3B8', marginBottom: 8 }}>Confirmation #</Text>
            <TextInput
              style={{ backgroundColor: '#1E293B', borderRadius: 12, padding: 12, color: '#F8FAFC', marginBottom: 24, borderWidth: 1, borderColor: '#334155' }}
              value={confirmationNumber}
              onChangeText={setConfirmationNumber}
              placeholder="Optional"
              placeholderTextColor="#64748B"
            />
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <TouchableOpacity
                onPress={() => setShowMarkPaid(false)}
                style={{ flex: 1, backgroundColor: '#334155', borderRadius: 12, padding: 16, alignItems: 'center' }}
              >
                <Text style={{ color: '#F8FAFC' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleMarkPaid}
                disabled={markPaid.isPending}
                style={{ flex: 1, backgroundColor: '#10B981', borderRadius: 12, padding: 16, alignItems: 'center' }}
              >
                {markPaid.isPending ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff', fontWeight: '600' }}>Save</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
