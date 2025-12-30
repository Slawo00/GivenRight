import { create } from "zustand";
import { RelationshipKey, PatternSuppression, PatternPriority, GiftMemoryEntry, MemoryWriteInput, buildRelationshipKey } from "../types/memory";
import { 
  initializeMemoryService, 
  writeGiftMemory, 
  getSuppressedPatterns, 
  getPatternPriorities,
  getMemoryForRelationship,
  isMemoryServiceReady 
} from "../services/giftMemory";

interface GiftMemoryState {
  isInitialized: boolean;
  relationshipMemoryActive: boolean;
  
  currentRelationshipKey: RelationshipKey | null;
  suppressedPatterns: PatternSuppression[];
  patternPriorities: PatternPriority[];
  relationshipHistory: GiftMemoryEntry[];
  
  initialize: () => Promise<void>;
  setCurrentRelationship: (key: RelationshipKey) => Promise<void>;
  recordDecision: (input: MemoryWriteInput) => Promise<void>;
  isPatternSuppressed: (patternId: string) => boolean;
  getPatternBoost: (patternId: string) => number;
  clearCurrentRelationship: () => void;
}

export const useGiftMemoryState = create<GiftMemoryState>((set, get) => ({
  isInitialized: false,
  relationshipMemoryActive: false,
  
  currentRelationshipKey: null,
  suppressedPatterns: [],
  patternPriorities: [],
  relationshipHistory: [],

  initialize: async () => {
    try {
      await initializeMemoryService();
      set({ 
        isInitialized: true,
        relationshipMemoryActive: isMemoryServiceReady(),
      });
    } catch (error) {
      console.warn("Gift memory initialization failed, using fallback mode");
      set({ isInitialized: true, relationshipMemoryActive: false });
    }
  },

  setCurrentRelationship: async (key: RelationshipKey) => {
    set({ currentRelationshipKey: key });
    
    try {
      const [suppressions, priorities, history] = await Promise.all([
        getSuppressedPatterns(key),
        getPatternPriorities(key),
        getMemoryForRelationship(key),
      ]);
      
      set({
        suppressedPatterns: suppressions,
        patternPriorities: priorities,
        relationshipHistory: history,
      });
    } catch (error) {
      set({
        suppressedPatterns: [],
        patternPriorities: [],
        relationshipHistory: [],
      });
    }
  },

  recordDecision: async (input: MemoryWriteInput) => {
    try {
      await writeGiftMemory(input);
      
      const key: RelationshipKey = {
        userId: input.userId,
        recipientId: input.recipientId,
        relationshipType: input.relationshipType,
      };
      
      const history = await getMemoryForRelationship(key);
      set({ relationshipHistory: history });
    } catch (error) {
      console.warn("Failed to record decision:", error);
    }
  },

  isPatternSuppressed: (patternId: string) => {
    const { suppressedPatterns } = get();
    return suppressedPatterns.some((s) => s.patternId === patternId);
  },

  getPatternBoost: (patternId: string) => {
    const { patternPriorities } = get();
    const priority = patternPriorities.find((p) => p.patternId === patternId);
    return priority?.boost ?? 0;
  },

  clearCurrentRelationship: () => {
    set({
      currentRelationshipKey: null,
      suppressedPatterns: [],
      patternPriorities: [],
      relationshipHistory: [],
    });
  },
}));
