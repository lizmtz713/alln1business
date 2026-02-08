import React from 'react';
import { 
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { useFeatureGate } from '../hooks/useFeatureGate';
import { useSubscription } from '../contexts/SubscriptionContext';

export function ProfileScreen({ navigation }: any) {
  const { user, logout } = useAuth();
  const { canExportData, canShareWithAccountant } = useFeatureGate();
  const { tier } = useSubscription();

  // Handle menu item press with feature gating
  const handleMenuPress = (screen: string) => {
    // Gate export feature
    if (screen === 'ExportData' && !canExportData) {
      navigation.navigate('Paywall', { source: 'feature_gate' });
      return;
    }
    // Gate accountant sharing (business only)
    if (screen === 'AccountantSharing' && !canShareWithAccountant) {
      navigation.navigate('Paywall', { source: 'feature_gate' });
      return;
    }
    navigation.navigate(screen);
  };

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign Out', style: 'destructive', onPress: logout }
      ]
    );
  };

  const menuItems = [
    { icon: 'business', label: 'Business Profile', screen: 'BusinessProfile', requiresPro: false },
    { icon: 'card', label: 'Digital Business Card', screen: 'BusinessCard', requiresPro: false },
    { icon: 'document-text', label: 'Invoice Templates', screen: 'InvoiceTemplates', requiresPro: false },
    { icon: 'cloud-upload', label: 'Export Data', screen: 'ExportData', requiresPro: true, proLabel: 'PRO' },
    { icon: 'link', label: 'Integrations', screen: 'Integrations', requiresPro: false },
    { icon: 'notifications', label: 'Notifications', screen: 'Notifications', requiresPro: false },
    { icon: 'lock-closed', label: 'Security', screen: 'Security', requiresPro: false },
    { icon: 'help-circle', label: 'Help & Support', screen: 'Support', requiresPro: false },
    { icon: 'information-circle', label: 'About Alln1', screen: 'About', requiresPro: false },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content}>
        <Text style={styles.title}>Settings</Text>

        {/* User Card */}
        <View style={styles.userCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user?.name?.charAt(0)?.toUpperCase() || '👤'}
            </Text>
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{user?.name}</Text>
            <Text style={styles.userBusiness}>{user?.businessName || 'Add business name'}</Text>
            <Text style={styles.userEmail}>{user?.email}</Text>
          </View>
          <TouchableOpacity style={styles.editButton}>
            <Ionicons name="pencil" size={18} color="#3B82F6" />
          </TouchableOpacity>
        </View>

        {/* Subscription Status */}
        <TouchableOpacity 
          style={styles.subscriptionCard}
          onPress={() => navigation.navigate('Paywall', { source: 'settings' })}
        >
          <View style={styles.subscriptionInfo}>
            <View style={[
              styles.tierBadge,
              tier === 'pro' && styles.tierBadgePro,
              tier === 'business' && styles.tierBadgeBusiness,
            ]}>
              <Text style={styles.tierBadgeText}>
                {tier.toUpperCase()}
              </Text>
            </View>
            <Text style={styles.subscriptionLabel}>
              {tier === 'free' ? 'Upgrade for unlimited access' : 'Manage subscription'}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#3B82F6" />
        </TouchableOpacity>

        {/* Menu Items */}
        <View style={styles.menu}>
          {menuItems.map((item, index) => (
            <TouchableOpacity 
              key={index}
              style={[
                styles.menuItem,
                index === menuItems.length - 1 && styles.menuItemLast
              ]}
              onPress={() => handleMenuPress(item.screen)}
            >
              <View style={styles.menuIcon}>
                <Ionicons name={item.icon as any} size={22} color="#3B82F6" />
              </View>
              <Text style={styles.menuLabel}>{item.label}</Text>
              <View style={styles.menuRight}>
                {item.requiresPro && !canExportData && (
                  <View style={styles.proBadge}>
                    <Ionicons name="lock-closed" size={10} color="#FFF" />
                    <Text style={styles.proBadgeText}>{item.proLabel}</Text>
                  </View>
                )}
                <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={22} color="#EF4444" />
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>

        <Text style={styles.version}>Alln1 Business v1.0.0</Text>
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F1F5F9' },
  content: { flex: 1, padding: 20 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#1E293B', marginBottom: 20 },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 20,
    borderRadius: 16,
    marginBottom: 24,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 28, color: '#FFF', fontWeight: '600' },
  userInfo: { flex: 1, marginLeft: 16 },
  userName: { fontSize: 20, fontWeight: '600', color: '#1E293B' },
  userBusiness: { fontSize: 14, color: '#3B82F6', marginTop: 2 },
  userEmail: { fontSize: 13, color: '#64748B', marginTop: 2 },
  editButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  menu: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    marginBottom: 24,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  menuItemLast: { borderBottomWidth: 0 },
  menuIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuLabel: { flex: 1, fontSize: 16, color: '#1E293B', marginLeft: 12 },
  menuRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  proBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3B82F6',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    gap: 4,
  },
  proBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFF',
  },
  subscriptionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#EFF6FF',
    padding: 16,
    borderRadius: 16,
    marginBottom: 24,
  },
  subscriptionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  tierBadge: {
    backgroundColor: '#64748B',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  tierBadgePro: {
    backgroundColor: '#3B82F6',
  },
  tierBadgeBusiness: {
    backgroundColor: '#7C3AED',
  },
  tierBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFF',
  },
  subscriptionLabel: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEE2E2',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  logoutText: { fontSize: 16, fontWeight: '600', color: '#EF4444' },
  version: { textAlign: 'center', color: '#94A3B8', marginTop: 24, fontSize: 13 },
});
