-- Migration: Create v3 Views with Real Personality Fit Score Integration
-- Created: 2026-02-08 16:28 UTC
-- Purpose: Fix personality_fit_score integration bug (0 → 20 for adventurous+creative+experience)

-- 1. Create v_decision_confidence_components_v3 with REAL personality fit scoring
CREATE OR REPLACE VIEW v_decision_confidence_components_v3 AS
SELECT 
    dc.*,
    
    -- Calculate REAL personality fit score using the function
    CASE 
        WHEN dc.personality_traits IS NOT NULL AND array_length(dc.personality_traits, 1) > 0 THEN
            calculate_personality_fit_score(
                dc.personality_traits,
                COALESCE(dc.gift_type_preference, 'experience'),
                'safe',  -- default decision_option (column doesn't exist)
                COALESCE(dc.time_constraint, 'relaxed'),
                'likes_surprises',  -- default surprise_tolerance (column doesn't exist)
                TRUE,  -- personalization_allowed
                FALSE  -- public_visibility
            )
        ELSE 0 
    END as personality_fit_score,
    
    -- Keep existing scores from v2 (base relationship, historical, etc.)
    v2.base_relationship_score,
    v2.historical_success_score,
    v2.constraint_compliance_score,
    v2.risk_penalty,
    
    -- Recalculate confidence score with REAL personality fit score
    (
        COALESCE(v2.base_relationship_score, 0) + 
        CASE 
            WHEN dc.personality_traits IS NOT NULL AND array_length(dc.personality_traits, 1) > 0 THEN
                calculate_personality_fit_score(
                    dc.personality_traits,
                    COALESCE(dc.gift_type_preference, 'experience'),
                    'safe',  -- default decision_option (column doesn't exist)
                    COALESCE(dc.time_constraint, 'relaxed'),
                    'likes_surprises',  -- default surprise_tolerance (column doesn't exist)
                    TRUE,  -- personalization_allowed
                    FALSE  -- public_visibility
                )
            ELSE 0 
        END +
        COALESCE(v2.historical_success_score, 0) + 
        COALESCE(v2.constraint_compliance_score, 0) - 
        COALESCE(v2.risk_penalty, 0)
    ) as confidence_score

FROM v_decision_context_v2 dc
LEFT JOIN v_decision_confidence_components_v2 v2 ON dc.session_id = v2.session_id;

-- 2. Update v_personality_fit_scores to use REAL calculated scores
CREATE OR REPLACE VIEW v_personality_fit_scores AS
SELECT 
    dc.*,
    CASE 
        WHEN dc.personality_traits IS NOT NULL AND array_length(dc.personality_traits, 1) > 0 THEN
            calculate_personality_fit_score(
                dc.personality_traits,
                COALESCE(dc.gift_type_preference, 'experience'),
                'safe',
                COALESCE(dc.time_constraint, 'relaxed'),
                'likes_surprises',  -- default surprise_tolerance (column doesn't exist)
                TRUE,  -- personalization_allowed
                FALSE  -- public_visibility
            )
        ELSE 0 
    END as personality_fit_score
FROM v_decision_context_v2 dc;

-- 3. Create v_decision_output_v3 with real personality fit scores
CREATE OR REPLACE VIEW v_decision_output_v3 AS
SELECT 
    cc.*,
    (cc.confidence_score * cc.occasion_emotional_risk_multiplier) as final_score,
    (cc.confidence_score * cc.occasion_emotional_risk_multiplier >= 70) as meets_threshold,
    CASE 
        WHEN (cc.confidence_score * cc.occasion_emotional_risk_multiplier >= 70) THEN false
        ELSE true
    END as is_fallback,
    CASE 
        WHEN (cc.confidence_score * cc.occasion_emotional_risk_multiplier >= 70) THEN NULL
        ELSE 'THRESHOLD_NOT_MET'
    END as fallback_reason
FROM v_decision_confidence_components_v3 cc;

-- Migration notes:
-- * v3 views use real calculate_personality_fit_score() function (not hardcoded 0)
-- * Expected result: ["adventurous", "creative"] + "experience" = 20 points personality_fit_score
-- * This will increase confidence_score and potentially meet threshold (>= 70)
-- * Backwards compatible: v2 views remain unchanged