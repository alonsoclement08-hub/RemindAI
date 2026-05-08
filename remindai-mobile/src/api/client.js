import axios from 'axios';
import { Platform } from 'react-native';
import { storage } from '../utils/storage';

// On Android emulator, localhost resolves to the emulator itself — use 10.0.2.2 instead.
// On a real device, set EXPO_PUBLIC_API_URL to your machine's LAN IP (e.g. http://192.168.1.42:3000/api).
const DEV_HOST = Platform.OS === 'android' ? '10.0.2.2' : 'localhost';
const API_URL = process.env.EXPO_PUBLIC_API_URL || `http://${DEV_HOST}:3000/api`;

console.log(`[API] base URL: ${API_URL}`);

const client = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

// ── Request logger ────────────────────────────────────────────────────────────
client.interceptors.request.use(
  async (config) => {
    const token = await storage.getAccessToken();
    if (token) config.headers.Authorization = `Bearer ${token}`;
    console.log(`[API] → ${(config.method || 'GET').toUpperCase()} ${config.baseURL}${config.url}`);
    return config;
  },
  (error) => Promise.reject(error),
);

// ── Response logger + token refresh + retry ───────────────────────────────────
client.interceptors.response.use(
  (response) => {
    console.log(`[API] ← ${response.status} ${response.config.url}`);
    return response;
  },
  async (error) => {
    const original = error.config || {};

    // Log the error clearly
    if (error.response) {
      console.warn(
        `[API] ✗ ${error.response.status} ${original.url}`,
        JSON.stringify(error.response.data),
      );
    } else {
      console.warn(
        `[API] ✗ Network error — ${original.url} — ${error.message}`,
        `\n       Check that the backend is reachable at ${API_URL}`,
      );
    }

    // 401 → try token refresh once
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const refreshToken = await storage.getRefreshToken();
        if (!refreshToken) throw new Error('No refresh token');
        const { data } = await axios.post(`${API_URL}/auth/refresh`, { refreshToken });
        await storage.setTokens(data.access, data.refresh);
        original.headers = { ...original.headers, Authorization: `Bearer ${data.access}` };
        return client(original);
      } catch {
        await storage.clearAll();
        if (typeof globalThis.__remindaiLogout === 'function') {
          globalThis.__remindaiLogout();
        }
        return Promise.reject(error);
      }
    }

    // Network error (no response) → retry once after 1 s
    if (!error.response && !original._networkRetry) {
      original._networkRetry = true;
      console.log('[API] Retrying after network error…');
      await new Promise((r) => setTimeout(r, 1000));
      return client(original);
    }

    return Promise.reject(error);
  },
);

export default client;
