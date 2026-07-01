import { create } from 'zustand';
import { localDB } from '../db/sqlite';
import { syncService } from '../services/sync.service';

const ARCHIVE_AFTER_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

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
    const reminder = {
      id,
      sync_status: 'pending',
      frequency: 'once',
      ...reminderData,
    };
    await localDB.createReminder(reminder);
    await syncService.queueChange('create', id, reminder);
    await get().load();
    return reminder;
  },

  update: async (id, updates) => {
    const mapped = {};
    if (updates.title !== undefined) mapped.title = updates.title;
    if (updates.description !== undefined) mapped.description = updates.description;
    if (updates.scheduledAt !== undefined) mapped.scheduled_at = updates.scheduledAt;
    if (updates.category !== undefined) mapped.category = updates.category;
    if (updates.priority !== undefined) mapped.priority = updates.priority;
    if (updates.frequency !== undefined) mapped.frequency = updates.frequency;
    if (updates.frequencyDays !== undefined) mapped.frequency_days = updates.frequencyDays;
    if (updates.notifyBefore !== undefined) mapped.notify_before = updates.notifyBefore;

    await localDB.updateReminder(id, { ...mapped, sync_status: 'pending' });
    await syncService.queueChange('update', id, updates);
    await get().load();
  },

  complete: async (id) => {
    const reminder = await localDB.getReminder(id);
    await localDB.updateReminder(id, {
      completed_at: new Date().toISOString(),
      sync_status: 'pending',
    });

    // For recurring: create next occurrence locally using pre-computed next_occurrence
    if (reminder && reminder.frequency && reminder.frequency !== 'once') {
      const nextDate = reminder.next_occurrence ?? computeNextLocal(reminder);
      if (nextDate) {
        const nextId = `local_${Date.now()}_${Math.random().toString(36).slice(2)}`;
        const nextReminder = {
          id: nextId,
          title: reminder.title,
          description: reminder.description,
          category: reminder.category,
          priority: reminder.priority,
          frequency: reminder.frequency,
          frequency_days: reminder.frequency_days,
          scheduled_at: nextDate,
          notify_before: reminder.notify_before,
          context_ai: reminder.context_ai,
          sync_status: 'pending',
        };
        await localDB.createReminder(nextReminder);
        await syncService.queueChange('create', nextId, nextReminder);
      }
    }

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

  archive: async (id) => {
    await localDB.updateReminder(id, {
      archived_at: new Date().toISOString(),
      sync_status: 'pending',
    });
    await syncService.queueChange('update', id, { archivedAt: new Date().toISOString() });
    await get().load();
  },

  restore: async (id) => {
    await localDB.updateReminder(id, {
      archived_at: null,
      completed_at: null,
      sync_status: 'pending',
    });
    await syncService.queueChange('update', id, { archivedAt: null, completedAt: null });
    await get().load();
  },

  remove: async (id) => {
    await localDB.deleteReminder(id);
    try { await syncService.queueChange('delete', id, {}); } catch (e) { console.warn('[remove] sync queue failed:', e); }
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

  // Returns { pending, completed, archived } sections
  getSections: () => {
    const { reminders } = get();
    const now = new Date();
    const archiveCutoff = new Date(now.getTime() - ARCHIVE_AFTER_MS);

    const pending = [];
    const completed = [];
    const archived = [];

    for (const r of reminders) {
      if (r.archived_at) {
        archived.push(r);
      } else if (r.completed_at) {
        // Auto-archive locally if older than 30 days
        if (new Date(r.completed_at) < archiveCutoff) {
          archived.push(r);
        } else {
          completed.push(r);
        }
      } else {
        pending.push(r);
      }
    }

    return { pending, completed, archived };
  },

  // Legacy — used by home screen sections (overdue/today/tomorrow/later)
  getTimeSections: () => {
    const { reminders } = get();
    const overdue = [];
    const today = [];
    const tomorrow = [];
    const later = [];
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrowStart = new Date(todayStart.getTime() + 86400000);
    const dayAfterTomorrow = new Date(tomorrowStart.getTime() + 86400000);

    for (const r of reminders) {
      if (r.completed_at || r.archived_at) continue;
      if (!r.scheduled_at) { later.push(r); continue; }
      const d = new Date(r.scheduled_at);
      if (d < todayStart) overdue.push(r);
      else if (d < tomorrowStart) today.push(r);
      else if (d < dayAfterTomorrow) tomorrow.push(r);
      else later.push(r);
    }

    return { overdue, today, tomorrow, later };
  },
}));

// Local recurrence helper (mirrors backend logic)
function computeNextLocal(reminder) {
  const { frequency, frequency_days, scheduled_at } = reminder;
  if (!frequency || frequency === 'once') return null;

  const base = scheduled_at ? new Date(scheduled_at) : new Date();
  const next = new Date(base);

  if (frequency === 'daily') {
    next.setDate(next.getDate() + 1);
    return next.toISOString();
  }
  if (frequency === 'weekly') {
    next.setDate(next.getDate() + 7);
    return next.toISOString();
  }
  if (frequency === 'monthly') {
    next.setMonth(next.getMonth() + 1);
    return next.toISOString();
  }
  if (frequency === 'custom' && Array.isArray(frequency_days) && frequency_days.length > 0) {
    const today = base.getDay();
    const sorted = [...frequency_days].sort((a, b) => a - b);
    const nextDay = sorted.find((d) => d > today) ?? sorted[0];
    const diff = nextDay > today ? nextDay - today : 7 - today + nextDay;
    next.setDate(next.getDate() + diff);
    return next.toISOString();
  }
  return null;
}
