require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function testSchema() {
    console.log("Testing pdf_brands schema...");

    // Attempt to insert a dummy record with ALL new fields
    // We need a valid job_id though. We will try to fetch one first.

    // 1. Get a recent job
    const { data: jobs } = await supabase.from('scan_jobs').select('id').limit(1);

    if (!jobs || jobs.length === 0) {
        console.log("No jobs found to test with. Please create a scan job first.");
        return;
    }

    const jobId = jobs[0].id;
    console.log(`Using Job ID: ${jobId}`);

    const testData = {
        job_id: jobId,
        name: "TEST_BRAND_Please_Delete",
        normalized_name: "test_brand_please_delete",
        pages: [1],
        logo_path: "/logos/test.png",
        nice_class: "9, 42",
        application_number: "123456",
        filing_date: "2023-01-01",
        expiration_date: "2033-01-01",
        owner: "Test Owner",
        colors: "Red, Blue",
        description: "A test description"
    };

    const { data, error } = await supabase.from('pdf_brands').insert(testData).select();

    if (error) {
        console.error("❌ Schema Validation Failed!");
        console.error("Error details:", error.message);
        if (error.message.includes("column") && error.message.includes("does not exist")) {
            console.log("\n⚠️  ROOT CAUSE FOUND: The database tables are missing the new columns.");
            console.log("Please run the SQL in 'update_schema.sql' in your Supabase Dashboard SQL Editor.");
        }
    } else {
        console.log("✅ Schema Validation Passed!");
        console.log("New columns allow insertion.");

        // Clean up
        if (data && data[0] && data[0].id) {
            await supabase.from('pdf_brands').delete().eq('id', data[0].id);
            console.log("Test record cleaned up.");
        }
    }
}

testSchema();
