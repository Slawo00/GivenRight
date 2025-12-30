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
const SYSTEM_PROMPT = `You are GivenRight's Contextual Explainability Layer.

Your role is NOT to make decisions.
All decisions are already final and locked.

You receive:
- a locked gifting context
- a locked decision outcome (SAFE, EMOTIONAL, or BOLD)

Your task:
Make each decision option feel concrete, distinct, and situation-specific
without recommending products or judging quality.

You must:
- reflect the relationship, occasion, personality, and constraints
- help the user imagine what this option could look like in real life
- remain neutral and non-directive

You must NOT:
- recommend products or brands
- suggest that one option is better than another
- use marketing or sales language
- mention prices, deals, or marketplaces
- mention system logic, scoring, or rules

Tone:
- calm
- grounded
- human
- non-promotional

All outputs must be structured JSON only.`;

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
  const contextSummary = [
    context.relationship_type,
    context.occasion_type,
    context.closeness_level === 5 ? 'Very close' : 
      context.closeness_level >= 3 ? 'Moderately close' : 'Not very close',
    context.personality_traits?.join(', '),
    context.surprise_tolerance === 'high' ? 'Loves bold surprises' :
      context.surprise_tolerance === 'low' ? 'Prefers safe choices' : 'Open to surprises',
    context.time_constraint === 'flexible' ? 'Plenty of time' :
      context.time_constraint === 'urgent' ? 'Limited time' : 'Some time',
  ].filter(Boolean).join(' · ');

  return `Context:
${contextSummary}

Decision Option:
{
  confidence_type: "${option.confidence_type}",
  pattern_id: "${option.pattern_id}",
  explanation: {
    why_this_works: "${option.explanation.why_this_works}",
    emotional_signal: "${option.explanation.emotional_signal}",
    things_to_consider: ${JSON.stringify(option.explanation.things_to_consider)}
  }
}

Task:
1) Briefly adapt the language so it clearly fits this specific context.
2) Generate 3–5 concrete example object categories that illustrate
   what this decision option could look like in practice.

Rules for example categories:
- Categories must be generic and neutral
- No brands, products, prices, or marketplaces
- No evaluative language (no "best", "premium deal", etc.)
- Each category must include:
  - a short title
  - a one-sentence description
  - a semantic icon key

Output JSON schema:
{
  "enriched_explanation": {
    "why_this_works": string,
    "emotional_signal": string,
    "things_to_consider": string[],
    "concrete_example_categories": [
      {
        "title": string,
        "description": string,
        "icon_key": string
      }
    ]
  }
}`;
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
