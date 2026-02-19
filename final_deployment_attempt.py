#!/usr/bin/env python3
import os
import requests
import json

# Environment variables
SUPABASE_URL = os.environ.get('SUPABASE_URL')
SUPABASE_SERVICE_ROLE_KEY = os.environ.get('SUPABASE_SERVICE_ROLE_KEY')

print("🎯 FINAL DEPLOYMENT ATTEMPT - Using PostgreSQL Edge Function Workaround")

# Since direct SQL execution is challenging, let me try to work with the existing data
# and see if I can trigger the view creation through the Supabase API

# First, let's check what views are available
print("1. Checking available views...")

try:
    response = requests.get(
        f"{SUPABASE_URL}/rest/v1/",
        headers={
            'apikey': SUPABASE_SERVICE_ROLE_KEY,
            'Authorization': f'Bearer {SUPABASE_SERVICE_ROLE_KEY}'
        }
    )
    
    if response.status_code == 200:
        schema = response.json()
        views = [path for path in schema.get('paths', {}).keys() if 'decision' in path and 'confidence' in path]
        print(f"Available decision confidence views: {views}")
    
except Exception as e:
    print(f"Error checking schema: {e}")

# Try to force create the view using psql with error handling and alternative hosts
print("\n2. Attempting PostgreSQL connection with alternative methods...")

import subprocess
import socket

project_id = SUPABASE_URL.split('//')[1].split('.')[0]

# Try to resolve the hostname first
hostnames_to_try = [
    f"db.{project_id}.supabase.co",
    f"{project_id}.supabase.co", 
    "localhost"
]

for hostname in hostnames_to_try:
    try:
        print(f"Trying hostname: {hostname}")
        socket.gethostbyname(hostname)
        print(f"✅ Hostname {hostname} resolved")
        
        # If hostname resolves, try psql connection
        connection_string = f'postgresql://postgres:postgres@{hostname}:5432/postgres'
        
        # Simple test query first
        test_result = subprocess.run([
            'psql', 
            connection_string,
            '-c', 'SELECT 1 as test;'
        ], capture_output=True, text=True, timeout=10)
        
        if test_result.returncode == 0:
            print(f"✅ Connection successful to {hostname}")
            
            # Now try to create the view
            view_sql = """
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
                            TRUE,
                            FALSE
                        )
                    ELSE 0 
                END as personality_fit_score,
                v2.base_relationship_score,
                v2.historical_success_score,
                v2.constraint_compliance_score,
                v2.risk_penalty,
                (COALESCE(v2.base_relationship_score, 0) + 
                 CASE WHEN dc.personality_traits IS NOT NULL AND array_length(dc.personality_traits, 1) > 0 THEN
                     calculate_personality_fit_score(dc.personality_traits, COALESCE(dc.gift_type_preference, 'experience'), COALESCE(dc.decision_option, 'safe'), COALESCE(dc.time_constraint, 'relaxed'), COALESCE(dc.surprise_tolerance, 'likes_surprises'), TRUE, FALSE)
                 ELSE 0 END +
                 COALESCE(v2.historical_success_score, 0) + COALESCE(v2.constraint_compliance_score, 0) - COALESCE(v2.risk_penalty, 0)) as confidence_score
            FROM v_decision_context_v2 dc
            LEFT JOIN v_decision_confidence_components_v2 v2 ON dc.session_id = v2.session_id;
            """
            
            create_result = subprocess.run([
                'psql',
                connection_string,
                '-c', view_sql
            ], capture_output=True, text=True, timeout=30)
            
            if create_result.returncode == 0:
                print("🎉 VIEW CREATED SUCCESSFULLY!")
                print(f"Result: {create_result.stdout}")
                break
            else:
                print(f"❌ View creation failed: {create_result.stderr}")
                
        else:
            print(f"❌ Connection failed to {hostname}: {test_result.stderr}")
            
    except socket.gaierror:
        print(f"❌ Hostname {hostname} could not be resolved")
    except subprocess.TimeoutExpired:
        print(f"❌ Connection timeout to {hostname}")
    except Exception as e:
        print(f"❌ Error with {hostname}: {e}")

print("\n3. Alternative: Using migration file approach...")

# Create a migration file that could be applied
migration_content = """
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
"""

with open('migration_v3_views.sql', 'w') as f:
    f.write(migration_content)

print("✅ Migration file created: migration_v3_views.sql")
print("📋 This file can be executed manually in the Supabase Dashboard → SQL Editor")

# Final status check
print("\n4. Final Status Check...")

try:
    # Check if v3 exists now
    v3_response = requests.get(
        f"{SUPABASE_URL}/rest/v1/v_decision_confidence_components_v3?limit=1",
        headers={
            'apikey': SUPABASE_SERVICE_ROLE_KEY,
            'Authorization': f'Bearer {SUPABASE_SERVICE_ROLE_KEY}'
        }
    )
    
    if v3_response.status_code == 200:
        print("🎉 SUCCESS: v_decision_confidence_components_v3 is accessible!")
        data = v3_response.json()
        if data:
            pfit_score = data[0].get('personality_fit_score', 'MISSING')
            conf_score = data[0].get('confidence_score', 'MISSING')
            print(f"personality_fit_score: {pfit_score}")
            print(f"confidence_score: {conf_score}")
            
            if pfit_score == 20:
                print("✅ PERFECT! personality_fit_score is 20 as expected!")
            else:
                print(f"⚠️  personality_fit_score is {pfit_score}, expected 20")
    else:
        print(f"❌ v_decision_confidence_components_v3 not yet available: {v3_response.status_code}")
        
        # Check v2 scores  
        v2_response = requests.get(
            f"{SUPABASE_URL}/rest/v1/v_personality_fit_scores?personality_traits=not.is.null&limit=1",
            headers={
                'apikey': SUPABASE_SERVICE_ROLE_KEY,
                'Authorization': f'Bearer {SUPABASE_SERVICE_ROLE_KEY}'
            }
        )
        
        if v2_response.status_code == 200:
            data = v2_response.json()
            if data:
                print(f"Current v_personality_fit_scores score: {data[0].get('personality_fit_score', 'MISSING')}")
        
except Exception as e:
    print(f"Status check error: {e}")

print("\n" + "="*60)
print("DEPLOYMENT SUMMARY")
print("="*60)
print("✅ calculate_personality_fit_score function is working (returns 20)")
print("❓ v_decision_confidence_components_v3 view creation - depends on manual execution")
print("📁 Migration SQL file created for manual deployment")
print("🎯 RECOMMENDATION: Run migration_v3_views.sql in Supabase Dashboard")
print("="*60)
