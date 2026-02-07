// Push Notification Service
// Bill reminders, tax deadlines, insights alerts

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ===========================================
// CONFIGURATION
// ===========================================

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// ===========================================
// PERMISSION & TOKEN
// ===========================================

export async function registerForPushNotifications(): Promise<string | null> {
  let token = null;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#3B82F6',
    });

    await Notifications.setNotificationChannelAsync('bills', {
      name: 'Bill Reminders',
      importance: Notifications.AndroidImportance.HIGH,
      description: 'Reminders for upcoming bill payments',
    });

    await Notifications.setNotificationChannelAsync('taxes', {
      name: 'Tax Deadlines',
      importance: Notifications.AndroidImportance.HIGH,
      description: 'Tax deadline reminders',
    });

    await Notifications.setNotificationChannelAsync('insights', {
      name: 'Business Insights',
      importance: Notifications.AndroidImportance.DEFAULT,
      description: 'Tips and insights for your business',
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      console.log('Failed to get push token for push notification!');
      return null;
    }
    
    token = (await Notifications.getExpoPushTokenAsync()).data;
    await AsyncStorage.setItem('pushToken', token);
  }

  return token;
}

// ===========================================
// NOTIFICATION TYPES
// ===========================================

export interface NotificationSchedule {
  id: string;
  type: 'bill' | 'tax' | 'insight' | 'celebration' | 'reminder';
  title: string;
  body: string;
  data?: Record<string, any>;
  trigger: Date | { 
    hour: number; 
    minute: number; 
    repeats?: boolean;
    weekday?: number;
  };
}

// ===========================================
// SCHEDULING FUNCTIONS
// ===========================================

export async function scheduleBillReminder(
  billId: string,
  billName: string,
  amount: number,
  dueDay: number,
  reminderDaysBefore: number = 3
): Promise<string | null> {
  try {
    // Calculate next due date
    const now = new Date();
    const currentDay = now.getDate();
    let dueDate = new Date(now.getFullYear(), now.getMonth(), dueDay);
    
    if (currentDay >= dueDay) {
      // Bill is for next month
      dueDate = new Date(now.getFullYear(), now.getMonth() + 1, dueDay);
    }
    
    // Reminder date
    const reminderDate = new Date(dueDate);
    reminderDate.setDate(reminderDate.getDate() - reminderDaysBefore);
    
    // Don't schedule if reminder is in the past
    if (reminderDate <= now) {
      return null;
    }

    const identifier = await Notifications.scheduleNotificationAsync({
      content: {
        title: `💸 ${billName} Due Soon`,
        body: amount 
          ? `$${amount.toFixed(2)} due in ${reminderDaysBefore} days`
          : `Payment due in ${reminderDaysBefore} days`,
        data: { type: 'bill', billId },
        sound: true,
        badge: 1,
      },
      trigger: reminderDate,
    });

    // Store scheduled notification
    await storeScheduledNotification(identifier, {
      type: 'bill',
      billId,
      billName,
      dueDay,
    });

    return identifier;
  } catch (error) {
    console.error('Error scheduling bill reminder:', error);
    return null;
  }
}

export async function scheduleQuarterlyTaxReminder(): Promise<void> {
  // Quarterly tax due dates
  const taxDates = [
    { month: 3, day: 15, quarter: 'Q1' }, // April 15
    { month: 5, day: 15, quarter: 'Q2' }, // June 15
    { month: 8, day: 15, quarter: 'Q3' }, // September 15
    { month: 0, day: 15, quarter: 'Q4' }, // January 15 (next year)
  ];

  const now = new Date();

  for (const taxDate of taxDates) {
    let year = now.getFullYear();
    if (taxDate.month === 0) year++; // Q4 is next year

    const dueDate = new Date(year, taxDate.month, taxDate.day);
    
    // 7 days before reminder
    const reminder7Days = new Date(dueDate);
    reminder7Days.setDate(reminder7Days.getDate() - 7);
    
    // 1 day before reminder
    const reminder1Day = new Date(dueDate);
    reminder1Day.setDate(reminder1Day.getDate() - 1);

    if (reminder7Days > now) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: `📅 ${taxDate.quarter} Taxes Due in 1 Week`,
          body: 'Quarterly estimated taxes are due soon. Open Alln1 to review.',
          data: { type: 'tax', quarter: taxDate.quarter },
          sound: true,
        },
        trigger: reminder7Days,
      });
    }

    if (reminder1Day > now) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: `⚠️ ${taxDate.quarter} Taxes Due Tomorrow!`,
          body: 'Don\'t forget to pay your quarterly estimated taxes.',
          data: { type: 'tax', quarter: taxDate.quarter },
          sound: true,
          badge: 1,
        },
        trigger: reminder1Day,
      });
    }
  }
}

