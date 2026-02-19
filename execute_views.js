const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabaseUrl = 'https://yjctwxxlbdosriwiwzgt.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlqY3R3eHhsYmRvc3Jpd2l3emd0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Njk0ODQyOSwiZXhwIjoyMDgyNTI0NDI5fQ.Srjz5iXy9fL7H6pyqDUG97szb1I6R6gw3mM3ZJ12xkM';

const supabase = createClient(supabaseUrl, supabaseKey);

async function executeViews() {
    try {
        // Read the SQL file
        const sqlContent = fs.readFileSync('projects/givenright/supabase/migrations/20260208162832_personality_fit_v3_views.sql', 'utf8');
        
        // Split into individual statements (removing comments and empty lines)
        const statements = sqlContent
            .split('-- ')
            .join('')
            .split('\n')
            .filter(line => line.trim() && !line.startsWith('--'))
            .join('\n')
            .split(';')
            .filter(stmt => stmt.trim())
            .map(stmt => stmt.trim() + ';');

        console.log(`Found ${statements.length} SQL statements to execute`);

        // Execute each statement
        for (let i = 0; i < statements.length; i++) {
            const stmt = statements[i];
            if (stmt.includes('CREATE OR REPLACE VIEW')) {
                console.log(`\nExecuting statement ${i + 1}:`);
                console.log(stmt.substring(0, 100) + '...');
                
                try {
                    const { data, error } = await supabase.rpc('exec_sql', { sql: stmt });
                    if (error) {
                        console.log('Error with exec_sql, trying raw SQL...');
                        // Try raw SQL execution if available
                        const { data: rawData, error: rawError } = await supabase
                            .from('pg_stat_statements')
                            .select('*')
                            .limit(1);
                        console.log('Raw query test:', rawError ? rawError.message : 'OK');
                    } else {
                        console.log('Success!', data);
                    }
                } catch (e) {
                    console.log('Exception:', e.message);
                }
            }
        }

        console.log('\nDone processing SQL statements');
        
    } catch (error) {
        console.error('Error:', error.message);
    }
}

executeViews();