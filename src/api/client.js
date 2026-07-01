import axios from 'axios';
import { Platform } from 'react-native';
import { storage } from '../utils/storage';
import { localDB } from '../db/sqlite';

async function reportSecurityEvent(type, details = {}) {
  try {
    const API_URL = process.env.EXPO_PUBLIC_API_URL || `http://localhost:4000/api`;
    await axios.post(`${API_URL}/security/report`, { type, severity: 'medium', details }, {
      timeout: 5000,
      headers: { 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true' },
    });
  } catch (_) {}
}

// On Android emulator, localhost resolves to the emulator itself — use 10.0.2.2 instead.
// On a real device, set EXPO_PUBLIC_API_URL to your machine's LAN IP (e.g. http://192.168.1.42:3000/api).
const DEV_HOST = Platform.OS === 'android' ? '10.0.2.2' : 'localhost';
const API_URL = process.env.EXPO_PUBLIC_API_URL || `http://${DEV_HOST}:4000/api`;

console.log(`[API] base URL: ${API_URL}`);

const client = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'bypass-tunnel-reminder': 'true',
    'ngrok-skip-browser-warning': 'true',
  },
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
        const { data } = await axios.post(`${API_URL}/auth/refresh`, { refreshToken }, {
          headers: { 'ngrok-skip-browser-warning': 'true' },
        });
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

    // 403 → account blocked (or any other forbidden state): force logout so
    // the UI doesn't get stuck retrying with a dead session
    if (error.response?.status === 403) {
      reportSecurityEvent('app_forbidden', { url: original.url });
      await storage.clearAll();
      await localDB.wipeAll();
      if (typeof globalThis.__remindaiLogout === 'function') {
        globalThis.__remindaiLogout();
      }
    }

    // Network error — fail fast, no auto-retry
    if (!error.response) {
      console.log('[API] Network error — serveur injoignable');
    }

    return Promise.reject(error);
  },
);

export default client;
