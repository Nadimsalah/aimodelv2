import { NextResponse } from 'next/server';
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

    let importId = null;

    try {
        const formData = await req.formData();
        const file = formData.get('file');

        if (!file) {
            return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
        }

        // Create import record
        const { data: importRecord, error: importError } = await supabase
            .from('brand_imports')
            .insert({
                filename: file.name,
                status: 'processing',
                brands_count: 0
            })
            .select()
            .single();

        if (importError) {
            console.error('Failed to create import record:', importError);
            return NextResponse.json({ error: 'Failed to create import record' }, { status: 500 });
        }

        importId = importRecord.id;

        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const workbook = XLSX.read(buffer, { type: 'buffer' });

        // Assume first sheet
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];

        // Convert to JSON
        const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 }); // Array of arrays

        if (jsonData.length === 0) {
            await supabase
                .from('brand_imports')
                .update({ status: 'failed', error: 'Excel file is empty' })
                .eq('id', importId);
            return NextResponse.json({ error: 'Excel file is empty' }, { status: 400 });
        }

        // Debug logging
        console.log("Excel Import: Rows found:", jsonData.length);
        const firstRow = jsonData[0];
        console.log("First Row:", JSON.stringify(firstRow));

        // Helper to normalize cell
        const normalize = (val) => String(val || '').trim().toLowerCase();

        // 1. Find Header Row
        let headerRowIndex = -1;
        let headers = [];

        for (let i = 0; i < Math.min(jsonData.length, 20); i++) {
            const row = jsonData[i];
            if (Array.isArray(row)) {
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

        if (headerRowIndex === -1) {
            console.log("No explicit header row found. Defaulting to row 0.");
            headerRowIndex = 0;
            if (Array.isArray(jsonData[0])) {
                headers = jsonData[0].map(normalize);
            }
        }

        // Map columns
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

        if (colMap.name === -1) {
            colMap.name = 0;
        }

        // Helper to convert Excel serial date to YYYY-MM-DD format
        const excelDateToString = (serial) => {
            if (!serial || isNaN(serial)) return null;

            // Excel stores dates as days since 1900-01-01 (with a leap year bug)
            const excelEpoch = new Date(1899, 11, 30); // December 30, 1899
            const days = Math.floor(serial);
            const date = new Date(excelEpoch.getTime() + days * 24 * 60 * 60 * 1000);

            // Format as YYYY-MM-DD
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');

            return `${year}-${month}-${day}`;
        };

        const rowsToInsert = [];
        const seen = new Set();
        const dataSummary = {
            registration_numbers: new Set(),
            nice_classes: new Set(),
            statuses: new Set(),
            filing_dates: [],
            expiration_dates: []
        };

        // Start from row AFTER header
        for (let i = headerRowIndex + 1; i < jsonData.length; i++) {
            const row = jsonData[i];
            const getVal = (idx) => (idx !== -1 && row[idx]) ? String(row[idx]).trim() : null;

            const brandName = getVal(colMap.name);

            if (brandName) {
                const normalized = brandName.toLowerCase();

                if (!seen.has(normalized)) {
                    const regNum = getVal(colMap.regNum);
                    const niceClass = getVal(colMap.nice);
                    const status = getVal(colMap.status);
                    const filingDateRaw = getVal(colMap.filing);
                    const expiryDateRaw = getVal(colMap.expiry);

                    // Convert Excel dates if they're numbers
                    const filingDate = filingDateRaw && !isNaN(filingDateRaw)
                        ? excelDateToString(parseFloat(filingDateRaw))
                        : filingDateRaw;
                    const expiryDate = expiryDateRaw && !isNaN(expiryDateRaw)
                        ? excelDateToString(parseFloat(expiryDateRaw))
                        : expiryDateRaw;

                    rowsToInsert.push({
                        name: brandName,
                        normalized_name: normalized,
                        logo_text: getVal(colMap.logo),
                        registration_number: regNum,
                        nice_class: niceClass,
                        filing_date: filingDate,
                        expiration_date: expiryDate,
                        status: status,
                        import_id: importId
                    });

                    // Collect data for summary
                    if (regNum) dataSummary.registration_numbers.add(regNum);
                    if (niceClass) dataSummary.nice_classes.add(niceClass);
                    if (status) dataSummary.statuses.add(status);
                    if (filingDate) dataSummary.filing_dates.push(filingDate);
                    if (expiryDate) dataSummary.expiration_dates.push(expiryDate);

                    seen.add(normalized);
                }
            }
        }

        if (rowsToInsert.length === 0) {
            await supabase
                .from('brand_imports')
                .update({
                    status: 'completed',
                    brands_count: 0,
                    error: 'No valid brands found'
                })
                .eq('id', importId);
            return NextResponse.json({ message: 'No valid brands found to insert.' });
        }

        const { data, error } = await supabase
            .from('brands')
            .upsert(rowsToInsert, { onConflict: 'normalized_name', ignoreDuplicates: true })
            .select();

        if (error) {
            console.error('Supabase Error:', error);
            await supabase
                .from('brand_imports')
                .update({ status: 'failed', error: error.message })
                .eq('id', importId);
            return NextResponse.json({ error: 'Database insert failed: ' + error.message }, { status: 500 });
        }

        // Generate summary
        const summary = {
            registration_numbers: Array.from(dataSummary.registration_numbers).slice(0, 3).join(', ') +
                (dataSummary.registration_numbers.size > 3 ? '...' : ''),
            nice_classes: Array.from(dataSummary.nice_classes).slice(0, 5).join(', '),
            status: Array.from(dataSummary.statuses).join(', ') || 'Active',
            date_range: dataSummary.filing_dates.length > 0 && dataSummary.expiration_dates.length > 0
                ? `${dataSummary.filing_dates[0]} - ${dataSummary.expiration_dates[dataSummary.expiration_dates.length - 1]}`
                : null
        };

        // Update import record with success
        await supabase
            .from('brand_imports')
            .update({
                status: 'completed',
                brands_count: rowsToInsert.length,
                data_summary: summary
            })
            .eq('id', importId);

        return NextResponse.json({
            success: true,
            message: `Processed ${rowsToInsert.length} brands.`,
            imported: rowsToInsert.length,
            importId: importId
        });

    } catch (error) {
        console.error('Import Error:', error);

        if (importId) {
            await supabase
                .from('brand_imports')
                .update({ status: 'failed', error: error.message })
                .eq('id', importId);
        }

        return NextResponse.json({ error: 'Failed to process Excel file: ' + error.message }, { status: 500 });
    }
}
