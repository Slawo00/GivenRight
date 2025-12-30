import type { DecisionContext, RiskLevel } from '../types';

export interface UncertaintyOutput {
  decision_risk_level: RiskLevel;
}

export function qualifyUncertainty(context: DecisionContext): UncertaintyOutput {
  let riskScore = 0;
  
  if (context.closeness_level >= 4) {
    riskScore += 2;
  } else if (context.closeness_level >= 2) {
    riskScore += 1;
  }
  
  if (context.personal_importance >= 4) {
    riskScore += 2;
  } else if (context.personal_importance >= 2) {
    riskScore += 1;
  }
  
  if (context.time_constraint === 'urgent') {
    riskScore += 2;
  } else if (context.time_constraint === 'normal') {
    riskScore += 1;
  }
  
  const highStakesOccasions: string[] = ['wedding', 'anniversary', 'valentines'];
  const mediumStakesOccasions: string[] = ['birthday', 'graduation', 'christmas'];
  
  if (highStakesOccasions.includes(context.occasion_type)) {
    riskScore += 2;
  } else if (mediumStakesOccasions.includes(context.occasion_type)) {
    riskScore += 1;
  }
  
  let decision_risk_level: RiskLevel;
  
  if (riskScore >= 6) {
    decision_risk_level = 'HIGH';
  } else if (riskScore >= 3) {
    decision_risk_level = 'MEDIUM';
  } else {
    decision_risk_level = 'LOW';
  }
  
  return { decision_risk_level };
}
