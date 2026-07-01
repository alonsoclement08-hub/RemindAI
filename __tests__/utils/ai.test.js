import { aiClient, _resetRateLimit } from '../../src/utils/ai';

jest.mock('../../src/api/client', () => ({
  __esModule: true,
  default: { post: jest.fn() },
}));

const client = require('../../src/api/client').default;

beforeEach(() => {
  jest.clearAllMocks();
  _resetRateLimit();
});

describe('aiClient.parseReminder', () => {
  it('calls /ai/parse with the text and returns server data', async () => {
    const serverData = { title: 'Appeler le client', category: 'work', priority: 3, confidence: 0.92 };
    client.post.mockResolvedValue({ data: serverData });

    const result = await aiClient.parseReminder('Appelle le client demain à 10h');

    expect(client.post).toHaveBeenCalledWith('/ai/parse', { text: 'Appelle le client demain à 10h' });
    expect(result.title).toBe('Appeler le client');
    expect(result.category).toBe('work');
  });

  it('attaches source: "ai" on a successful server response', async () => {
    client.post.mockResolvedValue({ data: { title: 'Test', confidence: 0.88 } });

    const result = await aiClient.parseReminder('Test reminder');

    expect(result.source).toBe('ai');
  });

  it('uses server confidence when provided', async () => {
    client.post.mockResolvedValue({ data: { title: 'T', confidence: 0.75 } });

    const result = await aiClient.parseReminder('Test');

    expect(result.confidence).toBe(0.75);
  });

  it('falls back to local NLP when the API call fails', async () => {
    client.post.mockRejectedValue(new Error('Network error'));

    const result = await aiClient.parseReminder('Médecin demain à 9h');

    expect(result.source).toBe('local');
    expect(result.title).toBeDefined();
  });

  it('sets confidence 0.7 and source "local" on fallback', async () => {
    client.post.mockRejectedValue(new Error('timeout'));

    const result = await aiClient.parseReminder('Appel demain');

    expect(result.source).toBe('local');
    expect(result.confidence).toBe(0.7);
  });
});

describe('aiClient.suggestReminders', () => {
  it('calls /ai/suggest with the user context', async () => {
    const context = { topCategory: 'work', patterns: [] };
    client.post.mockResolvedValue({ data: { suggestions: [] } });

    await aiClient.suggestReminders(context);

    expect(client.post).toHaveBeenCalledWith('/ai/suggest', context);
  });

  it('returns the suggestions array from the server', async () => {
    const suggestions = [
      { title: 'Réunion équipe', category: 'work', priority: 3 },
      { title: 'Sport', category: 'health', priority: 2 },
    ];
    client.post.mockResolvedValue({ data: { suggestions } });

    const result = await aiClient.suggestReminders({});

    expect(result).toHaveLength(2);
    expect(result[0].title).toBe('Réunion équipe');
  });

  it('returns an empty array when the API call fails', async () => {
    client.post.mockRejectedValue(new Error('503'));

    const result = await aiClient.suggestReminders({});

    expect(result).toEqual([]);
  });
});

describe('rate limiter', () => {
  it('falls back to local NLP after 10 requests per minute', async () => {
    client.post.mockResolvedValue({ data: { title: 'AI', confidence: 0.9 } });

    // Exhaust the 10-request budget
    for (let i = 0; i < 10; i++) {
      await aiClient.parseReminder('test');
    }

    // 11th request must use local fallback
    client.post.mockClear();
    const result = await aiClient.parseReminder('demain à 9h');

    expect(client.post).not.toHaveBeenCalled();
    expect(result.source).toBe('local');
    expect(result.confidence).toBe(0.7);
  });
});
