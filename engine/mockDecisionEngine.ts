import type { DecisionResult, DecisionScore, DecisionExplanation, OccasionType, DecisionDirection } from "../types/decision";
import type { RelationshipProfile } from "../types/relationship";
import type { BudgetRange } from "../types/common";
import { 
  getDefaultParameters, 
  getDefaultExplanations,
  type DecisionParameters 
} from "../services/supabase";

interface DecisionInput {
  relationship: RelationshipProfile;
  occasion: OccasionType;
  budget: BudgetRange;
}

interface ConfiguredDecisionInput extends DecisionInput {
  parameters?: DecisionParameters;
  explanations?: Record<DecisionDirection, DecisionExplanation>;
}

export function runMockDecisionEngine(input: DecisionInput): DecisionResult {
  return runConfiguredDecisionEngine({
    ...input,
    parameters: getDefaultParameters(),
    explanations: getDefaultExplanations(),
  });
}

export function runConfiguredDecisionEngine(input: ConfiguredDecisionInput): DecisionResult {
  const { relationship, budget, occasion } = input;
  const params = input.parameters ?? getDefaultParameters();
  const explanations = input.explanations ?? getDefaultExplanations();

  let safeScore = params.base.safe;
  let emotionalScore = params.base.emotional;
  let boldScore = params.base.bold;

  if (occasion === "birthday" || occasion === "anniversary") {
    emotionalScore += params.occasion.birthday?.emotional ?? 10;
  }

  if (occasion === "christmas") {
    safeScore += params.occasion.christmas?.safe ?? 5;
  }

  if (occasion === "valentines") {
    emotionalScore += params.occasion.valentines?.emotional ?? 15;
    boldScore += params.occasion.valentines?.bold ?? 10;
  }

  if (occasion === "wedding") {
    safeScore += params.occasion.wedding?.safe ?? 10;
    emotionalScore += params.occasion.wedding?.emotional ?? 5;
  }

  if (relationship.type === "partner") {
    emotionalScore += params.relationship.partner?.emotional ?? 15;
    boldScore += params.relationship.partner?.bold ?? 15;
  }

  if (relationship.type === "parent") {
    safeScore += 15;
    emotionalScore += 10;
  }

  if (relationship.type === "child") {
    emotionalScore += 15;
    boldScore += 5;
  }

  if (relationship.type === "friend") {
    emotionalScore += params.relationship.friend?.emotional ?? 10;
    boldScore += 15;
  }

  if (relationship.type === "colleague") {
    safeScore += params.relationship.colleague?.safe ?? 20;
    boldScore += params.relationship.colleague?.bold ?? -10;
    emotionalScore -= 20;
  }

  if (relationship.type === "other") {
    safeScore += 10;
  }

  if (relationship.closeness >= 4) {
    emotionalScore += params.closeness.high?.emotional ?? 10;
    boldScore += params.closeness.high?.bold ?? 20;
  } else if (relationship.closeness <= 2) {
    safeScore += params.closeness.low?.safe ?? 15;
    boldScore += params.closeness.low?.bold ?? -10;
  }

  if (relationship.surpriseTolerance === "low") {
    safeScore += params.surprise.low?.safe ?? 15;
    boldScore -= 40;
  }

  if (relationship.surpriseTolerance === "high") {
    boldScore += params.surprise.high?.bold ?? 15;
  }

  if (budget === "under_50") {
    safeScore += params.budget.under_50?.safe ?? 10;
    boldScore -= 20;
  }

  if (budget === "250_plus") {
    boldScore += params.budget["250_plus"]?.bold ?? 10;
    emotionalScore += params.budget["250_plus"]?.emotional ?? 5;
  }

  const scores: DecisionScore[] = [
    {
      direction: "safe",
      score: clamp(safeScore),
      risk: "low",
      recommended: false,
    },
    {
      direction: "emotional",
      score: clamp(emotionalScore),
      risk: "medium",
      recommended: false,
    },
    {
      direction: "bold",
      score: clamp(boldScore),
      risk: "high",
      recommended: false,
    },
  ];

  const maxScore = Math.max(...scores.map((s) => s.score));
  scores.forEach((s) => {
    s.recommended = s.score === maxScore;
  });

  return {
    scores,
    explanationByDirection: explanations,
  };
}

function clamp(value: number): number {
  return Math.max(0, Math.min(100, value));
}
