import client from './client';

export const analyticsAPI = {
  getSummary: (period = 'week') =>
    client.get(`/analytics/summary?period=${period}`).then(r => r.data),

  getCharts: (period = 'week') =>
    client.get(`/analytics/charts?period=${period}`).then(r => r.data),

  getInsights: (period = 'week') =>
    client.get(`/analytics/insights?period=${period}`).then(r => r.data),

  exportText: (period = 'month') =>
    client.get(`/analytics/export/text?period=${period}`).then(r => r.data),
};
