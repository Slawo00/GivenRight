import { supabase, isSupabaseConfigured } from '../../config/supabase';

export interface OptionItem {
  code: string;
  label: string;
  description?: string;
}

export interface Screen1Options {
  relationships: OptionItem[];
  closeness: OptionItem[];
  occasions: OptionItem[];
  importance: OptionItem[];
}

const defaultRelationships: OptionItem[] = [
  { code: 'partner', label: 'Partner' },
  { code: 'parent', label: 'Close Family' },
  { code: 'friend', label: 'Friend' },
  { code: 'colleague', label: 'Colleague' },
];

const defaultCloseness: OptionItem[] = [
  { code: 'distant', label: 'Distant' },
  { code: 'casual', label: 'Casual' },
  { code: 'close', label: 'Close' },
  { code: 'very_close', label: 'Very Close' },
];

const defaultOccasions: OptionItem[] = [
  { code: 'birthday', label: 'Birthday' },
  { code: 'anniversary', label: 'Anniversary' },
  { code: 'christmas', label: 'Holiday' },
  { code: 'thank_you', label: 'Thank You' },
  { code: 'other', label: 'Other' },
];

const defaultImportance: OptionItem[] = [
  { code: 'low', label: 'Low Priority' },
  { code: 'medium', label: 'Medium' },
  { code: 'important', label: 'Important' },
  { code: 'very_important', label: 'Very Important' },
];

const defaultOptions: Screen1Options = {
  relationships: defaultRelationships,
  closeness: defaultCloseness,
  occasions: defaultOccasions,
  importance: defaultImportance,
};

let cachedOptions: Screen1Options | null = null;

export async function loadScreen1Options(): Promise<Screen1Options> {
  if (cachedOptions) {
    return cachedOptions;
  }

  if (!isSupabaseConfigured) {
    return defaultOptions;
  }

  try {
    const [relationships, closeness, occasions, importance] = await Promise.all([
      supabase
        .from('q_relationship_types')
        .select('code, label, description')
        .order('sort_order', { ascending: true }),
      supabase
        .from('q_closeness_levels')
        .select('code, label')
        .order('emotional_expectation', { ascending: true }),
      supabase
        .from('q_occasion_types')
        .select('code, label')
        .order('sort_order', { ascending: true }),
      supabase
        .from('q_occasion_importance_levels')
        .select('code, label')
        .order('importance_level', { ascending: true }),
    ]);

    if (relationships.error || closeness.error || occasions.error || importance.error) {
      console.warn('Failed to load Screen 1 options from Supabase, using defaults');
      return defaultOptions;
    }

    const hasData = 
      relationships.data?.length > 0 && 
      closeness.data?.length > 0 && 
      occasions.data?.length > 0 && 
      importance.data?.length > 0;

    if (!hasData) {
      console.warn('No data in Screen 1 tables, using defaults');
      console.log('[Screen1Options] FALLBACK - Using default options:', {
        relationships: defaultRelationships.length,
        closeness: defaultCloseness.length,
        occasions: defaultOccasions.length,
        importance: defaultImportance.length,
      });
      return defaultOptions;
    }

    console.log('[Screen1Options] SUPABASE DATA LOADED:', {
      relationships: relationships.data?.length,
      closeness: closeness.data?.length,
      occasions: occasions.data?.length,
      importance: importance.data?.length,
    });
    console.log('[Screen1Options] Relationship codes:', relationships.data?.map(r => r.code));
    console.log('[Screen1Options] Closeness codes:', closeness.data?.map(c => c.code));
    console.log('[Screen1Options] Occasion codes:', occasions.data?.map(o => o.code));
    console.log('[Screen1Options] Importance codes:', importance.data?.map(i => i.code));

    cachedOptions = {
      relationships: relationships.data as OptionItem[],
      closeness: closeness.data as OptionItem[],
      occasions: occasions.data as OptionItem[],
      importance: importance.data as OptionItem[],
    };

    return cachedOptions;
  } catch (error) {
    console.warn('Error loading Screen 1 options:', error);
    return defaultOptions;
  }
}

export function clearScreen1OptionsCache(): void {
  cachedOptions = null;
}
