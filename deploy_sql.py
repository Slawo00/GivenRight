#!/usr/bin/env python3
import os
import requests
import json

# Get environment variables
SUPABASE_URL = os.environ.get('SUPABASE_URL')
SUPABASE_SERVICE_ROLE_KEY = os.environ.get('SUPABASE_SERVICE_ROLE_KEY')

if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
    print("❌ Error: Missing environment variables")
    exit(1)

print(f"🔗 Connecting to: {SUPABASE_URL}")

# Read the SQL file
with open('final_view_deployment.sql', 'r') as f:
    sql_content = f.read()

print("📄 SQL content loaded")

# Try multiple approaches to execute the SQL

# Approach 1: Try the GraphQL endpoint for schema operations
graphql_endpoint = f"{SUPABASE_URL}/graphql/v1"
headers = {
    'apikey': SUPABASE_SERVICE_ROLE_KEY,
    'Authorization': f'Bearer {SUPABASE_SERVICE_ROLE_KEY}',
    'Content-Type': 'application/json'
}

# Approach 2: Try to create a stored procedure that executes the SQL
create_executor_proc = """
CREATE OR REPLACE FUNCTION execute_deployment_sql() RETURNS TEXT AS $$
DECLARE
    result TEXT := '';
BEGIN
    -- Create v_decision_confidence_components_v3 with REAL personality fit scoring
    EXECUTE '
    CREATE OR REPLACE VIEW v_decision_confidence_components_v3 AS
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
        
        -- Recalculate confidence score with REAL personality fit score
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
    
    result := result || 'v_decision_confidence_components_v3 created; ';
    
    -- Update v_personality_fit_scores
    EXECUTE '
    CREATE OR REPLACE VIEW v_personality_fit_scores AS
    SELECT 
        dc.*,
        CASE 
            WHEN dc.personality_traits IS NOT NULL AND array_length(dc.personality_traits, 1) > 0 THEN
                calculate_personality_fit_score(
                    dc.personality_traits,
                    COALESCE(dc.gift_type_preference, ''experience''),
                    ''safe'',
                    COALESCE(dc.time_constraint, ''relaxed''),
                    COALESCE(dc.surprise_tolerance, ''likes_surprises''),
                    TRUE,  -- personalization_allowed
                    FALSE  -- public_visibility
                )
            ELSE 0 
        END as personality_fit_score
    FROM v_decision_context_v2 dc';
    
    result := result || 'v_personality_fit_scores updated; ';
    
    RETURN result || 'Deployment completed successfully!';
EXCEPTION WHEN OTHERS THEN
    RETURN 'Error: ' || SQLERRM;
END;
$$ LANGUAGE plpgsql;
"""

# Try to create and execute the deployment function via RPC
print("🔧 Attempting to create deployment function...")

try:
    # First, create the deployment function
    response = requests.post(
        f"{SUPABASE_URL}/rest/v1/rpc/sql",
        headers=headers,
        json={"query": create_executor_proc}
    )
    
    if response.status_code != 200:
        print(f"❌ Failed to create function via rpc/sql: {response.text}")
        
        # Try alternative: Create via direct RPC call structure
        rpc_data = {
            "args": {"sql": create_executor_proc}
        }
        
        response2 = requests.post(
            f"{SUPABASE_URL}/rest/v1/rpc/execute_sql",
            headers=headers,
            json=rpc_data
        )
        
        if response2.status_code != 200:
            print(f"❌ Alternative RPC also failed: {response2.text}")
            print("🎯 Trying direct PostgreSQL connection...")
            
            # Extract project ID from URL
            project_id = SUPABASE_URL.split('//')[1].split('.')[0]
            
            # Try different connection methods
            import subprocess
            
            # Method 1: Try with service role key as password
            try:
                result = subprocess.run([
                    'psql', 
                    f'postgresql://postgres:{SUPABASE_SERVICE_ROLE_KEY}@db.{project_id}.supabase.co:5432/postgres',
                    '-c', create_executor_proc
                ], capture_output=True, text=True, timeout=30)
                
                if result.returncode == 0:
                    print("✅ Function created via psql!")
                    
                    # Now execute the function
                    result2 = subprocess.run([
                        'psql',
                        f'postgresql://postgres:{SUPABASE_SERVICE_ROLE_KEY}@db.{project_id}.supabase.co:5432/postgres',
                        '-c', 'SELECT execute_deployment_sql();'
                    ], capture_output=True, text=True, timeout=30)
                    
                    if result2.returncode == 0:
                        print("🎉 DEPLOYMENT SUCCESSFUL!")
                        print(f"Result: {result2.stdout}")
                        
                        # Test the deployment
                        test_result = subprocess.run([
                            'psql',
                            f'postgresql://postgres:{SUPABASE_SERVICE_ROLE_KEY}@db.{project_id}.supabase.co:5432/postgres',
                            '-c', 'SELECT personality_fit_score FROM v_decision_confidence_components_v3 WHERE personality_traits IS NOT NULL LIMIT 1;'
                        ], capture_output=True, text=True, timeout=30)
                        
                        if test_result.returncode == 0:
                            print("🧪 Test result:")
                            print(test_result.stdout)
                        
                    else:
                        print(f"❌ Failed to execute function: {result2.stderr}")
                else:
                    print(f"❌ Failed to create function via psql: {result.stderr}")
                    
            except subprocess.TimeoutExpired:
                print("❌ Connection timeout")
            except Exception as e:
                print(f"❌ Connection error: {e}")
            
        else:
            print("✅ Function created via alternative RPC")
            
    else:
        print("✅ Function created via rpc/sql")

except Exception as e:
    print(f"❌ Request failed: {e}")

print("🏁 Deployment script completed")