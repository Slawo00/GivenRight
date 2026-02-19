
-- Migration: Add v3 views with working personality fit scores
-- Date: 2026-01-18

-- Create v_decision_confidence_components_v3 with REAL personality fit scoring
CREATE OR REPLACE VIEW v_decision_confidence_components_v3 AS
SELECT 
    dc.*,
    -- Calculate actual personality fit score using the function
    CASE 
        WHEN dc.personality_traits IS NOT NULL AND array_length(dc.personality_traits, 1) > 0 THEN
            calculate_personality_fit_score(
                dc.personality_traits,
                COALESCE(dc.gift_type_preference, 'experience'),
                COALESCE(dc.decision_option, 'safe'),
                COALESCE(dc.time_constraint, 'relaxed'),
                COALESCE(dc.surprise_tolerance, 'likes_surprises'),
                TRUE,  -- personalization_allowed
                FALSE  -- public_visibility
            )
        ELSE 0 
    END as personality_fit_score,
    
    -- Keep existing scores from v2
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
                    COALESCE(dc.decision_option, 'safe'),
                    COALESCE(dc.time_constraint, 'relaxed'),
                    COALESCE(dc.surprise_tolerance, 'likes_surprises'),
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

-- Update v_personality_fit_scores to use REAL scores
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
                COALESCE(dc.surprise_tolerance, 'likes_surprises'),
                TRUE,  -- personalization_allowed
                FALSE  -- public_visibility
            )
        ELSE 0 
    END as personality_fit_score
FROM v_decision_context_v2 dc;
