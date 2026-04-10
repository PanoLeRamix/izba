import { create } from 'zustand';
import { storage } from '../utils/storage';

interface AuthState {
  houseId: string | null;
  houseToken: string | null;
  houseName: string | null;
  userId: string | null;
  userToken: string | null;
  userName: string | null;
  isInitialized: boolean;
  setHouseSession: (houseId: string, houseToken: string, houseName: string) => Promise<void>;
  setUserSession: (session: { 
    houseId: string; 
    houseToken: string; 
    houseName: string;
    userId: string; 
    userToken: string;
    userName: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  initialize: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  houseId: null,
  houseToken: null,
  houseName: null,
  userId: null,
  userToken: null,
  userName: null,
  isInitialized: false,
  setHouseSession: async (houseId, houseToken, houseName) => {
    await storage.setItem('house_id', houseId);
    await storage.setItem('house_token', houseToken);
    await storage.setItem('house_name', houseName);
    await storage.removeItem('user_id');
    await storage.removeItem('user_token');
    await storage.removeItem('user_name');
    set({ houseId, houseToken, houseName, userId: null, userToken: null, userName: null });
  },
  setUserSession: async ({ houseId, houseToken, houseName, userId, userToken, userName }) => {
    await storage.setItem('house_id', houseId);
    await storage.setItem('house_token', houseToken);
    await storage.setItem('house_name', houseName);
    await storage.setItem('user_id', userId);
    await storage.setItem('user_token', userToken);
    await storage.setItem('user_name', userName);
    set({ houseId, houseToken, houseName, userId, userToken, userName });
  },
  logout: async () => {
    await storage.removeItem('house_id');
    await storage.removeItem('house_token');
    await storage.removeItem('house_name');
    await storage.removeItem('user_id');
    await storage.removeItem('user_token');
    await storage.removeItem('user_name');
    set({ houseId: null, houseToken: null, houseName: null, userId: null, userToken: null, userName: null });
  },
  initialize: async () => {
    try {
      const houseId = await storage.getItem('house_id');
      const houseToken = await storage.getItem('house_token');
      const houseName = await storage.getItem('house_name');
      const userId = await storage.getItem('user_id');
      const userToken = await storage.getItem('user_token');
      const userName = await storage.getItem('user_name');

      set({ houseId, houseToken, houseName, userId, userToken, userName, isInitialized: true });
    } catch (e) {
      set({ isInitialized: true });
    }
  },
}));
