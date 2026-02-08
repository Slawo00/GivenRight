
-- Complete Personality Fit Integration Deployment

-- Step 1: Create the function (using CREATE OR REPLACE)
CREATE OR REPLACE FUNCTION calculate_personality_fit_score(
    traits TEXT[],
    gift_type TEXT,
    decision_option TEXT DEFAULT 'safe',
    time_constraint TEXT DEFAULT NULL,
    surprise_tolerance TEXT DEFAULT NULL,
    personalization_allowed BOOLEAN DEFAULT TRUE,
    public_visibility BOOLEAN DEFAULT FALSE
) RETURNS INTEGER 
LANGUAGE plpgsql AS $$
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
    IF traits IS NULL OR array_length(traits, 1) = 0 THEN
        RETURN 0;
    END IF;
    
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
    
    IF decision_option = 'bold' THEN
        score := score + (max_boldness_acceptance - 3);
    END IF;
    
    IF public_visibility = TRUE THEN
        score := score - 10;
    END IF;
    
    RETURN GREATEST(0, LEAST(20, score));
END;
$$;

