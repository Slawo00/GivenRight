-- Deploy: Personality Fit Score Integration
-- Fix the integration bug in v_decision_confidence_components_v2

-- 1. Create the calculate_personality_fit_score function
CREATE OR REPLACE FUNCTION calculate_personality_fit_score(
    traits TEXT[],
    gift_type TEXT,
    decision_option TEXT DEFAULT 'safe',
    time_constraint TEXT DEFAULT NULL,
    surprise_tolerance TEXT DEFAULT NULL,
    personalization_allowed BOOLEAN DEFAULT TRUE,
    public_visibility BOOLEAN DEFAULT FALSE
) RETURNS INTEGER 
LANGUAGE plpgsql 
AS $$
DECLARE
    score INTEGER := 0;
    trait_record RECORD;
    max_emotional_orientation INTEGER := 1;
    max_functionality_preference INTEGER := 1;
    max_novelty_tolerance INTEGER := 1;
    max_aesthetic_sensitivity INTEGER := 1;
    max_experience_bias INTEGER := 1;
    max_boldness_acceptance INTEGER := 1;
BEGIN
    -- Return 0 if no traits provided
    IF traits IS NULL OR array_length(traits, 1) = 0 THEN
        RETURN 0;
    END IF;
    
    -- Aggregate personality dimensions using MAX rule
    FOR trait_record IN 
        SELECT * FROM q_personality_dimensions WHERE trait_code = ANY(traits)
    LOOP
        max_emotional_orientation := GREATEST(max_emotional_orientation, trait_record.emotional_orientation);
        max_functionality_preference := GREATEST(max_functionality_preference, trait_record.functionality_preference);
        max_novelty_tolerance := GREATEST(max_novelty_tolerance, trait_record.novelty_tolerance);
        max_aesthetic_sensitivity := GREATEST(max_aesthetic_sensitivity, trait_record.aesthetic_sensitivity);
        max_experience_bias := GREATEST(max_experience_bias, trait_record.experience_bias);
        max_boldness_acceptance := GREATEST(max_boldness_acceptance, trait_record.boldness_acceptance);
    END LOOP;
    
    -- Gift type scoring logic
    CASE gift_type
        WHEN 'practical' THEN
            IF max_functionality_preference >= 4 THEN score := score + 10; END IF;
            IF max_emotional_orientation <= 2 THEN score := score + 5; END IF;
            IF max_novelty_tolerance <= 2 THEN score := score + 5; END IF;
            IF max_boldness_acceptance <= 2 THEN score := score + 3; END IF;
            IF max_experience_bias >= 4 THEN score := score - 5; END IF;
            
        WHEN 'emotional' THEN
            IF max_emotional_orientation >= 4 THEN score := score + 10; END IF;
            IF max_aesthetic_sensitivity >= 4 THEN score := score + 5; END IF;
            IF max_novelty_tolerance >= 3 THEN score := score + 3; END IF;
            
        WHEN 'experience' THEN
            IF max_experience_bias >= 4 THEN score := score + 10; END IF;
            IF max_boldness_acceptance >= 3 THEN score := score + 5; END IF;
            IF max_novelty_tolerance >= 3 THEN score := score + 5; END IF;
            IF time_constraint = 'under_3_days' THEN score := score - 10; END IF;
            IF surprise_tolerance IN ('prefers_to_know', 'no_surprises') THEN score := score - 10; END IF;
            
        WHEN 'mixed' THEN
            IF max_emotional_orientation >= 3 THEN score := score + 5; END IF;
            IF max_experience_bias >= 3 THEN score := score + 5; END IF;
            IF max_aesthetic_sensitivity >= 3 THEN score := score + 5; END IF;
            IF NOT personalization_allowed THEN score := score - 5; END IF;
            
        WHEN 'surprise' THEN
            IF max_boldness_acceptance >= 4 THEN score := score + 10; END IF;
            IF max_novelty_tolerance >= 4 THEN score := score + 5; END IF;
            IF max_emotional_orientation >= 3 THEN score := score + 3; END IF;
            IF surprise_tolerance IN ('prefers_to_know', 'no_surprises') THEN score := score - 15; END IF;
    END CASE;
    
    -- Decision option modifiers
    IF decision_option = 'bold' THEN
        score := score + (max_boldness_acceptance - 3);
    END IF;
    
    -- General context penalties
    IF public_visibility = TRUE THEN
        score := score - 10;
    END IF;
    
    -- Cap score between 0 and 20
    RETURN GREATEST(0, LEAST(20, score));
