/**
 * Schedule local push notifications for bill due dates and appointment/reminder due dates.
 * Uses expo-notifications. Call syncBillAndReminderNotifications() when bills or compliance data load.
 */

import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { addDays, parseISO, format, isBefore, isAfter } from 'date-fns';

const BILL_CHANNEL = 'bills';
const REMINDER_CHANNEL = 'reminders';
const INSIGHTS_CHANNEL = 'insights';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export async function requestNotificationPermissions(): Promise<boolean> {
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

async function ensureChannels() {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(BILL_CHANNEL, {
    name: 'Bill Reminders',
    importance: Notifications.AndroidImportance.HIGH,
    description: 'Upcoming bill due dates',
  });
  await Notifications.setNotificationChannelAsync(REMINDER_CHANNEL, {
    name: 'Reminders',
    importance: Notifications.AndroidImportance.HIGH,
    description: 'Appointment and task reminders',
  });
  await Notifications.setNotificationChannelAsync(INSIGHTS_CHANNEL, {
    name: 'AI Predictions',
    importance: Notifications.AndroidImportance.DEFAULT,
    description: 'Proactive alerts and predictions',
  });
}

export type BillForNotification = { id: string; bill_name: string; due_date: string; amount: number; status: string };
export type ReminderForNotification = { id: string; name: string; due_date: string | null };

/**
 * Schedule a one-time notification for a bill due date (e.g. 1 day before).
 */
export async function scheduleBillDueNotification(
  bill: BillForNotification,
  daysBefore: number = 1
): Promise<string | null> {
  if (bill.status !== 'pending' || !bill.due_date) return null;
  try {
    await ensureChannels();
    const due = parseISO(bill.due_date);
    const triggerAt = addDays(due, -daysBefore);
    const now = new Date();
    if (isBefore(triggerAt, now)) return null;

    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Bill due soon',
        body: `${bill.bill_name} — $${Number(bill.amount).toFixed(2)} due ${format(due, 'MMM d')}`,
        data: { type: 'bill', billId: bill.id },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: triggerAt,
        ...(Platform.OS === 'android' && { channelId: BILL_CHANNEL }),
      },
    });
    return id;
  } catch {
    return null;
  }
}

/**
 * Schedule a one-time notification for a reminder/compliance item due date.
 */
export async function scheduleReminderNotification(
  item: ReminderForNotification,
  daysBefore: number = 1
): Promise<string | null> {
  if (!item.due_date) return null;
  try {
    await ensureChannels();
    const due = parseISO(item.due_date);
    const triggerAt = addDays(due, -daysBefore);
    const now = new Date();
    if (isBefore(triggerAt, now)) return null;

    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Reminder',
        body: `${item.name} — due ${format(due, 'MMM d')}`,
        data: { type: 'reminder', itemId: item.id },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: triggerAt,
        ...(Platform.OS === 'android' && { channelId: REMINDER_CHANNEL }),
      },
    });
    return id;
  } catch {
    return null;
  }
}

/**
 * Cancel all scheduled bill and reminder notifications (by content.data.type).
 */
export async function cancelScheduledBillAndReminderNotifications(): Promise<void> {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  for (const n of scheduled) {
    const data = (n.content?.data as { type?: string }) ?? {};
    if (data.type === 'bill' || data.type === 'reminder') {
      await Notifications.cancelScheduledNotificationAsync(n.identifier);
    }
  }
}

/**
 * Sync notifications: cancel existing bill/reminder notifications, then schedule for bills due in next 14 days and reminders due in next 14 days.
 * Pass current bills (pending only) and compliance items (or reminders) with due_date.
 */
export async function syncBillAndReminderNotifications(
  bills: BillForNotification[],
  reminders: ReminderForNotification[]
): Promise<void> {
  const granted = await requestNotificationPermissions();
  if (!granted) return;

  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  for (const n of scheduled) {
    const data = (n.content?.data as { type?: string }) ?? {};
    if (data.type === 'bill' || data.type === 'reminder') {
      await Notifications.cancelScheduledNotificationAsync(n.identifier);
    }
  }

  await ensureChannels();
  const now = new Date();
  const cutoff = addDays(now, 14);

  for (const bill of bills) {
    if (bill.status !== 'pending' || !bill.due_date) continue;
    const due = parseISO(bill.due_date);
    if (isAfter(due, cutoff)) continue;
    await scheduleBillDueNotification(bill, 1);
  }

  for (const item of reminders) {
    if (!item.due_date) continue;
    const due = parseISO(item.due_date);
    if (isBefore(due, now) || isAfter(due, cutoff)) continue;
    await scheduleReminderNotification(item, 1);
  }
}

/**
 * Schedule a single proactive notification for an AI insight (e.g. "Oil change in ~500 miles").
 * Fires in 1 hour so the user gets a nudge. Cancel previous insight notifications first.
 */
export async function scheduleInsightNotification(title: string, body: string): Promise<string | null> {
  try {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    for (const n of scheduled) {
      const data = (n.content?.data as { type?: string }) ?? {};
      if (data.type === 'insight') await Notifications.cancelScheduledNotificationAsync(n.identifier);
    }
    await ensureChannels();
    const inOneHour = new Date(Date.now() + 60 * 60 * 1000);
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: title.length > 40 ? title.slice(0, 37) + '...' : title,
        body: body.length > 100 ? body.slice(0, 97) + '...' : body,
        data: { type: 'insight' },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: inOneHour,
        ...(Platform.OS === 'android' && { channelId: INSIGHTS_CHANNEL }),
      },
    });
    return id;
  } catch {
    return null;
  }
}
