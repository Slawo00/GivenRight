import { create } from 'zustand';
import type { 
  DecisionContext, 
  RelationshipType, 
  OccasionType, 
  PersonalityTrait, 
  SurpriseTolerance,
  PersonalValue,
  BudgetRange,
  GiftTypePreference,
  TimeConstraint,
  ClosenessLevel,
  OccasionImportance
} from '@/services/decisionEngine/types';

type InputStep = 
  | 'idle'
  | 'relationship_occasion'
  | 'the_person'
  | 'boundaries_budget'
  | 'practical_constraints'
  | 'intent_locked';

interface InputCollectionState {
  step: InputStep;
  intentLocked: boolean;
  
  relationship_type: string | null;
  closeness_level: string | null;
  occasion_type: string | null;
  occasion_importance: string | null;
  
  personality_traits: PersonalityTrait[];
  surprise_tolerance: SurpriseTolerance;
  
  values: PersonalValue[];
  no_gos: string[];
  budget_range: BudgetRange | null;
  
  gift_type_preference: GiftTypePreference;
  time_constraint: TimeConstraint;
  country: string;
  relationship_key?: string;
  
  setRelationshipType: (type: string) => void;
  setClosenessLevel: (level: string) => void;
  setOccasionType: (type: string) => void;
  setOccasionImportance: (importance: string) => void;
  
  setPersonalityTraits: (traits: PersonalityTrait[]) => void;
  togglePersonalityTrait: (trait: PersonalityTrait) => void;
  setSurpriseTolerance: (tolerance: SurpriseTolerance) => void;
  
  setValues: (values: PersonalValue[]) => void;
  toggleValue: (value: PersonalValue) => void;
  setNoGos: (noGos: string[]) => void;
  toggleNoGo: (noGo: string) => void;
  setBudgetRange: (range: BudgetRange) => void;
  
  setGiftTypePreference: (pref: GiftTypePreference) => void;
  setTimeConstraint: (constraint: TimeConstraint) => void;
  setCountry: (country: string) => void;
  
  goToStep: (step: InputStep) => void;
  nextStep: () => void;
  lockIntent: () => void;
  
  getDecisionContext: () => DecisionContext | null;
  resetCollection: () => void;
}

const STEP_ORDER: InputStep[] = [
  'idle',
  'relationship_occasion',
  'the_person',
  'boundaries_budget',
  'practical_constraints',
  'intent_locked',
];

export const useInputCollectionState = create<InputCollectionState>((set, get) => ({
  step: 'idle',
  intentLocked: false,
  
  relationship_type: null,
  closeness_level: null,
  occasion_type: null,
  occasion_importance: null,
  
  personality_traits: [],
  surprise_tolerance: 'medium',
  
  values: [],
  no_gos: [],
  budget_range: null,
  
  gift_type_preference: 'no_preference',
  time_constraint: 'normal',
  country: 'US',
  
  setRelationshipType: (type) => {
    if (get().intentLocked) return;
    set({ relationship_type: type });
  },
  setClosenessLevel: (level) => {
    if (get().intentLocked) return;
    set({ closeness_level: level });
  },
  setOccasionType: (type) => {
    if (get().intentLocked) return;
    set({ occasion_type: type });
  },
  setOccasionImportance: (importance) => {
    if (get().intentLocked) return;
    set({ occasion_importance: importance });
  },
  
  setPersonalityTraits: (traits) => {
    if (get().intentLocked) return;
    set({ personality_traits: traits });
  },
  togglePersonalityTrait: (trait) => {
    if (get().intentLocked) return;
    const current = get().personality_traits;
    if (current.includes(trait)) {
      set({ personality_traits: current.filter(t => t !== trait) });
    } else {
      set({ personality_traits: [...current, trait] });
    }
  },
  setSurpriseTolerance: (tolerance) => {
    if (get().intentLocked) return;
    set({ surprise_tolerance: tolerance });
  },
  
  setValues: (values) => {
    if (get().intentLocked) return;
    set({ values });
  },
  toggleValue: (value) => {
    if (get().intentLocked) return;
    const current = get().values;
    if (current.includes(value)) {
      set({ values: current.filter(v => v !== value) });
    } else {
      set({ values: [...current, value] });
    }
  },
  setNoGos: (noGos) => {
    if (get().intentLocked) return;
    set({ no_gos: noGos });
  },
  toggleNoGo: (noGo) => {
    if (get().intentLocked) return;
    const current = get().no_gos;
    if (current.includes(noGo)) {
      set({ no_gos: current.filter(n => n !== noGo) });
    } else {
      set({ no_gos: [...current, noGo] });
    }
  },
  setBudgetRange: (range) => {
    if (get().intentLocked) return;
    set({ budget_range: range });
  },
  
  setGiftTypePreference: (pref) => {
    if (get().intentLocked) return;
    set({ gift_type_preference: pref });
  },
  setTimeConstraint: (constraint) => {
    if (get().intentLocked) return;
    set({ time_constraint: constraint });
  },
  setCountry: (country) => {
    if (get().intentLocked) return;
    set({ country });
  },
  
  goToStep: (step) => set({ step }),
  
  nextStep: () => {
    const currentStep = get().step;
    const currentIndex = STEP_ORDER.indexOf(currentStep);
    if (currentIndex < STEP_ORDER.length - 1) {
      set({ step: STEP_ORDER[currentIndex + 1] });
    }
  },
  
  lockIntent: () => {
    set({ intentLocked: true, step: 'intent_locked' });
  },
  
  getDecisionContext: () => {
    const state = get();
    
    const relationshipType = (state.relationship_type || 'friend') as RelationshipType;
    const occasionType = (state.occasion_type || 'birthday') as OccasionType;
    const closenessLevel = state.closeness_level || 'close';
    const occasionImportance = state.occasion_importance || 'medium';
    
    return {
      relationship_type: relationshipType,
      closeness_level: closenessLevel,
      occasion_type: occasionType,
      occasion_importance: occasionImportance,
      personality_traits: state.personality_traits.length > 0 ? state.personality_traits : ['practical'],
      surprise_tolerance: state.surprise_tolerance,
      values: state.values,
      no_gos: state.no_gos,
      budget_range: state.budget_range || '50_100',
      gift_type_preference: state.gift_type_preference,
      time_constraint: state.time_constraint,
      country: state.country,
      relationship_key: state.relationship_key,
    };
  },
  
  resetCollection: () => set({
    step: 'idle',
    intentLocked: false,
    relationship_type: null,
    closeness_level: null,
    occasion_type: null,
    occasion_importance: null,
    personality_traits: [],
    surprise_tolerance: 'medium',
    values: [],
    no_gos: [],
    budget_range: null,
    gift_type_preference: 'no_preference',
    time_constraint: 'normal',
    country: 'US',
    relationship_key: undefined,
  }),
}));
