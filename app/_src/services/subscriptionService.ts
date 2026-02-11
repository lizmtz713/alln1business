// Subscription Service - RevenueCat Wrapper
import Purchases, {
  PurchasesPackage,
  CustomerInfo,
  PurchasesOfferings,
  LOG_LEVEL,
} from 'react-native-purchases';
import { Platform } from 'react-native';

// ===========================================
// CONFIGURATION
// ===========================================

// Use environment variables in production
// These are placeholder keys - replace with your actual RevenueCat API keys
const REVENUECAT_API_KEY_IOS = process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY || 'appl_YOUR_IOS_API_KEY_HERE';
const REVENUECAT_API_KEY_ANDROID = process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY || 'goog_YOUR_ANDROID_API_KEY_HERE';

// Entitlement identifiers (configure these in RevenueCat dashboard)
export const ENTITLEMENTS = {
  PRO: 'pro',
  BUSINESS: 'business',
} as const;

// Product identifiers (configure these in App Store Connect / Google Play Console)
export const PRODUCTS = {
  PRO_MONTHLY: 'alln1_pro_monthly',
  BUSINESS_MONTHLY: 'alln1_business_monthly',
} as const;

// ===========================================
// TYPES
// ===========================================

export type SubscriptionTier = 'free' | 'pro' | 'business';

export interface SubscriptionStatus {
  tier: SubscriptionTier;
  isActive: boolean;
  expirationDate: Date | null;
  willRenew: boolean;
  productIdentifier: string | null;
}

export interface SubscriptionPackage {
  identifier: string;
  product: {
    title: string;
    description: string;
    priceString: string;
    price: number;
    currencyCode: string;
  };
  packageType: string;
  rcPackage: PurchasesPackage;
}

// ===========================================
// SERVICE
// ===========================================

class SubscriptionService {
  private initialized = false;

  /**
   * Initialize RevenueCat SDK
   * Call this once on app startup
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    try {
      // Enable debug logs in development
      if (__DEV__) {
        Purchases.setLogLevel(LOG_LEVEL.DEBUG);
      }

      const apiKey = Platform.OS === 'ios' 
        ? REVENUECAT_API_KEY_IOS 
        : REVENUECAT_API_KEY_ANDROID;

      await Purchases.configure({ apiKey });
      this.initialized = true;
      
      console.log('[SubscriptionService] RevenueCat initialized successfully');
    } catch (error) {
      console.error('[SubscriptionService] Failed to initialize RevenueCat:', error);
      throw error;
    }
  }

  /**
   * Set the user ID for RevenueCat (call after user authentication)
   */
  async setUserId(userId: string): Promise<void> {
    try {
      await Purchases.logIn(userId);
      console.log('[SubscriptionService] User logged in:', userId);
    } catch (error) {
      console.error('[SubscriptionService] Failed to set user ID:', error);
      throw error;
    }
  }

  /**
   * Log out the current user (call on user sign out)
   */
  async logout(): Promise<void> {
    try {
      await Purchases.logOut();
      console.log('[SubscriptionService] User logged out');
    } catch (error) {
      console.error('[SubscriptionService] Failed to log out:', error);
    }
  }

  /**
   * Get available subscription offerings
   */
  async getOfferings(): Promise<SubscriptionPackage[]> {
    try {
      const offerings: PurchasesOfferings = await Purchases.getOfferings();
      
      if (!offerings.current) {
        console.log('[SubscriptionService] No current offering available');
        return [];
      }

      const packages: SubscriptionPackage[] = offerings.current.availablePackages.map(pkg => ({
        identifier: pkg.identifier,
        product: {
          title: pkg.product.title,
          description: pkg.product.description,
          priceString: pkg.product.priceString,
          price: pkg.product.price,
          currencyCode: pkg.product.currencyCode,
        },
        packageType: pkg.packageType,
        rcPackage: pkg,
      }));

      return packages;
    } catch (error) {
      console.error('[SubscriptionService] Failed to get offerings:', error);
      throw error;
    }
  }

  /**
   * Get customer info and subscription status
   */
  async getSubscriptionStatus(): Promise<SubscriptionStatus> {
    try {
      const customerInfo: CustomerInfo = await Purchases.getCustomerInfo();
      return this.parseCustomerInfo(customerInfo);
    } catch (error) {
      console.error('[SubscriptionService] Failed to get subscription status:', error);
      // Return free tier as fallback
      return {
        tier: 'free',
        isActive: false,
        expirationDate: null,
        willRenew: false,
        productIdentifier: null,
      };
    }
  }

  /**
   * Purchase a subscription package
   */
  async purchasePackage(pkg: PurchasesPackage): Promise<SubscriptionStatus> {
    try {
      const { customerInfo } = await Purchases.purchasePackage(pkg);
      console.log('[SubscriptionService] Purchase successful');
      return this.parseCustomerInfo(customerInfo);
    } catch (error: any) {
      if (error.userCancelled) {
        console.log('[SubscriptionService] User cancelled purchase');
        throw new Error('Purchase cancelled');
      }
      console.error('[SubscriptionService] Purchase failed:', error);
      throw error;
    }
  }

  /**
   * Restore previous purchases
   */
  async restorePurchases(): Promise<SubscriptionStatus> {
    try {
      const customerInfo = await Purchases.restorePurchases();
      console.log('[SubscriptionService] Purchases restored');
      return this.parseCustomerInfo(customerInfo);
    } catch (error) {
      console.error('[SubscriptionService] Failed to restore purchases:', error);
      throw error;
    }
  }

  /**
   * Check if user has a specific entitlement
   */
  async hasEntitlement(entitlementId: string): Promise<boolean> {
    try {
      const customerInfo = await Purchases.getCustomerInfo();
      return customerInfo.entitlements.active[entitlementId] !== undefined;
    } catch (error) {
      console.error('[SubscriptionService] Failed to check entitlement:', error);
      return false;
    }
  }

  /**
   * Add a listener for customer info changes
   */
  addCustomerInfoListener(callback: (status: SubscriptionStatus) => void): () => void {
    const listener = Purchases.addCustomerInfoUpdateListener((customerInfo) => {
      callback(this.parseCustomerInfo(customerInfo));
    });
    return () => listener.remove();
  }

  /**
   * Parse CustomerInfo into our SubscriptionStatus format
   */
  private parseCustomerInfo(customerInfo: CustomerInfo): SubscriptionStatus {
    // Check for business entitlement first (it includes pro features)
    if (customerInfo.entitlements.active[ENTITLEMENTS.BUSINESS]) {
      const entitlement = customerInfo.entitlements.active[ENTITLEMENTS.BUSINESS];
      return {
        tier: 'business',
        isActive: true,
        expirationDate: entitlement.expirationDate 
          ? new Date(entitlement.expirationDate) 
          : null,
        willRenew: entitlement.willRenew,
        productIdentifier: entitlement.productIdentifier,
      };
    }

    // Check for pro entitlement
    if (customerInfo.entitlements.active[ENTITLEMENTS.PRO]) {
      const entitlement = customerInfo.entitlements.active[ENTITLEMENTS.PRO];
      return {
        tier: 'pro',
        isActive: true,
        expirationDate: entitlement.expirationDate 
          ? new Date(entitlement.expirationDate) 
          : null,
        willRenew: entitlement.willRenew,
        productIdentifier: entitlement.productIdentifier,
      };
    }

    // No active subscription - free tier
    return {
      tier: 'free',
      isActive: false,
      expirationDate: null,
      willRenew: false,
      productIdentifier: null,
    };
  }
}

// Export singleton instance
export const subscriptionService = new SubscriptionService();
