import client from './client';

export const dashboardAPI = {
  async getDailySummary() {
    const { data } = await client.get('/dashboard/daily-summary');
    return data;
  },
};
