import React, { useEffect, useState } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../contexts/AuthContext';
import { useFeatureGate, useFeatureUsage } from '../hooks/useFeatureGate';
import { Receipt, ExpenseCategory } from '../types';
import { format, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';

const CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  office_supplies: 'Office Supplies',
  equipment: 'Equipment',
  travel: 'Travel',
  meals: 'Meals & Entertainment',
  utilities: 'Utilities',
  rent: 'Rent',
  marketing: 'Marketing',
  professional_services: 'Professional Services',
  insurance: 'Insurance',
  taxes: 'Taxes',
  inventory: 'Inventory',
  shipping: 'Shipping',
  software: 'Software',
  other: 'Other',
};

export function ReceiptsScreen({ navigation }: any) {
  const { user } = useAuth();
  const { checkReceiptLimit, canUseUnlimitedReceipts } = useFeatureGate();
  const { getReceiptUsage } = useFeatureUsage();
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'this_month' | 'deductible'>('all');
  const [usageInfo, setUsageInfo] = useState({ used: 0, remaining: 10, limit: 10 });

  // Load usage info
  useEffect(() => {
    const loadUsage = async () => {
      const usage = await getReceiptUsage();
      setUsageInfo(usage);
    };
    loadUsage();
  }, [receipts]); // Refresh when receipts change

  // Handle add receipt with feature gate
  const handleAddReceipt = async () => {
    const allowed = await checkReceiptLimit();
    if (!allowed) {
      navigation.navigate('Paywall', { source: 'receipt_limit' });
      return;
    }
    navigation.navigate('AddReceipt');
  };

  useEffect(() => {
    fetchReceipts();
  }, [user]);

  const fetchReceipts = async () => {
    if (!user) return;
    try {
      const q = query(
        collection(db, 'receipts'),
        where('userId', '==', user.id),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      setReceipts(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Receipt)));
    } catch (error) {
      console.error('Error fetching receipts:', error);
    } finally {
      setLoading(false);
    }
  };

  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);

  const filteredReceipts = receipts.filter(r => {
    if (filter === 'this_month') {
      const receiptDate = r.date ? new Date(r.date) : new Date(r.createdAt);
      return isWithinInterval(receiptDate, { start: monthStart, end: monthEnd });
    }
    if (filter === 'deductible') {
      return r.taxDeductible;
    }
    return true;
  });

  const totalAmount = filteredReceipts.reduce((sum, r) => sum + (r.amount || 0), 0);
  const deductibleAmount = receipts
    .filter(r => r.taxDeductible)
    .reduce((sum, r) => sum + (r.amount || 0), 0);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Receipts</Text>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={handleAddReceipt}
        >
          <Ionicons name="camera" size={24} color="#FFF" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* Usage Limit Banner (for free users) */}
        {!canUseUnlimitedReceipts && (
          <TouchableOpacity 
            style={[
              styles.usageBanner,
              usageInfo.remaining <= 3 && styles.usageBannerWarning,
              usageInfo.remaining === 0 && styles.usageBannerDanger,
            ]}
            onPress={() => navigation.navigate('Paywall', { source: 'receipt_limit' })}
          >
            <View style={styles.usageBannerContent}>
              <Ionicons 
                name={usageInfo.remaining === 0 ? "alert-circle" : "receipt"} 
                size={20} 
                color={usageInfo.remaining === 0 ? "#DC2626" : usageInfo.remaining <= 3 ? "#D97706" : "#3B82F6"} 
              />
              <Text style={[
                styles.usageBannerText,
                usageInfo.remaining === 0 && styles.usageBannerTextDanger,
              ]}>
                {usageInfo.remaining === 0 
                  ? "Receipt limit reached" 
                  : `${usageInfo.remaining} of ${usageInfo.limit} receipts remaining`}
              </Text>
            </View>
            <View style={styles.usageBannerAction}>
              <Text style={styles.usageBannerUpgrade}>Upgrade</Text>
              <Ionicons name="chevron-forward" size={16} color="#3B82F6" />
            </View>
          </TouchableOpacity>
        )}

        {/* Summary */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>This Month</Text>
            <Text style={styles.summaryValue}>${totalAmount.toFixed(2)}</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Tax Deductible</Text>
            <Text style={[styles.summaryValue, { color: '#10B981' }]}>
              ${deductibleAmount.toFixed(2)}
            </Text>
          </View>
        </View>

        {/* Filters */}
        <View style={styles.filters}>
          {(['all', 'this_month', 'deductible'] as const).map((f) => (
            <TouchableOpacity
              key={f}
              style={[styles.filterButton, filter === f && styles.filterActive]}
              onPress={() => setFilter(f)}
            >
              <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
                {f === 'all' ? 'All' : f === 'this_month' ? 'This Month' : 'Tax Deductible'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Receipts List */}
        {filteredReceipts.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="receipt-outline" size={48} color="#CBD5E1" />
            <Text style={styles.emptyText}>No receipts yet</Text>
            <Text style={styles.emptySubtext}>
              Snap a photo of your receipts to track expenses
            </Text>
            <TouchableOpacity 
              style={styles.emptyButton}
              onPress={handleAddReceipt}
            >
              <Ionicons name="camera" size={20} color="#FFF" />
              <Text style={styles.emptyButtonText}>Scan Receipt</Text>
            </TouchableOpacity>
          </View>
        ) : (
          filteredReceipts.map((receipt) => (
            <TouchableOpacity 
              key={receipt.id}
              style={styles.receiptCard}
              onPress={() => navigation.navigate('ReceiptDetail', { receipt })}
            >
              {receipt.imageUrl ? (
                <Image source={{ uri: receipt.imageUrl }} style={styles.receiptThumb} />
              ) : (
                <View style={[styles.receiptThumb, styles.receiptThumbPlaceholder]}>
                  <Ionicons name="receipt" size={24} color="#94A3B8" />
                </View>
              )}
              <View style={styles.receiptInfo}>
                <Text style={styles.receiptVendor}>
                  {receipt.vendor || 'Unknown Vendor'}
                </Text>
                <Text style={styles.receiptCategory}>
                  {CATEGORY_LABELS[receipt.category]}
                </Text>
                <View style={styles.receiptMeta}>
                  <Text style={styles.receiptDate}>
                    {format(new Date(receipt.date || receipt.createdAt), 'MMM d, yyyy')}
                  </Text>
                  {receipt.taxDeductible && (
                    <View style={styles.deductibleBadge}>
                      <Text style={styles.deductibleText}>Tax Deductible</Text>
                    </View>
                  )}
                </View>
              </View>
              <Text style={styles.receiptAmount}>
                ${(receipt.amount || 0).toFixed(2)}
              </Text>
            </TouchableOpacity>
          ))
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F1F5F9' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  title: { fontSize: 28, fontWeight: 'bold', color: '#1E293B' },
  addButton: {
    backgroundColor: '#10B981',
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: { flex: 1, paddingHorizontal: 20 },
  usageBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#EFF6FF',
    padding: 14,
    borderRadius: 12,
    marginBottom: 16,
  },
  usageBannerWarning: {
    backgroundColor: '#FEF3C7',
  },
  usageBannerDanger: {
    backgroundColor: '#FEE2E2',
  },
  usageBannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  usageBannerText: {
    fontSize: 14,
    color: '#1E40AF',
    fontWeight: '500',
  },
  usageBannerTextDanger: {
    color: '#DC2626',
  },
  usageBannerAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  usageBannerUpgrade: {
    fontSize: 14,
    color: '#3B82F6',
    fontWeight: '600',
  },
  summaryCard: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  summaryItem: { flex: 1, alignItems: 'center' },
  summaryLabel: { fontSize: 13, color: '#64748B' },
  summaryValue: { fontSize: 24, fontWeight: '700', color: '#1E293B', marginTop: 4 },
  summaryDivider: { width: 1, height: 40, backgroundColor: '#E2E8F0' },
  filters: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FFF',
  },
  filterActive: { backgroundColor: '#10B981' },
  filterText: { fontSize: 14, color: '#64748B' },
  filterTextActive: { color: '#FFF', fontWeight: '600' },
  receiptCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
  },
  receiptThumb: {
    width: 56,
    height: 56,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  receiptThumbPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  receiptInfo: { flex: 1, marginLeft: 12 },
  receiptVendor: { fontSize: 16, fontWeight: '600', color: '#1E293B' },
  receiptCategory: { fontSize: 13, color: '#64748B', marginTop: 2 },
  receiptMeta: { flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 8 },
  receiptDate: { fontSize: 12, color: '#94A3B8' },
  deductibleBadge: {
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  deductibleText: { fontSize: 10, color: '#059669', fontWeight: '600' },
  receiptAmount: { fontSize: 18, fontWeight: '700', color: '#1E293B' },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    backgroundColor: '#FFF',
    borderRadius: 16,
  },
  emptyText: { fontSize: 17, fontWeight: '600', color: '#64748B', marginTop: 12 },
  emptySubtext: { fontSize: 14, color: '#94A3B8', marginTop: 4, textAlign: 'center' },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10B981',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 20,
    gap: 8,
  },
  emptyButtonText: { color: '#FFF', fontSize: 16, fontWeight: '600' },
});
