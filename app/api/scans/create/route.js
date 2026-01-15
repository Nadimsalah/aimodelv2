
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(req) {
    try {
        const formData = await req.formData();
        const file = formData.get('file');

        if (!file) {
            return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
        }

        const filename = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;

        // 1. Upload to Supabase Storage
        // NOTE: User must ensure 'scans' bucket exists and is public (or policies set)
        const { data: storageData, error: storageError } = await supabase
            .storage
            .from('scans')
            .upload(filename, file);

        if (storageError) {
            console.error('Storage Upload Error:', storageError);
            return NextResponse.json({ error: 'Failed to upload PDF: ' + storageError.message }, { status: 500 });
        }

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

        return NextResponse.json({ success: true, job: jobData });

    } catch (error) {
        console.error('Job Create Error:', error);
        return NextResponse.json({ error: 'Server Error: ' + error.message }, { status: 500 });
    }
}
