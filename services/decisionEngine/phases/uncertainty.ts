import type { DecisionContext, RiskLevel } from '../types';
import { closenessCodeToNumeric, importanceCodeToNumeric } from './helpers';

export interface UncertaintyOutput {
  decision_risk_level: RiskLevel;
}

export function qualifyUncertainty(context: DecisionContext): UncertaintyOutput {
  let riskScore = 0;
  
  const closenessNumeric = closenessCodeToNumeric(context.closeness_level);
  const importanceNumeric = importanceCodeToNumeric(context.occasion_importance);
  
  if (closenessNumeric >= 4) {
    riskScore += 2;
  } else if (closenessNumeric >= 2) {
    riskScore += 1;
  }
  
  if (importanceNumeric >= 4) {
    riskScore += 2;
  } else if (importanceNumeric >= 2) {
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
