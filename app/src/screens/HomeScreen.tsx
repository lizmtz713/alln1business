import React, { useEffect, useState } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';
import { format, isAfter, isBefore, addDays, startOfMonth, endOfMonth, getDate } from 'date-fns';
import { calculateTaxReadiness, generateInsights } from '../services/aiService';

export function HomeScreen({ navigation }: any) {
  const { user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [taxReadiness, setTaxReadiness] = useState({ score: 0, grade: 'F' as const });
  const [insights, setInsights] = useState<any[]>([]);
  const [stats, setStats] = useState({
    documentsCount: 0,
    upcomingBills: 0,
    billsTotal: 0,
    receiptsThisMonth: 0,
    receiptsTotal: 0,
    pendingInvoices: 0,
    totalDeductions: 0,
  });
  const [upcomingBills, setUpcomingBills] = useState<any[]>([]);

  useEffect(() => {
    fetchDashboardData();
  }, [user]);

  const fetchDashboardData = async () => {
    if (!user) return;
    
    try {
      // Fetch documents
      const docsQuery = query(collection(db, 'documents'), where('userId', '==', user.id));
      const docsSnap = await getDocs(docsQuery);
      const documents = docsSnap.docs.map(d => d.data());
      
      // Fetch bills
      const billsQuery = query(collection(db, 'bills'), where('userId', '==', user.id));
      const billsSnap = await getDocs(billsQuery);
      const bills = billsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      
      // Fetch receipts
      const receiptsQuery = query(collection(db, 'receipts'), where('userId', '==', user.id));
      const receiptsSnap = await getDocs(receiptsQuery);
      const receipts = receiptsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      
      // Calculate stats
      const today = getDate(new Date());
      const upcoming = bills.filter((b: any) => {
        const daysUntil = b.dueDay >= today ? b.dueDay - today : (30 - today) + b.dueDay;
        return daysUntil <= 7;
      });
      
      const thisMonth = receipts.filter((r: any) => {
        const receiptDate = new Date(r.createdAt?.toDate?.() || r.createdAt);
        return receiptDate >= startOfMonth(new Date()) && receiptDate <= endOfMonth(new Date());
      });
      
      const deductibleTotal = receipts
        .filter((r: any) => r.taxDeductible)
        .reduce((sum: number, r: any) => sum + (r.amount || 0), 0);
      
      setStats({
        documentsCount: documents.length,
        upcomingBills: upcoming.length,
        billsTotal: bills.reduce((sum: number, b: any) => sum + (b.amount || 0), 0),
        receiptsThisMonth: thisMonth.length,
        receiptsTotal: receipts.reduce((sum: number, r: any) => sum + (r.amount || 0), 0),
        pendingInvoices: 0,
        totalDeductions: deductibleTotal,
      });
      
      setUpcomingBills(upcoming.slice(0, 3));
      
      // Calculate tax readiness
      const hasW9 = documents.some((d: any) => d.type === 'w9');
      const hasInsurance = documents.some((d: any) => d.type === 'insurance');
      const categorized = receipts.filter((r: any) => r.category && r.category !== 'other').length;
      
      const readiness = calculateTaxReadiness(
        documents.length,
        receipts.length,
        categorized,
        6, // placeholder for months with receipts
        hasW9,
        hasInsurance,
        deductibleTotal
      );
      
      setTaxReadiness({ score: readiness.score, grade: readiness.grade });
      
      // Generate insights
      const newInsights = generateInsights(
        receipts as any,
        stats.receiptsTotal * 0.8, // placeholder
        stats.receiptsTotal,
        3, // placeholder streak
        receipts.filter((r: any) => !r.category || r.category === 'other').length
      );
      setInsights(newInsights);
      
    } catch (error) {
      console.error('Error fetching dashboard:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchDashboardData();
    setRefreshing(false);
  };

  const quickActions = [
    { icon: 'camera', label: 'Scan Receipt', screen: 'AddReceipt', color: '#10B981' },
    { icon: 'add-circle', label: 'Add Bill', screen: 'AddBill', color: '#F59E0B' },
    { icon: 'document-attach', label: 'Upload Doc', screen: 'AddDocument', color: '#3B82F6' },
    { icon: 'chatbubbles', label: 'Ask AI', screen: 'AIChat', color: '#8B5CF6' },
  ];

  const gradeColors: Record<string, string> = {
    A: '#10B981',
    B: '#22C55E', 
    C: '#F59E0B',
    D: '#EF4444',
    F: '#DC2626',
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <LinearGradient
          colors={['#1E3A8A', '#3B82F6']}
          style={styles.header}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.greeting}>
                {getGreeting()}, {user?.name?.split(' ')[0] || 'there'}! 👋
              </Text>
              <Text style={styles.businessName}>
                {user?.businessName || 'Your Business'}
              </Text>
            </View>
            <TouchableOpacity 
              style={styles.profileButton}
              onPress={() => navigation.navigate('Profile')}
            >
              <Ionicons name="person-circle" size={40} color="#FFF" />
            </TouchableOpacity>
          </View>

          {/* Tax Readiness Score */}
          <TouchableOpacity 
            style={styles.taxReadinessCard}
            onPress={() => navigation.navigate('TaxReadiness')}
          >
            <View style={styles.taxReadinessLeft}>
              <Text style={styles.taxReadinessLabel}>Tax Readiness Score</Text>
              <View style={styles.taxReadinessProgress}>
                <View style={[styles.taxReadinessBar, { width: `${taxReadiness.score}%` }]} />
              </View>
              <Text style={styles.taxReadinessHint}>
                {taxReadiness.score < 50 
                  ? 'Add receipts & docs to improve'
                  : taxReadiness.score < 80
                  ? 'Good progress! Keep going'
                  : 'Great job! You\'re tax ready'}
              </Text>
            </View>
            <View style={[styles.gradeCircle, { backgroundColor: gradeColors[taxReadiness.grade] }]}>
              <Text style={styles.gradeText}>{taxReadiness.grade}</Text>
              <Text style={styles.scoreText}>{taxReadiness.score}%</Text>
            </View>
          </TouchableOpacity>
        </LinearGradient>

        {/* Quick Actions */}
        <View style={styles.quickActionsContainer}>
          {quickActions.map((action, index) => (
            <TouchableOpacity
              key={index}
              style={styles.quickAction}
              onPress={() => navigation.navigate(action.screen)}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: action.color }]}>
                <Ionicons name={action.icon as any} size={22} color="#FFF" />
              </View>
              <Text style={styles.quickActionLabel}>{action.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Insights / Alerts */}
        {insights.length > 0 && (
          <View style={styles.insightsSection}>
            <Text style={styles.sectionTitle}>💡 Insights</Text>
            {insights.slice(0, 2).map((insight, index) => (
              <TouchableOpacity 
                key={index}
                style={[
                  styles.insightCard,
                  insight.type === 'warning' && styles.insightWarning,
                  insight.type === 'achievement' && styles.insightAchievement,
                ]}
                onPress={() => insight.actionScreen && navigation.navigate(insight.actionScreen)}
              >
                <View style={styles.insightContent}>
                  <Text style={styles.insightTitle}>{insight.title}</Text>
                  <Text style={styles.insightMessage}>{insight.message}</Text>
                </View>
                {insight.action && (
                  <Ionicons name="chevron-forward" size={20} color="#64748B" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Deductions Highlight */}
        {stats.totalDeductions > 0 && (
          <TouchableOpacity 
            style={styles.deductionsCard}
            onPress={() => navigation.navigate('Receipts')}
          >
            <LinearGradient
              colors={['#10B981', '#059669']}
              style={styles.deductionsGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Ionicons name="trending-up" size={32} color="#FFF" />
              <View style={styles.deductionsText}>
                <Text style={styles.deductionsLabel}>Potential Tax Deductions</Text>
                <Text style={styles.deductionsAmount}>
                  ${stats.totalDeductions.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color="rgba(255,255,255,0.7)" />
            </LinearGradient>
          </TouchableOpacity>
        )}

        {/* Upcoming Bills */}
        {upcomingBills.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>⚠️ Bills Due Soon</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Bills')}>
                <Text style={styles.seeAll}>See All</Text>
              </TouchableOpacity>
            </View>
            {upcomingBills.map((bill: any) => (
              <View key={bill.id} style={styles.billCard}>
                <View style={styles.billIcon}>
                  <Ionicons name="calendar" size={20} color="#F59E0B" />
                </View>
                <View style={styles.billInfo}>
                  <Text style={styles.billName}>{bill.name}</Text>
                  <Text style={styles.billDue}>Due {bill.dueDay}{getOrdinal(bill.dueDay)}</Text>
                </View>
                <Text style={styles.billAmount}>
                  ${bill.amount?.toFixed(2) || '—'}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Stats Overview */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📊 This Month</Text>
          <View style={styles.statsGrid}>
            <TouchableOpacity 
              style={styles.statCard}
              onPress={() => navigation.navigate('Receipts')}
            >
              <Ionicons name="receipt" size={24} color="#10B981" />
              <Text style={styles.statNumber}>{stats.receiptsThisMonth}</Text>
              <Text style={styles.statLabel}>Receipts</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.statCard}
              onPress={() => navigation.navigate('Bills')}
            >
              <Ionicons name="wallet" size={24} color="#F59E0B" />
              <Text style={styles.statNumber}>
                ${stats.billsTotal > 999 
                  ? `${(stats.billsTotal / 1000).toFixed(1)}k`
                  : stats.billsTotal.toFixed(0)}
              </Text>
              <Text style={styles.statLabel}>Monthly Bills</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.statCard}
              onPress={() => navigation.navigate('Documents')}
            >
              <Ionicons name="folder" size={24} color="#3B82F6" />
              <Text style={styles.statNumber}>{stats.documentsCount}</Text>
              <Text style={styles.statLabel}>Documents</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* AI Assistant CTA */}
        <TouchableOpacity 
          style={styles.aiCta}
          onPress={() => navigation.navigate('AIChat')}
        >
          <LinearGradient
            colors={['#8B5CF6', '#6366F1']}
            style={styles.aiCtaGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Text style={styles.aiCtaEmoji}>🤖</Text>
            <View style={styles.aiCtaText}>
              <Text style={styles.aiCtaTitle}>Got a tax question?</Text>
              <Text style={styles.aiCtaDesc}>
                Ask our AI — "Is my phone bill deductible?"
              </Text>
            </View>
            <Ionicons name="arrow-forward-circle" size={32} color="#FFF" />
          </LinearGradient>
        </TouchableOpacity>

        {/* Empty State for New Users */}
        {stats.documentsCount === 0 && stats.receiptsThisMonth === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>🚀</Text>
            <Text style={styles.emptyTitle}>Let's get started!</Text>
            <Text style={styles.emptyText}>
              Add your first receipt or document to begin tracking your business expenses.
            </Text>
            <TouchableOpacity 
              style={styles.emptyButton}
              onPress={() => navigation.navigate('AddReceipt')}
            >
              <Ionicons name="camera" size={20} color="#FFF" />
              <Text style={styles.emptyButtonText}>Scan First Receipt</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function getOrdinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return s[(v - 20) % 10] || s[v] || s[0];
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F1F5F9' },
  content: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 24,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  greeting: { fontSize: 15, color: 'rgba(255,255,255,0.9)' },
  businessName: { fontSize: 22, fontWeight: '700', color: '#FFF', marginTop: 2 },
  profileButton: {},
  taxReadinessCard: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  taxReadinessLeft: { flex: 1 },
  taxReadinessLabel: { fontSize: 13, color: 'rgba(255,255,255,0.9)', marginBottom: 8 },
  taxReadinessProgress: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 3,
    marginBottom: 6,
  },
  taxReadinessBar: {
    height: 6,
    backgroundColor: '#FFF',
    borderRadius: 3,
  },
  taxReadinessHint: { fontSize: 11, color: 'rgba(255,255,255,0.7)' },
  gradeCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 16,
  },
  gradeText: { fontSize: 22, fontWeight: '800', color: '#FFF' },
  scoreText: { fontSize: 10, color: 'rgba(255,255,255,0.9)' },
  quickActionsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    marginTop: -20,
    marginBottom: 20,
  },
  quickAction: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#FFF',
    marginHorizontal: 4,
    paddingVertical: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  quickActionIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  quickActionLabel: { fontSize: 11, color: '#64748B', textAlign: 'center' },
  insightsSection: { paddingHorizontal: 20, marginBottom: 20 },
  sectionTitle: { fontSize: 17, fontWeight: '600', color: '#1E293B', marginBottom: 12 },
  insightCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 14,
    borderRadius: 12,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
  },
  insightWarning: { borderLeftColor: '#F59E0B', backgroundColor: '#FFFBEB' },
  insightAchievement: { borderLeftColor: '#10B981', backgroundColor: '#ECFDF5' },
  insightContent: { flex: 1 },
  insightTitle: { fontSize: 15, fontWeight: '600', color: '#1E293B' },
  insightMessage: { fontSize: 13, color: '#64748B', marginTop: 2 },
  deductionsCard: { marginHorizontal: 20, marginBottom: 20, borderRadius: 16, overflow: 'hidden' },
  deductionsGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
  },
  deductionsText: { flex: 1, marginLeft: 16 },
  deductionsLabel: { fontSize: 13, color: 'rgba(255,255,255,0.9)' },
  deductionsAmount: { fontSize: 28, fontWeight: '700', color: '#FFF' },
  section: { paddingHorizontal: 20, marginBottom: 20 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  seeAll: { fontSize: 14, color: '#3B82F6', fontWeight: '500' },
  billCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 14,
    borderRadius: 12,
    marginBottom: 10,
  },
  billIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  billInfo: { flex: 1, marginLeft: 12 },
  billName: { fontSize: 15, fontWeight: '500', color: '#1E293B' },
  billDue: { fontSize: 13, color: '#F59E0B', marginTop: 2 },
  billAmount: { fontSize: 17, fontWeight: '600', color: '#1E293B' },
  statsGrid: { flexDirection: 'row', gap: 12 },
  statCard: {
    flex: 1,
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  statNumber: { fontSize: 24, fontWeight: '700', color: '#1E293B', marginTop: 8 },
  statLabel: { fontSize: 12, color: '#64748B', marginTop: 4 },
  aiCta: { marginHorizontal: 20, marginBottom: 20, borderRadius: 16, overflow: 'hidden' },
  aiCtaGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
  },
  aiCtaEmoji: { fontSize: 32 },
  aiCtaText: { flex: 1, marginLeft: 14 },
  aiCtaTitle: { fontSize: 16, fontWeight: '600', color: '#FFF' },
  aiCtaDesc: { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  emptyState: {
    margin: 20,
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
  },
  emptyEmoji: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontWeight: '600', color: '#1E293B' },
  emptyText: { fontSize: 14, color: '#64748B', textAlign: 'center', marginTop: 8, lineHeight: 20 },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10B981',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 20,
    gap: 8,
  },
  emptyButtonText: { color: '#FFF', fontSize: 16, fontWeight: '600' },
});
