import { create } from 'zustand';
import { isMsConnected, getMsProfile, disconnectMs } from '../services/microsoftGraph';

export const useMicrosoftStore = create((set, get) => ({
  connected: false,
  profile: null,
  loading: false,

  checkConnection: async () => {
    const connected = await isMsConnected();
    if (connected) {
      try {
        const profile = await getMsProfile();
        set({ connected: true, profile });
      } catch {
        set({ connected: false, profile: null });
      }
    } else {
      set({ connected: false, profile: null });
    }
  },

  setConnected: (profile) => set({ connected: true, profile }),

  disconnect: async () => {
    await disconnectMs();
    set({ connected: false, profile: null });
  },
}));
