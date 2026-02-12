import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { Alert } from 'react-native';
import { PurchasesPackage } from 'react-native-purchases';
import {
  subscriptionService,
  SubscriptionTier,
  SubscriptionStatus,
  SubscriptionPackage,
  PRODUCTS,
} from '../services/subscriptionService';
import { useAuth } from './AuthContext';

// ===========================================
// TYPES
// ===========================================

interface SubscriptionContextType {
  // Subscription state
  tier: SubscriptionTier;
  isLoading: boolean;
  isPro: boolean;
  isBusiness: boolean;
  subscriptionStatus: SubscriptionStatus | null;
  
  // Available packages
  packages: SubscriptionPackage[];
  proPackage: SubscriptionPackage | null;
  businessPackage: SubscriptionPackage | null;
  
  // Actions
  purchasePro: () => Promise<boolean>;
  purchaseBusiness: () => Promise<boolean>;
  purchasePackage: (pkg: SubscriptionPackage) => Promise<boolean>;
  restore: () => Promise<boolean>;
  refreshStatus: () => Promise<void>;
}

// ===========================================
// CONTEXT
// ===========================================

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

// ===========================================
// PROVIDER
// ===========================================

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  
  // State
  const [tier, setTier] = useState<SubscriptionTier>('free');
  const [isLoading, setIsLoading] = useState(true);
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(null);
  const [packages, setPackages] = useState<SubscriptionPackage[]>([]);

  // Derived state
  const isPro = tier === 'pro' || tier === 'business';
  const isBusiness = tier === 'business';

  // Find specific packages
  const proPackage = packages.find(pkg => 
    pkg.identifier.toLowerCase().includes('pro') || 
    pkg.rcPackage.product.identifier === PRODUCTS.PRO_MONTHLY
  ) || null;

  const businessPackage = packages.find(pkg => 
    pkg.identifier.toLowerCase().includes('business') || 
    pkg.rcPackage.product.identifier === PRODUCTS.BUSINESS_MONTHLY
  ) || null;

  // Initialize RevenueCat and load subscription status
  useEffect(() => {
    const init = async () => {
      try {
        await subscriptionService.initialize();
        
        // If user is logged in, set their ID in RevenueCat
        if (user?.id) {
          await subscriptionService.setUserId(user.id);
        }
        
        // Load offerings and status
        await Promise.all([
          loadOfferings(),
          refreshStatus(),
        ]);
      } catch (error) {
        console.error('[SubscriptionContext] Initialization error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    init();
  }, []);

  // Update RevenueCat user ID when auth changes
  useEffect(() => {
    const updateUserId = async () => {
      if (user?.id) {
        try {
          await subscriptionService.setUserId(user.id);
          await refreshStatus();
        } catch (error) {
          console.error('[SubscriptionContext] Failed to set user ID:', error);
        }
      } else {
        try {
          await subscriptionService.logout();
          setTier('free');
          setSubscriptionStatus(null);
        } catch (error) {
          console.error('[SubscriptionContext] Failed to logout:', error);
        }
      }
    };

    updateUserId();
  }, [user?.id]);

  // Listen for subscription changes
  useEffect(() => {
    const unsubscribe = subscriptionService.addCustomerInfoListener((status) => {
      setSubscriptionStatus(status);
      setTier(status.tier);
    });

    return unsubscribe;
  }, []);

  // Load available packages
  const loadOfferings = async () => {
    try {
      const offerings = await subscriptionService.getOfferings();
      setPackages(offerings);
    } catch (error) {
      console.error('[SubscriptionContext] Failed to load offerings:', error);
    }
  };

  // Refresh subscription status
  const refreshStatus = useCallback(async () => {
    try {
      const status = await subscriptionService.getSubscriptionStatus();
      setSubscriptionStatus(status);
      setTier(status.tier);
    } catch (error) {
      console.error('[SubscriptionContext] Failed to refresh status:', error);
    }
  }, []);

  // Purchase a specific package
  const purchasePackage = useCallback(async (pkg: SubscriptionPackage): Promise<boolean> => {
    setIsLoading(true);
    try {
      const status = await subscriptionService.purchasePackage(pkg.rcPackage);
      setSubscriptionStatus(status);
      setTier(status.tier);
      
      Alert.alert(
        '🎉 Welcome!',
        `You now have access to ${status.tier === 'business' ? 'Business' : 'Pro'} features!`,
        [{ text: 'Awesome!' }]
      );
      
      return true;
    } catch (error: any) {
      if (error.message !== 'Purchase cancelled') {
        Alert.alert(
          'Purchase Failed',
          'There was an error processing your purchase. Please try again.',
          [{ text: 'OK' }]
        );
      }
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Purchase Pro subscription
  const purchasePro = useCallback(async (): Promise<boolean> => {
    if (!proPackage) {
      Alert.alert('Unavailable', 'Pro subscription is not available at this time.');
      return false;
    }
    return purchasePackage(proPackage);
  }, [proPackage, purchasePackage]);

  // Purchase Business subscription
  const purchaseBusiness = useCallback(async (): Promise<boolean> => {
    if (!businessPackage) {
      Alert.alert('Unavailable', 'Business subscription is not available at this time.');
      return false;
    }
    return purchasePackage(businessPackage);
  }, [businessPackage, purchasePackage]);

  // Restore purchases
  const restore = useCallback(async (): Promise<boolean> => {
    setIsLoading(true);
    try {
      const status = await subscriptionService.restorePurchases();
      setSubscriptionStatus(status);
      setTier(status.tier);
      
      if (status.tier !== 'free') {
        Alert.alert(
          'Purchases Restored',
          `Your ${status.tier === 'business' ? 'Business' : 'Pro'} subscription has been restored.`,
          [{ text: 'Great!' }]
        );
        return true;
      } else {
        Alert.alert(
          'No Purchases Found',
          'We couldn\'t find any previous purchases to restore.',
          [{ text: 'OK' }]
        );
        return false;
      }
    } catch (error) {
      Alert.alert(
        'Restore Failed',
        'There was an error restoring your purchases. Please try again.',
        [{ text: 'OK' }]
      );
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const value: SubscriptionContextType = {
    tier,
    isLoading,
    isPro,
    isBusiness,
    subscriptionStatus,
    packages,
    proPackage,
    businessPackage,
    purchasePro,
    purchaseBusiness,
    purchasePackage,
    restore,
    refreshStatus,
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
}

// ===========================================
// HOOK
// ===========================================

export function useSubscription() {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
}
