-- Test queries for Personality Fit Score implementation
-- Run after executing personality_fit_implementation.sql

-- 1. Verify trait mappings were inserted correctly
SELECT 
  trait_code,
  label,
  emotional_orientation as emo,
  functionality_preference as func,
  novelty_tolerance as nov,
  aesthetic_sensitivity as aes,
  experience_bias as exp,
  boldness_acceptance as bold
FROM q_personality_dimensions 
ORDER BY trait_code;

-- 2. Test the calculation function directly
SELECT 
  calculate_personality_fit_score(
    ARRAY['practical'], 'practical', 'safe'
  ) as practical_practical_score,
  
  calculate_personality_fit_score(
    ARRAY['practical'], 'experience', 'safe'
  ) as practical_experience_score,
  
  calculate_personality_fit_score(
    ARRAY['adventurous', 'creative'], 'experience', 'safe'
  ) as adventurous_creative_experience_score;

-- 3. Test with existing data from Supabase
SELECT 
  session_id,
  personality_traits,
  gift_type_preference,
  personality_fit_score,
  
  -- Show breakdown for debugging
  'Traits: ' || array_to_string(personality_traits, ', ') || 
  ' | Gift: ' || COALESCE(gift_type_preference, 'none') ||
  ' | Score: ' || personality_fit_score as debug_info
  
FROM v_personality_fit_scores 
WHERE personality_traits IS NOT NULL 
LIMIT 10;

-- 4. Compare old vs new confidence calculation
SELECT 
  'OLD' as version,
  session_id,
  base_relationship_score,
  0 as old_personality_fit_score,
  confidence_score as old_total
FROM v_decision_confidence_components_v2 
WHERE session_id IN (SELECT session_id FROM v_personality_fit_scores LIMIT 3)

UNION ALL

SELECT 
  'NEW' as version,
  session_id,
  base_relationship_score,
  personality_fit_score as new_personality_fit_score,
  confidence_score as new_total
FROM v_decision_confidence_components_v3 
WHERE session_id IN (SELECT session_id FROM v_personality_fit_scores LIMIT 3)
ORDER BY session_id, version;