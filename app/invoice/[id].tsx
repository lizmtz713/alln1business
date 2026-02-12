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
  useInvoice,
  useUpdateInvoice,
  useRecordInvoicePayment,
} from '../../src/hooks/useInvoices';
import { useAuth } from '../../src/providers/AuthProvider';
import { hasSupabaseEnv } from '../../src/services/env';
import { createInvoicePdf } from '../../src/services/pdf';
import { uploadPdfToDocumentsBucket } from '../../src/services/storage';
import { format, parseISO } from 'date-fns';

const STATUS_COLORS: Record<string, string> = {
  draft: '#64748B',
  sent: '#3B82F6',
  viewed: '#3B82F6',
  paid: '#10B981',
  overdue: '#EF4444',
  cancelled: '#94A3B8',
};

function StatusBadge({ status }: { status: string }) {
  const color = STATUS_COLORS[status] ?? '#64748B';
  return (
    <View style={{ backgroundColor: color, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 }}>
      <Text style={{ color: '#fff', fontSize: 12, fontWeight: '600', textTransform: 'capitalize' }}>
        {status}
      </Text>
    </View>
  );
}

export default function InvoiceDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user, profile } = useAuth();
  const { data: invoice, isLoading } = useInvoice(id);
  const updateInvoice = useUpdateInvoice();
  const recordPayment = useRecordInvoicePayment();

  const [showRecordPayment, setShowRecordPayment] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [paymentMethod, setPaymentMethod] = useState('');
  const [paymentRef, setPaymentRef] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [attachPdfOnSend, setAttachPdfOnSend] = useState(false);

  const balanceDue = Number(invoice?.balance_due ?? 0);

  const handleGeneratePdf = async () => {
    if (!id || !user?.id) return;
    setGeneratingPdf(true);
    try {
      const { localPath, filename } = await createInvoicePdf(id, user.id);
      const pdfUrl = await uploadPdfToDocumentsBucket({
        userId: user.id,
        filename,
        localPath,
      });
      if (pdfUrl) {
        await updateInvoice.mutateAsync({ id, updates: { pdf_url: pdfUrl } });
        Linking.openURL(pdfUrl);
      } else {
        Alert.alert('Error', 'Failed to upload PDF');
      }
    } catch (e) {
      Alert.alert('Error', (e as Error).message);
    } finally {
      setGeneratingPdf(false);
    }
  };

  const handleMarkSent = async () => {
    if (!id || !user?.id) return;
    try {
      const updates = {
        status: 'sent' as const,
        sent_date: new Date().toISOString(),
        pdf_url: undefined as string | undefined,
      };
      if (attachPdfOnSend && !invoice?.pdf_url) {
        const { localPath, filename } = await createInvoicePdf(id, user.id);
        const pdfUrl = await uploadPdfToDocumentsBucket({
          userId: user.id,
          filename,
          localPath,
        });
        if (pdfUrl) (updates as { pdf_url?: string }).pdf_url = pdfUrl;
      }
      await updateInvoice.mutateAsync({ id, updates: { status: updates.status, sent_date: updates.sent_date, pdf_url: updates.pdf_url } });
    } catch (e) {
      Alert.alert('Error', (e as Error).message);
    }
  };

  const handleRecordPayment = async () => {
    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Error', 'Enter a valid payment amount.');
      return;
    }
    if (amount > balanceDue + 0.01) {
      Alert.alert('Error', 'Payment amount cannot exceed balance due.');
      return;
    }
    try {
      await recordPayment.mutateAsync({
        invoiceId: id!,
        amount,
        date: paymentDate,
        paymentMethod: paymentMethod.trim() || null,
        reference: paymentRef.trim() || null,
        notes: paymentNotes.trim() || null,
      });
      setShowRecordPayment(false);
      setPaymentAmount('');
      setPaymentDate(format(new Date(), 'yyyy-MM-dd'));
      setPaymentMethod('');
      setPaymentRef('');
      setPaymentNotes('');
    } catch (e) {
      Alert.alert('Error', (e as Error).message);
    }
  };

  const handleMarkPaid = async () => {
    if (!id || balanceDue <= 0) return;
    try {
      await recordPayment.mutateAsync({
        invoiceId: id,
        amount: balanceDue,
        date: format(new Date(), 'yyyy-MM-dd'),
      });
    } catch (e) {
      Alert.alert('Error', (e as Error).message);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Cancel Invoice',
      'Mark this invoice as cancelled?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes',
          style: 'destructive',
          onPress: async () => {
            if (!id) return;
            try {
              await updateInvoice.mutateAsync({
                id,
                updates: { status: 'cancelled' },
              });
              router.back();
            } catch (e) {
              Alert.alert('Error', (e as Error).message);
            }
          },
        },
      ]
    );
  };

  if (!hasSupabaseEnv || !id) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0F172A', padding: 24 }}>
        <TouchableOpacity onPress={() => router.back()} style={{ marginBottom: 16 }}>
          <Text style={{ color: '#3B82F6' }}>← Back</Text>
        </TouchableOpacity>
        <Text style={{ color: '#94A3B8' }}>Connect Supabase for invoices.</Text>
      </View>
    );
  }

  if (isLoading || !invoice) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0F172A', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  const customer = invoice.customers;
  const customerName = customer?.company_name || customer?.contact_name || 'No customer';
  const customerAddr = [customer?.address, [customer?.city, customer?.state, customer?.zip].filter(Boolean).join(', ')].filter(Boolean).join('\n');
  const canEdit = invoice.status === 'draft';
  const canRecordPayment = ['sent', 'viewed', 'overdue'].includes(invoice.status) && balanceDue > 0.01;

  return (
    <View style={{ flex: 1, backgroundColor: '#0F172A' }}>
      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 48 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={{ color: '#3B82F6', fontSize: 16 }}>← Back</Text>
          </TouchableOpacity>
          <StatusBadge status={invoice.status} />
        </View>

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
          <Text style={{ color: '#F8FAFC', fontSize: 20, fontWeight: 'bold' }}>{invoice.invoice_number}</Text>
          <TouchableOpacity onPress={() => { /* menu */ }}>
            <Text style={{ color: '#94A3B8' }}>⋮</Text>
          </TouchableOpacity>
        </View>

        <View style={{ backgroundColor: '#1E293B', borderRadius: 12, padding: 16, marginBottom: 20 }}>
          <Text style={{ color: '#94A3B8', fontSize: 12, marginBottom: 4 }}>From</Text>
          <Text style={{ color: '#F8FAFC', fontWeight: '600' }}>{profile?.business_name || 'Your Business'}</Text>

          <Text style={{ color: '#94A3B8', fontSize: 12, marginTop: 16, marginBottom: 4 }}>Bill To</Text>
          <Text style={{ color: '#F8FAFC', fontWeight: '600' }}>{customerName}</Text>
          {customerAddr ? <Text style={{ color: '#94A3B8', fontSize: 14, marginTop: 4 }}>{customerAddr}</Text> : null}
          {customer?.email ? <Text style={{ color: '#94A3B8', fontSize: 14 }}>{customer.email}</Text> : null}
        </View>

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 }}>
          <View>
            <Text style={{ color: '#64748B', fontSize: 12 }}>Invoice Date</Text>
            <Text style={{ color: '#F8FAFC' }}>{format(parseISO(invoice.invoice_date), 'MMM d, yyyy')}</Text>
          </View>
          <View>
            <Text style={{ color: '#64748B', fontSize: 12 }}>Due Date</Text>
            <Text style={{ color: '#F8FAFC' }}>{format(parseISO(invoice.due_date), 'MMM d, yyyy')}</Text>
          </View>
        </View>

        <View style={{ backgroundColor: '#1E293B', borderRadius: 12, padding: 16, marginBottom: 20 }}>
          <Text style={{ color: '#94A3B8', fontSize: 12, marginBottom: 8 }}>Line Items</Text>
          {invoice.invoice_items?.map((item) => (
            <View key={item.id} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#334155' }}>
              <View style={{ flex: 2 }}>
                <Text style={{ color: '#F8FAFC' }}>{item.description}</Text>
                <Text style={{ color: '#64748B', fontSize: 12 }}>{item.quantity} × ${Number(item.unit_price).toFixed(2)}</Text>
              </View>
              <Text style={{ color: '#F8FAFC', fontWeight: '600' }}>${Number(item.amount).toFixed(2)}</Text>
            </View>
          ))}
        </View>

        <View style={{ backgroundColor: '#1E293B', borderRadius: 12, padding: 16, marginBottom: 24 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
            <Text style={{ color: '#94A3B8' }}>Subtotal</Text>
            <Text style={{ color: '#F8FAFC' }}>${Number(invoice.subtotal).toFixed(2)}</Text>
          </View>
          {Number(invoice.tax_amount) > 0 && (
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
              <Text style={{ color: '#94A3B8' }}>Tax</Text>
              <Text style={{ color: '#F8FAFC' }}>${Number(invoice.tax_amount).toFixed(2)}</Text>
            </View>
          )}
          {Number(invoice.discount_amount) > 0 && (
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
              <Text style={{ color: '#94A3B8' }}>Discount</Text>
              <Text style={{ color: '#F8FAFC' }}>-${Number(invoice.discount_amount).toFixed(2)}</Text>
            </View>
          )}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#334155' }}>
            <Text style={{ color: '#F8FAFC', fontWeight: '600' }}>Total</Text>
            <Text style={{ color: '#10B981', fontWeight: '600', fontSize: 18 }}>${Number(invoice.total).toFixed(2)}</Text>
          </View>
          {balanceDue > 0 && (
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
              <Text style={{ color: '#94A3B8' }}>Balance Due</Text>
              <Text style={{ color: '#EF4444', fontWeight: '600' }}>${balanceDue.toFixed(2)}</Text>
            </View>
          )}
        </View>

        {(invoice.sent_date || invoice.paid_date) && (
          <View style={{ marginBottom: 24 }}>
            <Text style={{ color: '#94A3B8', fontSize: 12, marginBottom: 8 }}>Timeline</Text>
            {invoice.sent_date && (
              <Text style={{ color: '#F8FAFC', fontSize: 14 }}>Sent {format(parseISO(invoice.sent_date), 'MMM d, yyyy')}</Text>
            )}
            {invoice.paid_date && (
              <Text style={{ color: '#10B981', fontSize: 14 }}>Paid {format(parseISO(invoice.paid_date), 'MMM d, yyyy')}</Text>
            )}
          </View>
        )}

        <View style={{ gap: 12 }}>
          {canEdit && (
            <>
              <TouchableOpacity
                onPress={() => router.push(`/(modals)/edit-invoice/${id}` as never)}
                style={{ backgroundColor: '#3B82F6', borderRadius: 12, padding: 16, alignItems: 'center' }}
              >
                <Text style={{ color: '#fff', fontWeight: '600' }}>Edit Invoice</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setAttachPdfOnSend(!attachPdfOnSend)}
                style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}
              >
                <View
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: 6,
                    borderWidth: 2,
                    borderColor: attachPdfOnSend ? '#3B82F6' : '#64748B',
                    backgroundColor: attachPdfOnSend ? '#3B82F6' : 'transparent',
                    marginRight: 12,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {attachPdfOnSend && <Text style={{ color: '#fff', fontSize: 14 }}>✓</Text>}
                </View>
                <Text style={{ color: '#F8FAFC' }}>Attach PDF when sending</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleMarkSent}
                disabled={updateInvoice.isPending}
                style={{ backgroundColor: '#334155', borderRadius: 12, padding: 16, alignItems: 'center' }}
              >
                <Text style={{ color: '#F8FAFC', fontWeight: '600' }}>Mark as Sent</Text>
              </TouchableOpacity>
            </>
          )}
          {canRecordPayment && (
            <>
              <TouchableOpacity
                onPress={() => {
                  setPaymentAmount(balanceDue.toFixed(2));
                  setShowRecordPayment(true);
                }}
                style={{ backgroundColor: '#3B82F6', borderRadius: 12, padding: 16, alignItems: 'center' }}
              >
                <Text style={{ color: '#fff', fontWeight: '600' }}>Record Payment</Text>
              </TouchableOpacity>
              {Math.abs(balanceDue - Number(invoice.total)) < 0.01 && (
                <TouchableOpacity
                  onPress={handleMarkPaid}
                  disabled={recordPayment.isPending}
                  style={{ backgroundColor: '#10B981', borderRadius: 12, padding: 16, alignItems: 'center' }}
                >
                  <Text style={{ color: '#fff', fontWeight: '600' }}>Mark Paid (Full)</Text>
                </TouchableOpacity>
              )}
            </>
          )}
          {invoice.status === 'paid' && invoice.paid_date && (
            <Text style={{ color: '#10B981', textAlign: 'center' }}>
              Paid on {format(parseISO(invoice.paid_date), 'MMM d, yyyy')}
            </Text>
          )}
          {invoice.pdf_url ? (
            <>
              <Text style={{ color: '#10B981', fontSize: 12, marginBottom: 8, textAlign: 'center' }}>PDF ready</Text>
              <TouchableOpacity
                onPress={() => invoice.pdf_url && Linking.openURL(invoice.pdf_url)}
                style={{ backgroundColor: '#334155', borderRadius: 12, padding: 16, alignItems: 'center' }}
              >
                <Text style={{ color: '#3B82F6' }}>Download PDF</Text>
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity
              onPress={handleGeneratePdf}
              disabled={generatingPdf}
              style={{ backgroundColor: '#334155', borderRadius: 12, padding: 16, alignItems: 'center' }}
            >
              {generatingPdf ? <ActivityIndicator color="#3B82F6" /> : <Text style={{ color: '#3B82F6' }}>Generate PDF</Text>}
            </TouchableOpacity>
          )}
          {invoice.status !== 'cancelled' && (
            <TouchableOpacity onPress={handleDelete}>
              <Text style={{ color: '#EF4444', textAlign: 'center' }}>Cancel Invoice</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      <Modal visible={showRecordPayment} transparent animationType="slide">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: '#0F172A', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '80%' }}>
            <Text style={{ color: '#F8FAFC', fontSize: 20, fontWeight: 'bold', marginBottom: 20 }}>
              Record Payment
            </Text>
            <Text style={{ color: '#94A3B8', marginBottom: 8 }}>Amount</Text>
            <TextInput
              style={{ backgroundColor: '#1E293B', borderRadius: 12, padding: 12, color: '#F8FAFC', marginBottom: 16, borderWidth: 1, borderColor: '#334155' }}
              value={paymentAmount}
              onChangeText={setPaymentAmount}
              placeholder="0.00"
              placeholderTextColor="#64748B"
              keyboardType="decimal-pad"
            />
            <Text style={{ color: '#94A3B8', marginBottom: 8 }}>Date</Text>
            <TextInput
              style={{ backgroundColor: '#1E293B', borderRadius: 12, padding: 12, color: '#F8FAFC', marginBottom: 16, borderWidth: 1, borderColor: '#334155' }}
              value={paymentDate}
              onChangeText={setPaymentDate}
              placeholder="yyyy-MM-dd"
              placeholderTextColor="#64748B"
            />
            <Text style={{ color: '#94A3B8', marginBottom: 8 }}>Payment Method</Text>
            <TextInput
              style={{ backgroundColor: '#1E293B', borderRadius: 12, padding: 12, color: '#F8FAFC', marginBottom: 16, borderWidth: 1, borderColor: '#334155' }}
              value={paymentMethod}
              onChangeText={setPaymentMethod}
              placeholder="e.g. Check, ACH"
              placeholderTextColor="#64748B"
            />
            <Text style={{ color: '#94A3B8', marginBottom: 8 }}>Reference #</Text>
            <TextInput
              style={{ backgroundColor: '#1E293B', borderRadius: 12, padding: 12, color: '#F8FAFC', marginBottom: 16, borderWidth: 1, borderColor: '#334155' }}
              value={paymentRef}
              onChangeText={setPaymentRef}
              placeholder="Optional"
              placeholderTextColor="#64748B"
            />
            <Text style={{ color: '#94A3B8', marginBottom: 8 }}>Notes</Text>
            <TextInput
              style={{ backgroundColor: '#1E293B', borderRadius: 12, padding: 12, color: '#F8FAFC', marginBottom: 24, borderWidth: 1, borderColor: '#334155' }}
              value={paymentNotes}
              onChangeText={setPaymentNotes}
              placeholder="Optional"
              placeholderTextColor="#64748B"
            />
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <TouchableOpacity
                onPress={() => setShowRecordPayment(false)}
                style={{ flex: 1, backgroundColor: '#334155', borderRadius: 12, padding: 16, alignItems: 'center' }}
              >
                <Text style={{ color: '#F8FAFC' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleRecordPayment}
                disabled={recordPayment.isPending}
                style={{ flex: 1, backgroundColor: '#10B981', borderRadius: 12, padding: 16, alignItems: 'center' }}
              >
                {recordPayment.isPending ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff', fontWeight: '600' }}>Save</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
