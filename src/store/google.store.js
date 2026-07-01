import { create } from 'zustand';
import { isGoogleConnected, getGoogleProfile, disconnectGoogle } from '../services/googleWorkspace';

export const useGoogleStore = create((set) => ({
  connected: false,
  profile: null,

  checkConnection: async () => {
    const connected = await isGoogleConnected();
    if (connected) {
      try {
        const profile = await getGoogleProfile();
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
    await disconnectGoogle();
    set({ connected: false, profile: null });
  },
}));
