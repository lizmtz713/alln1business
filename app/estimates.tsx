import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Modal,
  Pressable,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useQuarterlyEstimates, useTaxSettings, useUpdateTaxSettings, useUpsertQuarterlyEstimates, useMarkEstimatePaid } from '../src/hooks/useQuarterlyEstimates';
import { useCreateComplianceItem, useComplianceItems } from '../src/hooks/useCompliance';
import { useNetworkStatus } from '../src/hooks/useNetworkStatus';
import { hasSupabaseEnv } from '../src/services/env';
import { format, parseISO } from 'date-fns';
import { Button, Card, Input } from '../src/components/ui';

const shared = {
  screen: { flex: 1, backgroundColor: '#0F172A' as const },
  padding: { padding: 24 },
  back: { color: '#3B82F6' as const, fontSize: 16, marginBottom: 24 },
  title: { color: '#F8FAFC' as const, fontSize: 24, fontWeight: 'bold' as const, marginBottom: 24 },
  card: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
};

export default function EstimatesScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ year?: string; quarter?: string }>();
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(
    params.year ? parseInt(params.year, 10) : currentYear
  );
  const [effectiveRate, setEffectiveRate] = useState('25');
  const [stateRate, setStateRate] = useState('0');
  const [includeMeals50, setIncludeMeals50] = useState(true);
  const [showPayModal, setShowPayModal] = useState(false);
  const [selectedEstimate, setSelectedEstimate] = useState<{
    id: string;
    quarter: number;
    total: number;
  } | null>(null);
  const [paidAmount, setPaidAmount] = useState('');
  const [paidDate, setPaidDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [paymentMethod, setPaymentMethod] = useState('');
  const [confirmationNumber, setConfirmationNumber] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');

  const { isConnected } = useNetworkStatus();
  const { data: settings } = useTaxSettings();
  const updateSettings = useUpdateTaxSettings();
  const { quarters, isLoading, refetch } = useQuarterlyEstimates(year);
  const upsertEstimates = useUpsertQuarterlyEstimates(year);
  const markPaid = useMarkEstimatePaid();
  const createCompliance = useCreateComplianceItem();
  const { data: existingCompliance = [] } = useComplianceItems();

  useEffect(() => {
    if (settings) {
      setEffectiveRate(String(Math.round((settings.effective_tax_rate ?? 0.25) * 100)));
      setStateRate(String(Math.round((settings.state_estimated_tax_rate ?? 0) * 100)));
      setIncludeMeals50(settings.include_meals_50 ?? true);
    }
  }, [settings]);

  const scrollToQuarter = params.quarter ? parseInt(params.quarter, 10) : null;

  const handleSaveSettings = () => {
    const fed = parseInt(effectiveRate, 10);
    const state = parseInt(stateRate, 10);
    if (isNaN(fed) || fed < 0 || fed > 100) {
      Alert.alert('Invalid', 'Effective tax rate must be 0-100');
      return;
    }
    updateSettings.mutate({
      effective_tax_rate: (fed || 25) / 100,
      state_estimated_tax_rate: (isNaN(state) ? 0 : state) / 100,
      include_meals_50: includeMeals50,
    });
  };

  const openPayModal = (row: { id: string; quarter: number; total: number }) => {
    setSelectedEstimate(row);
    setPaidAmount(row.total.toFixed(2));
    setPaidDate(format(new Date(), 'yyyy-MM-dd'));
    setPaymentMethod('');
    setConfirmationNumber('');
    setPaymentNotes('');
    setShowPayModal(true);
  };

  const handleMarkPaid = () => {
    if (!selectedEstimate) return;
    if (!isConnected) {
      Alert.alert('Offline', 'Connect to mark payments.');
      return;
    }
    markPaid.mutate(
      {
        id: selectedEstimate.id,
        paid: true,
        paid_amount: parseFloat(paidAmount) || selectedEstimate.total,
        paid_date: paidDate,
        payment_method: paymentMethod || undefined,
        confirmation_number: confirmationNumber || undefined,
        notes: paymentNotes || undefined,
      },
      { onSuccess: () => setShowPayModal(false) }
    );
  };

  const handleAddComplianceReminders = async () => {
    if (!isConnected) {
      Alert.alert('Offline', 'Connect to add compliance reminders.');
      return;
    }
    const existingIds = new Set(
      existingCompliance
        .filter((c) => c.related_estimate_id)
        .map((c) => c.related_estimate_id as string)
    );
    for (const q of quarters) {
      if (!q.paymentRow?.id || existingIds.has(q.paymentRow.id)) continue;
      await createCompliance.mutateAsync({
        name: `Q${q.quarter} ${year} Estimated Tax`,
        description: `Quarterly tax estimate due ${format(parseISO(q.due), 'MMM d, yyyy')}`,
        category: 'tax',
        due_date: q.due,
        recurrence: 'yearly',
        reminder_days: 7,
        source: 'system',
        related_estimate_id: q.paymentRow.id,
      });
      existingIds.add(q.paymentRow.id);
    }
  };

  if (!hasSupabaseEnv) {
    return (
      <View style={[shared.screen, shared.padding]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={shared.back}>← Back</Text>
        </TouchableOpacity>
        <Text style={{ color: '#94A3B8' }}>Connect Supabase for quarterly estimates.</Text>
      </View>
    );
  }

  return (
    <View style={[shared.screen]}>
      <ScrollView contentContainerStyle={[shared.padding, { paddingBottom: 120 }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={shared.back}>← Back</Text>
        </TouchableOpacity>
        <Text style={shared.title}>Quarterly Estimates</Text>

        <View style={shared.card}>
          <Text style={{ color: '#F8FAFC', fontWeight: '600', marginBottom: 12 }}>Settings</Text>
          <Input
            label="Effective Tax Rate (%)"
            value={effectiveRate}
            onChangeText={setEffectiveRate}
            keyboardType="numeric"
            placeholder="25"
          />
          <Input
            label="State Rate (%)"
            value={stateRate}
            onChangeText={setStateRate}
            keyboardType="numeric"
            placeholder="0"
          />
          <TouchableOpacity
            onPress={() => setIncludeMeals50(!includeMeals50)}
            style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}
          >
            <View
              style={{
                width: 24,
                height: 24,
                borderRadius: 6,
                backgroundColor: includeMeals50 ? '#3B82F6' : '#334155',
                marginRight: 12,
              }}
            />
            <Text style={{ color: '#F8FAFC' }}>Meals 50% deductible</Text>
          </TouchableOpacity>
          <Button title="Save" onPress={handleSaveSettings} loading={updateSettings.isPending} />
        </View>

        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 20 }}>
          {[currentYear - 1, currentYear, currentYear + 1].map((y) => (
            <TouchableOpacity
              key={y}
              onPress={() => setYear(y)}
              style={{
                paddingHorizontal: 16,
                paddingVertical: 10,
                borderRadius: 12,
                backgroundColor: year === y ? '#3B82F6' : '#1E293B',
              }}
            >
              <Text style={{ color: year === y ? '#fff' : '#94A3B8', fontWeight: '500' }}>{y}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {isLoading ? (
          <ActivityIndicator color="#3B82F6" style={{ marginTop: 24 }} />
        ) : (
          <>
            <TouchableOpacity
              style={[shared.card, { backgroundColor: '#334155', marginBottom: 20 }]}
              onPress={() => upsertEstimates.mutate()}
              disabled={upsertEstimates.isPending || !isConnected}
            >
              {upsertEstimates.isPending ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={{ color: '#F8FAFC', fontWeight: '600', textAlign: 'center' }}>
                  Update Estimates
                </Text>
              )}
            </TouchableOpacity>

            {quarters.map((q) => {
              const paid = q.paymentRow?.paid ?? false;
              const rowId = q.paymentRow?.id;
              return (
                <View
                  key={q.quarter}
                  style={[shared.card, scrollToQuarter === q.quarter && { borderWidth: 2, borderColor: '#3B82F6' }]}
                >
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <Text style={{ color: '#F8FAFC', fontWeight: '700', fontSize: 18 }}>Q{q.quarter}</Text>
                    <View
                      style={{
                        backgroundColor: paid ? '#10B981' : '#F59E0B',
                        paddingHorizontal: 10,
                        paddingVertical: 4,
                        borderRadius: 8,
                      }}
                    >
                      <Text style={{ color: '#fff', fontSize: 12, fontWeight: '600' }}>
                        {paid ? 'Paid' : 'Not Paid'}
                      </Text>
                    </View>
                  </View>
                  <Text style={{ color: '#94A3B8', fontSize: 12, marginBottom: 8 }}>
                    Due {format(parseISO(q.due), 'MMM d, yyyy')} (may shift on holidays)
                  </Text>
                  <Text style={{ color: '#94A3B8', fontSize: 14 }}>
                    Profit: ${q.taxableProfit.toFixed(2)} • Deductible: ${q.deductibleTotals.toFixed(2)} • {q.txCount} tx
                  </Text>
                  <Text style={{ color: '#3B82F6', fontSize: 16, fontWeight: '600', marginTop: 8 }}>
                    Federal: ${q.fedEstimate.toFixed(2)} • State: ${q.stateEstimate.toFixed(2)}
                  </Text>
                  <Text style={{ color: '#F8FAFC', fontSize: 18, fontWeight: '700', marginTop: 4 }}>
                    Total: ${q.totalEstimate.toFixed(2)}
                  </Text>
                  {rowId && (
                    <TouchableOpacity
                      style={{
                        marginTop: 12,
                        backgroundColor: paid ? '#334155' : '#3B82F6',
                        padding: 12,
                        borderRadius: 12,
                        alignItems: 'center',
                      }}
                      onPress={() => openPayModal({ id: rowId, quarter: q.quarter, total: q.totalEstimate })}
                      disabled={!isConnected}
                    >
                      <Text style={{ color: '#fff', fontWeight: '600' }}>
                        {paid ? 'Edit Payment' : 'Mark Paid'}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              );
            })}

            <Button
              title="Add as Compliance Reminders"
              variant="secondary"
              onPress={handleAddComplianceReminders}
              disabled={!isConnected || quarters.every((q) => !q.paymentRow?.id)}
            />
          </>
        )}
      </ScrollView>

      <Modal visible={showPayModal} transparent animationType="fade">
        <Pressable
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}
          onPress={() => setShowPayModal(false)}
        >
          <Pressable
            style={{ backgroundColor: '#1E293B', borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 24 }}
            onPress={(e) => e.stopPropagation()}
          >
            <Text style={{ color: '#F8FAFC', fontSize: 18, fontWeight: '600', marginBottom: 16 }}>
              {selectedEstimate ? `Q${selectedEstimate.quarter} Payment` : 'Mark Paid'}
            </Text>
            <Input label="Amount" value={paidAmount} onChangeText={setPaidAmount} keyboardType="decimal-pad" />
            <Input label="Date" value={paidDate} onChangeText={setPaidDate} placeholder="yyyy-mm-dd" />
            <Input label="Method" value={paymentMethod} onChangeText={setPaymentMethod} placeholder="Check, EFTPS, etc." />
            <Input label="Confirmation #" value={confirmationNumber} onChangeText={setConfirmationNumber} />
            <Input label="Notes" value={paymentNotes} onChangeText={setPaymentNotes} />
            <View style={{ flexDirection: 'row', gap: 12, marginTop: 8 }}>
              <Button title="Cancel" variant="secondary" onPress={() => setShowPayModal(false)} style={{ flex: 1 }} />
              <Button title="Save" onPress={handleMarkPaid} loading={markPaid.isPending} style={{ flex: 1 }} />
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
