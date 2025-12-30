import type { 
  PatternScore, 
  RiskProfile, 
  ExpectationFrame,
  RiskLevel,
  ConfidenceType 
} from '../types';

export interface ConfidenceDerivationOutput {
  confidence_options: Array<{
    confidence_type: ConfidenceType;
    pattern_id: string;
    score: number;
  }>;
}

interface PatternRiskProfile {
  risk_level: 'low' | 'medium' | 'high';
  emotional_weight: 'low' | 'medium' | 'high';
}

const PATTERN_RISK_PROFILES: Record<string, PatternRiskProfile> = {
  thoughtful_consumable: { risk_level: 'low', emotional_weight: 'low' },
  practical_upgrade: { risk_level: 'low', emotional_weight: 'low' },
  curated_classic: { risk_level: 'low', emotional_weight: 'medium' },
  shared_experience: { risk_level: 'medium', emotional_weight: 'high' },
  personal_artifact: { risk_level: 'medium', emotional_weight: 'high' },
  statement_piece: { risk_level: 'high', emotional_weight: 'medium' },
  symbolic_object: { risk_level: 'high', emotional_weight: 'high' },
  bespoke_creation: { risk_level: 'medium', emotional_weight: 'high' },
  transformative_experience: { risk_level: 'high', emotional_weight: 'high' },
};

function getConfidenceType(patternId: string, riskProfile: RiskProfile): ConfidenceType {
  const patternRisk = PATTERN_RISK_PROFILES[patternId];
  
  if (!patternRisk) {
    return 'SAFE';
  }
  
  if (patternRisk.risk_level === 'low') {
    return 'SAFE';
  }
  
  if (patternRisk.risk_level === 'high') {
    return 'BOLD';
  }
  
  if (patternRisk.emotional_weight === 'high') {
    return 'EMOTIONAL';
  }
  
  return 'SAFE';
}

export function deriveConfidence(
  patternScores: PatternScore[],
  riskProfile: RiskProfile,
  expectationFrame: ExpectationFrame,
  decisionRiskLevel: RiskLevel
): ConfidenceDerivationOutput {
  const buckets: Record<ConfidenceType, Array<{ pattern_id: string; score: number }>> = {
    SAFE: [],
    EMOTIONAL: [],
    BOLD: [],
  };
  
  for (const { pattern_id, final_score } of patternScores) {
    const confidenceType = getConfidenceType(pattern_id, riskProfile);
    buckets[confidenceType].push({ pattern_id, score: final_score });
  }
  
  for (const type of Object.keys(buckets) as ConfidenceType[]) {
    buckets[type].sort((a, b) => b.score - a.score);
  }
  
  const confidence_options: ConfidenceDerivationOutput['confidence_options'] = [];
  
  if (buckets.SAFE.length > 0) {
    confidence_options.push({
      confidence_type: 'SAFE',
      pattern_id: buckets.SAFE[0].pattern_id,
      score: buckets.SAFE[0].score,
    });
  }
  
  if (buckets.EMOTIONAL.length > 0) {
    confidence_options.push({
      confidence_type: 'EMOTIONAL',
      pattern_id: buckets.EMOTIONAL[0].pattern_id,
      score: buckets.EMOTIONAL[0].score,
    });
  }
  
  if (expectationFrame !== 'CONSERVATIVE' && buckets.BOLD.length > 0) {
    confidence_options.push({
      confidence_type: 'BOLD',
      pattern_id: buckets.BOLD[0].pattern_id,
      score: buckets.BOLD[0].score,
    });
  }
  
  if (decisionRiskLevel === 'HIGH' && confidence_options.every(o => o.confidence_type !== 'SAFE')) {
    if (patternScores.length > 0) {
      const safestPattern = patternScores[0];
      confidence_options.unshift({
        confidence_type: 'SAFE',
        pattern_id: safestPattern.pattern_id,
        score: safestPattern.final_score,
      });
    }
  }
  
  while (confidence_options.length < 2) {
    if (patternScores.length === 0) {
      confidence_options.push({
        confidence_type: confidence_options.length === 0 ? 'SAFE' : 'EMOTIONAL',
        pattern_id: 'curated_classic',
        score: 50,
      });
    } else {
      for (const { pattern_id, final_score } of patternScores) {
        if (!confidence_options.some(o => o.pattern_id === pattern_id)) {
          const nextType: ConfidenceType = 
            !confidence_options.some(o => o.confidence_type === 'SAFE') ? 'SAFE' :
            !confidence_options.some(o => o.confidence_type === 'EMOTIONAL') ? 'EMOTIONAL' :
            'BOLD';
          confidence_options.push({
            confidence_type: nextType,
            pattern_id,
            score: final_score,
          });
          break;
        }
      }
      if (confidence_options.length < 2 && patternScores.length === 1) {
        const alternativeType: ConfidenceType = 
          confidence_options[0]?.confidence_type === 'SAFE' ? 'EMOTIONAL' : 'SAFE';
        const alternativePattern = 
          confidence_options[0]?.pattern_id === 'thoughtful_consumable' 
            ? 'curated_classic' 
            : 'thoughtful_consumable';
        confidence_options.push({
          confidence_type: alternativeType,
          pattern_id: alternativePattern,
          score: 45,
        });
      }
    }
  }
  
  return { confidence_options: confidence_options.slice(0, 3) };
}
