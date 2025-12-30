export type DecisionDirection = "safe" | "emotional" | "bold";

export type RiskLevel = "low" | "medium" | "high";

export type OccasionType =
  | "birthday"
  | "christmas"
  | "anniversary"
  | "wedding"
  | "graduation"
  | "valentines"
  | "mothers_day"
  | "fathers_day"
  | "other";

export interface DecisionScore {
  direction: DecisionDirection;
  score: number;
  risk: RiskLevel;
  recommended: boolean;
}

export interface DecisionExplanation {
  whyThisWorks: string;
  risks: string;
  emotionalSignal: string;
}

export interface DecisionResult {
  scores: DecisionScore[];
  explanationByDirection: Record<DecisionDirection, DecisionExplanation>;
}

export type DecisionStep =
  | "idle"
  | "collecting_inputs"
  | "decision_ready"
  | "direction_selected"
  | "object_class_selection"
  | "pattern_explanation"
  | "completed";
