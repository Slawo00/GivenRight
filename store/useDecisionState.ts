import { create } from "zustand";
import type { DecisionDirection, DecisionResult, DecisionStep, OccasionType, DecisionExplanation } from "../types/decision";
import type { RelationshipProfile } from "../types/relationship";
import type { BudgetRange } from "../types/common";
import { runConfiguredDecisionEngine } from "../engine/mockDecisionEngine";
import { 
  getDefaultParameters, 
  getDefaultExplanations,
  type DecisionParameters 
} from "../services/supabase";
import type { ObjectPattern } from "../services/supabase/objectPatternService";
import type { DecisionResult as EngineDecisionResult, ConfidenceType } from "../services/decisionEngine/types";

interface TestScenarioInput {
  relationship: RelationshipProfile;
  occasion: OccasionType;
  budget: BudgetRange;
}

interface DecisionState {
  relationship?: RelationshipProfile;
  occasion?: OccasionType;
  budget?: BudgetRange;

  decisionResult?: DecisionResult;
  engineDecisionResult?: EngineDecisionResult;
  selectedDirection?: DecisionDirection;
  selectedPattern?: ObjectPattern;

  step: DecisionStep;
  
  configuredParameters?: DecisionParameters;
  configuredExplanations?: Record<DecisionDirection, DecisionExplanation>;

  setRelationship: (r: RelationshipProfile) => void;
  setOccasion: (o: OccasionType) => void;
  setBudget: (b: BudgetRange) => void;

  setDecisionResult: (r: DecisionResult) => void;
  selectDirection: (d: DecisionDirection) => void;
  selectPattern: (p: ObjectPattern) => void;
  advanceStep: (s: DecisionStep) => void;
  runDecisionSimulation: () => void;
  runTestScenario: (input: TestScenarioInput) => void;
  setConfig: (params: DecisionParameters, explanations: Record<DecisionDirection, DecisionExplanation>) => void;
  advanceToCommerce: () => void;
  completeWithExecution: () => void;
  resetDecision: () => void;
  setDecisionResultFromEngine: (engineResult: EngineDecisionResult) => void;
}

const initialState = {
  relationship: undefined,
  occasion: undefined,
  budget: undefined,
  decisionResult: undefined,
  engineDecisionResult: undefined,
  selectedDirection: undefined,
  selectedPattern: undefined,
  step: "idle" as DecisionStep,
  configuredParameters: undefined,
  configuredExplanations: undefined,
};

export const useDecisionState = create<DecisionState>((set, get) => ({
  ...initialState,

  setRelationship: (relationship) =>
    set({ relationship, step: "collecting_inputs" }),

  setOccasion: (occasion) =>
    set({ occasion, step: "collecting_inputs" }),

  setBudget: (budget) =>
    set({ budget, step: "collecting_inputs" }),

  setDecisionResult: (decisionResult) =>
    set({ decisionResult, step: "decision_ready" }),

  selectDirection: (selectedDirection) =>
    set({ selectedDirection, step: "direction_selected" }),

  selectPattern: (selectedPattern) =>
    set({ selectedPattern, step: "pattern_explanation" }),

  advanceStep: (step) =>
    set({ step }),

  setConfig: (configuredParameters, configuredExplanations) =>
    set({ configuredParameters, configuredExplanations }),

  runDecisionSimulation: () =>
    set((state) => {
      if (!state.relationship || !state.budget || !state.occasion) {
        return state;
      }

      const parameters = state.configuredParameters ?? getDefaultParameters();
      const explanations = state.configuredExplanations ?? getDefaultExplanations();

      const result = runConfiguredDecisionEngine({
        relationship: state.relationship,
        budget: state.budget,
        occasion: state.occasion,
        parameters,
        explanations,
      });

      return {
        ...state,
        decisionResult: result,
        step: "decision_ready",
      };
    }),

  runTestScenario: (input) =>
    set((state) => {
      const parameters = state.configuredParameters ?? getDefaultParameters();
      const explanations = state.configuredExplanations ?? getDefaultExplanations();

      const result = runConfiguredDecisionEngine({
        ...input,
        parameters,
        explanations,
      });

      return {
        relationship: input.relationship,
        occasion: input.occasion,
        budget: input.budget,
        decisionResult: result,
        selectedDirection: undefined,
        step: "decision_ready",
        configuredParameters: state.configuredParameters,
        configuredExplanations: state.configuredExplanations,
      };
    }),

  advanceToCommerce: () =>
    set({ step: "commerce_preview" }),

  completeWithExecution: () =>
    set({ step: "completed_with_execution" }),

  resetDecision: () =>
    set((state) => ({
      ...initialState,
      configuredParameters: state.configuredParameters,
      configuredExplanations: state.configuredExplanations,
    })),

  setDecisionResultFromEngine: (engineResult: EngineDecisionResult) => {
    const mapConfidenceToDirection = (ct: ConfidenceType): DecisionDirection => {
      switch (ct) {
        case 'SAFE': return 'safe';
        case 'EMOTIONAL': return 'emotional';
        case 'BOLD': return 'bold';
        default: return 'safe';
      }
    };

    const mapRiskLevel = (ct: ConfidenceType): 'low' | 'medium' | 'high' => {
      switch (ct) {
        case 'SAFE': return 'low';
        case 'EMOTIONAL': return 'medium';
        case 'BOLD': return 'high';
        default: return 'low';
      }
    };

    const scores = engineResult.options.map(option => ({
      direction: mapConfidenceToDirection(option.confidence_type),
      score: 70 + Math.floor(Math.random() * 20),
      risk: mapRiskLevel(option.confidence_type),
      recommended: option.confidence_type === 'SAFE',
    }));

    const explanationByDirection: Record<DecisionDirection, DecisionExplanation> = {
      safe: { whyThisWorks: '', risks: '', emotionalSignal: '' },
      emotional: { whyThisWorks: '', risks: '', emotionalSignal: '' },
      bold: { whyThisWorks: '', risks: '', emotionalSignal: '' },
    };

    for (const option of engineResult.options) {
      const dir = mapConfidenceToDirection(option.confidence_type);
      explanationByDirection[dir] = {
        whyThisWorks: option.explanation.why_this_works,
        risks: option.explanation.things_to_consider.join(' '),
        emotionalSignal: option.explanation.emotional_signal,
      };
    }

    const decisionResult: DecisionResult = {
      scores,
      explanationByDirection,
    };

    set({ decisionResult, engineDecisionResult: engineResult, step: 'decision_ready' });
  },
}));
