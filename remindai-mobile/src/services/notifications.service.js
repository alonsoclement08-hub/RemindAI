import * as Notifications from 'expo-notifications';
import { localDB } from '../db/sqlite';

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
};
