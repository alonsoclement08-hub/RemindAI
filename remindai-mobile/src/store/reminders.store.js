import { create } from 'zustand';
import { localDB } from '../db/sqlite';
import { syncService } from '../services/sync.service';

export const useRemindersStore = create((set, get) => ({
  reminders: [],
  isLoading: false,
  lastSync: null,

  load: async () => {
    set({ isLoading: true });
    try {
      const reminders = await localDB.getReminders();
      set({ reminders });
    } finally {
      set({ isLoading: false });
    }
  },

  create: async (reminderData) => {
    const id = `local_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const reminder = { id, sync_status: 'pending', ...reminderData };
    await localDB.createReminder(reminder);
    await syncService.queueChange('create', id, reminder);
    await get().load();
    return reminder;
  },

  complete: async (id) => {
    await localDB.updateReminder(id, {
      completed_at: new Date().toISOString(),
      sync_status: 'pending',
    });
    await syncService.queueChange('update', id, { completedAt: new Date().toISOString() });
    await get().load();
  },

  snooze: async (id, minutes) => {
    const reminder = await localDB.getReminder(id);
    if (!reminder) return;
    const base = reminder.scheduled_at ? new Date(reminder.scheduled_at) : new Date();
    const newTime = new Date(base.getTime() + minutes * 60 * 1000).toISOString();
    await localDB.updateReminder(id, { scheduled_at: newTime, sync_status: 'pending' });
    await syncService.queueChange('update', id, { scheduledAt: newTime });
    await get().load();
  },

  remove: async (id) => {
    await localDB.deleteReminder(id);
    await syncService.queueChange('delete', id, {});
    await get().load();
  },

  sync: async () => {
    const result = await syncService.syncReminders();
    if (result.success) {
      set({ lastSync: new Date().toISOString() });
      await get().load();
    }
    return result;
  },

  // Sections computed from reminders list
  getSections: () => {
    const { reminders } = get();
    const overdue = [];
    const today = [];
    const tomorrow = [];
    const later = [];
    const completed = [];
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrowStart = new Date(todayStart.getTime() + 86400000);
    const dayAfterTomorrow = new Date(tomorrowStart.getTime() + 86400000);

    reminders.forEach((r) => {
      if (r.completed_at) { completed.push(r); return; }
      if (!r.scheduled_at) { later.push(r); return; }
      const d = new Date(r.scheduled_at);
      if (d < todayStart) overdue.push(r);
      else if (d < tomorrowStart) today.push(r);
      else if (d < dayAfterTomorrow) tomorrow.push(r);
      else later.push(r);
    });

    return { overdue, today, tomorrow, later, completed };
  },
}));
