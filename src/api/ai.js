import client from './client';

export const aiAPI = {
  async parse(text) {
    try {
      const { data } = await client.post('/ai/parse', { text });
      return data;
    } catch {
      return null;
    }
  },

  async getDailySummary() {
    try {
      const { data } = await client.get('/ai/summary');
      return data;
    } catch {
      return null;
    }
  },

  async chat(message, history = [], mode = 'create') {
    const { data } = await client.post('/ai/chat', { message, history, mode });
    return data;
  },

  async recommendations(message, answers) {
    const { data } = await client.post('/ai/recommendations', { message, answers });
    return data;
  },

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

  async getDailyPlan() {
    try {
      const { data } = await client.get('/ai/daily-plan');
      return data;
    } catch {
      return null;
    }
  },

  async transcribe(base64Audio, mimeType = 'audio/m4a') {
    const { data } = await client.post('/ai/transcribe', { audio: base64Audio, mimeType });
    return data.text || '';
  },

  async getHabits() {
    try {
      const { data } = await client.get('/ai/habits');
      return data;
    } catch {
      return null;
    }
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
