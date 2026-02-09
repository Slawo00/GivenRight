import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SUPABASE_URL = 'https://your-project.supabase.co'; // Will be configured via env
const SUPABASE_ANON_KEY = 'your-anon-key'; // Will be configured via env

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Gift Recommendations API
export const GiftAPI = {
  // Save a new gift session
  async createSession(sessionData) {
    const { data, error } = await supabase
      .from('gift_sessions')
      .insert([sessionData])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Save recipient profile
  async saveRecipient(recipientData) {
    const { data, error } = await supabase
      .from('recipients')
      .insert([recipientData])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Calculate confidence score via database function
  async calculateConfidence(params) {
    const { data, error } = await supabase
      .rpc('calculate_gift_confidence_score', {
        p_personality_type: params.personalityType,
        p_interests: params.interests,
        p_relationship: params.relationship,
        p_budget_min: params.budgetMin,
        p_budget_max: params.budgetMax,
        p_occasion: params.occasion,
        p_special_notes: params.specialNotes,
      });
    
    if (error) throw error;
    return data;
  },

  // Get recommended categories
  async getRecommendedCategories(personalityType, occasion) {
    const { data, error } = await supabase
      .rpc('get_recommended_categories', {
        p_personality_type: personalityType,
        p_occasion: occasion,
      });
    
    if (error) throw error;
    return data;
  },

  // Save gift recommendations
  async saveRecommendations(sessionId, recommendations) {
    const recsWithSession = recommendations.map(rec => ({
      ...rec,
      session_id: sessionId,
    }));

    const { data, error } = await supabase
      .from('gift_recommendations')
      .insert(recsWithSession)
      .select();
    
    if (error) throw error;
    return data;
  },

  // Save confidence factors breakdown
  async saveConfidenceFactors(sessionId, factors) {
    const factorsWithSession = factors.map(f => ({
      ...f,
      session_id: sessionId,
    }));

    const { data, error } = await supabase
      .from('confidence_factors')
      .insert(factorsWithSession)
      .select();
    
    if (error) throw error;
    return data;
  },

  // Get all gift categories
  async getCategories() {
    const { data, error } = await supabase
      .from('gift_categories')
      .select('*')
      .order('name');
    
    if (error) throw error;
    return data;
  },

  // Submit user feedback on a recommendation
  async submitFeedback(recommendationId, rating) {
    const { data, error } = await supabase
      .from('gift_recommendations')
      .update({ user_feedback: rating })
      .eq('id', recommendationId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Get session history
  async getSessionHistory(limit = 20) {
    const { data, error } = await supabase
      .from('gift_sessions')
      .select(`
        *,
        gift_recommendations(*),
        confidence_factors(*)
      `)
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (error) throw error;
    return data;
  },
};

export default supabase;