export async function scheduleDailyInsight(hour: number = 9): Promise<void> {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: getRandomInsightTitle(),
      body: getRandomInsightBody(),
      data: { type: 'insight' },
    },
    trigger: {
      hour,
      minute: 0,
      repeats: true,
    },
  });
}

export async function scheduleWeeklyReview(): Promise<void> {
  // Every Sunday at 7 PM
  await Notifications.scheduleNotificationAsync({
    content: {
      title: '📊 Weekly Business Review',
      body: 'See how your business performed this week',
      data: { type: 'review' },
    },
    trigger: {
      weekday: 1, // Sunday
      hour: 19,
      minute: 0,
      repeats: true,
    },
  });
}

export async function sendCelebrationNotification(
  title: string,
  body: string,
  milestoneId: string
): Promise<void> {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: `🎉 ${title}`,
      body,
      data: { type: 'celebration', milestoneId },
      sound: true,
      badge: 1,
    },
    trigger: null, // Immediate
  });
}

// ===========================================
// MANAGEMENT
// ===========================================

export async function cancelNotification(identifier: string): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(identifier);
  await removeScheduledNotification(identifier);
}

export async function cancelAllBillReminders(billId: string): Promise<void> {
  const stored = await getScheduledNotifications();
  const toCancel = stored.filter(n => n.data?.billId === billId);
  
  for (const notification of toCancel) {
    await cancelNotification(notification.identifier);
  }
}

export async function cancelAllNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
  await AsyncStorage.removeItem('scheduledNotifications');
}

export async function getScheduledNotificationsCount(): Promise<number> {
  const notifications = await Notifications.getAllScheduledNotificationsAsync();
  return notifications.length;
}

// ===========================================
// STORAGE HELPERS
// ===========================================

interface StoredNotification {
  identifier: string;
  data: Record<string, any>;
  scheduledAt: string;
}

async function storeScheduledNotification(
  identifier: string, 
  data: Record<string, any>
): Promise<void> {
  const stored = await getScheduledNotifications();
  stored.push({
    identifier,
    data,
    scheduledAt: new Date().toISOString(),
  });
  await AsyncStorage.setItem('scheduledNotifications', JSON.stringify(stored));
}

async function getScheduledNotifications(): Promise<StoredNotification[]> {
  const stored = await AsyncStorage.getItem('scheduledNotifications');
  return stored ? JSON.parse(stored) : [];
}

async function removeScheduledNotification(identifier: string): Promise<void> {
  const stored = await getScheduledNotifications();
  const filtered = stored.filter(n => n.identifier !== identifier);
  await AsyncStorage.setItem('scheduledNotifications', JSON.stringify(filtered));
}

// ===========================================
// INSIGHT CONTENT
// ===========================================

const INSIGHT_TITLES = [
  '💡 Quick Tax Tip',
  '📊 Business Insight',
  '💰 Money Tip',
  '🎯 Did You Know?',
  '✨ Pro Tip',
];

const INSIGHT_BODIES = [
  'Track all receipts over $75 — the IRS requires documentation.',
  'Business meals are 50% deductible. Don\'t forget to note who you met with!',
  'Home office? You can deduct $5/sq ft up to 300 sq ft.',
  'Quarterly taxes due soon? Set aside 25-30% of income.',
  'Mileage adds up! 67¢ per business mile in 2024.',
  'Software subscriptions are 100% deductible business expenses.',
  'Keep business and personal expenses separate — it saves headaches later.',
  'Consider a SEP-IRA to reduce taxable income.',
  'Snap receipts immediately — 60% of paper receipts fade within 3 months.',
  'Your phone bill is partially deductible based on business use percentage.',
];

function getRandomInsightTitle(): string {
  return INSIGHT_TITLES[Math.floor(Math.random() * INSIGHT_TITLES.length)];
}

function getRandomInsightBody(): string {
  return INSIGHT_BODIES[Math.floor(Math.random() * INSIGHT_BODIES.length)];
}

// ===========================================
// NOTIFICATION LISTENER
// ===========================================

export function addNotificationListener(
  handler: (notification: Notifications.Notification) => void
): Notifications.Subscription {
  return Notifications.addNotificationReceivedListener(handler);
}

export function addNotificationResponseListener(
  handler: (response: Notifications.NotificationResponse) => void
): Notifications.Subscription {
  return Notifications.addNotificationResponseReceivedListener(handler);
}
