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
  selectedDirection?: DecisionDirection;

  step: DecisionStep;
  
  configuredParameters?: DecisionParameters;
  configuredExplanations?: Record<DecisionDirection, DecisionExplanation>;

  setRelationship: (r: RelationshipProfile) => void;
  setOccasion: (o: OccasionType) => void;
  setBudget: (b: BudgetRange) => void;

  setDecisionResult: (r: DecisionResult) => void;
  selectDirection: (d: DecisionDirection) => void;
  advanceStep: (s: DecisionStep) => void;
  runDecisionSimulation: () => void;
  runTestScenario: (input: TestScenarioInput) => void;
  setConfig: (params: DecisionParameters, explanations: Record<DecisionDirection, DecisionExplanation>) => void;
  resetDecision: () => void;
}

const initialState = {
  relationship: undefined,
  occasion: undefined,
  budget: undefined,
  decisionResult: undefined,
  selectedDirection: undefined,
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

  resetDecision: () =>
    set((state) => ({
      ...initialState,
      configuredParameters: state.configuredParameters,
      configuredExplanations: state.configuredExplanations,
    })),
}));
