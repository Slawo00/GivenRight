import type { 
  DecisionContext, 
  FitVector, 
  RiskProfile,
  ExpectationFrame,
  HistoricalData 
} from '../types';

export interface PatternFilteringOutput {
  eligible_patterns: string[];
  filtered_reasons: Record<string, string>;
}

interface PatternDefinition {
  id: string;
  name: string;
  occasion_compatibility: string[];
  relationship_compatibility: string[];
  min_budget: string[];
  gift_type: string;
  cultural_restrictions: string[];
  fit_requirements: Partial<FitVector>;
  risk_amplification: Partial<Record<string, number>>;
}

const PATTERN_DEFINITIONS: PatternDefinition[] = [
  {
    id: 'thoughtful_consumable',
    name: 'Thoughtful Consumable',
    occasion_compatibility: ['birthday', 'christmas', 'thank_you', 'just_because', 'other'],
    relationship_compatibility: ['partner', 'parent', 'child', 'sibling', 'friend', 'colleague', 'acquaintance', 'other'],
    min_budget: ['under_50', '50_100', '100_250', '250_plus'],
    gift_type: 'consumable',
    cultural_restrictions: [],
    fit_requirements: {},
    risk_amplification: {},
  },
  {
    id: 'practical_upgrade',
    name: 'Practical Upgrade',
    occasion_compatibility: ['birthday', 'christmas', 'graduation', 'just_because', 'other'],
    relationship_compatibility: ['partner', 'parent', 'child', 'sibling', 'friend', 'colleague', 'other'],
    min_budget: ['50_100', '100_250', '250_plus'],
    gift_type: 'physical',
    cultural_restrictions: [],
    fit_requirements: { practicality_bias: 40 },
    risk_amplification: {},
  },
  {
    id: 'curated_classic',
    name: 'Curated Classic',
    occasion_compatibility: ['birthday', 'christmas', 'wedding', 'graduation', 'anniversary', 'thank_you'],
    relationship_compatibility: ['partner', 'parent', 'child', 'sibling', 'friend', 'colleague', 'other'],
    min_budget: ['50_100', '100_250', '250_plus'],
    gift_type: 'physical',
    cultural_restrictions: [],
    fit_requirements: {},
    risk_amplification: {},
  },
  {
    id: 'shared_experience',
    name: 'Shared Experience',
    occasion_compatibility: ['birthday', 'valentines', 'anniversary', 'just_because'],
    relationship_compatibility: ['partner', 'parent', 'child', 'sibling', 'friend'],
    min_budget: ['50_100', '100_250', '250_plus'],
    gift_type: 'experience',
    cultural_restrictions: [],
    fit_requirements: { emotional_openness: 40 },
    risk_amplification: { overstep: 10 },
  },
  {
    id: 'personal_artifact',
    name: 'Personal Artifact',
    occasion_compatibility: ['birthday', 'christmas', 'graduation', 'wedding', 'anniversary'],
    relationship_compatibility: ['partner', 'parent', 'child', 'sibling', 'friend'],
    min_budget: ['50_100', '100_250', '250_plus'],
    gift_type: 'physical',
    cultural_restrictions: [],
    fit_requirements: { symbolic_affinity: 50 },
    risk_amplification: { misunderstanding: 15 },
  },
  {
    id: 'statement_piece',
    name: 'Statement Piece',
    occasion_compatibility: ['birthday', 'christmas', 'wedding', 'graduation', 'anniversary'],
    relationship_compatibility: ['partner', 'parent', 'friend'],
    min_budget: ['100_250', '250_plus'],
    gift_type: 'physical',
    cultural_restrictions: [],
    fit_requirements: { novelty_tolerance: 50 },
    risk_amplification: { disappointment: 10, overstep: 10 },
  },
  {
    id: 'symbolic_object',
    name: 'Symbolic Object',
    occasion_compatibility: ['valentines', 'anniversary', 'wedding', 'graduation'],
    relationship_compatibility: ['partner', 'parent', 'child'],
    min_budget: ['50_100', '100_250', '250_plus'],
    gift_type: 'physical',
    cultural_restrictions: [],
    fit_requirements: { symbolic_affinity: 60, emotional_openness: 50 },
    risk_amplification: { misunderstanding: 20 },
  },
  {
    id: 'bespoke_creation',
    name: 'Bespoke Creation',
    occasion_compatibility: ['birthday', 'wedding', 'anniversary'],
    relationship_compatibility: ['partner', 'parent', 'child', 'sibling', 'friend'],
    min_budget: ['100_250', '250_plus'],
    gift_type: 'physical',
    cultural_restrictions: [],
    fit_requirements: { symbolic_affinity: 50, emotional_openness: 40 },
    risk_amplification: { disappointment: 15 },
  },
  {
    id: 'transformative_experience',
    name: 'Transformative Experience',
    occasion_compatibility: ['birthday', 'graduation', 'anniversary'],
    relationship_compatibility: ['partner', 'parent', 'child', 'friend'],
    min_budget: ['100_250', '250_plus'],
    gift_type: 'experience',
    cultural_restrictions: [],
    fit_requirements: { novelty_tolerance: 60, emotional_openness: 50 },
    risk_amplification: { disappointment: 20, overstep: 15 },
  },
];

