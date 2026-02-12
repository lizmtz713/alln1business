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
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
  useInvoice,
  useUpdateInvoice,
  useUpsertInvoiceItems,
} from '../../../src/hooks/useInvoices';
import { useCustomers } from '../../../src/hooks/useCustomers';
import { hasSupabaseEnv } from '../../../src/services/env';
import type { PaymentTerms } from '../../../src/types/contacts';
import type { InvoiceItem } from '../../../src/types/invoices';
import { format, addDays } from 'date-fns';

const PAYMENT_TERMS: { id: PaymentTerms; label: string; days: number }[] = [
  { id: 'due_on_receipt', label: 'Due on receipt', days: 0 },
  { id: 'net_15', label: 'Net 15', days: 15 },
  { id: 'net_30', label: 'Net 30', days: 30 },
  { id: 'net_45', label: 'Net 45', days: 45 },
  { id: 'net_60', label: 'Net 60', days: 60 },
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

type LineItem = { id: string; description: string; quantity: number; unit_price: number };

function computeAmount(qty: number, rate: number) {
  return Math.round(qty * rate * 100) / 100;
}

export default function EditInvoiceScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: invoice, isLoading } = useInvoice(id);
  const { data: customers = [] } = useCustomers();
  const updateInvoice = useUpdateInvoice();
  const upsertItems = useUpsertInvoiceItems();

  const [customerId, setCustomerId] = useState<string | null>(null);
  const [invoiceDate, setInvoiceDate] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [paymentTerms, setPaymentTerms] = useState<PaymentTerms>('net_15');
  const [lines, setLines] = useState<LineItem[]>([]);
  const [taxRate, setTaxRate] = useState('');
  const [discountAmount, setDiscountAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [terms, setTerms] = useState('');
  const [showNotes, setShowNotes] = useState(false);

  useEffect(() => {
    if (invoice) {
      setCustomerId(invoice.customer_id);
      setInvoiceDate(invoice.invoice_date?.split('T')[0] ?? format(new Date(), 'yyyy-MM-dd'));
      setDueDate(invoice.due_date?.split('T')[0] ?? format(addDays(new Date(), 15), 'yyyy-MM-dd'));
      setTaxRate(invoice.tax_rate ? String(invoice.tax_rate) : '');
      setDiscountAmount(invoice.discount_amount ? String(invoice.discount_amount) : '');
      setNotes(invoice.notes ?? '');
      setTerms(invoice.terms ?? '');
      setLines(
        invoice.invoice_items?.length
          ? invoice.invoice_items.map((item, i) => ({
              id: item.id,
              description: item.description,
              quantity: Number(item.quantity),
              unit_price: Number(item.unit_price),
            }))
          : [{ id: '1', description: '', quantity: 1, unit_price: 0 }]
      );
    }
  }, [invoice]);

  const subtotal = lines.reduce((sum, l) => sum + computeAmount(l.quantity, l.unit_price), 0);
  const taxRateVal = parseFloat(taxRate) || 0;
  const taxAmount = Math.round(subtotal * (taxRateVal / 100) * 100) / 100;
  const discountVal = parseFloat(discountAmount) || 0;
  const total = Math.max(0, Math.round((subtotal + taxAmount - discountVal) * 100) / 100);

  const addLine = () => {
    setLines((prev) => [
      ...prev,
      { id: `new-${Date.now()}`, description: '', quantity: 1, unit_price: 0 },
    ]);
  };

  const removeLine = (lineId: string) => {
    if (lines.length <= 1) return;
    setLines((prev) => prev.filter((l) => l.id !== lineId));
  };

  const updateLine = (lineId: string, field: keyof LineItem, value: string | number) => {
    setLines((prev) =>
      prev.map((l) => (l.id === lineId ? { ...l, [field]: value } : l))
    );
  };

  const handlePaymentTermsChange = (pt: PaymentTerms) => {
    setPaymentTerms(pt);
    const ptConfig = PAYMENT_TERMS.find((p) => p.id === pt);
    if (ptConfig) setDueDate(format(addDays(new Date(invoiceDate), ptConfig.days), 'yyyy-MM-dd'));
  };

  const handleSave = async () => {
    if (!id || !invoice) return;

    const validLines = lines.filter((l) => l.description.trim() && l.unit_price > 0);
    if (validLines.length === 0) {
      Alert.alert('Error', 'Add at least one line item with description and amount.');
      return;
    }

    const items = validLines.map((l) => ({
      description: l.description.trim(),
      quantity: l.quantity,
      unit_price: l.unit_price,
      amount: computeAmount(l.quantity, l.unit_price),
    }));

    try {
      await updateInvoice.mutateAsync({
        id,
        updates: {
          customer_id: customerId,
          invoice_date: invoiceDate,
          due_date: dueDate,
          subtotal,
          tax_rate: taxRateVal || null,
          tax_amount: taxAmount,
          discount_amount: discountVal || null,
          total,
          balance_due: total - Number(invoice.amount_paid ?? 0),
          notes: notes.trim() || null,
          terms: terms.trim() || null,
        },
      });
      await upsertItems.mutateAsync({ invoiceId: id, items });
      router.back();
    } catch (e) {
      Alert.alert('Error', (e as Error).message);
    }
  };

  if (!hasSupabaseEnv || !id) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0F172A', padding: 24 }}>
        <TouchableOpacity onPress={() => router.back()} style={{ marginBottom: 16 }}>
          <Text style={{ color: '#3B82F6' }}>← Back</Text>
        </TouchableOpacity>
        <Text style={{ color: '#94A3B8' }}>Connect Supabase to edit invoices.</Text>
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

  if (invoice.status !== 'draft') {
    return (
      <View style={{ flex: 1, backgroundColor: '#0F172A', padding: 24 }}>
        <TouchableOpacity onPress={() => router.back()} style={{ marginBottom: 16 }}>
          <Text style={{ color: '#3B82F6' }}>← Back</Text>
        </TouchableOpacity>
        <Text style={{ color: '#94A3B8' }}>Only draft invoices can be edited.</Text>
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
          Edit Invoice
        </Text>

        <Text style={{ color: '#94A3B8', marginBottom: 8 }}>Invoice #</Text>
        <Text style={{ color: '#F8FAFC', marginBottom: 16 }}>{invoice.invoice_number}</Text>

        <Text style={{ color: '#94A3B8', marginBottom: 8 }}>Customer</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
          {customers.map((c) => (
            <TouchableOpacity
              key={c.id}
              onPress={() => setCustomerId(c.id)}
              style={{
                paddingHorizontal: 16,
                paddingVertical: 12,
                borderRadius: 12,
                backgroundColor: customerId === c.id ? '#3B82F6' : '#1E293B',
                marginRight: 8,
              }}
            >
              <Text style={{ color: '#F8FAFC' }} numberOfLines={1}>
                {c.company_name || c.contact_name}
              </Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity
            onPress={() => router.push('/(modals)/add-customer' as never)}
            style={{
              paddingHorizontal: 16,
              paddingVertical: 12,
              borderRadius: 12,
              backgroundColor: '#334155',
              marginRight: 8,
            }}
          >
            <Text style={{ color: '#3B82F6' }}>+ Add New</Text>
          </TouchableOpacity>
        </ScrollView>

        <Text style={{ color: '#94A3B8', marginBottom: 8 }}>Invoice Date</Text>
        <TextInput
          style={inputStyle}
          value={invoiceDate}
          onChangeText={(v) => {
            setInvoiceDate(v);
            const ptConfig = PAYMENT_TERMS.find((p) => p.id === paymentTerms);
            if (ptConfig) setDueDate(format(addDays(new Date(v), ptConfig.days), 'yyyy-MM-dd'));
          }}
          placeholder="yyyy-MM-dd"
          placeholderTextColor="#64748B"
        />

        <Text style={{ color: '#94A3B8', marginBottom: 8 }}>Due Date</Text>
        <TextInput
          style={inputStyle}
          value={dueDate}
          onChangeText={setDueDate}
          placeholder="yyyy-MM-dd"
          placeholderTextColor="#64748B"
        />

        <Text style={{ color: '#94A3B8', marginBottom: 8 }}>Payment Terms</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
          {PAYMENT_TERMS.map((p) => (
            <TouchableOpacity
              key={p.id}
              onPress={() => handlePaymentTermsChange(p.id)}
              style={{
                paddingHorizontal: 14,
                paddingVertical: 10,
                borderRadius: 12,
                backgroundColor: paymentTerms === p.id ? '#3B82F6' : '#1E293B',
              }}
            >
              <Text style={{ color: '#F8FAFC', fontSize: 14 }}>{p.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={{ color: '#94A3B8', marginBottom: 8 }}>Line Items</Text>
        {lines.map((line) => (
          <View
            key={line.id}
            style={{
              backgroundColor: '#1E293B',
              borderRadius: 12,
              padding: 12,
              marginBottom: 12,
            }}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
              <Text style={{ color: '#94A3B8', fontSize: 12 }}>Description</Text>
              {lines.length > 1 && (
                <TouchableOpacity onPress={() => removeLine(line.id)}>
                  <Text style={{ color: '#EF4444', fontSize: 12 }}>Remove</Text>
                </TouchableOpacity>
              )}
            </View>
            <TextInput
              style={[inputStyle, { marginBottom: 12 }]}
              value={line.description}
              onChangeText={(v) => updateLine(line.id, 'description', v)}
              placeholder="Description"
              placeholderTextColor="#64748B"
            />
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: '#94A3B8', fontSize: 12, marginBottom: 4 }}>Qty</Text>
                <TextInput
                  style={inputStyle}
                  value={String(line.quantity)}
                  onChangeText={(v) => updateLine(line.id, 'quantity', parseFloat(v) || 0)}
                  placeholder="1"
                  placeholderTextColor="#64748B"
                  keyboardType="decimal-pad"
                />
              </View>
              <View style={{ flex: 2 }}>
                <Text style={{ color: '#94A3B8', fontSize: 12, marginBottom: 4 }}>Rate ($)</Text>
                <TextInput
                  style={inputStyle}
                  value={line.unit_price ? String(line.unit_price) : ''}
                  onChangeText={(v) => updateLine(line.id, 'unit_price', parseFloat(v) || 0)}
                  placeholder="0.00"
                  placeholderTextColor="#64748B"
                  keyboardType="decimal-pad"
                />
              </View>
              <View style={{ flex: 1, justifyContent: 'flex-end', marginBottom: 16 }}>
                <Text style={{ color: '#10B981', fontWeight: '600' }}>
                  ${computeAmount(line.quantity, line.unit_price).toFixed(2)}
                </Text>
              </View>
            </View>
          </View>
        ))}
        <TouchableOpacity
          onPress={addLine}
          style={{
            backgroundColor: '#334155',
            borderRadius: 12,
            padding: 12,
            marginBottom: 20,
            alignItems: 'center',
          }}
        >
          <Text style={{ color: '#3B82F6' }}>+ Add Line</Text>
        </TouchableOpacity>

        <View style={{ backgroundColor: '#1E293B', borderRadius: 12, padding: 16, marginBottom: 20 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
            <Text style={{ color: '#94A3B8' }}>Subtotal</Text>
            <Text style={{ color: '#F8FAFC' }}>${subtotal.toFixed(2)}</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
            <Text style={{ color: '#94A3B8', marginRight: 8 }}>Tax %</Text>
            <TextInput
              style={[inputStyle, { flex: 1, marginBottom: 0 }]}
              value={taxRate}
              onChangeText={setTaxRate}
              placeholder="0"
              placeholderTextColor="#64748B"
              keyboardType="decimal-pad"
            />
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
            <Text style={{ color: '#94A3B8' }}>Tax</Text>
            <Text style={{ color: '#F8FAFC' }}>${taxAmount.toFixed(2)}</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
            <Text style={{ color: '#94A3B8', marginRight: 8 }}>Discount $</Text>
            <TextInput
              style={[inputStyle, { flex: 1, marginBottom: 0 }]}
              value={discountAmount}
              onChangeText={setDiscountAmount}
              placeholder="0"
              placeholderTextColor="#64748B"
              keyboardType="decimal-pad"
            />
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#334155' }}>
            <Text style={{ color: '#F8FAFC', fontWeight: '600', fontSize: 16 }}>Total</Text>
            <Text style={{ color: '#10B981', fontWeight: '600', fontSize: 18 }}>${total.toFixed(2)}</Text>
          </View>
        </View>

        <TouchableOpacity
          onPress={() => setShowNotes(!showNotes)}
          style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}
        >
          <Text style={{ color: '#3B82F6', marginRight: 8 }}>{showNotes ? '▼' : '▶'}</Text>
          <Text style={{ color: '#94A3B8' }}>Notes / Terms</Text>
        </TouchableOpacity>
        {showNotes && (
          <>
            <TextInput
              style={[inputStyle, { minHeight: 60, textAlignVertical: 'top' }]}
              value={notes}
              onChangeText={setNotes}
              placeholder="Notes"
              placeholderTextColor="#64748B"
              multiline
            />
            <TextInput
              style={[inputStyle, { minHeight: 60, textAlignVertical: 'top' }]}
              value={terms}
              onChangeText={setTerms}
              placeholder="Terms"
              placeholderTextColor="#64748B"
              multiline
            />
          </>
        )}

        <TouchableOpacity
          onPress={handleSave}
          disabled={updateInvoice.isPending || upsertItems.isPending}
          style={{
            backgroundColor: '#3B82F6',
            borderRadius: 12,
            padding: 16,
            alignItems: 'center',
            marginTop: 24,
          }}
        >
          {updateInvoice.isPending || upsertItems.isPending ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={{ color: '#fff', fontWeight: '600' }}>Save</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
