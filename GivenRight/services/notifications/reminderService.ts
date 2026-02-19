/**
 * Reminder / Notification Service
 * Schedules local notifications for upcoming gift occasions
 * Uses expo-notifications for cross-platform support
 */
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';

const REMINDERS_KEY = 'givenright_reminders';

export interface GiftReminder {
  id: string;
  occasionName: string;
  recipientName: string;
  date: string; // ISO date
  reminderDaysBefore: number;
  notificationId?: string;
  recurring: boolean;
  createdAt: string;
}

/**
 * Initialize notification permissions and channel
 */
export async function initializeNotifications(): Promise<boolean> {
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      return false;
    }

    // Configure notification behavior
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });

    return true;
  } catch (error) {
    console.warn('Notification init failed:', error);
    return false;
  }
}

/**
 * Schedule a gift reminder
 */
export async function scheduleReminder(reminder: Omit<GiftReminder, 'id' | 'notificationId' | 'createdAt'>): Promise<GiftReminder> {
  const id = `reminder-${Date.now()}`;
  const occasionDate = new Date(reminder.date);
  const triggerDate = new Date(occasionDate);
  triggerDate.setDate(triggerDate.getDate() - reminder.reminderDaysBefore);

  // Don't schedule in the past
  if (triggerDate <= new Date()) {
    triggerDate.setTime(Date.now() + 60000); // 1 min from now as fallback
  }

  const notificationId = await Notifications.scheduleNotificationAsync({
    content: {
      title: `🎁 Gift Reminder: ${reminder.occasionName}`,
      body: `${reminder.recipientName}'s ${reminder.occasionName} is in ${reminder.reminderDaysBefore} days! Time to find the perfect gift.`,
      data: { reminderId: id, type: 'gift_reminder' },
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: triggerDate,
    },
  });

  const fullReminder: GiftReminder = {
    ...reminder,
    id,
    notificationId,
    createdAt: new Date().toISOString(),
  };

  await saveReminder(fullReminder);
  return fullReminder;
}

/**
 * Cancel a scheduled reminder
 */
export async function cancelReminder(reminderId: string): Promise<void> {
  const reminders = await getReminders();
  const reminder = reminders.find(r => r.id === reminderId);

  if (reminder?.notificationId) {
    await Notifications.cancelScheduledNotificationAsync(reminder.notificationId);
  }

  const updated = reminders.filter(r => r.id !== reminderId);
  await AsyncStorage.setItem(REMINDERS_KEY, JSON.stringify(updated));
}

/**
 * Get all scheduled reminders
 */
export async function getReminders(): Promise<GiftReminder[]> {
  try {
    const data = await AsyncStorage.getItem(REMINDERS_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

/**
 * Get upcoming reminders (next 30 days)
 */
export async function getUpcomingReminders(): Promise<GiftReminder[]> {
  const all = await getReminders();
  const now = new Date();
  const thirtyDays = new Date(now.getTime() + 30 * 86400000);

  return all
    .filter(r => {
      const d = new Date(r.date);
      return d >= now && d <= thirtyDays;
    })
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

/**
 * Clear all reminders
 */
export async function clearAllReminders(): Promise<void> {
  const reminders = await getReminders();
  for (const r of reminders) {
    if (r.notificationId) {
      await Notifications.cancelScheduledNotificationAsync(r.notificationId).catch(() => {});
    }
  }
  await AsyncStorage.removeItem(REMINDERS_KEY);
}

// ---- Internal ----

async function saveReminder(reminder: GiftReminder): Promise<void> {
  const existing = await getReminders();
  existing.push(reminder);
  // Max 50 reminders
  const trimmed = existing.length > 50 ? existing.slice(-50) : existing;
  await AsyncStorage.setItem(REMINDERS_KEY, JSON.stringify(trimmed));
}