import type { 
  DecisionContext, 
  DecisionResult, 
  PhaseOutputs,
  HistoricalData 
} from './types';

import { qualifyUncertainty } from './phases/uncertainty';
import { mapSocialExpectation } from './phases/socialExpectation';
import { profileRisk } from './phases/riskProfiling';
import { computePersonalityFit } from './phases/personalityFit';
import { filterPatterns } from './phases/patternFiltering';
import { scorePatterns } from './phases/scoring';
import { deriveConfidence } from './phases/confidenceDerivation';
import { buildExplanation, getAllowedObjectClasses } from './explainability/explanationBuilder';

export interface DecisionEngineOptions {
  historicalData?: HistoricalData;
  suppressedPatterns?: string[];
  debug?: boolean;
}

export interface DecisionEngineResult {
  result: DecisionResult;
  phaseOutputs?: PhaseOutputs;
}

export function runDecisionEngine(
  context: DecisionContext,
  options: DecisionEngineOptions = {}
): DecisionEngineResult {
  const { historicalData, suppressedPatterns, debug = false } = options;
  
  const uncertaintyOutput = qualifyUncertainty(context);
  
  const socialExpectationOutput = mapSocialExpectation(context);
  
  const riskProfilingOutput = profileRisk(context, historicalData);
  
  const personalityFitOutput = computePersonalityFit(context);
  
  const patternFilteringOutput = filterPatterns(
    context,
    personalityFitOutput.fit_vector,
    riskProfilingOutput.risk_profile,
    socialExpectationOutput.expectation_frame,
    historicalData,
    suppressedPatterns
  );
  
  const scoringOutput = scorePatterns(
    patternFilteringOutput.eligible_patterns,
    context,
    personalityFitOutput.fit_vector,
    riskProfilingOutput.risk_profile,
    historicalData
  );
  
  const confidenceDerivationOutput = deriveConfidence(
    scoringOutput.pattern_scores,
    riskProfilingOutput.risk_profile,
    socialExpectationOutput.expectation_frame,
    uncertaintyOutput.decision_risk_level
  );
  
  const options_result = confidenceDerivationOutput.confidence_options.map(option => {
    const explanation = buildExplanation(
      option.pattern_id,
      option.confidence_type,
      context,
      riskProfilingOutput.risk_profile,
      personalityFitOutput.fit_vector,
      socialExpectationOutput.expectation_frame
    );
    
    const allowed_object_classes = getAllowedObjectClasses(option.pattern_id);
    
    return {
      confidence_type: option.confidence_type,
      pattern_id: option.pattern_id,
      allowed_object_classes,
      explanation,
    };
  });
  
  const result: DecisionResult = {
    decision_risk_level: uncertaintyOutput.decision_risk_level,
    expectation_frame: socialExpectationOutput.expectation_frame,
    options: options_result,
  };
  
  if (debug) {
    const phaseOutputs: PhaseOutputs = {
      uncertainty: uncertaintyOutput,
      socialExpectation: socialExpectationOutput,
      riskProfiling: riskProfilingOutput,
      personalityFit: personalityFitOutput,
      patternFiltering: patternFilteringOutput,
      scoring: scoringOutput,
      confidenceDerivation: confidenceDerivationOutput,
    };
    
    return { result, phaseOutputs };
  }
  
  return { result };
}

export function createDefaultContext(): DecisionContext {
  return {
    relationship_type: 'friend',
    closeness_level: 'close',
    occasion_type: 'birthday',
    occasion_importance: 'medium',
    personality_traits: [],
    surprise_tolerance: 'medium',
    values: [],
    no_gos: [],
    budget_range: '50_100',
    gift_type_preference: 'no_preference',
    time_constraint: 'normal',
    country: 'US',
  };
}

export * from './types';
