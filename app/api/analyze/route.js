import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
// const PDFParser = require('pdf2json'); // Removed as logic is moved to lib
import { extractBrandsFromPdfWithGemini } from '@/lib/extraction';

export async function POST(req) {
    try {
        const formData = await req.formData();
        const file = formData.get('file');
        // Use provided key or fallback to hardcoded user key
        const apiKey = formData.get('apiKey') || "AIzaSyC99x_1PypYnY7BTJuw68BP3VMSqyWENV0";

        if (!file) {
            return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
        }

        // Check for Mock Mode
        const isMock = formData.get('mock') === 'true';
        if (isMock) {
            // Simulate delay
            await new Promise(resolve => setTimeout(resolve, 1500));
            return NextResponse.json({
                brands: [
                    "Apple Inc.",
                    "Nike",
                    "Coca-Cola",
                    "Samsung",
                    "Tesla",
                    "Starbucks"
                ].sort()
            });
        }

        if (!apiKey) {
            return NextResponse.json({ error: 'API Key is required (or use Demo Mode)' }, { status: 400 });
        }

        // Convert Request File to Buffer
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        try {
            const brands = await extractBrandsFromPdfWithGemini(buffer, apiKey);
            return NextResponse.json({ brands });
        } catch (error) {
            console.error('API Error:', error);
            const errorMessage = error.message || '';
            if (errorMessage.includes('429') || errorMessage.includes('quota')) {
                return NextResponse.json({ error: 'API Quota Exceeded. Please try again later.' }, { status: 429 });
            }
            return NextResponse.json({ error: errorMessage }, { status: 500 });
        }
    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
