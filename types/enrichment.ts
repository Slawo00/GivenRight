/**
 * STEP B4 — Contextual Scenario Enrichment Types
 * 
 * These types define the enrichment layer that transforms
 * decision results into user-perceivable, situation-specific explanations.
 */

/**
 * A concrete example category that helps users imagine
 * what an option could look like in their situation.
 */
export interface ConcreteExampleCategory {
  /** Short, tangible category name */
  title: string;
  /** 1 sentence explaining what this could look like */
  description: string;
  /** Semantic icon reference (no images generated) */
  icon_key: string;
}

/**
 * Enriched explanation with situation-specific context
 * and concrete example categories.
 */
export interface EnrichedExplanation {
  why_this_works: string;
  emotional_signal: string;
  things_to_consider: string[];
  concrete_example_categories: ConcreteExampleCategory[];
}

/**
 * Enriched decision option with enhanced explanation.
 * No synthetic scores - preserves engine data exactly.
 */
export interface EnrichedOption {
  confidence_type: 'SAFE' | 'EMOTIONAL' | 'BOLD';
  pattern_id: string;
  allowed_object_classes: string[];
  explanation: EnrichedExplanation;
}

/**
 * Complete enriched decision result.
 * READ-ONLY: Preserves original engine ordering and metadata.
 */
export interface EnrichedDecisionResult {
  options: EnrichedOption[];
  decision_risk_level: 'LOW' | 'MEDIUM' | 'HIGH';
  expectation_frame: 'CONSERVATIVE' | 'BALANCED' | 'OPEN';
}

/**
 * Cache key for enriched results.
 */
export interface EnrichmentCacheKey {
  contextHash: string;
  resultHash: string;
}
