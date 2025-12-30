import { supabase, isSupabaseConfigured } from "../../config/supabase";
import type { DecisionDirection } from "../../types/decision";

export interface ObjectPattern {
  patternKey: string;
  title: string;
  description: string;
}

type PatternCache = Map<string, ObjectPattern[]>;
const cache: PatternCache = new Map();

const defaultPatterns: Record<DecisionDirection, ObjectPattern[]> = {
  safe: [
    { patternKey: "classic_gift", title: "Classic Gift", description: "Traditional, universally appreciated items." },
    { patternKey: "practical_item", title: "Practical Item", description: "Useful everyday items they will definitely use." },
    { patternKey: "gift_card", title: "Gift Card", description: "Let them choose exactly what they want." },
  ],
  emotional: [
    { patternKey: "memory_gift", title: "Memory Gift", description: "Something that captures a shared memory or inside joke." },
    { patternKey: "handmade", title: "Handmade Gift", description: "A personally crafted item showing time and effort." },
    { patternKey: "shared_experience", title: "Shared Experience", description: "An experience you can enjoy together." },
  ],
  bold: [
    { patternKey: "surprise_experience", title: "Surprise Experience", description: "An unexpected adventure or unique experience." },
    { patternKey: "statement_piece", title: "Statement Piece", description: "A memorable, conversation-starting gift." },
    { patternKey: "upgrade", title: "Luxury Upgrade", description: "A premium version of something they love." },
  ],
};

export async function getObjectPatterns(
  direction: DecisionDirection,
  locale: string = "en"
): Promise<ObjectPattern[]> {
  const cacheKey = `${direction}:${locale}`;
  
  if (cache.has(cacheKey)) {
    return cache.get(cacheKey)!;
  }

  if (!isSupabaseConfigured) {
    return defaultPatterns[direction];
  }

  try {
    const { data, error } = await supabase
      .from("object_patterns")
      .select("pattern_key, title, description")
      .eq("direction", direction)
      .eq("language", locale);

    if (data && data.length > 0) {
      const patterns: ObjectPattern[] = data.map(item => ({
        patternKey: item.pattern_key,
        title: item.title,
        description: item.description || "",
      }));
      cache.set(cacheKey, patterns);
      return patterns;
    }

    if (locale !== "en") {
      return getObjectPatterns(direction, "en");
    }

    return defaultPatterns[direction];
  } catch {
    return defaultPatterns[direction];
  }
}

export function getDefaultPatterns(): Record<DecisionDirection, ObjectPattern[]> {
  return defaultPatterns;
}

export function clearPatternCache(): void {
  cache.clear();
}
