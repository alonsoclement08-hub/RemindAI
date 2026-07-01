import { syncService } from '../../src/services/sync.service';

jest.mock('../../src/db/sqlite', () => ({
  localDB: {
    getSyncQueue: jest.fn().mockResolvedValue([]),
    getReminder: jest.fn().mockResolvedValue(null),
    createReminder: jest.fn().mockResolvedValue(undefined),
    deleteReminder: jest.fn().mockResolvedValue(undefined),
    markQueueItemSynced: jest.fn().mockResolvedValue(undefined),
    updateQueueItemStatus: jest.fn().mockResolvedValue(undefined),
    addToSyncQueue: jest.fn().mockResolvedValue(undefined),
  },
}));

jest.mock('../../src/api/client', () => ({
  __esModule: true,
  default: { post: jest.fn() },
}));

const { localDB } = require('../../src/db/sqlite');
const client = require('../../src/api/client').default;

beforeEach(() => {
  jest.clearAllMocks();
  // Make _sleep instant so retry tests don't wait
  jest.spyOn(syncService, '_sleep').mockResolvedValue(undefined);
});

afterEach(() => {
  jest.restoreAllMocks();
});

const makeQueueItem = (i, overrides = {}) => ({
  id: i,
  action: 'create',
  reminder_id: `r${i}`,
  payload: JSON.stringify({ title: `Reminder ${i}`, updated_at: new Date().toISOString() }),
  priority: 2,
  ...overrides,
});

describe('sync service', () => {
  it('returns success immediately when queue is empty', async () => {
    localDB.getSyncQueue.mockResolvedValue([]);

    const result = await syncService.syncReminders();

    expect(result).toEqual({ success: true, conflicts: [] });
    expect(client.post).not.toHaveBeenCalled();
  });

  it('sends changes in batches of max 50 items', async () => {
    const items = Array.from({ length: 75 }, (_, i) => makeQueueItem(i));
    localDB.getSyncQueue.mockResolvedValue(items);
    client.post.mockResolvedValue({ data: { server_changes: [], conflicts: [] } });

    await syncService.syncReminders();

    expect(client.post).toHaveBeenCalledTimes(2);
    expect(client.post.mock.calls[0][1].changes).toHaveLength(50);
    expect(client.post.mock.calls[1][1].changes).toHaveLength(25);
  });

  it('applies server version when server updated_at is newer (last-write-wins)', async () => {
    const olderTime = new Date(Date.now() - 5000).toISOString();
    const newerTime = new Date(Date.now() + 5000).toISOString();

    localDB.getSyncQueue.mockResolvedValue([makeQueueItem(1)]);
    client.post.mockResolvedValue({
      data: {
        server_changes: [
          { action: 'update', id: 'r1', reminder: { id: 'r1', title: 'Server title', updated_at: newerTime } },
        ],
        conflicts: [],
      },
    });
    localDB.getReminder.mockResolvedValue({ id: 'r1', title: 'Client title', updated_at: olderTime });

    await syncService.syncReminders();

    expect(localDB.createReminder).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Server title', sync_status: 'synced' })
    );
  });

  it('keeps client version when client updated_at is newer (last-write-wins)', async () => {
    const olderTime = new Date(Date.now() - 5000).toISOString();
    const newerTime = new Date(Date.now() + 5000).toISOString();

    localDB.getSyncQueue.mockResolvedValue([makeQueueItem(1)]);
    client.post.mockResolvedValue({
      data: {
        server_changes: [
          { action: 'update', id: 'r1', reminder: { id: 'r1', title: 'Server title', updated_at: olderTime } },
        ],
        conflicts: [],
      },
    });
    localDB.getReminder.mockResolvedValue({ id: 'r1', title: 'Client title', updated_at: newerTime });

    await syncService.syncReminders();

    expect(localDB.createReminder).not.toHaveBeenCalled();
  });

  it('retries on failure and marks item failed after max retries exceeded', async () => {
    localDB.getSyncQueue.mockResolvedValue([makeQueueItem(1)]);
    client.post.mockRejectedValue(new Error('Network error'));

    const result = await syncService.syncReminders();

    // 1 initial attempt + 3 retries = 4 total
    expect(client.post).toHaveBeenCalledTimes(4);
    expect(localDB.updateQueueItemStatus).toHaveBeenCalledWith(
      1, 'failed', 'Network error'
    );
    expect(result.success).toBe(true); // outer success even if batch failed
  });
});
