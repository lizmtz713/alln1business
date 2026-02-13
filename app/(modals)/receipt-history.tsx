import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  StyleSheet,
  Platform,
  Linking,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useReceipts } from '../../src/hooks/useReceipts';
import { useAuth } from '../../src/providers/AuthProvider';
import { getCategoryName } from '../../src/lib/categories';
import { EXPENSE_CATEGORIES } from '../../src/lib/categories';
import { useToast } from '../../src/components/ui';
import { format, parseISO } from 'date-fns';
import type { Receipt } from '../../src/types/receipts';

export default function ReceiptHistoryScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const toast = useToast();
  const [category, setCategory] = useState<string | null>(null);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [exporting, setExporting] = useState(false);

  const { data: receipts = [], isLoading } = useReceipts({
    category: category ?? undefined,
    dateFrom: dateFrom.trim() || undefined,
    dateTo: dateTo.trim() || undefined,
  });

  const buildCsv = (list: Receipt[]): string => {
    const header = 'Date,Vendor,Amount,Category,Notes';
    const rows = list.map((r) => {
      const date = r.date ? format(parseISO(r.date), 'yyyy-MM-dd') : '';
      const vendor = (r.vendor ?? '').replace(/"/g, '""');
      const amount = r.amount != null ? r.amount.toFixed(2) : '';
      const cat = (r.category ?? '').replace(/"/g, '""');
      const notes = (r.ocr_text ?? '').replace(/"/g, '""').replace(/\n/g, ' ');
      return `"${date}","${vendor}","${amount}","${cat}","${notes}"`;
    });
    return [header, ...rows].join('\n');
  };

  const handleExport = async () => {
    if (receipts.length === 0) {
      toast.show('No receipts to export for this filter.');
      return;
    }
    setExporting(true);
    try {
      const csv = buildCsv(receipts);
      const filename = `receipts-${dateFrom || 'all'}-${dateTo || 'all'}.csv`;
      if (Platform.OS === 'web') {
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
      } else {
        const { shareAsync } = await import('expo-sharing');
        const { writeAsStringAsync, documentDirectory } = await import('expo-file-system/legacy');
        const path = `${documentDirectory}${filename}`;
        await writeAsStringAsync(path, csv, { encoding: 'utf8' });
        try {
          await shareAsync(path, { mimeType: 'text/csv', dialogTitle: 'Export receipts' });
        } finally {
          try {
            const { deleteAsync } = await import('expo-file-system/legacy');
            await deleteAsync(path, { idempotent: true });
          } catch {
            /* ignore */
          }
        }
      }
      toast.show(`Exported ${receipts.length} receipt(s).`);
    } catch (e) {
      toast.show((e as Error)?.message ?? 'Export failed');
    } finally {
      setExporting(false);
    }
  };

  return (
    <View style={styles.screen}>
      <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>

      <Text style={styles.title}>Receipt history</Text>
      <Text style={styles.subtitle}>For tax purposes. Filter by category or date range, then export.</Text>

      <View style={styles.filters}>
        <Text style={styles.filterLabel}>Category</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
          <TouchableOpacity
            onPress={() => setCategory(null)}
            style={[styles.chip, !category && styles.chipActive]}
          >
            <Text style={[styles.chipText, !category && styles.chipTextActive]}>All</Text>
          </TouchableOpacity>
          {EXPENSE_CATEGORIES.slice(0, 10).map((c) => (
            <TouchableOpacity
              key={c.id}
              onPress={() => setCategory(c.id)}
              style={[styles.chip, category === c.id && styles.chipActive]}
            >
              <Text style={[styles.chipText, category === c.id && styles.chipTextActive]}>{c.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Text style={styles.filterLabel}>Date range</Text>
        <View style={styles.dateRow}>
          <TextInput
            style={styles.dateInput}
            placeholder="From (yyyy-mm-dd)"
            placeholderTextColor="#64748B"
            value={dateFrom}
            onChangeText={setDateFrom}
          />
          <Text style={styles.dateSep}>–</Text>
          <TextInput
            style={styles.dateInput}
            placeholder="To (yyyy-mm-dd)"
            placeholderTextColor="#64748B"
            value={dateTo}
            onChangeText={setDateTo}
          />
        </View>
      </View>

      <TouchableOpacity
        onPress={handleExport}
        disabled={exporting || receipts.length === 0}
        style={[styles.exportBtn, (exporting || receipts.length === 0) && styles.exportBtnDisabled]}
      >
        {exporting ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <>
            <Ionicons name="download-outline" size={20} color="#fff" />
            <Text style={styles.exportBtnText}>
              Export {receipts.length} receipt(s) as CSV
            </Text>
          </>
        )}
      </TouchableOpacity>

      {isLoading ? (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color="#3B82F6" />
        </View>
      ) : receipts.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="receipt-outline" size={48} color="#475569" />
          <Text style={styles.emptyText}>No receipts in this range</Text>
          <Text style={styles.emptySubtext}>Scan receipts from the home screen to build history.</Text>
        </View>
      ) : (
        <ScrollView style={styles.list} contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
          {receipts.map((r) => (
            <TouchableOpacity
              key={r.id}
              style={styles.row}
              onPress={() => r.image_url && Linking.openURL(r.image_url)}
            >
              <View style={styles.rowLeft}>
                <Text style={styles.rowVendor}>{r.vendor || 'Receipt'}</Text>
                <Text style={styles.rowDate}>
                  {r.date ? format(parseISO(r.date), 'MMM d, yyyy') : 'No date'}
                  {r.category ? ` · ${getCategoryName(r.category)}` : ''}
                </Text>
              </View>
              {r.amount != null && (
                <Text style={styles.rowAmount}>${r.amount.toFixed(2)}</Text>
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#0F172A', padding: 24 },
  backBtn: { marginBottom: 16 },
  backText: { color: '#3B82F6', fontSize: 16 },
  title: { color: '#F8FAFC', fontSize: 24, fontWeight: 'bold', marginBottom: 8 },
  subtitle: { color: '#94A3B8', marginBottom: 20 },
  filters: { marginBottom: 20 },
  filterLabel: { color: '#94A3B8', fontSize: 12, marginBottom: 8 },
  categoryScroll: { marginBottom: 16 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#1E293B',
    marginRight: 8,
  },
  chipActive: { backgroundColor: '#3B82F6' },
  chipText: { color: '#94A3B8', fontSize: 14 },
  chipTextActive: { color: '#fff', fontWeight: '500' },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dateInput: {
    flex: 1,
    backgroundColor: '#1E293B',
    borderRadius: 10,
    padding: 12,
    color: '#F8FAFC',
    fontSize: 14,
  },
  dateSep: { color: '#64748B' },
  exportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#22C55E',
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 24,
  },
  exportBtnDisabled: { opacity: 0.6 },
  exportBtnText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 48 },
  emptyText: { color: '#94A3B8', fontSize: 16, marginTop: 12 },
  emptySubtext: { color: '#64748B', fontSize: 14, marginTop: 4 },
  list: { flex: 1 },
  listContent: { paddingBottom: 40 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
  },
  rowLeft: { flex: 1 },
  rowVendor: { color: '#F8FAFC', fontSize: 16, fontWeight: '500' },
  rowDate: { color: '#94A3B8', fontSize: 13, marginTop: 2 },
  rowAmount: { color: '#22C55E', fontSize: 16, fontWeight: '600' },
});
