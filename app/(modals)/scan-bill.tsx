import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/providers/AuthProvider';
import { useBills, useCreateBill, useUpdateBill, useMarkBillPaid } from '../../src/hooks/useBills';
import { BillScanner, type BillScannerResult } from '../../src/components/BillScanner';
import { matchScannedBillToExisting } from '../../src/lib/matchBill';
import {
  getScanAmount,
  getScanDate,
  getScanProviderName,
} from '../../src/services/scanBill';
import { uploadReceipt } from '../../src/services/storage';
import { supabase } from '../../src/services/supabase';
import { hasSupabaseEnv } from '../../src/services/env';
import { useToast } from '../../src/components/ui';
import { format, addMonths, setDate } from 'date-fns';
import type { Bill } from '../../src/types/bills';

export default function ScanBillScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const toast = useToast();
  const { data: bills = [] } = useBills();
  const createBill = useCreateBill();
  const updateBill = useUpdateBill();
  const markPaid = useMarkBillPaid();

  const [scannerVisible, setScannerVisible] = useState(false);
  const [result, setResult] = useState<BillScannerResult | null>(null);
  const [saving, setSaving] = useState(false);

  const matchedBill = result
    ? matchScannedBillToExisting(getScanProviderName(result.fields), bills as Bill[])
    : null;
  const amount = result ? getScanAmount(result.fields) : null;
  const dueDate = result ? getScanDate(result.fields, result.documentType) : null;
  const defaultDue = dueDate ?? format(addMonths(setDate(new Date(), 15), 1), 'yyyy-MM-dd');
  const providerName = result ? getScanProviderName(result.fields) : '';

  const handleScanned = (r: BillScannerResult) => {
    setResult(r);
    setScannerVisible(false);
  };

  const handleCreateNewBill = async () => {
    if (!result || !user || !hasSupabaseEnv) return;
    const amt = amount ?? 0;
    if (amt <= 0) {
      toast.show('No amount extracted. Edit the bill after creating.');
    }
    setSaving(true);
    try {
      let attachmentUrl: string | null = null;
      try {
        attachmentUrl = await uploadReceipt(user.id, result.imageUri);
      } catch {
        /* ignore */
      }
      await createBill.mutateAsync({
        bill_name: result.fields.bill_name?.trim() || result.fields.provider_name?.trim() || 'Scanned bill',
        provider_name: providerName || null,
        account_number: result.fields.account_number?.trim() || null,
        amount: amt,
        due_date: defaultDue,
        status: 'pending',
        attachment_url: attachmentUrl,
      });
      toast.show('Bill created.');
      router.back();
    } catch (e) {
      toast.show((e as Error)?.message ?? 'Failed to create bill');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateExisting = async () => {
    if (!matchedBill || !result || amount == null) return;
    setSaving(true);
    try {
      await updateBill.mutateAsync({
        id: matchedBill.id,
        updates: { amount, due_date: defaultDue, updated_at: new Date().toISOString() },
      });
      toast.show(`Updated ${matchedBill.bill_name ?? matchedBill.provider_name ?? 'bill'} to $${amount.toFixed(2)}`);
      router.back();
    } catch (e) {
      toast.show((e as Error)?.message ?? 'Failed to update bill');
    } finally {
      setSaving(false);
    }
  };

  const handleMarkPaid = async () => {
    if (!matchedBill || !result) return;
    const paidAmt = amount ?? matchedBill.amount;
    Alert.alert(
      'Mark as paid?',
      `Mark "${matchedBill.bill_name ?? matchedBill.provider_name}" as paid for $${paidAmt.toFixed(2)} on ${defaultDue}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Mark paid',
          onPress: async () => {
            setSaving(true);
            try {
              await markPaid.mutateAsync({
                id: matchedBill.id,
                paid_amount: paidAmt,
                paid_date: defaultDue,
              });
              toast.show('Marked as paid.');
              router.back();
            } catch (e) {
              toast.show((e as Error)?.message ?? 'Failed to mark paid');
            } finally {
              setSaving(false);
            }
          },
        },
      ]
    );
  };

  const handleSaveAsReceiptOnly = async () => {
    if (!result || !user || !hasSupabaseEnv) return;
    setSaving(true);
    try {
      const url = await uploadReceipt(user.id, result.imageUri);
      await supabase.from('receipts').insert({
        user_id: user.id,
        image_url: url!,
        vendor: providerName || null,
        amount: amount ?? undefined,
        date: defaultDue || null,
        category: null,
        ocr_text: null,
      });
      toast.show('Receipt saved for tax history.');
      router.back();
    } catch (e) {
      toast.show((e as Error)?.message ?? 'Failed to save receipt');
    } finally {
      setSaving(false);
    }
  };

  const reset = () => setResult(null);

  if (!hasSupabaseEnv) {
    return (
      <View style={styles.screen}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.placeholder}>Connect Supabase to scan bills and save receipts.</Text>
      </View>
    );
  }

  if (!result) {
    return (
      <>
        <View style={styles.screen}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Scan bill or receipt</Text>
          <Text style={styles.subtitle}>
            We'll extract provider, amount, due date, and line items. For recurring bills you can update existing or mark as paid.
          </Text>
          <TouchableOpacity
            onPress={() => setScannerVisible(true)}
            style={styles.scanButton}
          >
            <Ionicons name="scan" size={32} color="#fff" />
            <Text style={styles.scanButtonText}>Scan now</Text>
          </TouchableOpacity>
        </View>
        <BillScanner
          visible={scannerVisible}
          onClose={() => setScannerVisible(false)}
          onScanned={handleScanned}
        />
      </>
    );
  }

  // Result view: extracted data + match suggestion + actions
  const isBill = result.documentType === 'bill';

  return (
    <View style={styles.screen}>
      <TouchableOpacity onPress={reset} style={styles.backBtn}>
        <Text style={styles.backText}>← Scan another</Text>
      </TouchableOpacity>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{isBill ? 'Bill' : 'Receipt'}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Extracted</Text>
          {providerName ? (
            <Row label="Provider / Store" value={providerName} />
          ) : null}
          {amount != null && amount > 0 ? (
            <Row label="Amount" value={`$${amount.toFixed(2)}`} />
          ) : null}
          {defaultDue ? <Row label={isBill ? 'Due date' : 'Date'} value={defaultDue} /> : null}
          {result.fields.account_number ? (
            <Row label="Account" value={String(result.fields.account_number)} />
          ) : null}
          {result.fields.service_period_start || result.fields.service_period_end ? (
            <Row
              label="Service period"
              value={[result.fields.service_period_start, result.fields.service_period_end].filter(Boolean).join(' – ')}
            />
          ) : null}
          {result.fields.line_items?.length ? (
            <View style={styles.lineItems}>
              <Text style={styles.lineItemsTitle}>Line items</Text>
              {result.fields.line_items.slice(0, 5).map((item, i) => (
                <Text key={i} style={styles.lineItem}>
                  {item.description ?? 'Item'} {item.amount != null ? `$${item.amount.toFixed(2)}` : ''}
                </Text>
              ))}
            </View>
          ) : null}
        </View>

        {matchedBill && isBill && (
          <View style={styles.matchCard}>
            <Text style={styles.matchTitle}>This looks like your existing bill</Text>
            <Text style={styles.matchLabel}>
              {matchedBill.bill_name ?? matchedBill.provider_name} — update amount to {amount != null ? `$${amount.toFixed(2)}` : 'this amount'}?
            </Text>
            <View style={styles.matchActions}>
              <TouchableOpacity
                onPress={handleUpdateExisting}
                disabled={saving || amount == null}
                style={styles.matchBtn}
              >
                <Text style={styles.matchBtnText}>Update amount & due date</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleMarkPaid} disabled={saving} style={[styles.matchBtn, styles.matchBtnSecondary]}>
                <Text style={styles.matchBtnTextSecondary}>Mark as paid</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <Text style={styles.actionsTitle}>What would you like to do?</Text>
        <TouchableOpacity
          onPress={handleCreateNewBill}
          disabled={saving}
          style={styles.primaryAction}
        >
          {saving ? <ActivityIndicator color="#fff" /> : (
            <Text style={styles.primaryActionText}>
              {isBill ? 'Create new bill entry' : 'Save as receipt & create bill (optional)'}
            </Text>
          )}
        </TouchableOpacity>

        {(result.documentType === 'receipt' || !matchedBill) && (
          <TouchableOpacity onPress={handleSaveAsReceiptOnly} disabled={saving} style={styles.secondaryAction}>
            <Text style={styles.secondaryActionText}>Save to receipt history only (for taxes)</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={rowStyles.row}>
      <Text style={rowStyles.label}>{label}</Text>
      <Text style={rowStyles.value} numberOfLines={2}>{value}</Text>
    </View>
  );
}

const rowStyles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#1E293B' },
  label: { color: '#94A3B8', fontSize: 13 },
  value: { color: '#F8FAFC', fontSize: 14, flex: 1, textAlign: 'right', marginLeft: 12 },
});

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#0F172A', padding: 24 },
  backBtn: { marginBottom: 16 },
  backText: { color: '#3B82F6', fontSize: 16 },
  placeholder: { color: '#94A3B8', fontSize: 16 },
  title: { color: '#F8FAFC', fontSize: 24, fontWeight: 'bold', marginBottom: 8 },
  subtitle: { color: '#94A3B8', marginBottom: 32 },
  scanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: '#3B82F6',
    paddingVertical: 20,
    borderRadius: 12,
  },
  scanButtonText: { color: '#fff', fontWeight: '600', fontSize: 18 },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 40 },
  badge: { alignSelf: 'flex-start', backgroundColor: '#334155', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, marginBottom: 16 },
  badgeText: { color: '#3B82F6', fontWeight: '600', fontSize: 14 },
  card: { backgroundColor: '#1E293B', borderRadius: 12, padding: 16, marginBottom: 20 },
  cardTitle: { color: '#94A3B8', fontSize: 12, fontWeight: '600', marginBottom: 8 },
  lineItems: { marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#334155' },
  lineItemsTitle: { color: '#94A3B8', fontSize: 12, marginBottom: 4 },
  lineItem: { color: '#E2E8F0', fontSize: 13, marginBottom: 2 },
  matchCard: { backgroundColor: '#1E3A5F', borderRadius: 12, padding: 16, marginBottom: 20, borderWidth: 1, borderColor: '#3B82F6' },
  matchTitle: { color: '#93C5FD', fontWeight: '600', marginBottom: 4 },
  matchLabel: { color: '#F8FAFC', fontSize: 15, marginBottom: 12 },
  matchActions: { flexDirection: 'row', gap: 8 },
  matchBtn: { flex: 1, backgroundColor: '#3B82F6', paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  matchBtnSecondary: { backgroundColor: 'transparent', borderWidth: 1, borderColor: '#3B82F6' },
  matchBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  matchBtnTextSecondary: { color: '#3B82F6', fontWeight: '600', fontSize: 14 },
  actionsTitle: { color: '#94A3B8', fontSize: 14, marginBottom: 12 },
  primaryAction: {
    backgroundColor: '#3B82F6',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 10,
  },
  primaryActionText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  secondaryAction: {
    backgroundColor: '#1E293B',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 10,
  },
  secondaryActionText: { color: '#3B82F6', fontWeight: '500', fontSize: 15 },
});
