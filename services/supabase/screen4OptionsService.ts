import { supabase, isSupabaseConfigured } from '../../config/supabase';

export interface OptionItem {
  code: string;
  label: string;
}

export interface Screen4Options {
  giftTypes: OptionItem[];
  timeConstraints: OptionItem[];
}

const defaultGiftTypes: OptionItem[] = [
  { code: 'physical', label: 'Something tangible' },
  { code: 'experience', label: 'An experience' },
  { code: 'both', label: 'Open to both' },
];

const defaultTimeConstraints: OptionItem[] = [
  { code: 'flexible', label: 'Plenty of time' },
  { code: '1_2_weeks', label: '1-2 weeks' },
  { code: 'urgent', label: 'Very soon' },
];

const defaultOptions: Screen4Options = {
  giftTypes: defaultGiftTypes,
  timeConstraints: defaultTimeConstraints,
};

let cachedOptions: Screen4Options | null = null;

export async function loadScreen4Options(): Promise<Screen4Options> {
  if (cachedOptions) {
    return cachedOptions;
  }

  if (!isSupabaseConfigured) {
    return defaultOptions;
  }

  try {
    const [giftTypes, timeConstraints] = await Promise.all([
      supabase
        .from('q_gift_type_preferences')
        .select('code, label')
        .order('sort_order'),
      supabase
        .from('q_time_constraints')
        .select('code, label')
        .order('urgency_level'),
    ]);

    if (giftTypes.error || timeConstraints.error) {
      console.warn('Failed to load Screen 4 options from Supabase, using defaults');
      return defaultOptions;
    }

    cachedOptions = {
      giftTypes: (giftTypes.data?.length ?? 0) > 0 ? giftTypes.data as OptionItem[] : defaultGiftTypes,
      timeConstraints: (timeConstraints.data?.length ?? 0) > 0 ? timeConstraints.data as OptionItem[] : defaultTimeConstraints,
    };

    return cachedOptions;
  } catch (error) {
    console.warn('Error loading Screen 4 options:', error);
    return defaultOptions;
  }
}

export function clearScreen4OptionsCache(): void {
  cachedOptions = null;
}
