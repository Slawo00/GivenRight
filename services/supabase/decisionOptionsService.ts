import { supabase, isSupabaseConfigured } from '../../config/supabase';

export async function loadAllowedDecisionOptions(lifeStageCode: string): Promise<string[]> {
  console.log('[DecisionOptions] Loading allowed options for life_stage_code:', lifeStageCode);
  
  if (!isSupabaseConfigured) {
    console.warn('[DecisionOptions] Supabase not configured');
    throw new Error('Supabase not configured');
  }

  const { data, error } = await supabase
    .from('v_allowed_decision_options')
    .select('decision_option')
    .eq('life_stage_code', lifeStageCode)
    .eq('is_allowed', true)
    .order('decision_option');

  if (error) {
    console.error('[DecisionOptions] Query error:', error);
    throw error;
  }

  if (!data || data.length === 0) {
    console.warn('[DecisionOptions] No allowed options found for:', lifeStageCode);
    return [];
  }

  const options = data.map(d => d.decision_option.toUpperCase());
  console.log('[DecisionOptions] Allowed options:', options);
  return options;
}