END;
$$;

-- 2. Update v_decision_confidence_components_v2 to use the real personality fit score
CREATE OR REPLACE VIEW v_decision_confidence_components_v3 AS
SELECT 
    dc.session_id,
    dc.relationship_id,
    dc.user_id,
    'safe' as decision_option,
    dc.relationship_type,
    dc.closeness_level,
    dc.occasion,
    dc.occasion_importance_code,
    dc.occasion_emotional_risk_multiplier,
    dc.life_stage_code,
    dc.personality_traits,
    dc.surprise_tolerance,
    dc.values,
    dc.no_gos,
    dc.budget_range,
    dc.time_constraint,
    dc.gift_type_preference,
    dc.prompt_version,
    dc.session_created_at,
    
    -- Base relationship score (from existing logic)
    (CASE 
        WHEN dc.relationship_type = 'spouse' THEN 30
        WHEN dc.relationship_type = 'partner' THEN 28
        WHEN dc.relationship_type = 'child' THEN 26
        WHEN dc.relationship_type = 'close_friend' THEN 26
        WHEN dc.relationship_type = 'sibling' THEN 24
        WHEN dc.relationship_type = 'parent' THEN 22
        WHEN dc.relationship_type = 'friend' THEN 20
        WHEN dc.relationship_type = 'colleague' THEN 15
        WHEN dc.relationship_type = 'acquaintance' THEN 10
        ELSE 5
    END * dc.occasion_emotional_risk_multiplier) as base_relationship_score,
    
    -- NEW: Real personality fit score using the function
    CASE 
        WHEN dc.personality_traits IS NOT NULL AND dc.gift_type_preference IS NOT NULL THEN
            calculate_personality_fit_score(
                dc.personality_traits,
                dc.gift_type_preference,
                'safe',
                dc.time_constraint,
                dc.surprise_tolerance,
                TRUE,
                FALSE
            )
        ELSE 0 
    END as personality_fit_score,
    
    -- Historical success score (placeholder)
    20 as historical_success_score,
    
    -- Constraint compliance score (placeholder) 
    15 as constraint_compliance_score,
    
    -- Risk penalty (placeholder)
    0 as risk_penalty,
    
    -- Confidence score = weighted sum of components
    (
        (CASE 
            WHEN dc.relationship_type = 'spouse' THEN 30
            WHEN dc.relationship_type = 'partner' THEN 28
            WHEN dc.relationship_type = 'child' THEN 26
            WHEN dc.relationship_type = 'close_friend' THEN 26
            WHEN dc.relationship_type = 'sibling' THEN 24
            WHEN dc.relationship_type = 'parent' THEN 22
            WHEN dc.relationship_type = 'friend' THEN 20
            WHEN dc.relationship_type = 'colleague' THEN 15
            WHEN dc.relationship_type = 'acquaintance' THEN 10
            ELSE 5
        END * dc.occasion_emotional_risk_multiplier) * 0.3 +
        
        (CASE 
            WHEN dc.personality_traits IS NOT NULL AND dc.gift_type_preference IS NOT NULL THEN
                calculate_personality_fit_score(
                    dc.personality_traits,
                    dc.gift_type_preference,
                    'safe',
                    dc.time_constraint,
                    dc.surprise_tolerance,
                    TRUE,
                    FALSE
                )
            ELSE 0 
        END) * 0.4 +
        
        20 * 0.2 +  -- historical success weight
        15 * 0.1    -- constraint compliance weight
    ) as confidence_score

FROM v_decision_context_v2 dc;

-- 3. Update the final decision output to use v3
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