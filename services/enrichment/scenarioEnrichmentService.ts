/**
 * STEP B4 — Contextual Scenario Enrichment Service
 * 
 * This service transforms already-decided DecisionResults into
 * user-perceivable, situation-specific explanations using ChatGPT.
 * 
 * STRICT RULES:
 * - READ-ONLY with respect to decisions
 * - No scores, patterns, or options may be changed
 * - Used only for language adaptation and example generation
 * 
 * ARCHITECTURE:
 * - Calls Supabase Edge Function (enrich-explanation)
 * - Edge Function handles OpenAI API securely
 * - Fallback to base explanations if call fails
 */

import type { DecisionContext, DecisionResult, ConfidenceOption } from '../decisionEngine/types';
import type { EnrichedDecisionResult, EnrichedOption, EnrichedExplanation } from '../../types/enrichment';

// Simple in-memory cache
const enrichmentCache = new Map<string, EnrichedDecisionResult>();

// Supabase Edge Function URL
const getEnrichmentUrl = () => {
  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) return null;
  return `${supabaseUrl}/functions/v1/enrich-explanation`;
};

const getSupabaseAnonKey = () => {
  return process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';
};

/**
 * Generate a simple hash for caching.
 */
function simpleHash(obj: unknown): string {
  const str = JSON.stringify(obj);
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16);
}

/**
 * Enrich a single option via Supabase Edge Function.
 * READ-ONLY: Only adds concrete_example_categories, preserves all other data.
 */
async function enrichOption(
  context: DecisionContext,
  option: ConfidenceOption
): Promise<EnrichedOption> {
  const enrichmentUrl = getEnrichmentUrl();
  const anonKey = getSupabaseAnonKey();

  if (!enrichmentUrl || !anonKey) {
    console.warn('Supabase not configured, using fallback');
    return createFallbackOption(option);
  }

  try {
    console.log('Enrichment: calling', enrichmentUrl);
    
    const response = await fetch(enrichmentUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${anonKey}`,
      },
      body: JSON.stringify({
        decision_context: {
          relationship_type: context.relationship_type,
          closeness_level: context.closeness_level,
          occasion_type: context.occasion_type,
          personality_traits: context.personality_traits,
          surprise_tolerance: context.surprise_tolerance,
          values: context.values,
          no_gos: context.no_gos,
          budget_range: context.budget_range,
          gift_type_preference: context.gift_type_preference,
          time_constraint: context.time_constraint,
        },
        decision_option: {
          confidence_type: option.confidence_type,
          pattern_id: option.pattern_id,
          explanation: {
            why_this_works: option.explanation.why_this_works,
            emotional_signal: option.explanation.emotional_signal,
            things_to_consider: option.explanation.things_to_consider,
          },
        },
      }),
    });

    console.log('Enrichment: response status', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Enrichment: error response', errorText);
      throw new Error(`Edge function returned ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    const enriched = data.enriched_explanation || data;

    return {
      confidence_type: option.confidence_type,
      pattern_id: option.pattern_id,
      allowed_object_classes: option.allowed_object_classes,
      explanation: {
        why_this_works: enriched.why_this_works || option.explanation.why_this_works,
        emotional_signal: enriched.emotional_signal || option.explanation.emotional_signal,
        things_to_consider: enriched.things_to_consider || option.explanation.things_to_consider,
        concrete_example_categories: (enriched.concrete_example_categories || []).slice(0, 5),
      },
    };
  } catch (error) {
    console.warn('Enrichment failed for option:', option.confidence_type, error);
    return createFallbackOption(option);
  }
}

/**
 * Create a fallback option without enrichment.
 */
function createFallbackOption(option: ConfidenceOption): EnrichedOption {
  return {
    confidence_type: option.confidence_type,
    pattern_id: option.pattern_id,
    allowed_object_classes: option.allowed_object_classes,
    explanation: {
      why_this_works: option.explanation.why_this_works,
      emotional_signal: option.explanation.emotional_signal,
      things_to_consider: option.explanation.things_to_consider,
      concrete_example_categories: [],
    },
  };
}

/**
 * Main enrichment function.
 * Enriches a DecisionResult with situation-specific explanations and examples.
 * READ-ONLY: Preserves original ordering and all engine metadata.
 * 
 * @param context - The locked DecisionContext
 * @param result - The locked DecisionResult from STEP B2
 * @returns EnrichedDecisionResult with concrete example categories
 */
export async function enrichDecisionResult(
  context: DecisionContext,
  result: DecisionResult
): Promise<EnrichedDecisionResult> {
  const cacheKey = `${simpleHash(context)}_${simpleHash(result)}`;
  const cached = enrichmentCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  try {
    const enrichedOptions = await Promise.all(
      result.options.map((option) => enrichOption(context, option))
    );

    const enrichedResult: EnrichedDecisionResult = {
      options: enrichedOptions,
      decision_risk_level: result.decision_risk_level,
      expectation_frame: result.expectation_frame,
    };

    enrichmentCache.set(cacheKey, enrichedResult);
    return enrichedResult;
  } catch (error) {
    console.warn('Enrichment service failed, returning base result:', error);
    return {
      options: result.options.map((option) => ({
        confidence_type: option.confidence_type,
        pattern_id: option.pattern_id,
        allowed_object_classes: option.allowed_object_classes,
        explanation: {
          why_this_works: option.explanation.why_this_works,
          emotional_signal: option.explanation.emotional_signal,
          things_to_consider: option.explanation.things_to_consider,
          concrete_example_categories: [],
        },
      })),
      decision_risk_level: result.decision_risk_level,
      expectation_frame: result.expectation_frame,
    };
  }
}

/**
 * Clear the enrichment cache.
 */
export function clearEnrichmentCache(): void {
  enrichmentCache.clear();
}

/**
 * Get cache size for debugging.
 */
export function getEnrichmentCacheSize(): number {
  return enrichmentCache.size;
}
