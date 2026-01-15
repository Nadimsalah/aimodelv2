
import { GoogleGenerativeAI } from '@google/generative-ai';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const PDFParser = require('pdf2json'); // Assuming pdf2json is installed

/**
 * Extracts text from a PDF buffer and uses Gemini to identify brands.
 * @param {Buffer} pdfBuffer - The raw PDF file buffer.
 * @param {string} apiKey - Google Gemini API Key.
 * @returns {Promise<string[]>} - List of detected brands.
 */
export async function extractBrandsFromPdfWithGemini(pdfBuffer, apiKey) {
    // 1. Extract Text
    let text;
    try {
        const pdfParser = new PDFParser(null, 1);
        text = await new Promise((resolve, reject) => {
            pdfParser.on("pdfParser_dataError", errData => reject(errData.parserError));
            pdfParser.on("pdfParser_dataReady", pdfData => {
                resolve(pdfParser.getRawTextContent());
            });
            pdfParser.parseBuffer(pdfBuffer);
        });
    } catch (error) {
        throw new Error("Failed to extract text from PDF: " + error.message);
    }

    // 2. Limit text to ~600k chars to stay safely within Free Tier token limits (250k tokens/min).
    const effectiveText = text.slice(0, 600000);

    // 3. Call Gemini
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

    const prompt = `
      You are a brand detection expert. Your task is to analyze the entire document text provided below and extract EVERY distinct commercial brand name, company, or product line mentioned.

      CRITICAL INSTRUCTIONS:
      1. Scan the COMPLETE text from beginning to end.
      2. Do not stop after finding a few examples. List ALL of them.
      3. Return strictly a JSON object with a key "brands" containing an array of strings.
      4. Do not include generic terms or individual person names unless they are brands.
      
      Text:
      "${effectiveText}"
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const textResponse = response.text();

    // 4. Parse JSON
    const cleanJson = textResponse.replace(/^```json\n|\n```$/g, '').replace(/^```\n|\n```$/g, '');
    const parsed = JSON.parse(cleanJson);
    return parsed.brands || [];
}
