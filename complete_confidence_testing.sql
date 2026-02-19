-- GivenRight Project: Complete Confidence Score Testing Suite
-- Execute this in Supabase SQL Editor step by step

-- ================================================================
-- PART 1: Test Final View Integration (v_personality_fit_scores)
-- ================================================================

-- 1.1: Verify trait mappings exist
SELECT 
  'Trait Mappings Check' as test_section,
  COUNT(*) as trait_count,
  array_agg(trait_code ORDER BY trait_code) as available_traits
FROM q_personality_dimensions;

-- 1.2: Test function with controlled inputs
SELECT 
  'Function Testing' as test_section,
  'practical + practical = ' || calculate_personality_fit_score(ARRAY['practical'], 'practical', 'safe') as test_1,
  'practical + experience = ' || calculate_personality_fit_score(ARRAY['practical'], 'experience', 'safe') as test_2,
  'adventurous + creative + experience = ' || calculate_personality_fit_score(ARRAY['adventurous', 'creative'], 'experience', 'safe') as test_3;

-- 1.3: Verify v_personality_fit_scores creation and sample data
SELECT 
  'View Creation Test' as test_section,
  session_id,
  personality_traits,
  gift_type_preference,
  personality_fit_score,
  CASE 
    WHEN personality_traits IS NOT NULL AND personality_fit_score > 0 THEN '✅ Scored'
    WHEN personality_traits IS NOT NULL AND personality_fit_score = 0 THEN '⚠️ Zero Score'
    WHEN personality_traits IS NULL THEN '❌ No Traits'
    ELSE '❓ Unknown'
  END as status
FROM v_personality_fit_scores 
WHERE session_id IS NOT NULL
ORDER BY personality_fit_score DESC
LIMIT 10;

-- ================================================================
-- PART 2: Test Complete Confidence Score (v_decision_confidence_components_v3)
-- ================================================================

-- 2.1: Verify the new v3 view exists and has all components
SELECT 
  'Confidence Components V3 Test' as test_section,
  session_id,
  relationship_type,
  base_relationship_score,
  personality_fit_score,
  historical_success_score,
  constraint_compliance_score,
  risk_penalty,
  confidence_score,
  CASE 
    WHEN confidence_score >= 70 THEN '🟢 High Confidence'
    WHEN confidence_score >= 50 THEN '🟡 Medium Confidence' 
    WHEN confidence_score >= 30 THEN '🔴 Low Confidence'
    ELSE '❌ Very Low'
  END as confidence_category
FROM v_decision_confidence_components_v3
WHERE session_id IS NOT NULL
ORDER BY confidence_score DESC
LIMIT 10;

-- 2.2: Compare old vs new confidence scoring (if v2 still exists)
WITH comparison AS (
  SELECT 
    'V2 (Old)' as version,
    session_id,
    0 as personality_fit_score,
    confidence_score as total_score
  FROM v_decision_confidence_components_v2 
  WHERE session_id IN (
    SELECT session_id FROM v_decision_confidence_components_v3 
    WHERE personality_fit_score > 0 LIMIT 5
  )
  
  UNION ALL
  
  SELECT 
    'V3 (New)' as version,
    session_id,
    personality_fit_score,
    confidence_score as total_score
  FROM v_decision_confidence_components_v3 
  WHERE session_id IN (
    SELECT session_id FROM v_decision_confidence_components_v3 
    WHERE personality_fit_score > 0 LIMIT 5
  )
)
SELECT * FROM comparison ORDER BY session_id, version;

-- ================================================================
-- PART 3: Validate End-to-End Integration
-- ================================================================

-- 3.1: Complete scoring breakdown for high-quality sessions
SELECT 
  'End-to-End Integration Test' as test_section,
  session_id,
  relationship_type,
  array_to_string(personality_traits, ', ') as traits,
  gift_type_preference,
  
  -- Score Breakdown
  base_relationship_score as base_score,
  personality_fit_score as personality_score,
  (base_relationship_score + personality_fit_score) as combined_core_score,
  confidence_score as final_score,
  
  -- Validation
  CASE 
    WHEN personality_fit_score > 0 AND base_relationship_score > 0 THEN '✅ Complete'
    WHEN personality_fit_score = 0 THEN '⚠️ Missing Personality'
    WHEN base_relationship_score = 0 THEN '⚠️ Missing Relationship'
    ELSE '❌ Incomplete'
  END as integration_status
  
FROM v_decision_confidence_components_v3
WHERE personality_traits IS NOT NULL 
  AND array_length(personality_traits, 1) > 0
  AND gift_type_preference IS NOT NULL
ORDER BY confidence_score DESC
LIMIT 10;

-- ================================================================
-- PART 4: Document Results - Test verschiedene Personality/Gift combinations
-- ================================================================

