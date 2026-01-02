import { supabase, isSupabaseConfigured } from '../../config/supabase';

export interface OptionItem {
  code: string;
  label: string;
}

export interface Screen1bOptions {
  lifeStages: OptionItem[];
}

const defaultLifeStages: OptionItem[] = [
  { code: 'baby', label: 'Baby (0–2)' },
  { code: 'child', label: 'Child (3–10)' },
  { code: 'teenager', label: 'Teenager (11–17)' },
];

const defaultOptions: Screen1bOptions = {
  lifeStages: defaultLifeStages,
};

let cachedOptions: Screen1bOptions | null = null;

export async function loadScreen1bOptions(): Promise<Screen1bOptions> {
  if (cachedOptions) {
    return cachedOptions;
  }

  if (!isSupabaseConfigured) {
    return defaultOptions;
  }

  try {
    const { data, error } = await supabase
      .from('q_life_stages')
      .select('code, label')
      .neq('code', 'adult');

    if (error) {
      console.warn('Failed to load Screen 1b options from Supabase, using defaults');
      return defaultOptions;
    }

    if (!data || data.length === 0) {
      console.warn('No data in q_life_stages table, using defaults');
      return defaultOptions;
    }

    cachedOptions = {
      lifeStages: data as OptionItem[],
    };

    return cachedOptions;
  } catch (error) {
    console.warn('Error loading Screen 1b options:', error);
    return defaultOptions;
  }
}

export function clearScreen1bOptionsCache(): void {
  cachedOptions = null;
}

export const LIFE_STAGE_REQUIRED_RELATIONSHIPS = ['child', 'nephew', 'niece'];

export function requiresLifeStageScreen(relationshipType: string | null): boolean {
  if (!relationshipType) return false;
  return LIFE_STAGE_REQUIRED_RELATIONSHIPS.includes(relationshipType);
}
