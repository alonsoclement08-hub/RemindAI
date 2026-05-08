import client from './client';
import { storage } from '../utils/storage';

export const authAPI = {
  async signup(email, password, name) {
    const { data } = await client.post('/auth/signup', { email, password, name });
    await storage.setTokens(data.access, data.refresh);
    await storage.setUser(data.user);
    return data;
  },

  async login(email, password) {
    const { data } = await client.post('/auth/login', { email, password });
    await storage.setTokens(data.access, data.refresh);
    await storage.setUser(data.user);
    return data;
  },

  async logout(token) {
    try {
      await client.post('/auth/logout');
    } catch {}
    await storage.clearAll();
  },
};
