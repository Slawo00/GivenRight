-- Migration: Personality Fit Score Enhancement
-- Created: 2026-02-08 15:45 UTC
-- Purpose: Add personality fit scoring system

-- 1. Create personality dimensions table (if not exists)
CREATE TABLE IF NOT EXISTS q_personality_dimensions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trait_code TEXT NOT NULL UNIQUE,
    emotional_orientation SMALLINT DEFAULT 3 CHECK (emotional_orientation BETWEEN 1 AND 5),
    functionality_preference SMALLINT DEFAULT 3 CHECK (functionality_preference BETWEEN 1 AND 5),
    novelty_tolerance SMALLINT DEFAULT 3 CHECK (novelty_tolerance BETWEEN 1 AND 5),
    aesthetic_sensitivity SMALLINT DEFAULT 3 CHECK (aesthetic_sensitivity BETWEEN 1 AND 5),
    experience_bias SMALLINT DEFAULT 3 CHECK (experience_bias BETWEEN 1 AND 5),
    boldness_acceptance SMALLINT DEFAULT 3 CHECK (boldness_acceptance BETWEEN 1 AND 5),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Insert personality dimension mappings (if not exists)
INSERT INTO q_personality_dimensions (trait_code, emotional_orientation, functionality_preference, novelty_tolerance, aesthetic_sensitivity, experience_bias, boldness_acceptance) 
VALUES 
    ('practical', 2, 4, 2, 2, 2, 2),
    ('emotional', 4, 2, 3, 4, 3, 3),
    ('creative', 3, 3, 4, 3, 3, 3),
    ('minimalistic', 2, 3, 2, 4, 2, 2),
    ('luxurious', 3, 3, 3, 5, 4, 3),
    ('humorous', 3, 3, 4, 3, 3, 4),
    ('adventurous', 3, 3, 4, 3, 4, 4),
    ('reserved', 2, 3, 1, 3, 2, 1)
ON CONFLICT (trait_code) DO NOTHING;

-- 3. Create personality fit score function
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