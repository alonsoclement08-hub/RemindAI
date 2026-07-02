import { create } from 'zustand';
import { authAPI } from '../api/auth';
import { securityAPI } from '../api/security';
import { storage } from '../utils/storage';
import { localDB } from '../db/sqlite';
import { notificationsService } from '../services/notifications.service';

// The on-device SQLite cache has no user_id column — it's a single shared
// store. If the account signing in differs from the one previously stored,
// wipe it first, otherwise one account's reminders leak into another
// account's view when both are used on the same device (e.g. testing a demo
// account on the same phone as the real account). The pending daily-summary
// notification is account-specific too, so it's cancelled along with it.
async function wipeLocalDataIfAccountChanged(previousUser, newUser) {
  if (!previousUser || previousUser.id !== newUser.id) {
    await localDB.wipeAll();
    await notificationsService.cancelDailySummary();
  }
}

export const useAuthStore = create((set, get) => ({
  user: null,
  isSignedIn: false,
  isLoading: true,
  onboardingSeen: false,
  remSetupSeen: false,
  error: null,

  init: async () => {
    try {
      const token = await storage.getAccessToken();
      const user = await storage.getUser();
      const onboardingSeen = await storage.getOnboardingSeen();
      const remSetupSeen = await storage.getRemSetupSeen();
      if (token && user) {
        set({ user, isSignedIn: true, onboardingSeen, remSetupSeen });
        globalThis.__remindaiLogout = get().logout;
      } else {
        set({ onboardingSeen, remSetupSeen });
      }
    } catch {
      set({ isSignedIn: false });
    } finally {
      set({ isLoading: false });
    }
  },

  signup: async (email, password, name) => {
    set({ error: null });
    const previousUser = await storage.getUser();
    const result = await authAPI.signup(email, password, name);
    await wipeLocalDataIfAccountChanged(previousUser, result.user);
    set({ user: result.user, isSignedIn: true });
    globalThis.__remindaiLogout = useAuthStore.getState().logout;
    return result;
  },

  login: async (email, password) => {
    set({ error: null });
    const previousUser = await storage.getUser();
    try {
      const result = await authAPI.login(email, password);
      await wipeLocalDataIfAccountChanged(previousUser, result.user);
      set({ user: result.user, isSignedIn: true });
      globalThis.__remindaiLogout = useAuthStore.getState().logout;
      return result;
    } catch (err) {
      const status = err?.response?.status;
      if (status === 401) securityAPI.report('app_failed_login', { email });
      else if (status === 403) securityAPI.report('app_forbidden', { email, reason: 'blocked' });
      throw err;
    }
  },

  loginWithGoogle: async (accessToken) => {
    set({ error: null });
    const previousUser = await storage.getUser();
    const result = await authAPI.loginWithGoogle(accessToken);
    await wipeLocalDataIfAccountChanged(previousUser, result.user);
    set({ user: result.user, isSignedIn: true });
    globalThis.__remindaiLogout = useAuthStore.getState().logout;
    return result;
  },


  setOnboardingSeen: async () => {
    await storage.setOnboardingSeen();
    set({ onboardingSeen: true });
  },

  setRemSetupSeen: async () => {
    await storage.setRemSetupSeen();
    set({ remSetupSeen: true });
  },

  logout: async () => {
    await authAPI.logout();
    await localDB.wipeAll();
    await notificationsService.cancelDailySummary();
    set({ user: null, isSignedIn: false });
  },

  setError: (error) => set({ error }),
  clearError: () => set({ error: null }),
}));
