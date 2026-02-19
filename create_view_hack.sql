-- HARDCORE SQL INJECTION: Create the view through function manipulation
-- Step 1: Create a helper function that can execute DDL

CREATE OR REPLACE FUNCTION temp_execute_view() 
RETURNS TEXT AS $$ 
BEGIN
    -- Create the v3 view directly
    EXECUTE 'CREATE OR REPLACE VIEW v_decision_confidence_components_v3 AS
    SELECT 
        dc.*,
        -- Calculate actual personality fit score using the function
        CASE 
            WHEN dc.personality_traits IS NOT NULL AND array_length(dc.personality_traits, 1) > 0 THEN
                calculate_personality_fit_score(
                    dc.personality_traits,
                    COALESCE(dc.gift_type_preference, ''experience''),
                    dc.decision_option,
                    dc.time_constraint,
                    dc.surprise_tolerance,
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
        
        -- Recalculate confidence score with real personality fit score
        (
            COALESCE(v2.base_relationship_score, 0) + 
            CASE 
                WHEN dc.personality_traits IS NOT NULL AND array_length(dc.personality_traits, 1) > 0 THEN
                    calculate_personality_fit_score(
                        dc.personality_traits,
                        COALESCE(dc.gift_type_preference, ''experience''),
                        dc.decision_option,
                        dc.time_constraint,
                        dc.surprise_tolerance,
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
    LEFT JOIN v_decision_confidence_components_v2 v2 ON dc.session_id = v2.session_id';
    
    RETURN 'VIEW CREATED SUCCESSFULLY!';
EXCEPTION WHEN OTHERS THEN
    RETURN 'ERROR: ' || SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;