import { supabase, isSupabaseConfigured } from "../../config/supabase";
import type { DecisionDirection } from "../../types/decision";

export interface ObjectPattern {
  patternKey: string;
  title: string;
  description: string;
  emotionalIntent: string;
  relationshipFit: string;
  thingsToConsider: string[];
  icon: string;
}

type PatternCache = Map<string, ObjectPattern[]>;
const cache: PatternCache = new Map();

const defaultPatterns: Record<DecisionDirection, ObjectPattern[]> = {
  safe: [
    {
      patternKey: "daily_accessory",
      title: "Daily Accessory",
      description: "Something they'll reach for every single day. Reliable, beautiful, and unmistakably thoughtful. This type of gift integrates seamlessly into their existing life without demanding change.",
      emotionalIntent: "Shows you pay attention to their daily life and value their comfort.",
      relationshipFit: "Perfect for relationships where you know their routines well. Works especially for partners, close friends, and family members whose daily patterns you observe naturally.",
      thingsToConsider: [
        "Choose quality over flash - this will be used daily",
        "Consider their existing accessories to avoid redundancy",
        "Think about their personal style - subtle or statement?",
        "Durability matters more than trends"
      ],
      icon: "⌚",
    },
    {
      patternKey: "practical_luxury",
      title: "Practical Luxury",
      description: "A premium version of something they already use. Elevates the ordinary into something special. You're not changing their life - you're making the life they have feel more valuable.",
      emotionalIntent: "Tells them they deserve the best version of what they already enjoy.",
      relationshipFit: "Ideal when you understand their habits but want to show you believe they deserve better. Strong choice for parents, partners, or anyone who puts others first.",
      thingsToConsider: [
        "Identify what they use often but wouldn't upgrade themselves",
        "Premium means quality, not necessarily expensive",
        "Avoid anything that implies criticism of their current choices",
        "Consider the learning curve - familiarity matters"
      ],
      icon: "✨",
    },
    {
      patternKey: "ritual_object",
      title: "Ritual Object",
      description: "Something that becomes part of their daily routine. Coffee, tea, morning light, evening calm. You're giving them a moment of peace they'll associate with your thoughtfulness.",
      emotionalIntent: "Creates a moment of daily joy and a small ritual of comfort.",
      relationshipFit: "Works beautifully for people who value their quiet moments. Strong choice for parents, partners, or friends who need more calm in their lives.",
      thingsToConsider: [
        "Think about their existing routines - morning person or evening?",
        "Choose something that enhances rather than adds complexity",
        "Consider the sensory experience - how it feels, smells, sounds",
        "Simplicity often lands better than elaborate ritual objects"
      ],
      icon: "☕",
    },
  ],
  emotional: [
    {
      patternKey: "shared_experience",
      title: "Shared Experience",
      description: "Not a thing, but a moment together. Something that becomes a memory you'll both carry. You're investing in your relationship itself, not in an object.",
      emotionalIntent: "Says 'I want more moments with you' and values connection over possession.",
      relationshipFit: "Best for relationships where presence matters more than presents. Strong choice for partners, close friends, or family members you don't see enough.",
      thingsToConsider: [
        "Choose something neither of you has done before",
        "Consider their comfort zone - challenge gently, don't overwhelm",
        "Plan around their schedule, not just yours",
        "Leave room for spontaneity within the experience"
      ],
      icon: "🎭",
    },
    {
      patternKey: "symbolic_object",
      title: "Symbolic Object",
      description: "Something that represents your connection. An inside joke, a shared story, a meaningful reference. Only you two understand its full significance.",
      emotionalIntent: "Shows the depth of your understanding and the uniqueness of your bond.",
      relationshipFit: "Perfect for relationships with shared history and private meaning. Strong choice for partners, long-time friends, or anyone who values sentiment over spectacle.",
      thingsToConsider: [
        "The symbol should reference something positive you've shared",
        "Subtlety is powerful - others don't need to understand",
        "Consider how they'll display or use it",
        "Avoid references that might be painful or complicated"
      ],
      icon: "💫",
    },
    {
      patternKey: "personal_artifact",
      title: "Personal Artifact",
      description: "A piece of their identity. Something that says 'I see who you really are.' This gift validates something important about them that others might overlook.",
      emotionalIntent: "Validates who they are becoming and honors their authentic self.",
      relationshipFit: "Works for people in transition or growth. Strong choice for anyone pursuing something meaningful - a hobby, career change, or personal development.",
      thingsToConsider: [
        "Focus on who they're becoming, not who they were",
        "Avoid assumptions - listen to what they actually say they want",
        "Consider whether this aligns with their own self-image",
        "The gift should empower, not define them"
      ],
      icon: "🎨",
    },
  ],
  bold: [
    {
      patternKey: "bespoke_creation",
      title: "Bespoke Creation",
      description: "Something made specifically for them. One of a kind, impossible to replicate, entirely theirs. This is not a product - it's a declaration that they are singular.",
      emotionalIntent: "Declares they are irreplaceable and worth the effort of custom creation.",
      relationshipFit: "Best for people who value uniqueness and effort over convenience. Strong choice for partners, close family, or anyone who feels undervalued by mass-market gifts.",
      thingsToConsider: [
        "Research artisans and makers carefully",
        "Allow plenty of time - bespoke takes longer",
        "Provide clear input without micromanaging",
        "Consider how they'll feel about the visibility of such a gift"
      ],
      icon: "💎",
    },
    {
      patternKey: "statement_piece",
      title: "Statement Piece",
      description: "Something that makes people ask 'Where did you get that?' A gift that starts conversations and elevates how they present themselves to the world.",
      emotionalIntent: "Elevates how they see themselves and how others see them.",
      relationshipFit: "Works for confident people who enjoy being noticed. Strong choice for partners, friends, or family members who embrace bold self-expression.",
      thingsToConsider: [
        "Know their comfort level with attention",
        "Consider where and how they'll use it",
        "Bold doesn't mean flashy - it can mean singular",
        "Make sure it aligns with their personal brand"
      ],
      icon: "🌟",
    },
    {
      patternKey: "transformative_experience",
      title: "Transformative Experience",
      description: "Something that changes them. A skill, a journey, a perspective they didn't have before. You're investing in who they might become, not who they are today.",
      emotionalIntent: "Invests in who they're becoming and believes in their potential.",
      relationshipFit: "Perfect for people open to growth and new challenges. Strong choice for partners, close friends, or anyone who has expressed a desire to learn or change.",
      thingsToConsider: [
        "Listen for what they've said they want to try",
        "Don't project your own growth wishes onto them",
        "Consider the time and energy commitment required",
        "Frame it as an opportunity, not an assignment"
      ],
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
      .select("pattern_key, title, description, emotional_intent, relationship_fit, things_to_consider, icon")
      .eq("direction", direction)
      .eq("language", locale);

    if (data && data.length > 0) {
      const patterns: ObjectPattern[] = data.map(item => ({
        patternKey: item.pattern_key,
        title: item.title,
        description: item.description || "",
        emotionalIntent: item.emotional_intent || "",
        relationshipFit: item.relationship_fit || "",
        thingsToConsider: item.things_to_consider || [],
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

export async function getPatternByKey(
  patternKey: string,
  direction: DecisionDirection,
  locale: string = "en"
): Promise<ObjectPattern | null> {
  const patterns = await getObjectPatterns(direction, locale);
  return patterns.find(p => p.patternKey === patternKey) || null;
}

export function getDefaultPatterns(): Record<DecisionDirection, ObjectPattern[]> {
  return defaultPatterns;
}

export function clearPatternCache(): void {
  cache.clear();
}
