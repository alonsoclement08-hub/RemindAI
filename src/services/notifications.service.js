import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { localDB } from '../db/sqlite';
import client from '../api/client';
import { storage } from '../utils/storage';
import { aiAPI } from '../api/ai';

const DAILY_SUMMARY_HOUR = 8;

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export const notificationsService = {
  async requestPermissions() {
    const { status } = await Notifications.requestPermissionsAsync();
    return status === 'granted';
  },

  async registerFCMToken() {
    try {
      const { status } = await Notifications.getPermissionsAsync();
      if (status !== 'granted') return null;

      // getDevicePushTokenAsync returns the native FCM (Android) or APNs (iOS) token
      const tokenData = await Notifications.getDevicePushTokenAsync();
      if (!tokenData?.data) return null;

      const platform = Platform.OS === 'ios' ? 'ios' : 'android';
      await client.post('/notifications/register', { token: tokenData.data, platform });

      return tokenData.data;
    } catch (err) {
      console.warn('[FCM] Token registration failed:', err.message);
      return null;
    }
  },

  async unregisterFCMToken() {
    try {
      const tokenData = await Notifications.getDevicePushTokenAsync();
      if (!tokenData?.data) return;
      await client.delete('/notifications/register', { data: { token: tokenData.data } });
    } catch (err) {
      console.warn('[FCM] Token unregistration failed:', err.message);
    }
  },

  async scheduleLocalNotification(reminder) {
    if (!reminder.scheduled_at) return null;

    const scheduledDate = new Date(reminder.scheduled_at);
    if (scheduledDate <= new Date()) return null;

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: reminder.title,
        body: reminder.description || 'Rappel RemindAI',
        data: { reminderId: reminder.id },
      },
      trigger: { date: scheduledDate },
    });

    await localDB.saveNotification(
      reminder.id,
      notificationId,
      reminder.title,
      reminder.description || 'Rappel RemindAI',
      'local'
    );

    return notificationId;
  },

  async cancelNotification(reminderId) {
    const history = await localDB.getNotificationHistory(reminderId);
    await Promise.all(
      history
        .filter((n) => n.notification_id)
        .map((n) =>
          Notifications.cancelScheduledNotificationAsync(n.notification_id).catch(() => {})
        )
    );
  },

  async handleRemoteNotification(data) {
    if (!data) return;
    await localDB.saveNotification(
      data.reminderId || null,
      data.notificationId || null,
      data.title || 'RemindAI',
      data.body || '',
      'remote'
    );
  },

  async getHistory(reminderId = null) {
    return localDB.getNotificationHistory(reminderId);
  },

  // Refreshes & schedules the AI daily-summary notification, at most once
  // per calendar day. Local notifications can't fetch fresh content at fire
  // time, so this re-schedules with today's text each time the app is
  // opened on a new day — call it on app foreground (e.g. home screen mount).
  async scheduleDailySummaryIfNeeded() {
    try {
      const today = new Date().toISOString().slice(0, 10);
      const lastScheduled = await storage.getDailySummaryDate();
      if (lastScheduled === today) return;

      const summary = await aiAPI.getDailySummary();
      if (!summary?.text) return;

      const previousId = await storage.getDailySummaryNotifId();
      if (previousId) {
        await Notifications.cancelScheduledNotificationAsync(previousId).catch(() => {});
      }

      const fireDate = new Date();
      fireDate.setHours(DAILY_SUMMARY_HOUR, 0, 0, 0);
      if (fireDate <= new Date()) fireDate.setDate(fireDate.getDate() + 1);

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Ton résumé du jour',
          body: summary.text,
          data: { type: 'daily_summary' },
        },
        trigger: { date: fireDate },
      });

      await storage.setDailySummaryNotifId(notificationId);
      await storage.setDailySummaryDate(today);
    } catch (err) {
      console.warn('[DailySummary] scheduling failed:', err.message);
    }
  },

  async cancelDailySummary() {
    const id = await storage.getDailySummaryNotifId();
    if (id) await Notifications.cancelScheduledNotificationAsync(id).catch(() => {});
  },

  // Call this once after successful login/signup
  async initAfterAuth() {
    const granted = await this.requestPermissions();
    if (granted) await this.registerFCMToken();
    await this.scheduleDailySummaryIfNeeded();
  },
};
