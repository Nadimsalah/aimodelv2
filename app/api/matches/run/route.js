
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { findBrandMatches } from '@/lib/matching';

export async function POST(req) {
    try {
        const { jobId, threshold } = await req.json();

        if (!jobId) {
            return NextResponse.json({ error: 'Missing jobId' }, { status: 400 });
        }

        // 1. Fetch My Brands
        // In real app, paginate this or use specialized search, but for prototype we just load all (< 5000 rows usually fine)
        const { data: myBrands, error: brandsError } = await supabase
            .from('brands')
            .select('id, name, normalized_name');

        if (brandsError) throw brandsError;

        // 2. Fetch Detected PDF Brands
        const { data: pdfBrands, error: pdfError } = await supabase
            .from('pdf_brands')
            .select('*')
            .eq('job_id', jobId);

        if (pdfError) throw pdfError;

        if (!pdfBrands || pdfBrands.length === 0) {
            return NextResponse.json({ message: 'No detected brands found in this job to match.', matches: [] });
        }

        // 3. Clear existing matches for this job (to allow re-run)
        await supabase.from('matches').delete().eq('job_id', jobId);

        // 4. Run Matching Logic
        const matches = findBrandMatches(myBrands || [], pdfBrands, threshold || 0.7);

        // 5. Insert Matches
        if (matches.length > 0) {
            const rows = matches.map(m => ({
                job_id: jobId,
                brand_id: m.my_brand_id,
                pdf_brand_id: m.pdf_brand_id,
                my_brand: m.my_brand_name,
                detected_brand: m.detected_brand_name,
                similarity: m.similarity,
                match_type: m.match_type
            }));

            // Bulk insert
            const { error: insertError } = await supabase.from('matches').insert(rows);
            if (insertError) throw insertError;
        }

        return NextResponse.json({ success: true, count: matches.length });

    } catch (error) {
        console.error('Matching Error:', error);
        return NextResponse.json({ error: 'Matching failed: ' + error.message }, { status: 500 });
    }
}

// GET endpoint to retrieve matches for the UI
export async function GET(req) {
    const { searchParams } = new URL(req.url);
    const jobId = searchParams.get('jobId');

    if (!jobId) return NextResponse.json({ error: 'Missing jobId' }, { status: 400 });

    const { data, error } = await supabase
        .from('matches')
        .select('*')
        .eq('job_id', jobId)
        .order('similarity', { ascending: false });

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ matches: data });
}
