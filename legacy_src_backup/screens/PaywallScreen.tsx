import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useSubscription } from '../contexts/SubscriptionContext';
import { useFeatureUsage } from '../hooks/useFeatureGate';
import { SubscriptionTier } from '../services/subscriptionService';

const { width } = Dimensions.get('window');

// ===========================================
// TYPES
// ===========================================

interface PlanFeature {
  text: string;
  included: boolean;
  highlight?: boolean;
}

interface PlanConfig {
  name: string;
  tier: SubscriptionTier;
  price: string;
  period: string;
  tagline: string;
  features: PlanFeature[];
  color: string;
  gradientColors: [string, string];
  popular?: boolean;
}

// ===========================================
// PLAN CONFIGURATIONS
// ===========================================

const PLANS: PlanConfig[] = [
  {
    name: 'Free',
    tier: 'free',
    price: '$0',
    period: 'forever',
    tagline: 'Get started with basics',
    color: '#64748B',
    gradientColors: ['#64748B', '#475569'],
    features: [
      { text: 'Basic expense tracking', included: true },
      { text: '10 receipts per month', included: true },
      { text: '3 AI chats per day', included: true },
      { text: 'Document storage', included: true },
      { text: 'Bill reminders', included: true },
      { text: 'Unlimited receipts', included: false },
      { text: 'Full AI CFO assistant', included: false },
      { text: 'Tax insights & deductions', included: false },
      { text: 'Export data', included: false },
      { text: 'Multi-business support', included: false },
    ],
  },
  {
    name: 'Pro',
    tier: 'pro',
    price: '$9.99',
    period: 'per month',
    tagline: 'For serious business owners',
    color: '#3B82F6',
    gradientColors: ['#3B82F6', '#1D4ED8'],
    popular: true,
    features: [
      { text: 'Everything in Free', included: true },
      { text: 'Unlimited receipts', included: true, highlight: true },
      { text: 'Full AI CFO assistant', included: true, highlight: true },
      { text: 'Tax insights & deductions', included: true, highlight: true },
      { text: 'Export data (CSV, PDF)', included: true },
      { text: 'Priority support', included: true },
      { text: 'Multi-business support', included: false },
      { text: 'Accountant sharing', included: false },
    ],
  },
  {
    name: 'Business',
    tier: 'business',
    price: '$19.99',
    period: 'per month',
    tagline: 'Scale without limits',
    color: '#7C3AED',
    gradientColors: ['#7C3AED', '#5B21B6'],
    features: [
      { text: 'Everything in Pro', included: true },
      { text: 'Multi-business support', included: true, highlight: true },
      { text: 'Accountant sharing', included: true, highlight: true },
      { text: 'Advanced reports', included: true },
      { text: 'Team collaboration', included: true },
      { text: 'API access', included: true },
      { text: 'Dedicated support', included: true },
    ],
  },
];

// ===========================================
// COMPONENT
// ===========================================