const BUDGET_ORDER = ['under_50', '50_100', '100_250', '250_plus'];

export function filterPatterns(
  context: DecisionContext,
  fitVector: FitVector,
  riskProfile: RiskProfile,
  expectationFrame: ExpectationFrame,
  historicalData?: HistoricalData,
  suppressedPatterns?: string[]
): PatternFilteringOutput {
  const eligible_patterns: string[] = [];
  const filtered_reasons: Record<string, string> = {};
  
  const budgetIndex = BUDGET_ORDER.indexOf(context.budget_range);
  
  for (const pattern of PATTERN_DEFINITIONS) {
    let reason: string | null = null;
    
    if (suppressedPatterns?.includes(pattern.id)) {
      reason = 'Recently used (cooldown active)';
    }
    
    if (!reason && context.no_gos.length > 0) {
      const patternKeywords = pattern.name.toLowerCase().split(' ');
      for (const noGo of context.no_gos) {
        if (patternKeywords.some(kw => kw.includes(noGo.toLowerCase()))) {
          reason = `Excluded by no-go: ${noGo}`;
          break;
        }
      }
    }
    
    if (!reason && !pattern.occasion_compatibility.includes(context.occasion_type)) {
      reason = `Not suitable for occasion: ${context.occasion_type}`;
    }
    
    if (!reason && !pattern.relationship_compatibility.includes(context.relationship_type)) {
      reason = `Not suitable for relationship: ${context.relationship_type}`;
    }
    
    if (!reason) {
      const minBudgetIndex = Math.min(
        ...pattern.min_budget.map(b => BUDGET_ORDER.indexOf(b))
      );
      if (budgetIndex < minBudgetIndex) {
        reason = `Budget too low (requires ${BUDGET_ORDER[minBudgetIndex]}+)`;
      }
    }
    
    if (!reason && context.gift_type_preference !== 'no_preference') {
      if (pattern.gift_type !== context.gift_type_preference) {
        reason = `Gift type mismatch (${pattern.gift_type} vs ${context.gift_type_preference})`;
      }
    }
    
    if (!reason && pattern.cultural_restrictions.length > 0) {
      const countryCode = context.country.toUpperCase().slice(0, 2);
      if (pattern.cultural_restrictions.includes(countryCode)) {
        reason = `Cultural restriction for ${context.country}`;
      }
    }
    
    if (!reason) {
      for (const [key, minValue] of Object.entries(pattern.fit_requirements)) {
        const actualValue = fitVector[key as keyof FitVector];
        if (actualValue < (minValue as number)) {
          reason = `Low fit for ${key} (${actualValue} < ${minValue})`;
          break;
        }
      }
    }
    
    if (!reason && expectationFrame === 'CONSERVATIVE') {
      const riskAmps = pattern.risk_amplification;
      const riskValues = Object.values(riskAmps);
      const totalRiskAmp = riskValues.length > 0 
        ? riskValues.reduce((a, b) => (a ?? 0) + (b ?? 0), 0) ?? 0
        : 0;
      if (totalRiskAmp > 20) {
        reason = 'Too risky for conservative frame';
      }
    }
    
    if (reason) {
      filtered_reasons[pattern.id] = reason;
    } else {
      eligible_patterns.push(pattern.id);
    }
  }
  
  return { eligible_patterns, filtered_reasons };
}
