import { create } from "zustand";
import type { DecisionDirection, DecisionResult, DecisionStep, OccasionType } from "../types/decision";
import type { RelationshipProfile } from "../types/relationship";
import type { BudgetRange } from "../types/common";
import { runMockDecisionEngine } from "../engine/mockDecisionEngine";

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

  setRelationship: (r: RelationshipProfile) => void;
  setOccasion: (o: OccasionType) => void;
  setBudget: (b: BudgetRange) => void;

  setDecisionResult: (r: DecisionResult) => void;
  selectDirection: (d: DecisionDirection) => void;
  advanceStep: (s: DecisionStep) => void;
  runDecisionSimulation: () => void;
  runTestScenario: (input: TestScenarioInput) => void;
  resetDecision: () => void;
}

const initialState = {
  relationship: undefined,
  occasion: undefined,
  budget: undefined,
  decisionResult: undefined,
  selectedDirection: undefined,
  step: "idle" as DecisionStep,
};

export const useDecisionState = create<DecisionState>((set) => ({
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

  runDecisionSimulation: () =>
    set((state) => {
      if (!state.relationship || !state.budget || !state.occasion) {
        return state;
      }

      const result = runMockDecisionEngine({
        relationship: state.relationship,
        budget: state.budget,
        occasion: state.occasion,
      });

      return {
        ...state,
        decisionResult: result,
        step: "decision_ready",
      };
    }),

  runTestScenario: (input) =>
    set(() => {
      const result = runMockDecisionEngine(input);

      return {
        relationship: input.relationship,
        occasion: input.occasion,
        budget: input.budget,
        decisionResult: result,
        selectedDirection: undefined,
        step: "decision_ready",
      };
    }),

  resetDecision: () =>
    set(initialState),
}));