export function PaywallScreen() {
  const navigation = useNavigation();
  const {
    tier: currentTier,
    isLoading,
    proPackage,
    businessPackage,
    purchasePro,
    purchaseBusiness,
    restore,
  } = useSubscription();
  
  const { getReceiptUsage, getAIChatUsage } = useFeatureUsage();
  
  const [selectedTier, setSelectedTier] = useState<SubscriptionTier>('pro');
  const [processingPurchase, setProcessingPurchase] = useState(false);
  const [usageInfo, setUsageInfo] = useState({ receipts: 0, aiChats: 0 });

  // Load usage info
  useEffect(() => {
    const loadUsage = async () => {
      const [receipts, aiChats] = await Promise.all([
        getReceiptUsage(),
        getAIChatUsage(),
      ]);
      setUsageInfo({
        receipts: receipts.used,
        aiChats: aiChats.used,
      });
    };
    loadUsage();
  }, []);

  // Handle purchase
  const handlePurchase = async () => {
    if (selectedTier === 'free' || selectedTier === currentTier) {
      navigation.goBack();
      return;
    }

    setProcessingPurchase(true);
    try {
      let success = false;
      if (selectedTier === 'pro') {
        success = await purchasePro();
      } else if (selectedTier === 'business') {
        success = await purchaseBusiness();
      }
      
      if (success) {
        navigation.goBack();
      }
    } finally {
      setProcessingPurchase(false);
    }
  };

  // Handle restore
  const handleRestore = async () => {
    setProcessingPurchase(true);
    try {
      await restore();
    } finally {
      setProcessingPurchase(false);
    }
  };

  const selectedPlan = PLANS.find(p => p.tier === selectedTier)!;
  const isCurrentPlan = selectedTier === currentTier;
  const isUpgrade = PLANS.findIndex(p => p.tier === selectedTier) > PLANS.findIndex(p => p.tier === currentTier);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Loading plans...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="close" size={28} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Upgrade Your Plan</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Current Plan Badge */}
        <View style={styles.currentPlanBadge}>
          <Ionicons name="sparkles" size={16} color="#3B82F6" />
          <Text style={styles.currentPlanText}>
            Current plan: <Text style={styles.currentPlanName}>{currentTier.charAt(0).toUpperCase() + currentTier.slice(1)}</Text>
          </Text>
        </View>

        {/* Usage Stats (for free users) */}
        {currentTier === 'free' && (
          <View style={styles.usageContainer}>
            <View style={styles.usageItem}>
              <Text style={styles.usageLabel}>Receipts this month</Text>
              <Text style={styles.usageValue}>{usageInfo.receipts}/10</Text>
            </View>
            <View style={styles.usageDivider} />
            <View style={styles.usageItem}>
              <Text style={styles.usageLabel}>AI chats today</Text>
              <Text style={styles.usageValue}>{usageInfo.aiChats}/3</Text>
            </View>
          </View>
        )}

        {/* Plan Cards */}
        <View style={styles.plansContainer}>
          {PLANS.map((plan) => (
            <TouchableOpacity
              key={plan.tier}
              style={[
                styles.planCard,
                selectedTier === plan.tier && styles.planCardSelected,
                plan.popular && styles.planCardPopular,
              ]}
              onPress={() => setSelectedTier(plan.tier)}
              activeOpacity={0.8}
            >
              {plan.popular && (
                <View style={styles.popularBadge}>
                  <Text style={styles.popularBadgeText}>MOST POPULAR</Text>
                </View>
              )}
              
              <LinearGradient
                colors={selectedTier === plan.tier ? plan.gradientColors : ['#F8FAFC', '#F1F5F9']}
                style={styles.planCardGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View style={styles.planHeader}>
                  <Text style={[
                    styles.planName,
                    selectedTier === plan.tier && styles.planNameSelected
                  ]}>
                    {plan.name}
                  </Text>
                  <View style={styles.planPriceContainer}>
                    <Text style={[
                      styles.planPrice,
                      selectedTier === plan.tier && styles.planPriceSelected
                    ]}>
                      {plan.price}
                    </Text>
                    <Text style={[
                      styles.planPeriod,
                      selectedTier === plan.tier && styles.planPeriodSelected
                    ]}>
                      /{plan.period}
                    </Text>
                  </View>
                </View>
                
                {currentTier === plan.tier && (
                  <View style={styles.currentBadge}>
                    <Ionicons name="checkmark-circle" size={14} color="#10B981" />
                    <Text style={styles.currentBadgeText}>Current</Text>
                  </View>
                )}
              </LinearGradient>
            </TouchableOpacity>
          ))}
        </View>

        {/* Feature List */}
        <View style={styles.featuresContainer}>
          <Text style={styles.featuresTitle}>
            {selectedPlan.name} includes:
          </Text>
          {selectedPlan.features.map((feature, index) => (
            <View
              key={index}
              style={[
                styles.featureRow,
                feature.highlight && styles.featureRowHighlight,
              ]}
            >
              <Ionicons
                name={feature.included ? 'checkmark-circle' : 'close-circle'}
                size={20}
                color={feature.included ? '#10B981' : '#CBD5E1'}
              />
              <Text style={[
                styles.featureText,
                !feature.included && styles.featureTextDisabled,
                feature.highlight && styles.featureTextHighlight,
              ]}>
                {feature.text}
              </Text>
              {feature.highlight && (
                <View style={styles.newBadge}>
                  <Text style={styles.newBadgeText}>NEW</Text>
                </View>
              )}
            </View>
          ))}
        </View>

        {/* CTA Button */}
        <TouchableOpacity
          style={[
            styles.ctaButton,
            { backgroundColor: selectedPlan.color },
            (isCurrentPlan || processingPurchase) && styles.ctaButtonDisabled,
          ]}
          onPress={handlePurchase}
          disabled={processingPurchase}
        >
          {processingPurchase ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.ctaButtonText}>
              {isCurrentPlan
                ? 'Current Plan'
                : isUpgrade
                ? `Upgrade to ${selectedPlan.name}`
                : 'Continue'}
            </Text>
          )}
        </TouchableOpacity>

        {/* Restore Purchases */}
        <TouchableOpacity
          style={styles.restoreButton}
          onPress={handleRestore}
          disabled={processingPurchase}
        >
          <Text style={styles.restoreButtonText}>Restore Purchases</Text>
        </TouchableOpacity>

        {/* Terms */}
        <Text style={styles.termsText}>
          By subscribing, you agree to our Terms of Service and Privacy Policy.
          Subscriptions automatically renew unless cancelled at least 24 hours
          before the end of the current period.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

