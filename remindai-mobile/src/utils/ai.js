import client from '../api/client';
import { parseNLP } from './nlp';

const RATE_WINDOW_MS = 60000; // 1 minute
const RATE_MAX = 10;

// Module-level state — shared across all calls in a session
const _state = { calls: [] };

// Exported for test resets only
export const _resetRateLimit = () => { _state.calls = []; };

function checkRateLimit() {
  const now = Date.now();
  _state.calls = _state.calls.filter((t) => now - t < RATE_WINDOW_MS);
  if (_state.calls.length >= RATE_MAX) return false;
  _state.calls.push(now);
  return true;
}

const localFallback = (text) => ({
  ...parseNLP(text),
  source: 'local',
  confidence: 0.7,
});

export const aiClient = {
  async parseReminder(text) {
    if (!checkRateLimit()) return localFallback(text);
    try {
      const { data } = await client.post('/ai/parse', { text });
      return { ...data, source: 'ai', confidence: data.confidence ?? 0.9 };
    } catch {
      return localFallback(text);
    }
  },

  // Returns { reminder, advice, suggestions, questions, nextStep }
  async chat(message) {
    if (!checkRateLimit()) return null;
    try {
      const { data } = await client.post('/ai/chat', { message });
      return data;
    } catch {
      return null;
    }
  },

  // Returns { intro, recommendations, avoid, tip, reminderTitle }
  async getRecommendations(message, answers) {
    if (!checkRateLimit()) return null;
    try {
      const { data } = await client.post('/ai/recommendations', { message, answers });
      return data;
    } catch {
      return null;
    }
  },

  // Returns { advice, suggestions, optimizations, questions, confirmationText }
  async getAdvice(reminder) {
    if (!checkRateLimit()) return null;
    try {
      const { data } = await client.post('/ai/advice', reminder);
      return data;
    } catch {
      return null;
    }
  },

  async suggestReminders(userContext) {
    if (!checkRateLimit()) return [];
    try {
      const { data } = await client.post('/ai/suggest', userContext);
      return data.suggestions ?? [];
    } catch {
      return [];
    }
  },
};
