import { useMemo, useCallback } from 'react';
import { useSubscription } from '../contexts/SubscriptionContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../contexts/AuthContext';

// ===========================================
// CONSTANTS
// ===========================================

const FREE_TIER_LIMITS = {
  RECEIPTS_PER_MONTH: 10,
  AI_CHATS_PER_DAY: 3,
} as const;

const STORAGE_KEYS = {
  RECEIPT_COUNT: 'feature_receipt_count',
  RECEIPT_MONTH: 'feature_receipt_month',
  AI_CHAT_COUNT: 'feature_ai_chat_count',
  AI_CHAT_DATE: 'feature_ai_chat_date',
} as const;

// ===========================================
// TYPES
// ===========================================

export interface FeatureGate {
  // Pro+ features
  canUseAICFO: boolean;
  canUseUnlimitedReceipts: boolean;
  canExportData: boolean;
  canUseTaxInsights: boolean;
  
  // Business-only features
  canUseMultiBusiness: boolean;
  canShareWithAccountant: boolean;
  
  // Free tier tracking
  receiptsRemaining: number;
  receiptsUsedThisMonth: number;
  aiChatsRemaining: number;
  aiChatsUsedToday: number;
  
  // Helper functions
  checkReceiptLimit: () => Promise<boolean>;
  incrementReceiptCount: () => Promise<void>;
  checkAIChatLimit: () => Promise<boolean>;
  incrementAIChatCount: () => Promise<void>;
  resetUsageTracking: () => Promise<void>;
}

// ===========================================
// HOOK
// ===========================================

