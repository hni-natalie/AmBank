import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UserInput {
  companyName: string;
  ticker?: string;
  sector?: string;
}

interface AppState {
  userInput: UserInput | null;
  setUserInput: (input: UserInput) => void;
  clearUserInput: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      userInput: null,
      setUserInput: (input) => set({ userInput: input }),
      clearUserInput: () => set({ userInput: null }),
    }),
    {
      name: 'app-storage', // unique name for localStorage key
    }
  )
);
