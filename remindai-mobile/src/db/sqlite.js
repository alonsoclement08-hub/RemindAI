import * as SQLite from 'expo-sqlite';
import { initSchema } from './schema';

const MAX_QUEUE_SIZE = 1000;

let db = null;

export const initDB = async () => {
  db = await SQLite.openDatabaseAsync('remindai.db');
  await db.execAsync(initSchema);
  return db;
};

export const getDB = () => {
  if (!db) throw new Error('DB not initialized. Call initDB() first.');
  return db;
};

export const localDB = {
  // ─── Reminders ────────────────────────────────────────────────────────────

  async createReminder(reminder) {
    await getDB().runAsync(
      `INSERT OR REPLACE INTO reminders
       (id, title, description, category, scheduled_at, priority, context_ai, sync_status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        reminder.id,
        reminder.title,
        reminder.description || null,
        reminder.category || 'personal',
        reminder.scheduled_at || reminder.scheduledAt || null,
        reminder.priority || 2,
        reminder.context_ai || null,
        reminder.sync_status || 'pending',
        reminder.created_at || new Date().toISOString(),
        new Date().toISOString(),
      ]
    );
  },

  async getReminders() {
    return getDB().getAllAsync(
      'SELECT * FROM reminders WHERE deleted_at IS NULL ORDER BY scheduled_at ASC, created_at DESC'
    );
  },

  async getReminder(id) {
    return getDB().getFirstAsync('SELECT * FROM reminders WHERE id = ?', [id]);
  },

  async updateReminder(id, updates) {
    const fields = Object.keys(updates).map((k) => `${k} = ?`).join(', ');
    const values = [...Object.values(updates), new Date().toISOString(), id];
    await getDB().runAsync(
      `UPDATE reminders SET ${fields}, updated_at = ? WHERE id = ?`,
      values
    );
  },

  async deleteReminder(id) {
    await getDB().runAsync(
      'UPDATE reminders SET deleted_at = ?, updated_at = ? WHERE id = ?',
      [new Date().toISOString(), new Date().toISOString(), id]
    );
  },

  async getPendingCount() {
    const result = await getDB().getFirstAsync(
      'SELECT COUNT(*) as count FROM reminders WHERE deleted_at IS NULL AND completed_at IS NULL'
    );
    return result?.count || 0;
  },

  // ─── Sync Queue ───────────────────────────────────────────────────────────

  async getSyncQueue() {
    return getDB().getAllAsync(
      "SELECT * FROM sync_queue WHERE status = 'pending' ORDER BY priority DESC, created_at ASC"
    );
  },

  async addToSyncQueue(action, reminderId, payload, priority = 2) {
    // Deduplication: if a pending item for this reminder already exists, update it
    const existing = await getDB().getFirstAsync(
      "SELECT id FROM sync_queue WHERE reminder_id = ? AND status = 'pending'",
      [reminderId]
    );

    if (existing) {
      await getDB().runAsync(
        'UPDATE sync_queue SET action = ?, payload = ?, priority = ?, updated_at = ? WHERE id = ?',
        [action, JSON.stringify(payload), priority, new Date().toISOString(), existing.id]
      );
      return;
    }

    // Enforce max queue size: evict old synced items first, then drop if still full
    const countRow = await getDB().getFirstAsync(
      "SELECT COUNT(*) as count FROM sync_queue WHERE status = 'pending'"
    );
    if ((countRow?.count || 0) >= MAX_QUEUE_SIZE) {
      await getDB().runAsync(
        "DELETE FROM sync_queue WHERE status IN ('synced', 'failed') ORDER BY created_at ASC LIMIT 200"
      );
      const recheck = await getDB().getFirstAsync(
        "SELECT COUNT(*) as count FROM sync_queue WHERE status = 'pending'"
      );
      if ((recheck?.count || 0) >= MAX_QUEUE_SIZE) return; // still full — drop
    }

    await getDB().runAsync(
      'INSERT INTO sync_queue (action, reminder_id, payload, priority) VALUES (?, ?, ?, ?)',
      [action, reminderId, JSON.stringify(payload), priority]
    );
  },

  async markQueueItemSynced(id) {
    await getDB().runAsync(
      "UPDATE sync_queue SET status = 'synced', updated_at = ? WHERE id = ?",
      [new Date().toISOString(), id]
    );
  },

  async updateQueueItemStatus(id, status, error = null) {
    await getDB().runAsync(
      'UPDATE sync_queue SET status = ?, last_error = ?, updated_at = ? WHERE id = ?',
      [status, error, new Date().toISOString(), id]
    );
  },

  // ─── Notification History ─────────────────────────────────────────────────

  async saveNotification(reminderId, notificationId, title, body, type = 'local') {
    await getDB().runAsync(
      'INSERT INTO notification_history (reminder_id, notification_id, title, body, type) VALUES (?, ?, ?, ?, ?)',
      [reminderId, notificationId, title, body, type]
    );
  },

  async getNotificationHistory(reminderId = null) {
    if (reminderId) {
      return getDB().getAllAsync(
        'SELECT * FROM notification_history WHERE reminder_id = ? ORDER BY triggered_at DESC',
        [reminderId]
      );
    }
    return getDB().getAllAsync(
      'SELECT * FROM notification_history ORDER BY triggered_at DESC LIMIT 100'
    );
  },
};
