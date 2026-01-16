require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function forceSchemaReload() {
    console.log('🔄 Forcing Supabase schema cache reload...\n');

    // Read the update schema SQL
    const sql = fs.readFileSync('update_schema.sql', 'utf8');

    console.log('SQL to execute:');
    console.log('─'.repeat(60));
    console.log(sql);
    console.log('─'.repeat(60));
    console.log('\n📋 Please run the above SQL in your Supabase Dashboard:');
    console.log('   1. Go to: https://tiszirpwlhomuxmyqnkq.supabase.co/project/_/sql');
    console.log('   2. Paste the SQL above');
    console.log('   3. Click "Run"');
    console.log('\n⏳ After running, wait 10 seconds, then test the app again.\n');
}

forceSchemaReload();
