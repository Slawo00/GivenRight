import type { DecisionContext, ExpectationFrame } from '../types';
import { closenessCodeToNumeric } from './helpers';

export interface SocialExpectationOutput {
  expectation_frame: ExpectationFrame;
}

const FORMAL_RELATIONSHIPS = ['colleague', 'acquaintance'];
const CLOSE_RELATIONSHIPS = ['partner', 'parent', 'child', 'sibling'];

const FORMAL_OCCASIONS = ['wedding', 'graduation', 'thank_you'];
const INTIMATE_OCCASIONS = ['valentines', 'anniversary'];

const CONSERVATIVE_CULTURES = ['JP', 'DE', 'GB', 'CH'];
const OPEN_CULTURES = ['US', 'AU', 'BR'];

export function mapSocialExpectation(context: DecisionContext): SocialExpectationOutput {
  let conservativeScore = 0;
  let openScore = 0;
  
  if (FORMAL_RELATIONSHIPS.includes(context.relationship_type)) {
    conservativeScore += 2;
  } else if (CLOSE_RELATIONSHIPS.includes(context.relationship_type)) {
    openScore += 1;
  }
  
  if (FORMAL_OCCASIONS.includes(context.occasion_type)) {
    conservativeScore += 2;
  } else if (INTIMATE_OCCASIONS.includes(context.occasion_type)) {
    openScore += 2;
  }
  
  const countryCode = context.country.toUpperCase().slice(0, 2);
  if (CONSERVATIVE_CULTURES.includes(countryCode)) {
    conservativeScore += 1;
  } else if (OPEN_CULTURES.includes(countryCode)) {
    openScore += 1;
  }
  
  const closenessNumeric = closenessCodeToNumeric(context.closeness_level);
  
  if (closenessNumeric <= 2) {
    conservativeScore += 1;
  } else if (closenessNumeric >= 4) {
    openScore += 1;
  }
  
  let expectation_frame: ExpectationFrame;
  
  const delta = openScore - conservativeScore;
  
  if (delta >= 2) {
    expectation_frame = 'OPEN';
  } else if (delta <= -2) {
    expectation_frame = 'CONSERVATIVE';
  } else {
    expectation_frame = 'BALANCED';
  }
  
  return { expectation_frame };
}
