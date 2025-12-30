import type { 
  DecisionContext, 
  FitVector, 
  RiskProfile, 
  PatternScore,
  HistoricalData 
} from '../types';

export interface ScoringOutput {
  pattern_scores: PatternScore[];
}

interface PatternWeights {
  base_weight: number;
  fit_weights: Partial<Record<keyof FitVector, number>>;
  risk_penalties: Partial<Record<string, number>>;
}

const PATTERN_WEIGHTS: Record<string, PatternWeights> = {
  thoughtful_consumable: {
    base_weight: 60,
    fit_weights: { practicality_bias: 0.2 },
    risk_penalties: { disappointment: 0.1 },
  },
  practical_upgrade: {
    base_weight: 55,
    fit_weights: { practicality_bias: 0.4 },
    risk_penalties: { disappointment: 0.15 },
  },
  curated_classic: {
    base_weight: 65,
    fit_weights: { practicality_bias: 0.2, symbolic_affinity: 0.15 },
    risk_penalties: { disappointment: 0.1 },
  },
  shared_experience: {
    base_weight: 55,
    fit_weights: { emotional_openness: 0.3, novelty_tolerance: 0.2 },
    risk_penalties: { overstep: 0.2, misunderstanding: 0.1 },
  },
  personal_artifact: {
    base_weight: 50,
    fit_weights: { symbolic_affinity: 0.4, emotional_openness: 0.2 },
    risk_penalties: { misunderstanding: 0.25 },
  },
  statement_piece: {
    base_weight: 45,
    fit_weights: { novelty_tolerance: 0.4, symbolic_affinity: 0.2 },
    risk_penalties: { disappointment: 0.2, overstep: 0.15 },
  },
  symbolic_object: {
    base_weight: 40,
    fit_weights: { symbolic_affinity: 0.5, emotional_openness: 0.3 },
    risk_penalties: { misunderstanding: 0.3 },
  },
  bespoke_creation: {
    base_weight: 45,
    fit_weights: { symbolic_affinity: 0.35, emotional_openness: 0.25 },
    risk_penalties: { disappointment: 0.25 },
  },
  transformative_experience: {
    base_weight: 40,
    fit_weights: { novelty_tolerance: 0.4, emotional_openness: 0.3 },
    risk_penalties: { disappointment: 0.3, overstep: 0.2 },
  },
};

export function scorePatterns(
  eligiblePatterns: string[],
  context: DecisionContext,
  fitVector: FitVector,
  riskProfile: RiskProfile,
  historicalData?: HistoricalData
): ScoringOutput {
  const pattern_scores: PatternScore[] = [];
  
  for (const patternId of eligiblePatterns) {
    const weights = PATTERN_WEIGHTS[patternId];
    
    if (!weights) {
      pattern_scores.push({
        pattern_id: patternId,
        base_weight: 50,
        fit_bonus: 0,
        risk_penalty: 0,
        historical_boost: 0,
        final_score: 50,
      });
      continue;
    }
    
    let fit_bonus = 0;
    for (const [fitKey, weight] of Object.entries(weights.fit_weights)) {
      const fitValue = fitVector[fitKey as keyof FitVector];
      fit_bonus += (fitValue - 50) * weight;
    }
    
    let risk_penalty = 0;
    const riskMap: Record<string, number> = {
      disappointment: riskProfile.disappointment_risk,
      misunderstanding: riskProfile.misunderstanding_risk,
      overstep: riskProfile.overstep_risk,
      insignificance: riskProfile.insignificance_risk,
    };
    
    for (const [riskKey, penaltyWeight] of Object.entries(weights.risk_penalties)) {
      const riskValue = riskMap[riskKey] || 0;
      risk_penalty += (riskValue / 100) * (penaltyWeight ?? 0) * 30;
    }
    
    let historical_boost = 0;
    if (historicalData?.pattern_success_rates[patternId]) {
      const successRate = historicalData.pattern_success_rates[patternId];
      historical_boost = (successRate - 0.5) * 20;
    }
    
    const final_score = Math.max(0, Math.min(100, 
      weights.base_weight + fit_bonus - risk_penalty + historical_boost
    ));
    
    pattern_scores.push({
      pattern_id: patternId,
      base_weight: weights.base_weight,
      fit_bonus: Math.round(fit_bonus * 10) / 10,
      risk_penalty: Math.round(risk_penalty * 10) / 10,
      historical_boost: Math.round(historical_boost * 10) / 10,
      final_score: Math.round(final_score * 10) / 10,
    });
  }
  
  pattern_scores.sort((a, b) => b.final_score - a.final_score);
  
  return { pattern_scores };
}
