import { supabase, isSupabaseConfigured } from "../../config/supabase";
import type { DecisionDirection } from "../../types/decision";

export interface ObjectPattern {
  patternKey: string;
  title: string;
  description: string;
  emotionalIntent: string;
  icon: string;
}

type PatternCache = Map<string, ObjectPattern[]>;
const cache: PatternCache = new Map();

const defaultPatterns: Record<DecisionDirection, ObjectPattern[]> = {
  safe: [
    {
      patternKey: "daily_accessory",
      title: "Daily Accessory",
      description: "Something they'll reach for every single day. Reliable, beautiful, and unmistakably thoughtful.",
      emotionalIntent: "Shows you pay attention to their daily life",
      icon: "⌚",
    },
    {
      patternKey: "practical_luxury",
      title: "Practical Luxury",
      description: "A premium version of something they already use. Elevates the ordinary into something special.",
      emotionalIntent: "Tells them they deserve the best",
      icon: "✨",
    },
    {
      patternKey: "ritual_object",
      title: "Ritual Object",
      description: "Something that becomes part of their daily routine. Coffee, tea, morning light, evening calm.",
      emotionalIntent: "Creates a moment of daily joy",
      icon: "☕",
    },
  ],
  emotional: [
    {
      patternKey: "shared_experience",
      title: "Shared Experience",
      description: "Not a thing, but a moment together. Something that becomes a memory you'll both carry.",
      emotionalIntent: "Says 'I want more moments with you'",
      icon: "🎭",
    },
    {
      patternKey: "symbolic_object",
      title: "Symbolic Object",
      description: "Something that represents your connection. An inside joke, a shared story, a meaningful reference.",
      emotionalIntent: "Shows the depth of your understanding",
      icon: "💫",
    },
    {
      patternKey: "personal_artifact",
      title: "Personal Artifact",
      description: "A piece of their identity. Something that says 'I see who you really are.'",
      emotionalIntent: "Validates who they are becoming",
      icon: "🎨",
    },
  ],
  bold: [
    {
      patternKey: "bespoke_creation",
      title: "Bespoke Creation",
      description: "Something made specifically for them. One of a kind, impossible to replicate, entirely theirs.",
      emotionalIntent: "Declares they are irreplaceable",
      icon: "💎",
    },
    {
      patternKey: "statement_piece",
      title: "Statement Piece",
      description: "Something that makes people ask 'Where did you get that?' A gift that starts conversations.",
      emotionalIntent: "Elevates how they see themselves",
      icon: "🌟",
    },
    {
      patternKey: "transformative_experience",
      title: "Transformative Experience",
      description: "Something that changes them. A skill, a journey, a perspective they didn't have before.",
      emotionalIntent: "Invests in who they're becoming",
      icon: "🚀",
    },
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
      .select("pattern_key, title, description, emotional_intent, icon")
      .eq("direction", direction)
      .eq("language", locale);

    if (data && data.length > 0) {
      const patterns: ObjectPattern[] = data.map(item => ({
        patternKey: item.pattern_key,
        title: item.title,
        description: item.description || "",
        emotionalIntent: item.emotional_intent || "",
        icon: item.icon || "🎁",
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
