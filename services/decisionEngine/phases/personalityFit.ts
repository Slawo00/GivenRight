import type { DecisionContext, FitVector, PersonalityTrait, PersonalValue } from '../types';

export interface PersonalityFitOutput {
  fit_vector: FitVector;
}

const TRAIT_WEIGHTS: Record<PersonalityTrait, Partial<FitVector>> = {
  practical: { practicality_bias: 25, novelty_tolerance: -10 },
  creative: { novelty_tolerance: 20, symbolic_affinity: 10 },
  sentimental: { emotional_openness: 25, symbolic_affinity: 15 },
  adventurous: { novelty_tolerance: 25, practicality_bias: -10 },
  minimalist: { practicality_bias: 15, novelty_tolerance: -5 },
  traditional: { novelty_tolerance: -20, practicality_bias: 10 },
  trendy: { novelty_tolerance: 15, symbolic_affinity: 5 },
  intellectual: { practicality_bias: 10, symbolic_affinity: 10 },
};

const VALUE_WEIGHTS: Record<PersonalValue, Partial<FitVector>> = {
  sustainability: { practicality_bias: 10, symbolic_affinity: 5 },
  quality: { practicality_bias: 15, emotional_openness: 5 },
  uniqueness: { novelty_tolerance: 20, symbolic_affinity: 10 },
  functionality: { practicality_bias: 25, novelty_tolerance: -5 },
  luxury: { emotional_openness: 10, symbolic_affinity: 15 },
  handmade: { emotional_openness: 15, symbolic_affinity: 20 },
  local: { practicality_bias: 5, symbolic_affinity: 10 },
  innovation: { novelty_tolerance: 25, practicality_bias: 5 },
};

export function computePersonalityFit(context: DecisionContext): PersonalityFitOutput {
  const fit_vector: FitVector = {
    novelty_tolerance: 50,
    emotional_openness: 50,
    symbolic_affinity: 50,
    practicality_bias: 50,
  };
  
  for (const trait of context.personality_traits) {
    const weights = TRAIT_WEIGHTS[trait];
    if (weights) {
      if (weights.novelty_tolerance) fit_vector.novelty_tolerance += weights.novelty_tolerance;
      if (weights.emotional_openness) fit_vector.emotional_openness += weights.emotional_openness;
      if (weights.symbolic_affinity) fit_vector.symbolic_affinity += weights.symbolic_affinity;
      if (weights.practicality_bias) fit_vector.practicality_bias += weights.practicality_bias;
    }
  }
  
  for (const value of context.values) {
    const weights = VALUE_WEIGHTS[value];
    if (weights) {
      if (weights.novelty_tolerance) fit_vector.novelty_tolerance += weights.novelty_tolerance;
      if (weights.emotional_openness) fit_vector.emotional_openness += weights.emotional_openness;
      if (weights.symbolic_affinity) fit_vector.symbolic_affinity += weights.symbolic_affinity;
      if (weights.practicality_bias) fit_vector.practicality_bias += weights.practicality_bias;
    }
  }
  
  switch (context.surprise_tolerance) {
    case 'low':
      fit_vector.novelty_tolerance -= 15;
      fit_vector.practicality_bias += 10;
      break;
    case 'high':
      fit_vector.novelty_tolerance += 15;
      fit_vector.emotional_openness += 5;
      break;
  }
  
  fit_vector.novelty_tolerance = Math.max(0, Math.min(100, fit_vector.novelty_tolerance));
  fit_vector.emotional_openness = Math.max(0, Math.min(100, fit_vector.emotional_openness));
  fit_vector.symbolic_affinity = Math.max(0, Math.min(100, fit_vector.symbolic_affinity));
  fit_vector.practicality_bias = Math.max(0, Math.min(100, fit_vector.practicality_bias));
  
  return { fit_vector };
}
