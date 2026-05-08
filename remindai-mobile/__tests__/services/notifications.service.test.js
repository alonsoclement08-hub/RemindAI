import { notificationsService } from '../../src/services/notifications.service';

jest.mock('../../src/db/sqlite', () => ({
  localDB: {
    saveNotification: jest.fn().mockResolvedValue(undefined),
    getNotificationHistory: jest.fn().mockResolvedValue([]),
  },
}));

const Notifications = require('expo-notifications');
const { localDB } = require('../../src/db/sqlite');

beforeEach(() => {
  jest.clearAllMocks();
  Notifications.__reset();
});

describe('notifications service', () => {
  it('schedules a local notification for a reminder with a future scheduled_at', async () => {
    const future = new Date(Date.now() + 3600000).toISOString(); // 1h from now
    const reminder = { id: 'r1', title: 'Appeler maman', description: 'Important', scheduled_at: future };

    const notifId = await notificationsService.scheduleLocalNotification(reminder);

    expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        content: expect.objectContaining({ title: 'Appeler maman' }),
      })
    );
    expect(notifId).toMatch(/^notif_/);
    expect(localDB.saveNotification).toHaveBeenCalledWith(
      'r1', notifId, 'Appeler maman', 'Important', 'local'
    );
  });

  it('skips scheduling when reminder has no scheduled_at', async () => {
    const reminder = { id: 'r2', title: 'Sans date', scheduled_at: null };

    const notifId = await notificationsService.scheduleLocalNotification(reminder);

    expect(notifId).toBeNull();
    expect(Notifications.scheduleNotificationAsync).not.toHaveBeenCalled();
    expect(localDB.saveNotification).not.toHaveBeenCalled();
  });

  it('cancels all scheduled notifications for a reminder', async () => {
    localDB.getNotificationHistory.mockResolvedValue([
      { id: 1, notification_id: 'notif_1', reminder_id: 'r1' },
      { id: 2, notification_id: 'notif_2', reminder_id: 'r1' },
    ]);

    await notificationsService.cancelNotification('r1');

    expect(Notifications.cancelScheduledNotificationAsync).toHaveBeenCalledTimes(2);
    expect(Notifications.cancelScheduledNotificationAsync).toHaveBeenCalledWith('notif_1');
    expect(Notifications.cancelScheduledNotificationAsync).toHaveBeenCalledWith('notif_2');
  });

  it('saves remote notification to history', async () => {
    const remoteData = {
      reminderId: 'r3',
      notificationId: 'push_abc',
      title: 'Rappel serveur',
      body: 'Votre réunion commence dans 10 minutes',
    };

    await notificationsService.handleRemoteNotification(remoteData);

    expect(localDB.saveNotification).toHaveBeenCalledWith(
      'r3', 'push_abc', 'Rappel serveur', 'Votre réunion commence dans 10 minutes', 'remote'
    );
  });
});
