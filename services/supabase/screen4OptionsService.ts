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
  { code: 'practical', label: 'Practical' },
  { code: 'emotional', label: 'Emotional' },
  { code: 'mixed', label: 'Mixed' },
  { code: 'surprise', label: 'Surprise' },
  { code: 'experience', label: 'Experience' },
];

const defaultTimeConstraints: OptionItem[] = [
  { code: 'relaxed', label: '> 2 Weeks' },
  { code: 'normal', label: '1-2 Weeks' },
  { code: 'urgent', label: '< 3 Days' },
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
        .select('code, label'),
      supabase
        .from('q_time_constraints')
        .select('code, label'),
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
