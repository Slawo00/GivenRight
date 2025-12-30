import { supabase, isSupabaseConfigured } from "../../config/supabase";

export interface DecisionParameters {
  base: {
    safe: number;
    emotional: number;
    bold: number;
  };
  relationship: {
    partner: { emotional: number; bold: number };
    colleague: { safe: number; bold: number };
    friend: { emotional: number };
  };
  closeness: {
    high: { emotional: number; bold: number };
    low: { safe: number; bold: number };
  };
  surprise: {
    low: { safe: number };
    high: { bold: number };
  };
  budget: {
    under_50: { safe: number };
    "250_plus": { bold: number; emotional: number };
  };
  occasion: {
    birthday: { emotional: number };
    valentines: { emotional: number; bold: number };
    wedding: { safe: number; emotional: number };
    christmas: { safe: number };
  };
}

const defaultParameters: DecisionParameters = {
  base: { safe: 50, emotional: 50, bold: 50 },
  relationship: {
    partner: { emotional: 15, bold: 15 },
    colleague: { safe: 20, bold: -10 },
    friend: { emotional: 10 },
  },
  closeness: {
    high: { emotional: 10, bold: 20 },
    low: { safe: 15, bold: -10 },
  },
  surprise: {
    low: { safe: 15 },
    high: { bold: 15 },
  },
  budget: {
    under_50: { safe: 10 },
    "250_plus": { bold: 10, emotional: 5 },
  },
  occasion: {
    birthday: { emotional: 10 },
    valentines: { emotional: 15, bold: 10 },
    wedding: { safe: 10, emotional: 5 },
    christmas: { safe: 5 },
  },
};

let cachedParameters: DecisionParameters | null = null;

export async function getDecisionParameters(): Promise<DecisionParameters> {
  if (cachedParameters) {
    return cachedParameters;
  }

  if (!isSupabaseConfigured) {
    return defaultParameters;
  }

  try {
    const { data, error } = await supabase
      .from("decision_parameters")
      .select("key, value");

    if (error || !data || data.length === 0) {
      return defaultParameters;
    }

    const params = { ...defaultParameters };
    
    data.forEach(({ key, value }) => {
      const numValue = Number(value);
      
      if (key === "base.safe") params.base.safe = numValue;
      if (key === "base.emotional") params.base.emotional = numValue;
      if (key === "base.bold") params.base.bold = numValue;
      
      if (key === "weight.relationship.partner.emotional") params.relationship.partner.emotional = numValue;
      if (key === "weight.relationship.partner.bold") params.relationship.partner.bold = numValue;
      if (key === "weight.relationship.colleague.safe") params.relationship.colleague.safe = numValue;
      if (key === "weight.relationship.colleague.bold") params.relationship.colleague.bold = numValue;
      if (key === "weight.relationship.friend.emotional") params.relationship.friend.emotional = numValue;
      
      if (key === "weight.closeness.high.emotional") params.closeness.high.emotional = numValue;
      if (key === "weight.closeness.high.bold") params.closeness.high.bold = numValue;
      if (key === "weight.closeness.low.safe") params.closeness.low.safe = numValue;
      if (key === "weight.closeness.low.bold") params.closeness.low.bold = numValue;
      
      if (key === "weight.surprise.low.safe") params.surprise.low.safe = numValue;
      if (key === "weight.surprise.high.bold") params.surprise.high.bold = numValue;
      
      if (key === "weight.budget.under_50.safe") params.budget.under_50.safe = numValue;
      if (key === "weight.budget.250_plus.bold") params.budget["250_plus"].bold = numValue;
      if (key === "weight.budget.250_plus.emotional") params.budget["250_plus"].emotional = numValue;
      
      if (key === "weight.occasion.birthday.emotional") params.occasion.birthday.emotional = numValue;
      if (key === "weight.occasion.valentines.emotional") params.occasion.valentines.emotional = numValue;
      if (key === "weight.occasion.valentines.bold") params.occasion.valentines.bold = numValue;
      if (key === "weight.occasion.wedding.safe") params.occasion.wedding.safe = numValue;
      if (key === "weight.occasion.wedding.emotional") params.occasion.wedding.emotional = numValue;
      if (key === "weight.occasion.christmas.safe") params.occasion.christmas.safe = numValue;
    });

    cachedParameters = params;
    return params;
  } catch {
    return defaultParameters;
  }
}

export function getDefaultParameters(): DecisionParameters {
  return defaultParameters;
}

export function clearParameterCache(): void {
  cachedParameters = null;
}
