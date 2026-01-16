
import { NextResponse } from 'next/server';
import { BrandExtractorService } from '@/lib/services/brand-extractor.service';
import path from 'path';

export async function GET() {
    try {
        console.log('Starting Brand Extraction Test...');
        const service = new BrandExtractorService();

        // Use valid.pdf in the root directory
        const pdfPath = path.join(process.cwd(), 'valid.pdf');

        console.log(`Extracting from: ${pdfPath}`);
        const result = await service.extract(pdfPath, 1);

        return NextResponse.json({
            success: true,
            data: result
        });
    } catch (error: any) {
        console.error('Test Failed:', error);
        return NextResponse.json({
            success: false,
            error: error.message,
            stack: error.stack
        }, { status: 500 });
    }
}
