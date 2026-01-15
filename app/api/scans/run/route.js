
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { extractBrandsFromPdfWithGemini } from '@/lib/extraction';

// This endpoint is triggered by the client (for prototype) to run the extraction
export async function POST(req) {
    try {
        const { jobId } = await req.json();

        if (!jobId) {
            return NextResponse.json({ error: 'Missing jobId' }, { status: 400 });
        }

        // 1. Update status to 'processing'
        await supabase
            .from('scan_jobs')
            .update({ status: 'processing' })
            .eq('id', jobId);

        // 2. Fetch job details
        const { data: job, error: jobError } = await supabase
            .from('scan_jobs')
            .select('*')
            .eq('id', jobId)
            .single();

        if (jobError || !job) {
            throw new Error('Job not found');
        }

        // 3. Download PDF from Storage
        const { data: pdfData, error: downloadError } = await supabase
            .storage
            .from('scans')
            .download(job.storage_path);

        if (downloadError) {
            throw new Error('Failed to download PDF: ' + downloadError.message);
        }

        const arrayBuffer = await pdfData.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // 4. Run Extraction
        // Using hardcoded key internally for now (or could fetch from user settings table)
        const apiKey = process.env.GEMINI_API_KEY || "AIzaSyC99x_1PypYnY7BTJuw68BP3VMSqyWENV0";

        const brands = await extractBrandsFromPdfWithGemini(buffer, apiKey);

        // 5. Store Results (pdf_brands)
        // Insert in bulk
        if (brands.length > 0) {
            const rows = brands.map(name => ({
                job_id: jobId,
                name: name,
                normalized_name: name.toLowerCase().trim()
            }));

            const { error: insertError } = await supabase
                .from('pdf_brands')
                .insert(rows);

            if (insertError) {
                console.error("Failed to insert brands:", insertError);
                // Non-fatal? Maybe, but let's log it.
            }
        }

        // 6. Mark Job as Completed
        await supabase
            .from('scan_jobs')
            .update({ status: 'completed' })
            .eq('id', jobId);

        return NextResponse.json({ success: true, count: brands.length });

    } catch (error) {
        console.error('Job Run Error:', error);

        // Update job with failed status
        if (req.body && req.body.jobId) { // Check if we even parsed jobId
            // (We can't easily access jobId here if it wasn't extracted, skipping specific error update for generalized crash)
        }

        return NextResponse.json({ error: 'Job execution failed: ' + error.message }, { status: 500 });
    }
}
