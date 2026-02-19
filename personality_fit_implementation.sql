-- GivenRight: Personality Fit Score Implementation
-- Complete SQL implementation based on Excel logic

-- 1. Create personality dimensions table with trait-to-dimension mapping
CREATE TABLE IF NOT EXISTS q_personality_dimensions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trait_code TEXT UNIQUE NOT NULL,
  label TEXT NOT NULL,
  emotional_orientation SMALLINT DEFAULT 3,
  functionality_preference SMALLINT DEFAULT 3,
  novelty_tolerance SMALLINT DEFAULT 3,
  aesthetic_sensitivity SMALLINT DEFAULT 3,
  experience_bias SMALLINT DEFAULT 3,
  boldness_acceptance SMALLINT DEFAULT 3,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 2. Insert trait mappings from Excel analysis
INSERT INTO q_personality_dimensions 
(trait_code, label, emotional_orientation, functionality_preference, novelty_tolerance, aesthetic_sensitivity, experience_bias, boldness_acceptance)
VALUES
('practical', 'Practical', 2, 5, 2, 2, 1, 2),
('emotional', 'Emotional', 5, 1, 3, 4, 2, 3),
('creative', 'Creative', 3, 2, 5, 4, 3, 4),
('minimalistic', 'Minimalistic', 2, 4, 1, 5, 1, 2),
('luxurious', 'Luxurious', 3, 3, 2, 5, 1, 2),
('humorous', 'Humorous', 3, 2, 4, 3, 2, 4),
('adventurous', 'Adventurous', 3, 2, 5, 3, 5, 5),
('reserved', 'Reserved', 2, 4, 1, 2, 1, 1)
ON CONFLICT (trait_code) DO NOTHING;

-- 3. Create personality fit score calculation function
CREATE OR REPLACE FUNCTION calculate_personality_fit_score(
  traits TEXT[],
  gift_type TEXT,
  decision_option TEXT DEFAULT 'safe',
  time_constraint TEXT DEFAULT NULL,
  surprise_tolerance TEXT DEFAULT NULL,
  personalization_allowed BOOLEAN DEFAULT TRUE,
  public_visibility BOOLEAN DEFAULT FALSE
) RETURNS INTEGER AS $$
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
  -- If no traits provided, return 0
  IF traits IS NULL OR array_length(traits, 1) = 0 THEN
    RETURN 0;
  END IF;

  -- Aggregate personality dimensions using MAX rule (from Excel)
  FOR trait_record IN 
    SELECT * FROM q_personality_dimensions 
    WHERE trait_code = ANY(traits)
  LOOP
    max_emotional_orientation := GREATEST(max_emotional_orientation, trait_record.emotional_orientation);
    max_functionality_preference := GREATEST(max_functionality_preference, trait_record.functionality_preference);
    max_novelty_tolerance := GREATEST(max_novelty_tolerance, trait_record.novelty_tolerance);
    max_aesthetic_sensitivity := GREATEST(max_aesthetic_sensitivity, trait_record.aesthetic_sensitivity);
    max_experience_bias := GREATEST(max_experience_bias, trait_record.experience_bias);
    max_boldness_acceptance := GREATEST(max_boldness_acceptance, trait_record.boldness_acceptance);
  END LOOP;

  -- Apply gift type scoring logic from Excel
  
  -- PRACTICAL gift scoring
  IF gift_type = 'practical' THEN
    IF max_functionality_preference >= 4 THEN score := score + 10; END IF;
    IF max_emotional_orientation <= 2 THEN score := score + 5; END IF;
    IF max_novelty_tolerance <= 2 THEN score := score + 5; END IF;
    IF max_boldness_acceptance <= 2 THEN score := score + 3; END IF;
    IF max_experience_bias >= 4 THEN score := score - 5; END IF;
  END IF;

  -- EMOTIONAL OBJECT gift scoring
  IF gift_type = 'emotional' THEN
    IF max_emotional_orientation >= 4 THEN score := score + 10; END IF;
    IF max_aesthetic_sensitivity >= 4 THEN score := score + 5; END IF;
    IF max_novelty_tolerance >= 3 THEN score := score + 3; END IF;
  END IF;

  -- EXPERIENCE gift scoring
  IF gift_type = 'experience' THEN
    IF max_experience_bias >= 4 THEN score := score + 10; END IF;
    IF max_boldness_acceptance >= 3 THEN score := score + 5; END IF;
    IF max_novelty_tolerance >= 3 THEN score := score + 5; END IF;
    
    -- Context penalties for experience
    IF time_constraint = 'under_3_days' THEN score := score - 10; END IF;
    IF surprise_tolerance IN ('prefers_to_know', 'no_surprises') THEN score := score - 10; END IF;
  END IF;

  -- MIXED/HYBRID gift scoring
  IF gift_type = 'mixed' THEN
    IF max_emotional_orientation >= 3 THEN score := score + 5; END IF;
    IF max_experience_bias >= 3 THEN score := score + 5; END IF;
    IF max_aesthetic_sensitivity >= 3 THEN score := score + 5; END IF;
    
    IF NOT personalization_allowed THEN score := score - 5; END IF;
  END IF;

  -- SURPRISE gift scoring  
  IF gift_type = 'surprise' THEN
    IF max_boldness_acceptance >= 4 THEN score := score + 10; END IF;
    IF max_novelty_tolerance >= 4 THEN score := score + 5; END IF;
    IF max_emotional_orientation >= 3 THEN score := score + 3; END IF;
    
    -- Hard penalty for surprise-intolerant people
    IF surprise_tolerance IN ('prefers_to_know', 'no_surprises') THEN score := score - 15; END IF;
  END IF;

  -- Decision option modifiers
  IF decision_option = 'bold' THEN
    score := score + (max_boldness_acceptance - 3); -- Bonus/penalty based on boldness
  END IF;

  -- General context penalties
  IF public_visibility = TRUE THEN score := score - 10; END IF;

  -- Cap score between 0 and 20
  RETURN GREATEST(0, LEAST(20, score));
