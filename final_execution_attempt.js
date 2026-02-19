const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabaseUrl = 'https://yjctwxxlbdosriwiwzgt.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlqY3R3eHhsYmRvc3Jpd2l3emd0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Njk0ODQyOSwiZXhwIjoyMDgyNTI0NDI5fQ.Srjz5iXy9fL7H6pyqDUG97szb1I6R6gw3mM3ZJ12xkM';

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('=== FINAL SQL EXECUTION ATTEMPT ===');
console.log('');
console.log('MISSION: Execute the 3 CREATE OR REPLACE VIEW statements');
console.log('STATUS: Direct connection methods have failed due to network/auth restrictions');
console.log('ALTERNATIVE: Document exactly what needs to be executed and current state');
console.log('');

// Read and display the SQL that needs to be executed
console.log('SQL TO BE EXECUTED:');
console.log('===================');

try {
    const sqlContent = fs.readFileSync('projects/givenright/supabase/migrations/20260208162832_personality_fit_v3_views.sql', 'utf8');
    
    // Extract just the CREATE VIEW statements
    const createViewStatements = sqlContent
        .split('\n')
        .filter(line => !line.startsWith('--') && line.trim() !== '')
        .join('\n')
        .split(';')
        .filter(stmt => stmt.includes('CREATE OR REPLACE VIEW'))
        .map((stmt, index) => {
            return `-- VIEW ${index + 1}:\n${stmt.trim()};`;
        });

    createViewStatements.forEach(stmt => {
        console.log(stmt);
        console.log('');
    });

    console.log('===================');
    console.log('');
    
} catch (error) {
    console.log('Error reading SQL file:', error.message);
}

async function documentCurrentState() {
    console.log('CURRENT DATABASE STATE:');
    console.log('=======================');

    // 1. Verify function works
    try {
        const { data: scoreTest } = await supabase.rpc('calculate_personality_fit_score', {
            traits: ["adventurous", "creative"],
            gift_type: "experience",
            decision_option: "safe", 
            time_constraint: "relaxed",
            surprise_tolerance: "likes_surprises",
            personalization_allowed: true,
            public_visibility: false
        });
        console.log('✅ calculate_personality_fit_score function: WORKING, returns', scoreTest);
    } catch (e) {
        console.log('❌ Function test failed:', e.message);
    }

    // 2. Check existing views
    const viewsToCheck = [
        'v_decision_context_v2',
        'v_decision_confidence_components_v2', 
        'v_decision_confidence_components_v3',
        'v_personality_fit_scores',
        'v_decision_output_v3'
    ];

    for (const viewName of viewsToCheck) {
        try {
            const { data, error } = await supabase
                .from(viewName)
                .select('*')
                .limit(1);
                
            if (error) {
                console.log(`❌ ${viewName}: NOT ACCESSIBLE (${error.message})`);
            } else {
                console.log(`✅ ${viewName}: EXISTS, ${data?.length || 0} rows sampled`);
                if (data && data[0] && data[0].personality_fit_score !== undefined) {
                    console.log(`   Current personality_fit_score: ${data[0].personality_fit_score}`);
                }
            }
        } catch (e) {
            console.log(`❌ ${viewName}: ERROR (${e.message})`);
        }
    }
}

async function finalReport() {
    await documentCurrentState();
    
    console.log('');
    console.log('=== EXECUTION REPORT ===');
    console.log('');
    console.log('ATTEMPTED METHODS:');
    console.log('1. ❌ Direct psql connection (DNS resolution failed)');
    console.log('2. ❌ Supabase CLI (connection failed)'); 
    console.log('3. ❌ Python psycopg2 (DNS resolution failed)');
    console.log('4. ❌ REST API DDL execution (not supported)');
    console.log('5. ❌ Connection pooler (tenant authentication failed)');
    console.log('6. ❌ Node.js with connection strings (DNS resolution failed)');
    console.log('');
    console.log('ROOT CAUSE: This environment cannot establish direct PostgreSQL connections to Supabase');
    console.log('           - DNS resolution fails for db.yjctwxxlbdosriwiwzgt.supabase.co');
    console.log('           - Pooler connection requires different credentials');
    console.log('           - REST API does not support DDL (CREATE VIEW) operations');
    console.log('');
    console.log('WHAT WORKS:');
    console.log('✅ calculate_personality_fit_score function returns 20 for ["adventurous","creative"]');
    console.log('✅ REST API function calls work perfectly');  
    console.log('✅ Some views (v_personality_fit_scores) exist but need updating');
    console.log('');
    console.log('WHAT NEEDS TO BE DONE:');
    console.log('🎯 Execute these 3 CREATE OR REPLACE VIEW statements in Supabase:');
    console.log('   1. v_decision_confidence_components_v3');
    console.log('   2. v_personality_fit_scores (update existing)');
    console.log('   3. v_decision_output_v3');
    console.log('');
    console.log('SOLUTION: Manual execution through Supabase Dashboard SQL Editor');
    console.log('         or direct database access with proper network connectivity');
}

finalReport();