// ===========================================
// STYLES
// ===========================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#64748B',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  closeButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
  },
  headerSpacer: {
    width: 36,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  currentPlanBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EFF6FF',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    alignSelf: 'center',
    marginBottom: 20,
  },
  currentPlanText: {
    fontSize: 14,
    color: '#64748B',
    marginLeft: 6,
  },
  currentPlanName: {
    fontWeight: '600',
    color: '#3B82F6',
  },
  usageContainer: {
    flexDirection: 'row',
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  usageItem: {
    flex: 1,
    alignItems: 'center',
  },
  usageLabel: {
    fontSize: 12,
    color: '#92400E',
    marginBottom: 4,
  },
  usageValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#B45309',
  },
  usageDivider: {
    width: 1,
    backgroundColor: '#FCD34D',
    marginHorizontal: 16,
  },
  plansContainer: {
    marginBottom: 24,
  },
  planCard: {
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
  },
  planCardSelected: {
    borderColor: '#3B82F6',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  planCardPopular: {
    borderColor: '#3B82F6',
  },
  popularBadge: {
    position: 'absolute',
    top: 0,
    right: 16,
    backgroundColor: '#3B82F6',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    zIndex: 1,
  },
  popularBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  planCardGradient: {
    padding: 20,
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  planName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
  },
  planNameSelected: {
    color: '#FFFFFF',
  },
  planPriceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  planPrice: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1E293B',
  },
  planPriceSelected: {
    color: '#FFFFFF',
  },
  planPeriod: {
    fontSize: 14,
    color: '#64748B',
    marginLeft: 4,
  },
  planPeriodSelected: {
    color: 'rgba(255,255,255,0.8)',
  },
  currentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  currentBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#10B981',
    marginLeft: 4,
  },
  featuresContainer: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  featuresTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 16,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  featureRowHighlight: {
    backgroundColor: '#EFF6FF',
    marginHorizontal: -12,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderBottomWidth: 0,
    marginBottom: 4,
  },
  featureText: {
    flex: 1,
    fontSize: 15,
    color: '#1E293B',
    marginLeft: 12,
  },
  featureTextDisabled: {
    color: '#94A3B8',
    textDecorationLine: 'line-through',
  },
  featureTextHighlight: {
    fontWeight: '600',
    color: '#1E40AF',
  },
  newBadge: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  newBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  ctaButton: {
    borderRadius: 14,
    paddingVertical: 18,
    alignItems: 'center',
    marginBottom: 16,
  },
  ctaButtonDisabled: {
    opacity: 0.6,
  },
  ctaButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  restoreButton: {
    alignItems: 'center',
    paddingVertical: 12,
    marginBottom: 16,
  },
  restoreButtonText: {
    fontSize: 14,
    color: '#3B82F6',
    fontWeight: '500',
  },
  termsText: {
    fontSize: 11,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 16,
  },
});