END;
$$ LANGUAGE plpgsql;

-- 4. Create view for personality fit scores  
CREATE OR REPLACE VIEW v_personality_fit_scores AS
SELECT 
  dc.*,
  calculate_personality_fit_score(
    dc.personality_traits,
    dc.gift_type_preference, 
    'safe', -- Default decision option, could be parameterized
    dc.time_constraint,
    dc.surprise_tolerance,
    TRUE, -- personalization_allowed - could be derived from closeness
    FALSE -- public_visibility - could be derived from occasion
  ) as personality_fit_score
FROM v_decision_context_v2 dc;

-- 5. Update main confidence components view to include real personality fit score
CREATE OR REPLACE VIEW v_decision_confidence_components_v3 AS
SELECT 
  dc.session_id,
  dc.relationship_id,
  dc.user_id,
  'safe' as decision_option, -- Will be expanded to include all options
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
  
  -- Score components
  COALESCE((
    SELECT rt.emotional_intensity * 6 + rt.intimacy_allowed * 2 + rt.risk_tolerance * 2
    FROM q_relationship_types rt 
    WHERE rt.code = dc.relationship_type
  ), 0) as base_relationship_score,
  
  pfs.personality_fit_score,
  
  20 as historical_success_score, -- Placeholder - implement historical logic
  15 as constraint_compliance_score, -- Placeholder - implement constraint checking
  0 as risk_penalty, -- Placeholder - implement risk penalty calculation
  
  -- Final confidence score
  COALESCE((
    SELECT rt.emotional_intensity * 6 + rt.intimacy_allowed * 2 + rt.risk_tolerance * 2
    FROM q_relationship_types rt 
    WHERE rt.code = dc.relationship_type
  ), 0) + 
  COALESCE(pfs.personality_fit_score, 0) + 
  20 + 15 - 0 as confidence_score

FROM v_decision_context_v2 dc
LEFT JOIN v_personality_fit_scores pfs ON pfs.session_id = dc.session_id;

-- Test queries to verify implementation
-- SELECT * FROM q_personality_dimensions ORDER BY trait_code;
-- SELECT session_id, personality_traits, gift_type_preference, personality_fit_score 
-- FROM v_personality_fit_scores 
-- WHERE personality_traits IS NOT NULL 
-- LIMIT 5;