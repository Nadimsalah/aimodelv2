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
        const formData = await req.formData();
        const file = formData.get('file');

        if (!file) {
            return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
        }

        const filename = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;

        // 1. Upload to Supabase Storage
        console.log('Attempting to upload file:', filename);

        const { data: storageData, error: storageError } = await supabase
            .storage
            .from('scans')
            .upload(filename, file);

        if (storageError) {
            console.error('Storage Upload Error:', storageError);

            // Check if bucket doesn't exist
            if (storageError.message?.includes('Bucket not found') || storageError.message?.includes('bucket')) {
                return NextResponse.json({
                    error: 'Storage bucket "scans" does not exist. Please create it in Supabase Dashboard → Storage → Create bucket named "scans"'
                }, { status: 500 });
            }

            return NextResponse.json({ error: 'Failed to upload PDF: ' + storageError.message }, { status: 500 });
        }

        console.log('File uploaded successfully:', storageData.path);

        // 2. Create Job in DB
        const { data: jobData, error: dbError } = await supabase
            .from('scan_jobs')
            .insert({
                filename: file.name,
                storage_path: storageData.path,
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
