import client from '../api/client';
import { localDB } from '../db/sqlite';

const BATCH_SIZE = 50;
const MAX_RETRIES = 3;

// Removes null/undefined values to reduce payload size before sync
const compressPayload = (payload) => {
  if (!payload || typeof payload !== 'object') return payload;
  return Object.fromEntries(Object.entries(payload).filter(([, v]) => v != null));
};

// Last-write-wins: returns 'server' or 'client' based on updated_at timestamps
const resolveConflict = (localReminder, serverReminder) => {
  const localTime = new Date(localReminder.updated_at || 0).getTime();
  const serverTime = new Date(serverReminder.updated_at || 0).getTime();
  return serverTime > localTime ? 'server' : 'client';
};

export const syncService = {
  _retryDelays: [3000, 6000, 12000],

  async _sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  },

  async syncReminders() {
    try {
      const allPending = await localDB.getSyncQueue();
      if (allPending.length === 0) return { success: true, conflicts: [] };

      const allConflicts = [];

      // Process in batches of BATCH_SIZE
      for (let i = 0; i < allPending.length; i += BATCH_SIZE) {
        const batch = allPending.slice(i, i + BATCH_SIZE);

        // Mark batch as in-progress
        await Promise.all(
          batch.map((item) => localDB.updateQueueItemStatus(item.id, 'syncing'))
        );

        let attempt = 0;
        let batchDone = false;

        while (!batchDone && attempt <= MAX_RETRIES) {
          try {
            const { data } = await client.post('/sync', {
              client_timestamp: Date.now(),
              changes: batch.map((item) => ({
                action: item.action,
                id: item.reminder_id,
                reminder: compressPayload(JSON.parse(item.payload || '{}')),
              })),
            });

            await Promise.all(
              batch.map((item) => localDB.markQueueItemSynced(item.id))
            );

            // Apply server changes with conflict resolution
            for (const change of data.server_changes || []) {
              if (change.action === 'delete') {
                await localDB.deleteReminder(change.id);
              } else if (change.reminder) {
                const local = await localDB.getReminder(change.id);
                if (local) {
                  const winner = resolveConflict(local, change.reminder);
                  if (winner === 'server') {
                    await localDB.createReminder({ ...change.reminder, sync_status: 'synced' });
                  } else {
                    allConflicts.push({ id: change.id, winner: 'client' });
                  }
                } else {
                  await localDB.createReminder({ ...change.reminder, sync_status: 'synced' });
                }
              }
            }

            allConflicts.push(...(data.conflicts || []));
            batchDone = true;
          } catch (err) {
            attempt++;
            if (attempt <= MAX_RETRIES) {
              await this._sleep(this._retryDelays[attempt - 1]);
            } else {
              await Promise.all(
                batch.map((item) =>
                  localDB.updateQueueItemStatus(item.id, 'failed', err.message)
                )
              );
              batchDone = true;
            }
          }
        }
      }

      return { success: true, conflicts: allConflicts };
    } catch (error) {
      console.error('Sync failed:', error.message);
      return { success: false, error };
    }
  },

  async queueChange(action, reminderId, reminder) {
    const priority = reminder?.priority ?? 2;
    await localDB.addToSyncQueue(action, reminderId, reminder, priority);
  },
};
