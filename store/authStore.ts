import { create } from 'zustand';
import { storage } from '../utils/storage';

interface AuthState {
  houseId: string | null;
  userId: string | null;
  isInitialized: boolean;
  setAuth: (houseId: string, userId: string) => Promise<void>;
  setHouseId: (houseId: string) => Promise<void>;
  logout: () => Promise<void>;
  initialize: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  houseId: null,
  userId: null,
  isInitialized: false,
  setAuth: async (houseId, userId) => {
    await storage.setItem('house_id', houseId);
    await storage.setItem('user_id', userId);
    set({ houseId, userId });
  },
  setHouseId: async (houseId) => {
    await storage.setItem('house_id', houseId);
    set({ houseId });
  },
  logout: async () => {
    await storage.removeItem('house_id');
    await storage.removeItem('user_id');
    set({ houseId: null, userId: null });
  },
  initialize: async () => {
    try {
      // Small delay to ensure native modules are ready on Android
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const houseId = await storage.getItem('house_id');
      const userId = await storage.getItem('user_id');
      
      console.log('Storage initialized:', { houseId, userId });
      
      set({ houseId, userId, isInitialized: true });
    } catch (e) {
      console.error('Failed to initialize storage:', e);
      set({ isInitialized: true });
    }
  },
}));
