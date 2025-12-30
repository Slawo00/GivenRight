import type { DecisionResult, DecisionScore, OccasionType } from "../types/decision";
import type { RelationshipProfile } from "../types/relationship";
import type { BudgetRange } from "../types/common";

interface DecisionInput {
  relationship: RelationshipProfile;
  occasion: OccasionType;
  budget: BudgetRange;
}

export function runMockDecisionEngine(input: DecisionInput): DecisionResult {
  const { relationship, budget, occasion } = input;

  let safeScore = 60;
  let emotionalScore = 60;
  let boldScore = 60;

  if (occasion === "birthday" || occasion === "anniversary") {
    emotionalScore += 10;
  }

  if (occasion === "christmas") {
    safeScore += 10;
  }

  if (occasion === "valentines") {
    emotionalScore += 15;
    boldScore += 10;
  }

  if (occasion === "wedding") {
    emotionalScore += 10;
    safeScore += 5;
  }

  if (relationship.type === "partner") {
    emotionalScore += 20;
    boldScore += 10;
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
    emotionalScore += 10;
    boldScore += 15;
  }

  if (relationship.type === "colleague") {
    safeScore += 20;
    emotionalScore -= 20;
    boldScore -= 30;
  }

  if (relationship.type === "other") {
    safeScore += 10;
  }

  emotionalScore += relationship.closeness * 5;
  boldScore += relationship.closeness * 3;

  if (relationship.surpriseTolerance === "low") {
    boldScore -= 40;
    safeScore += 10;
  }

  if (relationship.surpriseTolerance === "high") {
    boldScore += 15;
  }

  if (budget === "under_50") {
    boldScore -= 20;
  }

  if (budget === "250_plus") {
    boldScore += 10;
    emotionalScore += 5;
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
    explanationByDirection: {
      safe: {
        whyThisWorks: "This option minimizes risk and ensures appreciation.",
        risks: "May feel predictable if emotional depth is expected.",
        emotionalSignal: "Reliability & stability",
      },
      emotional: {
        whyThisWorks: "Balances emotional meaning with thoughtful intent.",
        risks: "Requires understanding of personal preferences.",
        emotionalSignal: "Connection & care",
      },
      bold: {
        whyThisWorks: "Makes a strong statement and creates memorability.",
        risks: "High emotional risk if preferences are misjudged.",
        emotionalSignal: "Intensity & confidence",
      },
    },
  };
}

function clamp(value: number): number {
  return Math.max(0, Math.min(100, value));
}
