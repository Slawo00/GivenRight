import { supabase, isSupabaseConfigured } from "../../config/supabase";

export interface DecisionParameters {
  base: {
    safe: number;
    emotional: number;
    bold: number;
  };
  relationship: {
    partner: { safe: number; emotional: number; bold: number };
    parent: { safe: number; emotional: number; bold: number };
    child: { safe: number; emotional: number; bold: number };
    friend: { safe: number; emotional: number; bold: number };
    colleague: { safe: number; emotional: number; bold: number };
    other: { safe: number; emotional: number; bold: number };
  };
  closeness: {
    high: { safe: number; emotional: number; bold: number };
    low: { safe: number; emotional: number; bold: number };
  };
  surprise: {
    low: { safe: number; emotional: number; bold: number };
    high: { safe: number; emotional: number; bold: number };
  };
  budget: {
    under_50: { safe: number; emotional: number; bold: number };
    "50_100": { safe: number; emotional: number; bold: number };
    "100_250": { safe: number; emotional: number; bold: number };
    "250_plus": { safe: number; emotional: number; bold: number };
  };
  occasion: {
    birthday: { safe: number; emotional: number; bold: number };
    anniversary: { safe: number; emotional: number; bold: number };
    valentines: { safe: number; emotional: number; bold: number };
    wedding: { safe: number; emotional: number; bold: number };
    christmas: { safe: number; emotional: number; bold: number };
    graduation: { safe: number; emotional: number; bold: number };
    other: { safe: number; emotional: number; bold: number };
  };
}

const defaultParameters: DecisionParameters = {
  base: { safe: 50, emotional: 50, bold: 50 },
  relationship: {
    partner: { safe: 0, emotional: 15, bold: 15 },
    parent: { safe: 15, emotional: 10, bold: 0 },
    child: { safe: 0, emotional: 15, bold: 5 },
    friend: { safe: 0, emotional: 10, bold: 15 },
    colleague: { safe: 20, emotional: -20, bold: -30 },
    other: { safe: 10, emotional: 0, bold: 0 },
  },
  closeness: {
    high: { safe: 0, emotional: 10, bold: 20 },
    low: { safe: 15, emotional: 0, bold: -10 },
  },
  surprise: {
    low: { safe: 15, emotional: 0, bold: -40 },
    high: { safe: 0, emotional: 0, bold: 15 },
  },
  budget: {
    under_50: { safe: 10, emotional: 0, bold: -20 },
    "50_100": { safe: 0, emotional: 0, bold: 0 },
    "100_250": { safe: 0, emotional: 0, bold: 0 },
    "250_plus": { safe: 0, emotional: 5, bold: 10 },
  },
  occasion: {
    birthday: { safe: 0, emotional: 10, bold: 0 },
    anniversary: { safe: 0, emotional: 10, bold: 0 },
    valentines: { safe: 0, emotional: 15, bold: 10 },
    wedding: { safe: 5, emotional: 10, bold: 0 },
    christmas: { safe: 10, emotional: 0, bold: 0 },
    graduation: { safe: 5, emotional: 5, bold: 0 },
    other: { safe: 0, emotional: 0, bold: 0 },
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

    const params = JSON.parse(JSON.stringify(defaultParameters)) as DecisionParameters;
    
    data.forEach(({ key, value }) => {
      const numValue = Number(value);
      const parts = key.split(".");
      
      if (parts[0] === "base") {
        if (parts[1] === "safe") params.base.safe = numValue;
        if (parts[1] === "emotional") params.base.emotional = numValue;
        if (parts[1] === "bold") params.base.bold = numValue;
      }
      
      if (parts[0] === "weight" && parts[1] === "relationship") {
        const relType = parts[2] as keyof typeof params.relationship;
        const direction = parts[3] as "safe" | "emotional" | "bold";
        if (params.relationship[relType] && direction) {
          params.relationship[relType][direction] = numValue;
        }
      }
      
      if (parts[0] === "weight" && parts[1] === "closeness") {
        const level = parts[2] as "high" | "low";
        const direction = parts[3] as "safe" | "emotional" | "bold";
        if (params.closeness[level] && direction) {
          params.closeness[level][direction] = numValue;
        }
      }
      
      if (parts[0] === "weight" && parts[1] === "surprise") {
        const level = parts[2] as "low" | "high";
        const direction = parts[3] as "safe" | "emotional" | "bold";
        if (params.surprise[level] && direction) {
          params.surprise[level][direction] = numValue;
        }
      }
      
      if (parts[0] === "weight" && parts[1] === "budget") {
        const range = parts[2] as keyof typeof params.budget;
        const direction = parts[3] as "safe" | "emotional" | "bold";
        if (params.budget[range] && direction) {
          params.budget[range][direction] = numValue;
        }
      }
      
      if (parts[0] === "weight" && parts[1] === "occasion") {
        const occ = parts[2] as keyof typeof params.occasion;
        const direction = parts[3] as "safe" | "emotional" | "bold";
        if (params.occasion[occ] && direction) {
          params.occasion[occ][direction] = numValue;
        }
      }
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
