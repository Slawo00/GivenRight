import type { DecisionContext, RiskProfile, RiskType, HistoricalData } from '../types';
import { closenessCodeToNumeric, importanceCodeToNumeric } from './helpers';

export interface RiskProfilingOutput {
  risk_profile: RiskProfile;
}

export function profileRisk(
  context: DecisionContext,
  historicalData?: HistoricalData
): RiskProfilingOutput {
  let disappointment_risk = 30;
  let misunderstanding_risk = 30;
  let overstep_risk = 30;
  let insignificance_risk = 30;
  
  const closenessNumeric = closenessCodeToNumeric(context.closeness_level);
  
  if (closenessNumeric >= 4) {
    disappointment_risk += 20;
    insignificance_risk += 15;
    overstep_risk -= 10;
  } else if (closenessNumeric <= 2) {
    overstep_risk += 25;
    misunderstanding_risk += 15;
    disappointment_risk -= 10;
  }
  
  switch (context.relationship_type) {
    case 'partner':
      disappointment_risk += 15;
      insignificance_risk += 20;
      break;
    case 'colleague':
      overstep_risk += 20;
      misunderstanding_risk += 10;
      break;
    case 'parent':
    case 'child':
      disappointment_risk += 10;
      misunderstanding_risk += 10;
      break;
    case 'friend':
      misunderstanding_risk += 5;
      break;
    case 'acquaintance':
      overstep_risk += 25;
      break;
  }
  
  switch (context.occasion_type) {
    case 'valentines':
    case 'anniversary':
      insignificance_risk += 15;
      disappointment_risk += 10;
      break;
    case 'wedding':
      misunderstanding_risk += 10;
      overstep_risk -= 5;
      break;
    case 'just_because':
      overstep_risk += 10;
      break;
    case 'thank_you':
      overstep_risk += 5;
      break;
  }
  
  const importanceNumeric = importanceCodeToNumeric(context.occasion_importance);
  
  if (importanceNumeric >= 4) {
    disappointment_risk += 10;
    insignificance_risk += 10;
  }
  
  if (historicalData) {
    const successRates = Object.values(historicalData.pattern_success_rates);
    if (successRates.length > 0) {
      const avgSuccess = successRates.reduce((a, b) => a + b, 0) / successRates.length;
      if (avgSuccess >= 0.7) {
        disappointment_risk -= 10;
        misunderstanding_risk -= 5;
      } else if (avgSuccess <= 0.3) {
        disappointment_risk += 10;
        misunderstanding_risk += 10;
      }
    }
  }
  
  disappointment_risk = Math.max(0, Math.min(100, disappointment_risk));
  misunderstanding_risk = Math.max(0, Math.min(100, misunderstanding_risk));
  overstep_risk = Math.max(0, Math.min(100, overstep_risk));
  insignificance_risk = Math.max(0, Math.min(100, insignificance_risk));
  
  const risks: Record<RiskType, number> = {
    disappointment: disappointment_risk,
    misunderstanding: misunderstanding_risk,
    overstep: overstep_risk,
    insignificance: insignificance_risk,
  };
  
  const dominant_risk_type = (Object.entries(risks) as [RiskType, number][])
    .sort((a, b) => b[1] - a[1])[0][0];
  
  return {
    risk_profile: {
      disappointment_risk,
      misunderstanding_risk,
      overstep_risk,
      insignificance_risk,
      dominant_risk_type,
    },
  };
}
