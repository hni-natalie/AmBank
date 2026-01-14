import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { DashboardResponse, CompanySnapshot } from '../api/dashboard';

interface UserInput {
  companyName: string;
  ticker?: string;
  sector?: string;
}

interface AppState {
  userInput: UserInput | null;
  setUserInput: (input: UserInput) => void;
  clearUserInput: () => void;

  // Dashboard cache
  cachedDashboard: DashboardResponse | null;
  cachedSnapshot: CompanySnapshot | null;
  setCachedDashboard: (dashboard: DashboardResponse, snapshot: CompanySnapshot | null) => void;
  clearCache: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      userInput: null,
      setUserInput: (input) => set({ userInput: input }),
      clearUserInput: () => set({ userInput: null }),

      // Dashboard cache
      cachedDashboard: null,
      cachedSnapshot: null,
      setCachedDashboard: (dashboard, snapshot) => set({
        cachedDashboard: dashboard,
        cachedSnapshot: snapshot
      }),
      clearCache: () => set({
        cachedDashboard: null,
        cachedSnapshot: null
      }),
    }),
    {
      name: 'app-storage', // unique name for localStorage key
    }
  )
);
