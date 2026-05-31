import client from './client';

export const aiAPI = {
  async postFeedback({ reminderId, category, action, rating } = {}) {
    try {
      const { data } = await client.post('/ai/feedback', { reminderId, category, action, rating });
      return data;
    } catch {
      // fire-and-forget — ignore network errors
    }
  },

  async learnPreferences() {
    const { data } = await client.post('/ai/learn-preferences');
    return data;
  },

  async getSmartRecommendations() {
    const { data } = await client.get('/ai/smart-recommendations');
    return data;
  },

  async getPreferences() {
    const { data } = await client.get('/ai/preferences');
    return data;
  },

  async resetPreferences() {
    const { data } = await client.delete('/ai/preferences');
    return data;
  },

  async generateAdvice({ type = 'daily_summary', extraContext = {} } = {}) {
    try {
      const { data } = await client.post('/ai/generate-advice', { type, extraContext });
      return data;
    } catch {
      return null;
    }
  },

  async getReminderAdvice(reminderId) {
    try {
      const { data } = await client.post('/ai/reminder-advice', { reminderId });
      return data;
    } catch {
      return null;
    }
  },
};
