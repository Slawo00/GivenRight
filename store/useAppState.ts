import { create } from 'zustand';

interface AppState {
  appReady: boolean;
  debugMode: boolean;
  setAppReady: (ready: boolean) => void;
  setDebugMode: (enabled: boolean) => void;
  toggleDebugMode: () => void;
}

export const useAppState = create<AppState>((set) => ({
  appReady: false,
  debugMode: true,
  setAppReady: (ready) => set({ appReady: ready }),
  setDebugMode: (enabled) => set({ debugMode: enabled }),
  toggleDebugMode: () => set((state) => ({ debugMode: !state.debugMode })),
}));
