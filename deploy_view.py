#!/usr/bin/env python3
import os
import subprocess
import json

# Environment variables
SUPABASE_URL = os.environ.get('SUPABASE_URL')
SUPABASE_SERVICE_ROLE_KEY = os.environ.get('SUPABASE_SERVICE_ROLE_KEY')

if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
    print("Error: Missing environment variables")
    exit(1)

# The SQL to create the view
sql = '''CREATE OR REPLACE VIEW v_decision_confidence_components_v3 AS
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
LEFT JOIN v_decision_confidence_components_v2 v2 ON dc.session_id = v2.session_id;'''

# Write SQL to temp file
with open('temp_view.sql', 'w') as f:
    f.write(sql)

# Try to execute using psql if available
psql_url = SUPABASE_URL.replace('https://', 'postgresql://postgres:').replace('.supabase.co', '.supabase.co:5432') + '/postgres'

try:
    result = subprocess.run([
        'psql', psql_url, '-f', 'temp_view.sql'
    ], capture_output=True, text=True, env={**os.environ, 'PGPASSWORD': 'your_password'})
    
    if result.returncode == 0:
        print("✓ View created successfully via psql")
        print(result.stdout)
    else:
        print("✗ psql failed, trying alternative method")
        print(result.stderr)
        
        # Alternative: Use curl with base64 encoded SQL
        import base64
        encoded_sql = base64.b64encode(sql.encode()).decode()
        
        curl_cmd = [
            'curl', '-X', 'POST', f'{SUPABASE_URL}/sql',
            '-H', f'apikey: {SUPABASE_SERVICE_ROLE_KEY}',
            '-H', f'Authorization: Bearer {SUPABASE_SERVICE_ROLE_KEY}',
            '-H', 'Content-Type: application/sql',
            '--data', sql
        ]
        
        result2 = subprocess.run(curl_cmd, capture_output=True, text=True)
        print("Curl result:", result2.stdout, result2.stderr)
        
except FileNotFoundError:
    print("psql not found, trying direct file execution...")
    
# Cleanup
os.remove('temp_view.sql')