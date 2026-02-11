import React, { useEffect, useState } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, TouchableOpacity
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../contexts/AuthContext';
import { Bill, BillCategory } from '../types';
import { format, getDate, isAfter, isBefore, addDays, startOfMonth, endOfMonth } from 'date-fns';

const CATEGORY_ICONS: Record<BillCategory, { icon: string; color: string }> = {
  utilities: { icon: 'flash', color: '#F59E0B' },
  rent: { icon: 'home', color: '#3B82F6' },
  insurance: { icon: 'shield', color: '#10B981' },
  subscriptions: { icon: 'refresh', color: '#8B5CF6' },
  supplies: { icon: 'cube', color: '#EC4899' },
  services: { icon: 'construct', color: '#6366F1' },
  taxes: { icon: 'receipt', color: '#EF4444' },
  other: { icon: 'ellipsis-horizontal', color: '#64748B' },
};

export function BillsScreen({ navigation }: any) {
  const { user } = useAuth();
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBills();
  }, [user]);

  const fetchBills = async () => {
    if (!user) return;
    try {
      const q = query(
        collection(db, 'bills'),
        where('userId', '==', user.id),
        orderBy('dueDay', 'asc')
      );
      const snapshot = await getDocs(q);
      setBills(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Bill)));
    } catch (error) {
      console.error('Error fetching bills:', error);
    } finally {
      setLoading(false);
    }
  };

  const today = new Date();
  const currentDay = getDate(today);

  const upcomingBills = bills.filter(b => {
    const daysUntilDue = b.dueDay >= currentDay 
      ? b.dueDay - currentDay 
      : (30 - currentDay) + b.dueDay;
    return daysUntilDue <= 7;
  });

  const totalMonthly = bills.reduce((sum, b) => sum + (b.amount || 0), 0);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Bills</Text>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => navigation.navigate('AddBill')}
        >
          <Ionicons name="add" size={24} color="#FFF" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* Summary Card */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Monthly Total</Text>
              <Text style={styles.summaryValue}>
                ${totalMonthly.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Due This Week</Text>
              <Text style={[styles.summaryValue, { color: '#F59E0B' }]}>
                {upcomingBills.length}
              </Text>
            </View>
          </View>
        </View>

        {/* Upcoming Bills */}
        {upcomingBills.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>⚠️ Due Soon</Text>
            {upcomingBills.map((bill) => (
              <BillCard 
                key={bill.id} 
                bill={bill} 
                currentDay={currentDay}
                onPress={() => navigation.navigate('BillDetail', { bill })}
              />
            ))}
          </>
        )}

        {/* All Bills */}
        <Text style={styles.sectionTitle}>All Bills ({bills.length})</Text>
        {bills.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="receipt-outline" size={48} color="#CBD5E1" />
            <Text style={styles.emptyText}>No bills tracked yet</Text>
            <Text style={styles.emptySubtext}>Add your recurring bills to stay on top of payments</Text>
          </View>
        ) : (
          bills.map((bill) => (
            <BillCard 
              key={bill.id} 
              bill={bill} 
              currentDay={currentDay}
              onPress={() => navigation.navigate('BillDetail', { bill })}
            />
          ))
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function BillCard({ bill, currentDay, onPress }: { bill: Bill; currentDay: number; onPress: () => void }) {
  const categoryStyle = CATEGORY_ICONS[bill.category] || CATEGORY_ICONS.other;
  const daysUntilDue = bill.dueDay >= currentDay 
    ? bill.dueDay - currentDay 
    : (30 - currentDay) + bill.dueDay;
  
  const isUrgent = daysUntilDue <= 3;

  return (
    <TouchableOpacity style={styles.billCard} onPress={onPress}>
      <View style={[styles.billIcon, { backgroundColor: categoryStyle.color }]}>
        <Ionicons name={categoryStyle.icon as any} size={22} color="#FFF" />
      </View>
      <View style={styles.billInfo}>
        <Text style={styles.billName}>{bill.name}</Text>
        <Text style={styles.billCompany}>{bill.companyName}</Text>
      </View>
      <View style={styles.billRight}>
        {bill.amount && (
          <Text style={styles.billAmount}>${bill.amount.toFixed(2)}</Text>
        )}
        <Text style={[styles.billDue, isUrgent && styles.billDueUrgent]}>
          Due {bill.dueDay}{getOrdinal(bill.dueDay)}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

function getOrdinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return s[(v - 20) % 10] || s[v] || s[0];
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
    backgroundColor: '#F59E0B',
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: { flex: 1, paddingHorizontal: 20 },
  summaryCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  summaryRow: { flexDirection: 'row', alignItems: 'center' },
  summaryItem: { flex: 1, alignItems: 'center' },
  summaryLabel: { fontSize: 13, color: '#64748B' },
  summaryValue: { fontSize: 28, fontWeight: '700', color: '#1E293B', marginTop: 4 },
  summaryDivider: { width: 1, height: 40, backgroundColor: '#E2E8F0' },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: '#1E293B', marginBottom: 12 },
  billCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  billIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  billInfo: { flex: 1, marginLeft: 14 },
  billName: { fontSize: 16, fontWeight: '600', color: '#1E293B' },
  billCompany: { fontSize: 13, color: '#64748B', marginTop: 2 },
  billRight: { alignItems: 'flex-end' },
  billAmount: { fontSize: 16, fontWeight: '600', color: '#1E293B' },
  billDue: { fontSize: 12, color: '#64748B', marginTop: 2 },
  billDueUrgent: { color: '#EF4444', fontWeight: '600' },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    backgroundColor: '#FFF',
    borderRadius: 16,
  },
  emptyText: { fontSize: 17, fontWeight: '600', color: '#64748B', marginTop: 12 },
  emptySubtext: { fontSize: 14, color: '#94A3B8', marginTop: 4, textAlign: 'center', paddingHorizontal: 20 },
});
