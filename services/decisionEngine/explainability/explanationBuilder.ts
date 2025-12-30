import type { 
  DecisionContext, 
  RiskProfile, 
  FitVector,
  ExpectationFrame,
  ConfidenceType,
  Explanation 
} from '../types';

interface ExplanationRules {
  why_patterns: Record<string, string>;
  emotional_signals: Record<string, Record<string, string>>;
  consideration_rules: Record<string, string[]>;
}

const EXPLANATION_RULES: ExplanationRules = {
  why_patterns: {
    thoughtful_consumable: 'A carefully chosen consumable shows you pay attention to their preferences without overwhelming.',
    practical_upgrade: 'Something they use regularly, but better. Practical gifts show you understand their daily life.',
    curated_classic: 'A timeless choice that reflects quality and thoughtfulness. Safe but never boring.',
    shared_experience: 'Creating memories together strengthens your connection. The gift is the time spent.',
    personal_artifact: 'Something that carries personal meaning speaks to your unique relationship.',
    statement_piece: 'A bold choice that makes a lasting impression. For when ordinary is not enough.',
    symbolic_object: 'An object that represents something deeper. The meaning transcends the material.',
    bespoke_creation: 'Something made specifically for them shows extraordinary effort and thought.',
    transformative_experience: 'An experience that could change their perspective or open new doors.',
  },
  emotional_signals: {
    partner: {
      SAFE: 'Shows you care about their comfort and happiness.',
      EMOTIONAL: 'Expresses deep affection and understanding.',
      BOLD: 'Demonstrates your desire to surprise and delight.',
    },
    parent: {
      SAFE: 'Honors their preferences and shows respect.',
      EMOTIONAL: 'Acknowledges all they mean to you.',
      BOLD: 'Shows you see them as more than just a parent.',
    },
    child: {
      SAFE: 'Supports their growth with thoughtfulness.',
      EMOTIONAL: 'Expresses your deep connection and pride.',
      BOLD: 'Shows trust in their maturity and individuality.',
    },
    sibling: {
      SAFE: 'Respects your unique dynamic.',
      EMOTIONAL: 'Celebrates your shared history.',
      BOLD: 'Surprises them in a way only you could.',
    },
    friend: {
      SAFE: 'Shows you value the friendship.',
      EMOTIONAL: 'Deepens your bond beyond casual.',
      BOLD: 'Takes your friendship to a new level.',
    },
    colleague: {
      SAFE: 'Professional yet thoughtful.',
      EMOTIONAL: 'Shows genuine appreciation.',
      BOLD: 'Appropriate for your relationship level.',
    },
    acquaintance: {
      SAFE: 'Appropriate without overstepping.',
      EMOTIONAL: 'Warmly acknowledges the connection.',
      BOLD: 'Opens doors for deeper connection.',
    },
    other: {
      SAFE: 'Shows appropriate care and consideration.',
      EMOTIONAL: 'Expresses genuine warmth.',
      BOLD: 'Makes a memorable impression.',
    },
  },
  consideration_rules: {
    disappointment: [
      'This choice depends on knowing their preferences well.',
      'Consider how they might react if it is not quite right.',
    ],
    misunderstanding: [
      'Make sure the meaning is clear to them.',
      'Consider their perspective on symbolic gifts.',
    ],
    overstep: [
      'Consider if this fits your relationship stage.',
      'They may find this unexpectedly personal.',
    ],
    insignificance: [
      'This may feel understated for the occasion.',
      'Consider if this matches the importance of the moment.',
    ],
  },
};

export function buildExplanation(
  patternId: string,
  confidenceType: ConfidenceType,
  context: DecisionContext,
  riskProfile: RiskProfile,
  _fitVector: FitVector,
  _expectationFrame: ExpectationFrame
): Explanation {
  const why_this_works = EXPLANATION_RULES.why_patterns[patternId] 
    || 'A thoughtful choice suited to the occasion.';
  
  const relationshipSignals = EXPLANATION_RULES.emotional_signals[context.relationship_type] 
    || EXPLANATION_RULES.emotional_signals.other;
  const emotional_signal = relationshipSignals[confidenceType] 
    || relationshipSignals.SAFE;
  
  const things_to_consider: string[] = [];
  
  const dominantRisk = riskProfile.dominant_risk_type;
  const riskConsiderations = EXPLANATION_RULES.consideration_rules[dominantRisk];
  if (riskConsiderations && riskConsiderations.length > 0) {
    things_to_consider.push(riskConsiderations[0]);
  }
  
  if (confidenceType === 'BOLD') {
    things_to_consider.push('This is a bolder choice. Make sure it aligns with how they see your relationship.');
  }
  
  if (context.time_constraint === 'urgent') {
    things_to_consider.push('Time is limited. Ensure you can execute this choice well.');
  }
  
  if (context.surprise_tolerance === 'low' && confidenceType !== 'SAFE') {
    things_to_consider.push('They prefer predictability. Consider if they are ready for this.');
  }
  
  if (things_to_consider.length === 0) {
    things_to_consider.push('A well-balanced choice with minimal risk.');
  }
  
  return {
    why_this_works,
    emotional_signal,
    things_to_consider: things_to_consider.slice(0, 3),
  };
}

export function getAllowedObjectClasses(patternId: string): string[] {
  const PATTERN_OBJECT_CLASSES: Record<string, string[]> = {
    thoughtful_consumable: ['gourmet_food', 'specialty_drinks', 'self_care', 'subscription_boxes'],
    practical_upgrade: ['tech_gadgets', 'kitchen_tools', 'workspace', 'travel_gear'],
    curated_classic: ['leather_goods', 'timepieces', 'writing_instruments', 'home_decor'],
    shared_experience: ['dining', 'concerts', 'travel', 'classes', 'adventures'],
    personal_artifact: ['custom_jewelry', 'engraved_items', 'photo_gifts', 'memory_books'],
    statement_piece: ['art', 'designer_items', 'limited_editions', 'rare_finds'],
    symbolic_object: ['heirloom_pieces', 'meaningful_jewelry', 'ceremony_items'],
    bespoke_creation: ['commissioned_art', 'custom_crafted', 'personalized_luxury'],
    transformative_experience: ['retreats', 'masterclasses', 'life_experiences', 'unique_adventures'],
  };
  
  return PATTERN_OBJECT_CLASSES[patternId] || ['general'];
}
