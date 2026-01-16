import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Create a Supabase client with the SERVICE_ROLE_KEY
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
        auth: {
            persistSession: false,
            autoRefreshToken: false,
            detectSessionInUrl: false
        }
    }
);

export async function POST(req) {
    try {
        const body = await req.json();
        const { filename, storage_path, file_size } = body;

        if (!filename || !storage_path) {
            return NextResponse.json({ error: 'Missing required fields: filename or storage_path' }, { status: 400 });
        }

        console.log('Registering job for file:', filename);

        // Create Job in DB
        const { data: jobData, error: dbError } = await supabase
            .from('scan_jobs')
            .insert({
                filename: filename,
                storage_path: storage_path,
                // file_size: file_size // Add to schema if column exists, for now omit or add if schema supports
                status: 'queued'
            })
            .select()
            .single();

        if (dbError) {
            console.error('DB Job Creation Error:', dbError);
            return NextResponse.json({ error: 'Failed to create job record: ' + dbError.message }, { status: 500 });
        }

        console.log('Job created successfully:', jobData.id);
        return NextResponse.json({ success: true, job: jobData });

    } catch (error) {
        console.error('Job Create Error:', error);
        return NextResponse.json({ error: 'Server Error: ' + error.message }, { status: 500 });
    }
}
