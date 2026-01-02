export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';
export type ExpectationFrame = 'CONSERVATIVE' | 'BALANCED' | 'OPEN';
export type ConfidenceType = 'SAFE' | 'EMOTIONAL' | 'BOLD';
export type SurpriseTolerance = string;
export type TimeConstraint = string;

export type RelationshipType = 
  | 'partner'
  | 'parent'
  | 'child'
  | 'sibling'
  | 'friend'
  | 'colleague'
  | 'acquaintance'
  | 'other';

export type OccasionType =
  | 'birthday'
  | 'christmas'
  | 'valentines'
  | 'anniversary'
  | 'wedding'
  | 'graduation'
  | 'thank_you'
  | 'just_because'
  | 'other';

export type BudgetRange =
  | 'under_50'
  | '50_100'
  | '100_250'
  | '250_plus';

export type GiftTypePreference = string;

export type PersonalityTrait = string;

export type PersonalValue =
  | 'sustainability'
  | 'quality'
  | 'uniqueness'
  | 'functionality'
  | 'luxury'
  | 'handmade'
  | 'local'
  | 'innovation';

export type RiskType =
  | 'disappointment'
  | 'misunderstanding'
  | 'overstep'
  | 'insignificance';

export type ClosenessLevel = string;
export type OccasionImportance = string;

export interface DecisionContext {
  relationship_type: string;
  closeness_level: string;
  occasion_type: string;
  occasion_importance: string;
  personality_traits: string[];
  surprise_tolerance: string;
  values: string[];
  no_gos: string[];
  budget_range: string;
  gift_type_preference: string;
  time_constraint: string;
  country: string;
  relationship_key?: string;
}

export interface RiskProfile {
  disappointment_risk: number;
  misunderstanding_risk: number;
  overstep_risk: number;
  insignificance_risk: number;
  dominant_risk_type: RiskType;
}

export interface FitVector {
  novelty_tolerance: number;
  emotional_openness: number;
  symbolic_affinity: number;
  practicality_bias: number;
}

export interface PatternScore {
  pattern_id: string;
  base_weight: number;
  fit_bonus: number;
  risk_penalty: number;
  historical_boost: number;
  final_score: number;
}

export interface Explanation {
  why_this_works: string;
  emotional_signal: string;
  things_to_consider: string[];
}

export interface ConfidenceOption {
  confidence_type: ConfidenceType;
  pattern_id: string;
  allowed_object_classes: string[];
  explanation: Explanation;
}

export interface DecisionResult {
  decision_risk_level: RiskLevel;
  expectation_frame: ExpectationFrame;
  options: ConfidenceOption[];
}

export interface PhaseOutputs {
  uncertainty: {
    decision_risk_level: RiskLevel;
  };
  socialExpectation: {
    expectation_frame: ExpectationFrame;
  };
  riskProfiling: {
    risk_profile: RiskProfile;
  };
  personalityFit: {
    fit_vector: FitVector;
  };
  patternFiltering: {
    eligible_patterns: string[];
    filtered_reasons: Record<string, string>;
  };
  scoring: {
    pattern_scores: PatternScore[];
  };
  confidenceDerivation: {
    confidence_options: Array<{
      confidence_type: ConfidenceType;
      pattern_id: string;
      score: number;
    }>;
  };
}

export interface HistoricalData {
  pattern_success_rates: Record<string, number>;
  last_used_patterns: Record<string, number>;
}