-- 4.1: Test Matrix - All combinations
WITH test_combinations AS (
  SELECT 
    unnest(ARRAY['practical', 'emotional', 'creative', 'adventurous', 'reserved', 'humorous']) as personality,
    unnest(ARRAY['practical', 'emotional', 'experience', 'mixed', 'surprise']) as gift_type
),
test_results AS (
  SELECT 
    personality,
    gift_type,
    calculate_personality_fit_score(ARRAY[personality], gift_type, 'safe') as score,
    CASE 
      WHEN calculate_personality_fit_score(ARRAY[personality], gift_type, 'safe') >= 15 THEN '🟢 Excellent'
      WHEN calculate_personality_fit_score(ARRAY[personality], gift_type, 'safe') >= 10 THEN '🟡 Good'
      WHEN calculate_personality_fit_score(ARRAY[personality], gift_type, 'safe') >= 5 THEN '🔴 Poor'
      ELSE '❌ Very Poor'
    END as fit_rating
  FROM test_combinations
)
SELECT 
  'Personality-Gift Fit Matrix' as test_section,
  personality,
  gift_type,
  score,
  fit_rating
FROM test_results
ORDER BY personality, gift_type;

-- 4.2: Best and worst matches analysis
WITH test_results AS (
  SELECT 
    unnest(ARRAY['practical', 'emotional', 'creative', 'adventurous', 'reserved', 'humorous']) as personality,
    unnest(ARRAY['practical', 'emotional', 'experience', 'mixed', 'surprise']) as gift_type
),
scored_results AS (
  SELECT 
    personality,
    gift_type,
    calculate_personality_fit_score(ARRAY[personality], gift_type, 'safe') as score
  FROM test_results
)
SELECT 
  'Best Matches (Score >= 15)' as category,
  personality || ' → ' || gift_type || ' (' || score || ')' as combination
FROM scored_results WHERE score >= 15

UNION ALL

SELECT 
  'Worst Matches (Score = 0)' as category,
  personality || ' → ' || gift_type || ' (' || score || ')' as combination  
FROM scored_results WHERE score = 0

ORDER BY category DESC;

-- ================================================================
-- PART 5: System Health Check
-- ================================================================

-- 5.1: Data quality assessment
SELECT 
  'Data Quality Report' as report_section,
  COUNT(*) as total_sessions,
  COUNT(CASE WHEN personality_traits IS NOT NULL THEN 1 END) as sessions_with_personality,
  COUNT(CASE WHEN gift_type_preference IS NOT NULL THEN 1 END) as sessions_with_gift_preference,
  COUNT(CASE WHEN personality_traits IS NOT NULL AND gift_type_preference IS NOT NULL THEN 1 END) as sessions_ready_for_scoring,
  ROUND(
    COUNT(CASE WHEN personality_traits IS NOT NULL AND gift_type_preference IS NOT NULL THEN 1 END)::FLOAT / 
    COUNT(*)::FLOAT * 100, 2
  ) as data_completeness_pct
FROM v_personality_fit_scores;

-- 5.2: Score distribution analysis
SELECT 
  'Score Distribution Analysis' as analysis_section,
  CASE 
    WHEN personality_fit_score = 0 THEN '0 (No Score)'
    WHEN personality_fit_score BETWEEN 1 AND 5 THEN '1-5 (Very Poor)'
    WHEN personality_fit_score BETWEEN 6 AND 10 THEN '6-10 (Poor)'
    WHEN personality_fit_score BETWEEN 11 AND 15 THEN '11-15 (Good)'
    WHEN personality_fit_score BETWEEN 16 AND 20 THEN '16-20 (Excellent)'
    ELSE 'Unknown'
  END as score_range,
  COUNT(*) as session_count
FROM v_personality_fit_scores
WHERE session_id IS NOT NULL
GROUP BY 
  CASE 
    WHEN personality_fit_score = 0 THEN '0 (No Score)'
    WHEN personality_fit_score BETWEEN 1 AND 5 THEN '1-5 (Very Poor)'
    WHEN personality_fit_score BETWEEN 6 AND 10 THEN '6-10 (Poor)'
    WHEN personality_fit_score BETWEEN 11 AND 15 THEN '11-15 (Good)'
    WHEN personality_fit_score BETWEEN 16 AND 20 THEN '16-20 (Excellent)'
    ELSE 'Unknown'
  END
ORDER BY 
  CASE 
    WHEN score_range = '0 (No Score)' THEN 0
    WHEN score_range = '1-5 (Very Poor)' THEN 1
    WHEN score_range = '6-10 (Poor)' THEN 2
    WHEN score_range = '11-15 (Good)' THEN 3
    WHEN score_range = '16-20 (Excellent)' THEN 4
    ELSE 5
  END;

-- ================================================================
-- SUMMARY QUERY: Executive Dashboard
-- ================================================================

SELECT 
  '🎯 GIVENRIGHT CONFIDENCE SCORE SYSTEM - STATUS REPORT' as executive_summary,
  (SELECT COUNT(*) FROM v_personality_fit_scores WHERE personality_fit_score > 0) as active_scored_sessions,
  (SELECT AVG(confidence_score)::INTEGER FROM v_decision_confidence_components_v3 WHERE personality_fit_score > 0) as avg_confidence_score,
  (SELECT COUNT(*) FROM q_personality_dimensions) as personality_dimensions_loaded,
  CASE 
    WHEN (SELECT COUNT(*) FROM v_personality_fit_scores WHERE personality_fit_score > 0) > 0 THEN '✅ SYSTEM OPERATIONAL'
    ELSE '❌ SYSTEM NOT FUNCTIONAL' 
  END as system_status;