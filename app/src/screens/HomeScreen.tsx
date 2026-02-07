import React, { useEffect, useState } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { format, isAfter, isBefore, addDays } from 'date-fns';

export function HomeScreen({ navigation }: any) {
  const { user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    documentsCount: 0,
    upcomingBills: 0,
    receiptsThisMonth: 0,
    pendingInvoices: 0,
  });

  const onRefresh = async () => {
    setRefreshing(true);
    // TODO: Fetch real stats
    setRefreshing(false);
  };

  const quickActions = [
    { icon: 'document-text', label: 'Add Document', screen: 'AddDocument', color: '#3B82F6' },
    { icon: 'receipt', label: 'Scan Receipt', screen: 'AddReceipt', color: '#10B981' },
    { icon: 'cash', label: 'Add Bill', screen: 'AddBill', color: '#F59E0B' },
    { icon: 'chatbubbles', label: 'Ask AI', screen: 'AIChat', color: '#8B5CF6' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Header */}
        <LinearGradient
          colors={['#1E3A8A', '#3B82F6']}
          style={styles.header}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.headerContent}>
            <Text style={styles.greeting}>
              Hey, {user?.name?.split(' ')[0] || 'there'}! 👋
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
        </LinearGradient>

        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickActions}>
          {quickActions.map((action, index) => (
            <TouchableOpacity
              key={index}
              style={styles.quickAction}
              onPress={() => navigation.navigate(action.screen)}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: action.color }]}>
                <Ionicons name={action.icon as any} size={24} color="#FFF" />
              </View>
              <Text style={styles.quickActionLabel}>{action.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Stats Cards */}
        <Text style={styles.sectionTitle}>Overview</Text>
        <View style={styles.statsGrid}>
          <TouchableOpacity 
            style={styles.statCard}
            onPress={() => navigation.navigate('Documents')}
          >
            <Ionicons name="folder-open" size={28} color="#3B82F6" />
            <Text style={styles.statNumber}>{stats.documentsCount}</Text>
            <Text style={styles.statLabel}>Documents</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.statCard}
            onPress={() => navigation.navigate('Bills')}
          >
            <Ionicons name="calendar" size={28} color="#F59E0B" />
            <Text style={styles.statNumber}>{stats.upcomingBills}</Text>
            <Text style={styles.statLabel}>Bills Due Soon</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.statCard}
            onPress={() => navigation.navigate('Receipts')}
          >
            <Ionicons name="receipt" size={28} color="#10B981" />
            <Text style={styles.statNumber}>{stats.receiptsThisMonth}</Text>
            <Text style={styles.statLabel}>Receipts (Month)</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.statCard]}
            onPress={() => navigation.navigate('Invoices')}
          >
            <Ionicons name="document-text" size={28} color="#8B5CF6" />
            <Text style={styles.statNumber}>{stats.pendingInvoices}</Text>
            <Text style={styles.statLabel}>Open Invoices</Text>
          </TouchableOpacity>
        </View>

        {/* AI Assistant Promo */}
        <TouchableOpacity 
          style={styles.aiPromo}
          onPress={() => navigation.navigate('AIChat')}
        >
          <LinearGradient
            colors={['#8B5CF6', '#6366F1']}
            style={styles.aiPromoGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <View style={styles.aiPromoContent}>
              <Text style={styles.aiPromoEmoji}>🤖</Text>
              <View style={styles.aiPromoText}>
                <Text style={styles.aiPromoTitle}>AI Business Assistant</Text>
                <Text style={styles.aiPromoDesc}>
                  Ask about taxes, deductions, bookkeeping & more
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#FFF" />
          </LinearGradient>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F1F5F9' },
  content: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerContent: { flex: 1 },
  greeting: { fontSize: 16, color: 'rgba(255,255,255,0.9)' },
  businessName: { fontSize: 24, fontWeight: '700', color: '#FFF', marginTop: 4 },
  profileButton: { marginLeft: 16 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
    marginHorizontal: 20,
    marginTop: 24,
    marginBottom: 12,
  },
  quickActions: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    gap: 8,
  },
  quickAction: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 16,
    marginHorizontal: 4,
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  quickActionLabel: { fontSize: 12, color: '#64748B', textAlign: 'center' },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
  },
  statNumber: { fontSize: 32, fontWeight: '700', color: '#1E293B', marginTop: 8 },
  statLabel: { fontSize: 13, color: '#64748B', marginTop: 4 },
  aiPromo: { marginHorizontal: 20, marginTop: 24, borderRadius: 16, overflow: 'hidden' },
  aiPromoGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
  },
  aiPromoContent: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  aiPromoEmoji: { fontSize: 36, marginRight: 16 },
  aiPromoText: { flex: 1 },
  aiPromoTitle: { fontSize: 18, fontWeight: '600', color: '#FFF' },
  aiPromoDesc: { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
});