export function useFeatureGate(): FeatureGate {
  const { isPro, isBusiness, tier } = useSubscription();
  const { user } = useAuth();

  // Memoized feature flags
  const features = useMemo(() => ({
    // Pro+ features (available to Pro and Business)
    canUseAICFO: isPro,
    canUseUnlimitedReceipts: isPro,
    canExportData: isPro,
    canUseTaxInsights: isPro,
    
    // Business-only features
    canUseMultiBusiness: isBusiness,
    canShareWithAccountant: isBusiness,
  }), [isPro, isBusiness]);

  // Get current month key for storage
  const getMonthKey = useCallback(() => {
    const now = new Date();
    return `${now.getFullYear()}-${now.getMonth() + 1}`;
  }, []);

  // Get current date key for storage
  const getDateKey = useCallback(() => {
    const now = new Date();
    return `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;
  }, []);

  // Get user-specific storage key
  const getUserKey = useCallback((key: string) => {
    return user?.id ? `${key}_${user.id}` : key;
  }, [user?.id]);

  // Get receipt usage for current month
  const getReceiptUsage = useCallback(async (): Promise<{ count: number; month: string }> => {
    try {
      const [countStr, monthStr] = await Promise.all([
        AsyncStorage.getItem(getUserKey(STORAGE_KEYS.RECEIPT_COUNT)),
        AsyncStorage.getItem(getUserKey(STORAGE_KEYS.RECEIPT_MONTH)),
      ]);

      const currentMonth = getMonthKey();
      const storedMonth = monthStr || '';
      
      // Reset if new month
      if (storedMonth !== currentMonth) {
        await AsyncStorage.multiSet([
          [getUserKey(STORAGE_KEYS.RECEIPT_COUNT), '0'],
          [getUserKey(STORAGE_KEYS.RECEIPT_MONTH), currentMonth],
        ]);
        return { count: 0, month: currentMonth };
      }

      return {
        count: parseInt(countStr || '0', 10),
        month: storedMonth,
      };
    } catch (error) {
      console.error('[useFeatureGate] Failed to get receipt usage:', error);
      return { count: 0, month: getMonthKey() };
    }
  }, [getUserKey, getMonthKey]);

  // Get AI chat usage for current day
  const getAIChatUsage = useCallback(async (): Promise<{ count: number; date: string }> => {
    try {
      const [countStr, dateStr] = await Promise.all([
        AsyncStorage.getItem(getUserKey(STORAGE_KEYS.AI_CHAT_COUNT)),
        AsyncStorage.getItem(getUserKey(STORAGE_KEYS.AI_CHAT_DATE)),
      ]);

      const currentDate = getDateKey();
      const storedDate = dateStr || '';
      
      // Reset if new day
      if (storedDate !== currentDate) {
        await AsyncStorage.multiSet([
          [getUserKey(STORAGE_KEYS.AI_CHAT_COUNT), '0'],
          [getUserKey(STORAGE_KEYS.AI_CHAT_DATE), currentDate],
        ]);
        return { count: 0, date: currentDate };
      }

      return {
        count: parseInt(countStr || '0', 10),
        date: storedDate,
      };
    } catch (error) {
      console.error('[useFeatureGate] Failed to get AI chat usage:', error);
      return { count: 0, date: getDateKey() };
    }
  }, [getUserKey, getDateKey]);

  // Check if user can add more receipts
  const checkReceiptLimit = useCallback(async (): Promise<boolean> => {
    if (isPro) return true; // Unlimited for Pro+
    
    const { count } = await getReceiptUsage();
    return count < FREE_TIER_LIMITS.RECEIPTS_PER_MONTH;
  }, [isPro, getReceiptUsage]);

  // Increment receipt count
  const incrementReceiptCount = useCallback(async (): Promise<void> => {
    if (isPro) return; // Don't track for Pro+
    
    try {
      const { count } = await getReceiptUsage();
      await AsyncStorage.setItem(
        getUserKey(STORAGE_KEYS.RECEIPT_COUNT),
        String(count + 1)
      );
    } catch (error) {
      console.error('[useFeatureGate] Failed to increment receipt count:', error);
    }
  }, [isPro, getReceiptUsage, getUserKey]);

  // Check if user can use AI chat
  const checkAIChatLimit = useCallback(async (): Promise<boolean> => {
    if (isPro) return true; // Unlimited for Pro+
    
    const { count } = await getAIChatUsage();
    return count < FREE_TIER_LIMITS.AI_CHATS_PER_DAY;
  }, [isPro, getAIChatUsage]);

  // Increment AI chat count
  const incrementAIChatCount = useCallback(async (): Promise<void> => {
    if (isPro) return; // Don't track for Pro+
    
    try {
      const { count } = await getAIChatUsage();
      await AsyncStorage.setItem(
        getUserKey(STORAGE_KEYS.AI_CHAT_COUNT),
        String(count + 1)
      );
    } catch (error) {
      console.error('[useFeatureGate] Failed to increment AI chat count:', error);
    }
  }, [isPro, getAIChatUsage, getUserKey]);

  // Reset all usage tracking (for testing or account changes)
  const resetUsageTracking = useCallback(async (): Promise<void> => {
    try {
      await AsyncStorage.multiRemove([
        getUserKey(STORAGE_KEYS.RECEIPT_COUNT),
        getUserKey(STORAGE_KEYS.RECEIPT_MONTH),
        getUserKey(STORAGE_KEYS.AI_CHAT_COUNT),
        getUserKey(STORAGE_KEYS.AI_CHAT_DATE),
      ]);
    } catch (error) {
      console.error('[useFeatureGate] Failed to reset usage tracking:', error);
    }
  }, [getUserKey]);

  // Calculate remaining receipts (need to be sync for rendering)
  // This is a simplified version - actual count is async
  const receiptsRemaining = useMemo(() => {
    if (isPro) return Infinity;
    return FREE_TIER_LIMITS.RECEIPTS_PER_MONTH;
  }, [isPro]);

  const aiChatsRemaining = useMemo(() => {
    if (isPro) return Infinity;
    return FREE_TIER_LIMITS.AI_CHATS_PER_DAY;
  }, [isPro]);

  return {
    ...features,
    receiptsRemaining,
    receiptsUsedThisMonth: 0, // Updated async when needed
    aiChatsRemaining,
    aiChatsUsedToday: 0, // Updated async when needed
    checkReceiptLimit,
    incrementReceiptCount,
    checkAIChatLimit,
    incrementAIChatCount,
    resetUsageTracking,
  };
}

// ===========================================
// UTILITY HOOK FOR ASYNC USAGE DATA
// ===========================================

export function useFeatureUsage() {
  const { isPro } = useSubscription();
  const { user } = useAuth();

  const getUserKey = useCallback((key: string) => {
    return user?.id ? `${key}_${user.id}` : key;
  }, [user?.id]);

  const getMonthKey = useCallback(() => {
    const now = new Date();
    return `${now.getFullYear()}-${now.getMonth() + 1}`;
  }, []);

  const getDateKey = useCallback(() => {
    const now = new Date();
    return `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;
  }, []);

  // Get async receipt usage
  const getReceiptUsage = useCallback(async () => {
    if (isPro) {
      return { used: 0, remaining: Infinity, limit: Infinity };
    }

    try {
      const [countStr, monthStr] = await Promise.all([
        AsyncStorage.getItem(getUserKey(STORAGE_KEYS.RECEIPT_COUNT)),
        AsyncStorage.getItem(getUserKey(STORAGE_KEYS.RECEIPT_MONTH)),
      ]);

      const currentMonth = getMonthKey();
      const count = monthStr === currentMonth ? parseInt(countStr || '0', 10) : 0;

      return {
        used: count,
        remaining: Math.max(0, FREE_TIER_LIMITS.RECEIPTS_PER_MONTH - count),
        limit: FREE_TIER_LIMITS.RECEIPTS_PER_MONTH,
      };
    } catch {
      return { used: 0, remaining: FREE_TIER_LIMITS.RECEIPTS_PER_MONTH, limit: FREE_TIER_LIMITS.RECEIPTS_PER_MONTH };
    }
  }, [isPro, getUserKey, getMonthKey]);

  // Get async AI chat usage
  const getAIChatUsage = useCallback(async () => {
    if (isPro) {
      return { used: 0, remaining: Infinity, limit: Infinity };
    }

    try {
      const [countStr, dateStr] = await Promise.all([
        AsyncStorage.getItem(getUserKey(STORAGE_KEYS.AI_CHAT_COUNT)),
        AsyncStorage.getItem(getUserKey(STORAGE_KEYS.AI_CHAT_DATE)),
      ]);

      const currentDate = getDateKey();
      const count = dateStr === currentDate ? parseInt(countStr || '0', 10) : 0;

      return {
        used: count,
        remaining: Math.max(0, FREE_TIER_LIMITS.AI_CHATS_PER_DAY - count),
        limit: FREE_TIER_LIMITS.AI_CHATS_PER_DAY,
      };
    } catch {
      return { used: 0, remaining: FREE_TIER_LIMITS.AI_CHATS_PER_DAY, limit: FREE_TIER_LIMITS.AI_CHATS_PER_DAY };
    }
  }, [isPro, getUserKey, getDateKey]);

  return { getReceiptUsage, getAIChatUsage };
}
