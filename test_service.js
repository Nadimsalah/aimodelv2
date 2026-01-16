require('dotenv').config({ path: '.env.local' });
const path = require('path');
const { GoogleGenerativeAI, SchemaType } = require('@google/generative-ai');
const fs = require('fs');

const extractionSchema = {
    type: SchemaType.OBJECT,
    properties: {
        brandName: { type: SchemaType.STRING, description: "The name of the trademark/brand" },
        applicationNumber: { type: SchemaType.STRING, description: "The application or registration number" },
        filingDate: { type: SchemaType.STRING, description: "Filing date" },
        expiryDate: { type: SchemaType.STRING, description: "Expiration date" },
        owner: { type: SchemaType.STRING, description: "Owner name" },
        niceClassification: {
            type: SchemaType.ARRAY,
            items: { type: SchemaType.STRING },
            description: "List of Nice classifications"
        },
        colors: { type: SchemaType.STRING, description: "Colors claimed" },
        description: { type: SchemaType.STRING, description: "Visual description" },
        logo_bounding_box: {
            type: SchemaType.ARRAY,
            items: { type: SchemaType.NUMBER },
            description: "Bounding box [ymin, xmin, ymax, xmax]",
        }
    },
    required: ["brandName", "applicationNumber", "logo_bounding_box"]
};

async function testExtraction() {
    try {
        console.log("Testing Gemini Extraction...");
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) throw new Error("GEMINI_API_KEY missing");

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({
            model: "gemini-pro",
            generationConfig: {
                responseMimeType: "application/json",
                responseSchema: extractionSchema,
            }
        });

        console.log("No test image provided for full extraction. Running API connectivity check...");

        // Simple text check with pro model
        const textModel = genAI.getGenerativeModel({ model: "gemini-pro" });
        const result = await textModel.generateContent("Respond with 'OK' if you are working.");
        console.log("Gemini API Check:", result.response.text());

        console.log("✅ Gemini API is reachable and responding.");

    } catch (e) {
        console.error("❌ Extraction Test Failed:", e);
    }
}

testExtraction();
