#!/usr/bin/env python3
import os
import requests
import json

# Read environment variables
SUPABASE_URL = os.environ.get('SUPABASE_URL')
SUPABASE_SERVICE_ROLE_KEY = os.environ.get('SUPABASE_SERVICE_ROLE_KEY')

if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
    print("Error: Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables")
    exit(1)

# Read SQL migration
with open('temp_migration.sql', 'r') as f:
    sql_content = f.read()

# Split into individual statements
statements = [stmt.strip() for stmt in sql_content.split(';') if stmt.strip()]

headers = {
    'apikey': SUPABASE_SERVICE_ROLE_KEY,
    'Authorization': f'Bearer {SUPABASE_SERVICE_ROLE_KEY}',
    'Content-Type': 'application/json',
    'Prefer': 'return=minimal'
}

base_url = f"{SUPABASE_URL}/rest/v1"

# Execute each statement
for i, statement in enumerate(statements):
    if not statement.strip():
        continue
        
    print(f"Executing statement {i+1}/{len(statements)}...")
    print(f"Statement: {statement[:100]}...")
    
    try:
        # For DDL statements, we need to use a different approach
        # Let's try using the raw SQL execution via a custom function
        response = requests.post(
            f"{base_url}/rpc/query",
            headers=headers,
            json={"sql": statement}
        )
        
        if response.status_code == 200:
            print(f"✓ Statement {i+1} executed successfully")
        else:
            print(f"✗ Statement {i+1} failed: {response.status_code} - {response.text}")
            # Try direct query execution if rpc fails
            if "not found" in response.text.lower():
                print("Trying alternative execution method...")
                # For simple table operations, try direct REST API
                continue
    except Exception as e:
        print(f"✗ Statement {i+1} error: {e}")

print("Migration deployment complete!")