import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { BrandExtractorService } from '@/lib/services/brand-extractor.service';
import fs from 'fs';
import path from 'path';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(req) {
    try {
        const { jobId } = await req.json();

        if (!jobId) {
            return NextResponse.json({ error: 'Job ID required' }, { status: 400 });
        }

        // 1. Update job status to processing
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

        // 3. Download PDF from storage
        const { data: pdfData, error: downloadError } = await supabase
            .storage
            .from('scans')
            .download(job.storage_path);

        if (downloadError) {
            throw new Error('Failed to download PDF');
        }

        // Save to temp file
        const tempPdfPath = path.join(process.cwd(), `temp_${jobId}.pdf`);
        const buffer = Buffer.from(await pdfData.arrayBuffer());
        fs.writeFileSync(tempPdfPath, buffer);

        // 4. Get total pages
        const service = new BrandExtractorService();
        const totalPages = await service.getPageCount(tempPdfPath);

        await supabase
            .from('scan_jobs')
            .update({ total_pages: totalPages })
            .eq('id', jobId);

        console.log(`Job ${jobId}: Processing ${totalPages} pages`);

        let extractedCount = 0;
        let lastError = null;
        let processedCount = 0; // Track processed pages globally

        // 5. Process pages in parallel batches for speed
        const BATCH_SIZE = 10; // Process 10 pages at a time
        const batches = [];

        for (let i = 1; i <= totalPages; i += BATCH_SIZE) {
            const batchPages = [];
            for (let j = i; j < i + BATCH_SIZE && j <= totalPages; j++) {
                batchPages.push(j);
            }
            batches.push(batchPages);
        }

        console.log(`Processing ${totalPages} pages in ${batches.length} batches of up to ${BATCH_SIZE} pages each`);

        // Process each batch in parallel
        for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
            const batch = batches[batchIndex];
            console.log(`\n📦 Processing batch ${batchIndex + 1}/${batches.length} (pages ${batch[0]}-${batch[batch.length - 1]})`);

            // Process all pages in this batch simultaneously
            const batchPromises = batch.map(async (page) => {
                try {
                    console.log(`Job ${jobId}: extracting page ${page}`);
                    const result = await service.extract(tempPdfPath, page);

                    // Debug: Log what Gemini returned
                    console.log(`Page ${page} Gemini result:`, JSON.stringify(result, null, 2));

                    let extractionSuccess = false;

                    if (result && result.brandName && result.brandName.trim()) {
                        console.log(`✓ Extracted brand: ${result.brandName} (page ${page})`);

                        // Insert result
                        const { data, error: insertError } = await supabase
                            .from('pdf_brands')
                            .insert({
                                job_id: jobId,
                                name: result.brandName,
                                normalized_name: result.brandName.toLowerCase().trim(),
                                pages: [page],
                                logo_path: result.logoUrl,
                                nice_class: Array.isArray(result.niceClassification) ? result.niceClassification.join(', ') : result.niceClassification,
                                application_number: result.applicationNumber,
                                filing_date: result.filingDate,
                                expiration_date: result.expiryDate,
                                owner: result.owner,
                                colors: result.colors,
                                description: result.description
                            });

                        if (insertError) {
                            console.error(`❌ Database insert error for ${result.brandName}:`, insertError);
                            // We don't throw here to avoid failing other pages
                        } else {
                            console.log(`✅ Successfully saved ${result.brandName} to database`);
                            extractionSuccess = true;
                        }
                    } else {
                        console.log(`✗ Page ${page}: No brand name found or empty response`);
                    }

                    // Increment processed count atomically (JS is single threaded event loop)
                    processedCount++;

                    // Update progress in DB (fire and forget to not slow down processing)
                    supabase.from('scan_jobs')
                        .update({ progress_pages: processedCount })
                        .eq('id', jobId)
                        .then(() => console.log(`Job ${jobId}: Progress updated to ${processedCount}/${totalPages}`))
                        .catch(err => console.error('Progress update failed:', err));

                    return { success: extractionSuccess, page };
                } catch (pageError) {
                    console.error(`Page ${page} Error:`, pageError);
                    processedCount++; // Still count as processed even if failed
                    return { success: false, page, error: pageError.message };
                }
            });

            // Wait for all pages in this batch to complete
            const batchResults = await Promise.all(batchPromises);

            // Count successes
            const batchSuccesses = batchResults.filter(r => r.success).length;
            extractedCount += batchSuccesses;

            // Store last error if any
            const batchErrors = batchResults.filter(r => r.error);
            if (batchErrors.length > 0) {
                lastError = batchErrors[batchErrors.length - 1].error;
            }

            console.log(`✅ Batch ${batchIndex + 1} complete: ${batchSuccesses}/${batch.length} brands extracted`);
        }

        // 6. Finalize Job Status
        if (extractedCount === 0 && lastError) {
            await supabase
                .from('scan_jobs')
                .update({
                    status: 'failed',
                    error: lastError
                })
                .eq('id', jobId);
        } else {
            await supabase
                .from('scan_jobs')
                .update({ status: 'completed' })
                .eq('id', jobId);
        }

        // 7. Cleanup temp file
        if (fs.existsSync(tempPdfPath)) {
            fs.unlinkSync(tempPdfPath);
        }

        return NextResponse.json({
            success: true,
            extracted: extractedCount,
            total: totalPages
        });

    } catch (error) {
        console.error('Scan processing error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
