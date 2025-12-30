/**
 * STEP B4 — Enrichment State Management
 * 
 * Manages the enrichment process and caches enriched results.
 */

import { create } from 'zustand';
import type { EnrichedDecisionResult } from '../types/enrichment';
import type { DecisionContext, DecisionResult } from '../services/decisionEngine/types';
import { enrichDecisionResult } from '../services/enrichment';

interface EnrichmentState {
  isEnriching: boolean;
  enrichedResult: EnrichedDecisionResult | null;
  error: string | null;
  
  startEnrichment: (context: DecisionContext, result: DecisionResult) => Promise<void>;
  clearEnrichment: () => void;
}

export const useEnrichmentState = create<EnrichmentState>((set) => ({
  isEnriching: false,
  enrichedResult: null,
  error: null,
  
  startEnrichment: async (context: DecisionContext, result: DecisionResult) => {
    set({ isEnriching: true, error: null });
    
    try {
      const enriched = await enrichDecisionResult(context, result);
      set({ enrichedResult: enriched, isEnriching: false });
    } catch (error) {
      console.warn('Enrichment failed:', error);
      set({ 
        isEnriching: false, 
        error: error instanceof Error ? error.message : 'Enrichment failed',
        enrichedResult: null,
      });
    }
  },
  
  clearEnrichment: () => {
    set({ isEnriching: false, enrichedResult: null, error: null });
  },
}));
