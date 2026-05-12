import client from './client';

export const budgetAPI = {
  async getUsage(category = 'errand', period = 'monthly') {
    const { data } = await client.get('/budget/usage', { params: { category, period } });
    return data;
  },

  async list() {
    const { data } = await client.get('/budget');
    return data;
  },

  async set({ category, budgetLimit, period, alertThreshold = 0.8 }) {
    const { data } = await client.post('/budget/set', { category, budgetLimit, period, alertThreshold });
    return data;
  },

  async update(id, updates) {
    const { data } = await client.patch(`/budget/${id}`, updates);
    return data;
  },

  async remove(id) {
    const { data } = await client.delete(`/budget/${id}`);
    return data;
  },

  async getSmartRecommendations() {
    const { data } = await client.get('/ai/smart-recommendations');
    return data;
  },
};
