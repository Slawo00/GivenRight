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
 */

import OpenAI from 'openai';
import type { DecisionContext, DecisionResult, ConfidenceOption } from '../decisionEngine/types';
import type { EnrichedDecisionResult, EnrichedOption, EnrichedExplanation } from '../../types/enrichment';

// Simple in-memory cache
const enrichmentCache = new Map<string, EnrichedDecisionResult>();

// OpenAI client - uses Replit AI Integrations
const getOpenAIClient = () => {
  return new OpenAI({
    apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY || process.env.EXPO_PUBLIC_OPENAI_API_KEY || '',
    baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
  });
};

/**
 * System prompt for the Explainability Layer.
 * Fixed - never changes based on user input.
 */
const SYSTEM_PROMPT = `You are GivenRight's Explainability Layer.

You receive:
- a locked gifting context
- a locked decision outcome (SAFE / EMOTIONAL / BOLD)

Your task:
Translate the decision into clear, calm, situation-specific language.

For EACH option:
1) Make the option feel distinct in tone and intent
2) Reflect the relationship, occasion, personality, and constraints
3) Generate 3–5 concrete example object categories that help the user imagine what this option could look like

Rules:
- Do NOT recommend products
- Do NOT mention brands or marketplaces
- Do NOT change the decision
- Do NOT sound generic
- Avoid marketing language
- Use grounded, human phrasing

Output must be structured JSON only.`;

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
 * Build the user prompt for a single option.
 */
function buildUserPrompt(
  context: DecisionContext,
  option: ConfidenceOption
): string {
  return JSON.stringify({
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
    decision_result: {
      confidence_type: option.confidence_type,
      pattern_id: option.pattern_id,
      allowed_object_classes: option.allowed_object_classes,
      explanation: {
        why_this_works: option.explanation.why_this_works,
        emotional_signal: option.explanation.emotional_signal,
        things_to_consider: option.explanation.things_to_consider,
      },
    },
  }, null, 2);
}

/**
 * Parse ChatGPT response into EnrichedExplanation.
 */
function parseEnrichmentResponse(
  responseContent: string,
  originalExplanation: ConfidenceOption['explanation']
): EnrichedExplanation {
  try {
    const parsed = JSON.parse(responseContent);
    const enriched = parsed.enriched_explanation || parsed;
    
    return {
      why_this_works: enriched.why_this_works || originalExplanation.why_this_works,
      emotional_signal: enriched.emotional_signal || originalExplanation.emotional_signal,
      things_to_consider: enriched.things_to_consider || originalExplanation.things_to_consider,
      concrete_example_categories: (enriched.concrete_example_categories || []).slice(0, 5),
    };
  } catch {
    // Fallback: return original explanation without examples
    return {
      why_this_works: originalExplanation.why_this_works,
      emotional_signal: originalExplanation.emotional_signal,
      things_to_consider: originalExplanation.things_to_consider,
      concrete_example_categories: [],
    };
  }
}

/**
 * Enrich a single option with ChatGPT.
 * READ-ONLY: Only adds concrete_example_categories, preserves all other data.
 */
async function enrichOption(
  openai: OpenAI,
  context: DecisionContext,
  option: ConfidenceOption
): Promise<EnrichedOption> {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: buildUserPrompt(context, option) },
      ],
      response_format: { type: 'json_object' },
      max_tokens: 1000,
      temperature: 0.7,
    });

    const content = response.choices[0]?.message?.content || '{}';
    const enrichedExplanation = parseEnrichmentResponse(content, option.explanation);

    return {
      confidence_type: option.confidence_type,
      pattern_id: option.pattern_id,
      allowed_object_classes: option.allowed_object_classes,
      explanation: enrichedExplanation,
    };
  } catch (error) {
    console.warn('Enrichment failed for option:', option.confidence_type, error);
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
    const openai = getOpenAIClient();
    
    const enrichedOptions = await Promise.all(
      result.options.map((option) => enrichOption(openai, context, option))
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
