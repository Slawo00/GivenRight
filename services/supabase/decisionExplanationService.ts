import { supabase, isSupabaseConfigured } from "../../config/supabase";
import type { DecisionDirection, DecisionExplanation } from "../../types/decision";

type ExplanationCache = Map<string, DecisionExplanation>;
const cache: ExplanationCache = new Map();

const defaultExplanations: Record<DecisionDirection, DecisionExplanation> = {
  safe: {
    whyThisWorks: "This gift is universally appreciated and unlikely to miss the mark.",
    risks: "Minimal risk of disappointment, but may feel less personal.",
    emotionalSignal: "Shows thoughtfulness while staying within comfortable boundaries.",
  },
  emotional: {
    whyThisWorks: "This gift creates a deeper connection and shows you truly understand the recipient.",
    risks: "Requires knowing the person well. May not land if relationship understanding is off.",
    emotionalSignal: "Carries more meaning and personal significance.",
  },
  bold: {
    whyThisWorks: "This gift makes a statement and creates a memorable moment.",
    risks: "Higher risk, higher reward. Best for strong relationships with adventurous recipients.",
    emotionalSignal: "Shows confidence in your relationship and willingness to take a chance.",
  },
};

export async function getExplanation(
  direction: DecisionDirection,
  locale: string = "en"
): Promise<DecisionExplanation> {
  const cacheKey = `${direction}:${locale}`;
  
  if (cache.has(cacheKey)) {
    return cache.get(cacheKey)!;
  }

  if (!isSupabaseConfigured) {
    return defaultExplanations[direction];
  }

  try {
    const { data, error } = await supabase
      .from("decision_explanations")
      .select("title, body, emotional_signal, risk_note")
      .eq("direction", direction)
      .eq("language", locale)
      .single();

    if (data) {
      const explanation: DecisionExplanation = {
        whyThisWorks: data.body || defaultExplanations[direction].whyThisWorks,
        risks: data.risk_note || defaultExplanations[direction].risks,
        emotionalSignal: data.emotional_signal || defaultExplanations[direction].emotionalSignal,
      };
      cache.set(cacheKey, explanation);
      return explanation;
    }

    if (locale !== "en") {
      return getExplanation(direction, "en");
    }

    return defaultExplanations[direction];
  } catch {
    return defaultExplanations[direction];
  }
}

export async function getAllExplanations(
  locale: string = "en"
): Promise<Record<DecisionDirection, DecisionExplanation>> {
  const [safe, emotional, bold] = await Promise.all([
    getExplanation("safe", locale),
    getExplanation("emotional", locale),
    getExplanation("bold", locale),
  ]);

  return { safe, emotional, bold };
}

export function getDefaultExplanations(): Record<DecisionDirection, DecisionExplanation> {
  return defaultExplanations;
}

export function clearExplanationCache(): void {
  cache.clear();
}
