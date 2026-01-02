import { supabase, isSupabaseConfigured } from '../../config/supabase';

export interface OptionItem {
  code: string;
  label: string;
}

export interface Screen3Options {
  values: OptionItem[];
  noGos: OptionItem[];
  budgetRanges: OptionItem[];
}

const defaultValues: OptionItem[] = [
  { code: 'sustainability', label: 'Sustainability' },
  { code: 'craftsmanship', label: 'Craftsmanship' },
  { code: 'experiences', label: 'Experiences over things' },
  { code: 'minimalism', label: 'Minimalism' },
];

const defaultNoGos: OptionItem[] = [
  { code: 'alcohol', label: 'alcohol' },
  { code: 'clothing', label: 'clothing' },
  { code: 'personal_items', label: 'personal items' },
  { code: 'generic_gifts', label: 'generic gifts' },
];

const defaultBudgetRanges: OptionItem[] = [
  { code: 'under_50', label: 'Under $50' },
  { code: '50_100', label: '$50 – $100' },
  { code: '100_250', label: '$100 – $250' },
  { code: 'flexible', label: 'Flexible' },
];

const defaultOptions: Screen3Options = {
  values: defaultValues,
  noGos: defaultNoGos,
  budgetRanges: defaultBudgetRanges,
};

let cachedOptions: Screen3Options | null = null;

export async function loadScreen3Options(): Promise<Screen3Options> {
  if (cachedOptions) {
    return cachedOptions;
  }

  if (!isSupabaseConfigured) {
    return defaultOptions;
  }

  try {
    const [values, noGos, budget] = await Promise.all([
      supabase
        .from('q_value_constraints')
        .select('code, label')
        .eq('type', 'value'),
      supabase
        .from('q_value_constraints')
        .select('code, label')
        .eq('type', 'no_go'),
      supabase
        .from('q_budget_ranges')
        .select('code, label'),
    ]);

    if (values.error || noGos.error || budget.error) {
      console.warn('Failed to load Screen 3 options from Supabase, using defaults');
      return defaultOptions;
    }

    cachedOptions = {
      values: (values.data?.length ?? 0) > 0 ? values.data as OptionItem[] : defaultValues,
      noGos: (noGos.data?.length ?? 0) > 0 ? noGos.data as OptionItem[] : defaultNoGos,
      budgetRanges: (budget.data?.length ?? 0) > 0 ? budget.data as OptionItem[] : defaultBudgetRanges,
    };

    return cachedOptions;
  } catch (error) {
    console.warn('Error loading Screen 3 options:', error);
    return defaultOptions;
  }
}

export function clearScreen3OptionsCache(): void {
  cachedOptions = null;
}
