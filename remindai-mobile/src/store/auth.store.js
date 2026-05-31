import { create } from 'zustand';
import { authAPI } from '../api/auth';
import { storage } from '../utils/storage';

export const useAuthStore = create((set, get) => ({
  user: null,
  isSignedIn: false,
  isLoading: true,
  onboardingSeen: false,
  error: null,

  init: async () => {
    try {
      const token = await storage.getAccessToken();
      const user = await storage.getUser();
      const onboardingSeen = await storage.getOnboardingSeen();
      if (token && user) {
        set({ user, isSignedIn: true, onboardingSeen });
        globalThis.__remindaiLogout = get().logout;
      } else {
        set({ onboardingSeen });
      }
    } catch {
      set({ isSignedIn: false });
    } finally {
      set({ isLoading: false });
    }
  },

  signup: async (email, password, name) => {
    set({ error: null });
    const result = await authAPI.signup(email, password, name);
    set({ user: result.user, isSignedIn: true });
    globalThis.__remindaiLogout = useAuthStore.getState().logout;
    return result;
  },

  login: async (email, password) => {
    set({ error: null });
    const result = await authAPI.login(email, password);
    set({ user: result.user, isSignedIn: true });
    globalThis.__remindaiLogout = useAuthStore.getState().logout;
    return result;
  },

  setOnboardingSeen: async () => {
    await storage.setOnboardingSeen();
    set({ onboardingSeen: true });
  },

  logout: async () => {
    await authAPI.logout();
    set({ user: null, isSignedIn: false });
  },

  setError: (error) => set({ error }),
  clearError: () => set({ error: null }),
}));
