const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://yjctwxxlbdosriwiwzgt.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlqY3R3eHhsYmRvc3Jpd2l3emd0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Njk0ODQyOSwiZXhwIjoyMDgyNTI0NDI5fQ.Srjz5iXy9fL7H6pyqDUG97szb1I6R6gw3mM3ZJ12xkM';

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyV3Implementation() {
    console.log('=== VERIFICATION OF V3 VIEWS ===');
    console.log('');

    // Test v_decision_confidence_components_v3
    try {
        const { data: v3Data, error: v3Error } = await supabase
            .from('v_decision_confidence_components_v3')
            .select('*')
            .limit(5);
            
        if (v3Error) {
            console.log('❌ v_decision_confidence_components_v3 error:', v3Error.message);
        } else {
            console.log('✅ v_decision_confidence_components_v3 accessible');
            console.log('   Columns available:', Object.keys(v3Data[0] || {}));
            console.log('   Rows found:', v3Data?.length || 0);
            
            if (v3Data && v3Data.length > 0) {
                const sample = v3Data[0];
                console.log('   Sample personality_fit_score:', sample.personality_fit_score);
                console.log('   Sample confidence_score:', sample.confidence_score);
                console.log('   Sample personality_traits:', sample.personality_traits);
            }
        }
    } catch (e) {
        console.log('❌ v3 view test failed:', e.message);
    }

    console.log('');

    // Test v_personality_fit_scores
    try {
        const { data: pfsData, error: pfsError } = await supabase
            .from('v_personality_fit_scores')
            .select('*')
            .limit(5);
            
        if (pfsError) {
            console.log('❌ v_personality_fit_scores error:', pfsError.message);
        } else {
            console.log('✅ v_personality_fit_scores accessible');
            console.log('   Rows found:', pfsData?.length || 0);
            
            if (pfsData && pfsData.length > 0) {
                const sample = pfsData[0];
                console.log('   Sample personality_fit_score:', sample.personality_fit_score);
                console.log('   Sample personality_traits:', sample.personality_traits);
            }
        }
    } catch (e) {
        console.log('❌ personality fit scores view test failed:', e.message);
    }

    console.log('');

    // Test v_decision_output_v3
    try {
        const { data: outputData, error: outputError } = await supabase
            .from('v_decision_output_v3')
            .select('*')
            .limit(5);
            
        if (outputError) {
            console.log('❌ v_decision_output_v3 error:', outputError.message);
        } else {
            console.log('✅ v_decision_output_v3 accessible');
            console.log('   Rows found:', outputData?.length || 0);
            
            if (outputData && outputData.length > 0) {
                const sample = outputData[0];
                console.log('   Sample final_score:', sample.final_score);
                console.log('   Sample meets_threshold:', sample.meets_threshold);
                console.log('   Sample personality_fit_score:', sample.personality_fit_score);
            }
        }
    } catch (e) {
        console.log('❌ decision output v3 view test failed:', e.message);
    }

    console.log('');
    console.log('=== FINAL VERIFICATION ===');
    console.log('');
    
    // Specific test: Check if personality_fit_score is now 20 instead of 0
    try {
        const { data: testData, error: testError } = await supabase
            .from('v_decision_confidence_components_v3')
            .select('session_id, personality_traits, personality_fit_score, confidence_score')
            .not('personality_traits', 'is', null)
            .limit(3);
            
        if (testError) {
            console.log('❌ Final test failed:', testError.message);
        } else {
            console.log('✅ FINAL TEST RESULTS:');
            testData.forEach((row, i) => {
                console.log(`   Row ${i + 1}:`);
                console.log(`     personality_traits: ${JSON.stringify(row.personality_traits)}`);
                console.log(`     personality_fit_score: ${row.personality_fit_score} (should be 20 if traits include adventurous+creative)`);
                console.log(`     confidence_score: ${row.confidence_score}`);
                console.log('');
            });
            
            const hasCorrectScore = testData.some(row => row.personality_fit_score === 20);
            if (hasCorrectScore) {
                console.log('🎉 SUCCESS: Found personality_fit_score = 20! V3 views are working correctly!');
            } else {
                console.log('⚠️  Warning: No personality_fit_score = 20 found. May need more data or different traits.');
            }
        }
    } catch (e) {
        console.log('❌ Final verification failed:', e.message);
    }
}

verifyV3Implementation();