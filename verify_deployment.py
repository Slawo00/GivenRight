#!/usr/bin/env python3
import os
import subprocess
import json

SUPABASE_URL = os.environ.get('SUPABASE_URL')
SUPABASE_SERVICE_ROLE_KEY = os.environ.get('SUPABASE_SERVICE_ROLE_KEY')

def test_function():
    """Test the calculate_personality_fit_score function"""
    print("🧪 Testing calculate_personality_fit_score function...")
    
    test_cases = [
        {
            "traits": ["adventurous", "creative"],
            "gift_type": "experience",
            "expected": 20
        },
        {
            "traits": ["practical"],
            "gift_type": "practical",
            "expected": "high score for practical"
        }
    ]
    
    for test in test_cases:
        cmd = [
            'curl', '-X', 'POST', 
            f'{SUPABASE_URL}/rest/v1/rpc/calculate_personality_fit_score',
            '-H', f'apikey: {SUPABASE_SERVICE_ROLE_KEY}',
            '-H', f'Authorization: Bearer {SUPABASE_SERVICE_ROLE_KEY}',
            '-H', 'Content-Type: application/json',
            '-d', json.dumps({
                "traits": test["traits"],
                "gift_type": test["gift_type"]
            })
        ]
        
        result = subprocess.run(cmd, capture_output=True, text=True)
        if result.returncode == 0:
            score = int(result.stdout.strip())
            print(f"  ✓ {test['traits']} + {test['gift_type']} → {score}")
            if test["expected"] == score:
                print(f"    ✓ Expected {test['expected']}, got {score}")
        else:
            print(f"  ✗ {test['traits']} + {test['gift_type']} → Error: {result.stderr}")

def check_views():
    """Check available decision views"""
    print("\n📋 Checking decision views...")
    
    views_to_check = [
        'v_decision_context_v2',
        'v_decision_confidence_components_v2', 
        'v_decision_confidence_components_v3',
        'v_personality_fit_scores'
    ]
    
    for view in views_to_check:
        cmd = [
            'curl', '-H', f'apikey: {SUPABASE_SERVICE_ROLE_KEY}',
            '-H', f'Authorization: Bearer {SUPABASE_SERVICE_ROLE_KEY}',
            f'{SUPABASE_URL}/rest/v1/{view}?select=*&limit=1'
        ]
        
        result = subprocess.run(cmd, capture_output=True, text=True)
        if 'Could not find' in result.stdout:
            print(f"  ✗ {view} - Not found")
        else:
            try:
                data = json.loads(result.stdout)
                if isinstance(data, list) and len(data) > 0:
                    cols = list(data[0].keys())
                    personality_score = data[0].get('personality_fit_score', 'N/A')
                    print(f"  ✓ {view} - Exists (personality_fit_score: {personality_score})")
                    if 'personality_fit_score' in cols:
                        print(f"    📊 Has personality_fit_score column")
                else:
                    print(f"  ✓ {view} - Exists (empty)")
            except json.JSONDecodeError:
                print(f"  ⚠ {view} - Exists but couldn't parse response")

def provide_manual_sql():
    """Provide the SQL that needs to be executed manually"""
    print(f"\n🔧 MANUAL SQL DEPLOYMENT REQUIRED")
    print("="*50)
    print("Since direct SQL execution via API isn't available, please execute this SQL manually in the Supabase SQL Editor:")
    print()
    
    sql = """-- Create v_decision_confidence_components_v3 with real personality fit scoring
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

-- Also update the personality fit scores view to use the function
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
                TRUE,
                FALSE
            )
        ELSE 0 
    END as personality_fit_score
FROM v_decision_context_v2 dc;"""
    
    print(sql)
    print("\n" + "="*50)
    print("📝 Steps to complete deployment:")
    print("1. Go to Supabase Dashboard → SQL Editor")
    print("2. Paste and execute the above SQL")
    print("3. Verify the views work by running the verification again")
    print()

if __name__ == "__main__":
    print("🚀 SUPABASE PERSONALITY FIT SCORE DEPLOYMENT VERIFICATION")
    print("="*60)
    
    if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
        print("❌ Missing environment variables")
        exit(1)
    
    test_function()
    check_views()
    provide_manual_sql()
    
    print("\n✅ Deployment verification complete!")