import { supabase, isSupabaseConfigured } from '../../config/supabase';

export async function loadAllowedDecisionOptions(lifeStageCode: string): Promise<string[]> {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase not configured');
  }

  const { data, error } = await supabase
    .from('v_allowed_decision_options')
    .select('decision_option')
    .eq('life_stage_code', lifeStageCode)
    .eq('is_allowed', true)
    .order('decision_option');

  if (error) throw error;

  if (!data || data.length === 0) {
    return [];
  }

  return data.map(d => d.decision_option);
}
