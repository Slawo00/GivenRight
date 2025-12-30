import type { ID } from './common';
import type { RelationshipType } from './relationship';

export type OccasionType =
  | 'birthday'
  | 'christmas'
  | 'anniversary'
  | 'wedding'
  | 'graduation'
  | 'other';

export type PersonalityTrait =
  | 'creative'
  | 'practical'
  | 'adventurous'
  | 'traditional'
  | 'minimalist'
  | 'luxurious';

export type DecisionFlowStep =
  | 'relationship'
  | 'occasion'
  | 'personality'
  | 'budget'
  | 'preferences'
  | 'result';

export interface DecisionState {
  id: ID;
  currentStep: DecisionFlowStep;
  relationship?: RelationshipType;
  occasion?: OccasionType;
  personality?: PersonalityTrait[];
  budget?: {
    min: number;
    max: number;
    currency: string;
  };
  preferences?: string[];
  completed: boolean;
}
