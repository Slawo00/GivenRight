import { supabase, isSupabaseConfigured } from '../../config/supabase';

export interface OptionItem {
  code: string;
  label: string;
}

export interface Screen2Options {
  personalityTraits: OptionItem[];
  surpriseTolerance: OptionItem[];
}

const defaultPersonalityTraits: OptionItem[] = [
  { code: 'practical', label: 'Practical' },
  { code: 'sentimental', label: 'Sentimental' },
  { code: 'creative', label: 'Creative' },
  { code: 'minimalist', label: 'Minimalist' },
  { code: 'expressive', label: 'Expressive' },
];

const defaultSurpriseTolerance: OptionItem[] = [
  { code: 'low', label: 'Prefers safe choices' },
  { code: 'medium', label: 'Enjoys a thoughtful surprise' },
  { code: 'high', label: 'Loves bold surprises' },
];

const defaultOptions: Screen2Options = {
  personalityTraits: defaultPersonalityTraits,
  surpriseTolerance: defaultSurpriseTolerance,
};

let cachedOptions: Screen2Options | null = null;

export async function loadScreen2Options(): Promise<Screen2Options> {
  if (cachedOptions) {
    return cachedOptions;
  }

  if (!isSupabaseConfigured) {
    return defaultOptions;
  }

  try {
    const [traits, tolerance] = await Promise.all([
      supabase
        .from('q_personality_traits')
        .select('code, label'),
      supabase
        .from('q_surprise_tolerance_levels')
        .select('code, label'),
    ]);

    if (traits.error || tolerance.error) {
      console.warn('Failed to load Screen 2 options from Supabase, using defaults');
      return defaultOptions;
    }

    const hasData = 
      traits.data?.length > 0 && 
      tolerance.data?.length > 0;

    if (!hasData) {
      console.warn('No data in Screen 2 tables, using defaults');
      return defaultOptions;
    }

    cachedOptions = {
      personalityTraits: traits.data as OptionItem[],
      surpriseTolerance: tolerance.data as OptionItem[],
    };

    return cachedOptions;
  } catch (error) {
    console.warn('Error loading Screen 2 options:', error);
    return defaultOptions;
  }
}

export function clearScreen2OptionsCache(): void {
  cachedOptions = null;
}
