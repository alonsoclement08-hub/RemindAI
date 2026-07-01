import client from './client';

export const securityAPI = {
  async report(type, details = {}) {
    try {
      await client.post('/security/report', { type, severity: 'medium', details });
    } catch (_) {}
  },
};
