/**
 * E2E Integration Flow Tests
 * Simulate complete user journeys through the full store + service stack.
 * All external I/O (network, SQLite, SecureStore) is mocked.
 */
import { useAuthStore } from '../../src/store/auth.store';
import { useRemindersStore } from '../../src/store/reminders.store';
import { aiClient, _resetRateLimit } from '../../src/utils/ai';
import { parseNLP } from '../../src/utils/nlp';

// ── Mocks ─────────────────────────────────────────────────────────────────────

jest.mock('../../src/api/auth', () => ({
  authAPI: {
    signup: jest.fn(),
    login: jest.fn(),
    logout: jest.fn().mockResolvedValue(undefined),
  },
}));

jest.mock('../../src/utils/storage', () => ({
  storage: {
    setTokens: jest.fn(),
    getAccessToken: jest.fn().mockResolvedValue(null),
    getRefreshToken: jest.fn().mockResolvedValue(null),
    getUser: jest.fn().mockResolvedValue(null),
    setUser: jest.fn(),
    clearAll: jest.fn(),
  },
}));

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

jest.mock('../../src/api/client', () => ({
  __esModule: true,
  default: { post: jest.fn() },
}));

// ── Handles ───────────────────────────────────────────────────────────────────

const { authAPI } = require('../../src/api/auth');
const { localDB } = require('../../src/db/sqlite');
const { syncService } = require('../../src/services/sync.service');
const apiClient = require('../../src/api/client').default;

// ── Setup ─────────────────────────────────────────────────────────────────────

beforeEach(() => {
  jest.clearAllMocks();
  _resetRateLimit();
  useAuthStore.setState({ user: null, isSignedIn: false, isLoading: false, error: null });
  useRemindersStore.setState({ reminders: [], isLoading: false, lastSync: null });
});

// ── F1: Auth Flow ─────────────────────────────────────────────────────────────

describe('E2E F1: Auth flow', () => {
  it('signup → logout → login restores authenticated state', async () => {
    const user = { id: 'u1', email: 'fab@remindai.com', tier: 'free' };
    authAPI.signup.mockResolvedValue({ user, access: 'tok', refresh: 'ref' });
    authAPI.login.mockResolvedValue({ user, access: 'tok2', refresh: 'ref2' });

    // Signup
    await useAuthStore.getState().signup('fab@remindai.com', 'password123', 'Fab');
    expect(useAuthStore.getState().isSignedIn).toBe(true);
    expect(useAuthStore.getState().user.email).toBe('fab@remindai.com');

    // Logout clears state
    await useAuthStore.getState().logout();
    expect(useAuthStore.getState().isSignedIn).toBe(false);
    expect(useAuthStore.getState().user).toBeNull();

    // Login restores state
    await useAuthStore.getState().login('fab@remindai.com', 'password123');
    expect(useAuthStore.getState().isSignedIn).toBe(true);
    expect(useAuthStore.getState().user.tier).toBe('free');
  });
});

// ── F2: Reminder Lifecycle ────────────────────────────────────────────────────

describe('E2E F2: Reminder lifecycle', () => {
  it('create → load → sections → complete', async () => {
    // Step 1: create
    await useRemindersStore.getState().create({ title: 'Réunion équipe', category: 'work', priority: 3 });
    expect(localDB.createReminder).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Réunion équipe', category: 'work' })
    );
    expect(syncService.queueChange).toHaveBeenCalledWith('create', expect.any(String), expect.any(Object));

    // Step 2: load returns the reminder
    const todayISO = new Date().toISOString();
    localDB.getReminders.mockResolvedValue([
      { id: 'r1', title: 'Réunion équipe', scheduled_at: todayISO, completed_at: null },
    ]);
    await useRemindersStore.getState().load();

    // Step 3: sections show it as today
    const { today, completed } = useRemindersStore.getState().getSections();
    expect(today).toHaveLength(1);
    expect(completed).toHaveLength(0);

    // Step 4: complete
    await useRemindersStore.getState().complete('r1');
    expect(localDB.updateReminder).toHaveBeenCalledWith(
      'r1',
      expect.objectContaining({ completed_at: expect.any(String) })
    );
  });
});

// ── F3: Offline → Online Sync ─────────────────────────────────────────────────

describe('E2E F3: Offline → Online sync', () => {
  it('reminder created offline is queued, then synced when back online', async () => {
    // Create while offline (no API call — goes straight to local DB + queue)
    await useRemindersStore.getState().create({
      title: 'Acheter du lait',
      category: 'errand',
      priority: 2,
    });

    // Queue holds the pending change
    expect(syncService.queueChange).toHaveBeenCalledWith(
      'create',
      expect.stringMatching(/^local_/),
      expect.objectContaining({ title: 'Acheter du lait' })
    );
    expect(useRemindersStore.getState().lastSync).toBeNull();

    // Back online — sync succeeds
    const result = await useRemindersStore.getState().sync();
    expect(syncService.syncReminders).toHaveBeenCalled();
    expect(result.success).toBe(true);
    expect(useRemindersStore.getState().lastSync).not.toBeNull();
  });
});

// ── F4: NLP → Create ─────────────────────────────────────────────────────────

describe('E2E F4: NLP-assisted creation', () => {
  it('French text is parsed by NLP engine and reminder is created with correct entities', async () => {
    const text = 'Médecin demain à 14h';
    const parsed = parseNLP(text);

    // NLP must extract health category and 14:00
    expect(parsed.category).toBe('health');
    expect(parsed.scheduledAt.getHours()).toBe(14);

    // Create from parsed result
    await useRemindersStore.getState().create({
      title: parsed.title,
      category: parsed.category,
      priority: parsed.priority,
      scheduled_at: parsed.scheduledAt.toISOString(),
    });

    expect(localDB.createReminder).toHaveBeenCalledWith(
      expect.objectContaining({
        category: 'health',
        scheduled_at: parsed.scheduledAt.toISOString(),
      })
    );
  });
});

// ── F5: AI Fallback → Create ──────────────────────────────────────────────────

describe('E2E F5: AI service unavailable — graceful fallback', () => {
  it('AI parse failure falls back to local NLP and reminder is still created', async () => {
    // AI endpoint is down
    apiClient.post.mockRejectedValue(new Error('Connection refused'));

    const result = await aiClient.parseReminder('Sport demain matin');

    // Must fall back gracefully
    expect(result.source).toBe('local');
    expect(result.confidence).toBe(0.7);
    expect(result.category).toBe('health'); // sport → health

    // App continues — creates reminder with fallback data
    await useRemindersStore.getState().create({
      title: result.title,
      category: result.category,
      priority: result.priority,
    });

    expect(localDB.createReminder).toHaveBeenCalledWith(
      expect.objectContaining({ category: 'health' })
    );
  });
});
