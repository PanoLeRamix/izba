import { create } from 'zustand';
import { storage } from '../utils/storage';

interface AuthState {
  houseId: string | null;
  houseToken: string | null;
  userId: string | null;
  userToken: string | null;
  isInitialized: boolean;
  setHouseSession: (houseId: string, houseToken: string) => Promise<void>;
  setUserSession: (session: { houseId: string; houseToken: string; userId: string; userToken: string }) => Promise<void>;
  logout: () => Promise<void>;
  initialize: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  houseId: null,
  houseToken: null,
  userId: null,
  userToken: null,
  isInitialized: false,
  setHouseSession: async (houseId, houseToken) => {
    await storage.setItem('house_id', houseId);
    await storage.setItem('house_token', houseToken);
    await storage.removeItem('user_id');
    await storage.removeItem('user_token');
    set({ houseId, houseToken, userId: null, userToken: null });
  },
  setUserSession: async ({ houseId, houseToken, userId, userToken }) => {
    await storage.setItem('house_id', houseId);
    await storage.setItem('house_token', houseToken);
    await storage.setItem('user_id', userId);
    await storage.setItem('user_token', userToken);
    set({ houseId, houseToken, userId, userToken });
  },
  logout: async () => {
    await storage.removeItem('house_id');
    await storage.removeItem('house_token');
    await storage.removeItem('user_id');
    await storage.removeItem('user_token');
    set({ houseId: null, houseToken: null, userId: null, userToken: null });
  },
  initialize: async () => {
    try {
      const houseId = await storage.getItem('house_id');
      const houseToken = await storage.getItem('house_token');
      const userId = await storage.getItem('user_id');
      const userToken = await storage.getItem('user_token');

      set({ houseId, houseToken, userId, userToken, isInitialized: true });
    } catch (e) {
      set({ isInitialized: true });
    }
  },
}));
