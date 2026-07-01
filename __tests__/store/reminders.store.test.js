import { useRemindersStore } from '../../src/store/reminders.store';

jest.mock('../../src/db/sqlite', () => ({
  localDB: {
    getReminders: jest.fn().mockResolvedValue([]),
    createReminder: jest.fn().mockResolvedValue(undefined),
    updateReminder: jest.fn().mockResolvedValue(undefined),
    deleteReminder: jest.fn().mockResolvedValue(undefined),
    getReminder: jest.fn(),
    addToSyncQueue: jest.fn().mockResolvedValue(undefined),
    getSyncQueue: jest.fn().mockResolvedValue([]),
    markQueueItemSynced: jest.fn().mockResolvedValue(undefined),
  },
}));

jest.mock('../../src/services/sync.service', () => ({
  syncService: {
    queueChange: jest.fn().mockResolvedValue(undefined),
    syncReminders: jest.fn().mockResolvedValue({ success: true, conflicts: [] }),
  },
}));

const { localDB } = require('../../src/db/sqlite');

beforeEach(() => {
  jest.clearAllMocks();
  useRemindersStore.setState({ reminders: [], isLoading: false });
});

describe('reminders store', () => {
  it('load fetches reminders from localDB', async () => {
    const fakeReminders = [
      { id: '1', title: 'Test', scheduled_at: null, completed_at: null },
    ];
    localDB.getReminders.mockResolvedValue(fakeReminders);

    await useRemindersStore.getState().load();
    expect(useRemindersStore.getState().reminders).toEqual(fakeReminders);
  });

  it('create calls localDB.createReminder and reloads', async () => {
    await useRemindersStore.getState().create({ title: 'New reminder', category: 'work', priority: 2 });
    expect(localDB.createReminder).toHaveBeenCalled();
    expect(localDB.getReminders).toHaveBeenCalled();
  });

  it('complete calls updateReminder with completedAt', async () => {
    await useRemindersStore.getState().complete('reminder-1');
    expect(localDB.updateReminder).toHaveBeenCalledWith('reminder-1', expect.objectContaining({
      completed_at: expect.any(String),
    }));
  });

  it('remove soft deletes reminder', async () => {
    await useRemindersStore.getState().remove('reminder-1');
    expect(localDB.deleteReminder).toHaveBeenCalledWith('reminder-1');
  });

  it('getSections splits reminders correctly', () => {
    const now = new Date();
    const todayDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 14, 0).toISOString();
    const tomorrowDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 10, 0).toISOString();

    useRemindersStore.setState({
      reminders: [
        { id: '1', title: 'Today', scheduled_at: todayDate, completed_at: null },
        { id: '2', title: 'Tomorrow', scheduled_at: tomorrowDate, completed_at: null },
        { id: '3', title: 'Done', scheduled_at: todayDate, completed_at: new Date().toISOString() },
      ],
    });

    const sections = useRemindersStore.getState().getSections();
    expect(sections.pending).toHaveLength(2);
    expect(sections.completed).toHaveLength(1);
  });

  it('snooze updates scheduled_at by given minutes', async () => {
    const base = new Date(2026, 4, 10, 9, 0);
    localDB.getReminder.mockResolvedValue({ id: 'r1', scheduled_at: base.toISOString() });

    await useRemindersStore.getState().snooze('r1', 60);

    const call = localDB.updateReminder.mock.calls[0];
    const newTime = new Date(call[1].scheduled_at);
    expect(newTime.getHours()).toBe(10);
  });
});
