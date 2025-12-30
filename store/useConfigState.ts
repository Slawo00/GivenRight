import { create } from "zustand";
import { isSupabaseConfigured } from "../config/supabase";
import { 
  getDecisionParameters, 
  getAllExplanations,
  getObjectPatterns,
  type DecisionParameters,
  type ObjectPattern
} from "../services/supabase";
import type { DecisionDirection, DecisionExplanation } from "../types/decision";

type ConnectionStatus = "disconnected" | "connecting" | "connected" | "fallback";

interface ConfigState {
  connectionStatus: ConnectionStatus;
  isLoading: boolean;
  lastError?: string;
  locale: string;
  
  parameters?: DecisionParameters;
  explanations?: Record<DecisionDirection, DecisionExplanation>;
  patterns?: Record<DecisionDirection, ObjectPattern[]>;
  
  loadConfig: () => Promise<void>;
  setLocale: (locale: string) => void;
}

export const useConfigState = create<ConfigState>((set, get) => ({
  connectionStatus: isSupabaseConfigured ? "disconnected" : "fallback",
  isLoading: false,
  locale: "en",
  
  loadConfig: async () => {
    if (!isSupabaseConfigured) {
      set({ connectionStatus: "fallback" });
      return;
    }
    
    set({ isLoading: true, connectionStatus: "connecting" });
    
    try {
      const [parameters, explanations, safePatterns, emotionalPatterns, boldPatterns] = await Promise.all([
        getDecisionParameters(),
        getAllExplanations(get().locale),
        getObjectPatterns("safe", get().locale),
        getObjectPatterns("emotional", get().locale),
        getObjectPatterns("bold", get().locale),
      ]);
      
      set({
        parameters,
        explanations,
        patterns: {
          safe: safePatterns,
          emotional: emotionalPatterns,
          bold: boldPatterns,
        },
        connectionStatus: "connected",
        isLoading: false,
        lastError: undefined,
      });
    } catch (error) {
      set({
        connectionStatus: "fallback",
        isLoading: false,
        lastError: error instanceof Error ? error.message : "Unknown error",
      });
    }
  },
  
  setLocale: (locale) => {
    set({ locale });
    get().loadConfig();
  },
}));
