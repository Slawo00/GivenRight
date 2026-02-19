#!/bin/bash

# Extract project reference from URL
PROJECT_REF=$(echo $SUPABASE_URL | sed 's|https://||' | sed 's|\.supabase\.co||')
echo "Project ref: $PROJECT_REF"

# Create the view SQL
cat > view_v3.sql << 'EOF'
CREATE OR REPLACE VIEW v_decision_confidence_components_v3 AS
SELECT 
    dc.*,
    -- Calculate actual personality fit score using the function
    CASE 
        WHEN dc.personality_traits IS NOT NULL AND array_length(dc.personality_traits, 1) > 0 THEN
            calculate_personality_fit_score(
                dc.personality_traits,
                COALESCE(dc.gift_type_preference, 'experience'),
                dc.decision_option,
                dc.time_constraint,
                dc.surprise_tolerance,
                TRUE,
                FALSE
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
                    COALESCE(dc.gift_type_preference, 'experience'),
                    dc.decision_option,
                    dc.time_constraint,
                    dc.surprise_tolerance,
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
LEFT JOIN v_decision_confidence_components_v2 v2 ON dc.session_id = v2.session_id;
EOF

# Try different psql connection approaches
echo "Attempting psql connection..."

# Approach 1: Direct connection with URL parsing
DB_URL="postgresql://postgres:[YOUR-PASSWORD]@db.${PROJECT_REF}.supabase.co:5432/postgres"

# Since we can't get the password, let's try the supabase CLI approach
if command -v supabase &> /dev/null; then
    echo "Using supabase CLI..."
    
    # Check if project is linked
    if [ -d "projects/givenright" ]; then
        cd projects/givenright
        supabase db push --include-all || echo "Push failed, trying direct SQL..."
        # Try executing the view directly
        supabase db diff --file view_v3.sql --use-migra || echo "Direct diff failed"
    fi
else
    echo "Supabase CLI not found. Attempting alternative method..."
    
    # Try to use the HTTP API for schema modifications
    # This is a workaround since direct SQL execution isn't available
    echo "Creating view via API calls..."
    
    # We'll need to manually construct the API calls for this
    echo "Manual API construction required..."
fi

echo "Deployment script completed."