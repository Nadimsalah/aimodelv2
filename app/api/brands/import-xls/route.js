
import { NextResponse } from 'next/server';
// import { supabase } from '@/lib/supabase'; // Bypass shared client
import * as XLSX from 'xlsx';

export async function POST(req) {
    // FORCE FRESH CLIENT to debug caching issues
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        {
            auth: { persistSession: false }
        }
    );
    try {
        const formData = await req.formData();
        const file = formData.get('file');

        if (!file) {
            return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
        }

        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const workbook = XLSX.read(buffer, { type: 'buffer' });

        // Assume first sheet
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];

        // Convert to JSON
        const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 }); // Array of arrays

        if (jsonData.length === 0) {
            return NextResponse.json({ error: 'Excel file is empty' }, { status: 400 });
        }

        // Debug logging
        console.log("Excel Import: Rows found:", jsonData.length);
        const firstRow = jsonData[0];
        console.log("First Row:", JSON.stringify(firstRow));

        // Helper to normalize cell
        const normalize = (val) => String(val || '').trim().toLowerCase();

        // 1. Find Header Row
        // Scan up to first 20 rows to find a row that looks like a header (contains "marque", "brand", or "name")
        let headerRowIndex = -1;
        let headers = [];

        for (let i = 0; i < Math.min(jsonData.length, 20); i++) {
            const row = jsonData[i];
            if (Array.isArray(row)) {
                // Check if this row has "marque" or "brand"
                const hasKeyword = row.some(cell => {
                    const txt = normalize(cell);
                    return txt.includes('marque') || txt.includes('brand') || txt.includes('name');
                });

                if (hasKeyword) {
                    headerRowIndex = i;
                    headers = row.map(normalize);
                    console.log(`Found header at row ${i}:`, headers);
                    break;
                }
            }
        }

        // Fallback: If no header found, assume row 0 is header (or data if no header exists, handled by index 0 fallback)
        if (headerRowIndex === -1) {
            console.log("No explicit header row found. Defaulting to row 0.");
            headerRowIndex = 0;
            if (Array.isArray(jsonData[0])) {
                headers = jsonData[0].map(normalize);
            }
        }

        // Map columns by header name (or partial match)
        // Map columns by header name (or partial match)
        const getIdx = (keywords) => headers.findIndex(h => h && keywords.some(k => h.includes(k)));

        const colMap = {
            name: getIdx(['marque', 'brand', 'name']),
            logo: getIdx(['logo']),
            regNum: getIdx(['enregistrement', 'registration', 'num', "d'enregistrement"]),
            nice: getIdx(['nice', 'class', 'classification']),
            filing: getIdx(['dépôt', 'filing', 'deposit', 'de dépôt', 'depot']),
            expiry: getIdx(['expiration', 'expiry', "d'expiration"]),
            status: getIdx(['statut', 'status'])
        };

        // Fallback for name if not found: try column 0
        if (colMap.name === -1) {
            // If we found a header row but no name column, maybe it's just Column A?
            colMap.name = 0;
        }

        const rowsToInsert = [];
        const seen = new Set(); // dedupe by normalized name within this batch

        // Start from row AFTER header
        for (let i = headerRowIndex + 1; i < jsonData.length; i++) {
            const row = jsonData[i];
            // Helper to get cell value safely
            const getVal = (idx) => (idx !== -1 && row[idx]) ? String(row[idx]).trim() : null;

            const brandName = getVal(colMap.name);

            if (brandName) {
                const normalized = brandName.toLowerCase();

                if (!seen.has(normalized)) {
                    rowsToInsert.push({
                        name: brandName,
                        normalized_name: normalized,
                        logo_text: getVal(colMap.logo),
                        registration_number: getVal(colMap.regNum),
                        nice_class: getVal(colMap.nice),
                        filing_date: getVal(colMap.filing),
                        expiration_date: getVal(colMap.expiry),
                        status: getVal(colMap.status)
                    });
                    seen.add(normalized);
                }
            }
        }

        if (rowsToInsert.length === 0) {
            return NextResponse.json({ message: 'No valid brands found to insert.' });
        }

        const { data, error } = await supabase
            .from('brands')
            .upsert(rowsToInsert, { onConflict: 'normalized_name', ignoreDuplicates: true })
            .select();

        if (error) {
            console.error('Supabase Error:', error);
            return NextResponse.json({ error: 'Database insert failed: ' + error.message }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            message: `Processed ${rowsToInsert.length} brands.`,
            count: rowsToInsert.length
        });

    } catch (error) {
        console.error('Import Error:', error);
        return NextResponse.json({ error: 'Failed to process Excel file: ' + error.message }, { status: 500 });
    }
}
