const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://yjctwxxlbdosriwiwzgt.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlqY3R3eHhsYmRvc3Jpd2l3emd0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Njk0ODQyOSwiZXhwIjoyMDgyNTI0NDI5fQ.Srjz5iXy9fL7H6pyqDUG97szb1I6R6gw3mM3ZJ12xkM';

const supabase = createClient(supabaseUrl, supabaseKey);

async function createAndExecuteViews() {
    try {
        // First, let's create a function that can execute DDL
        const createFunctionSQL = `
CREATE OR REPLACE FUNCTION execute_ddl_sql(sql_text text)
RETURNS text AS $$
BEGIN
    EXECUTE sql_text;
    RETURN 'SUCCESS';
EXCEPTION WHEN OTHERS THEN
    RETURN 'ERROR: ' || SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
        `;

        console.log('Step 1: Creating DDL execution function...');
        const { data: funcResult, error: funcError } = await supabase.rpc('execute_ddl_sql', { sql_text: createFunctionSQL });
        console.log('Function creation result:', funcResult, funcError);

        // Now use it to create our views
        const view1 = `CREATE OR REPLACE VIEW v_decision_confidence_components_v3 AS
SELECT 
    dc.*,
    CASE 
        WHEN dc.personality_traits IS NOT NULL AND array_length(dc.personality_traits, 1) > 0 THEN
            calculate_personality_fit_score(
                dc.personality_traits,
                COALESCE(dc.gift_type_preference, 'experience'),
                COALESCE(dc.decision_option, 'safe'),
                COALESCE(dc.time_constraint, 'relaxed'),
                COALESCE(dc.surprise_tolerance, 'likes_surprises'),
                TRUE,
                FALSE
            )
        ELSE 0 
    END as personality_fit_score,
    v2.base_relationship_score,
    v2.historical_success_score,
    v2.constraint_compliance_score,
    v2.risk_penalty,
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
                    TRUE,
                    FALSE
                )
            ELSE 0 
        END +
        COALESCE(v2.historical_success_score, 0) + 
        COALESCE(v2.constraint_compliance_score, 0) - 
        COALESCE(v2.risk_penalty, 0)
    ) as confidence_score
FROM v_decision_context_v2 dc
LEFT JOIN v_decision_confidence_components_v2 v2 ON dc.session_id = v2.session_id`;

        console.log('Step 2: Creating v_decision_confidence_components_v3...');
        const { data: view1Result, error: view1Error } = await supabase.rpc('execute_ddl_sql', { sql_text: view1 });
        console.log('View 1 result:', view1Result, view1Error?.message);

        const view2 = `CREATE OR REPLACE VIEW v_personality_fit_scores AS
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
                TRUE,
                FALSE
            )
        ELSE 0 
    END as personality_fit_score
FROM v_decision_context_v2 dc`;

        console.log('Step 3: Creating v_personality_fit_scores...');
        const { data: view2Result, error: view2Error } = await supabase.rpc('execute_ddl_sql', { sql_text: view2 });
        console.log('View 2 result:', view2Result, view2Error?.message);

        const view3 = `CREATE OR REPLACE VIEW v_decision_output_v3 AS
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
FROM v_decision_confidence_components_v3 cc`;

        console.log('Step 4: Creating v_decision_output_v3...');
        const { data: view3Result, error: view3Error } = await supabase.rpc('execute_ddl_sql', { sql_text: view3 });
        console.log('View 3 result:', view3Result, view3Error?.message);

        console.log('\n=== FINAL RESULTS ===');
        console.log('Function creation:', funcResult || funcError?.message);
        console.log('View 1 (v_decision_confidence_components_v3):', view1Result || view1Error?.message);
        console.log('View 2 (v_personality_fit_scores):', view2Result || view2Error?.message);
        console.log('View 3 (v_decision_output_v3):', view3Result || view3Error?.message);

    } catch (error) {
        console.error('Error:', error.message);
    }
}

createAndExecuteViews();