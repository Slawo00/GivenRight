import type { DecisionResult, DecisionScore, DecisionExplanation, OccasionType, DecisionDirection } from "../types/decision";
import type { RelationshipProfile, RelationshipType } from "../types/relationship";
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

  const occasionParams = params.occasion[occasion as keyof typeof params.occasion] ?? { safe: 0, emotional: 0, bold: 0 };
  safeScore += occasionParams.safe;
  emotionalScore += occasionParams.emotional;
  boldScore += occasionParams.bold;

  const relParams = params.relationship[relationship.type as RelationshipType] ?? { safe: 0, emotional: 0, bold: 0 };
  safeScore += relParams.safe;
  emotionalScore += relParams.emotional;
  boldScore += relParams.bold;

  if (relationship.closeness >= 4) {
    safeScore += params.closeness.high.safe;
    emotionalScore += params.closeness.high.emotional;
    boldScore += params.closeness.high.bold;
  } else if (relationship.closeness <= 2) {
    safeScore += params.closeness.low.safe;
    emotionalScore += params.closeness.low.emotional;
    boldScore += params.closeness.low.bold;
  }

  if (relationship.surpriseTolerance === "low") {
    safeScore += params.surprise.low.safe;
    emotionalScore += params.surprise.low.emotional;
    boldScore += params.surprise.low.bold;
  } else if (relationship.surpriseTolerance === "high") {
    safeScore += params.surprise.high.safe;
    emotionalScore += params.surprise.high.emotional;
    boldScore += params.surprise.high.bold;
  }

  const budgetParams = params.budget[budget as keyof typeof params.budget] ?? { safe: 0, emotional: 0, bold: 0 };
  safeScore += budgetParams.safe;
  emotionalScore += budgetParams.emotional;
  boldScore += budgetParams.bold;

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
