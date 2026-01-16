const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config({ path: '.env.local' });

async function testGeminiAPI() {
    const apiKey = process.env.GEMINI_API_KEY;

    console.log('Testing Gemini API...');
    console.log('API Key:', apiKey ? `${apiKey.substring(0, 10)}...` : 'NOT FOUND');

    if (!apiKey) {
        console.error('❌ GEMINI_API_KEY not found in .env.local');
        return;
    }

    const genAI = new GoogleGenerativeAI(apiKey);

    // Try different model names
    const modelsToTest = [
        'gemini-pro',
        'gemini-1.5-pro',
        'gemini-1.5-pro-latest',
        'gemini-1.5-flash',
        'gemini-1.5-flash-latest'
    ];

    for (const modelName of modelsToTest) {
        try {
            console.log(`\nTesting model: ${modelName}`);
            const model = genAI.getGenerativeModel({ model: modelName });
            const result = await model.generateContent('Say hello');
            const response = await result.response;
            const text = response.text();
            console.log(`✅ ${modelName} works! Response: ${text.substring(0, 50)}...`);
            break; // If one works, we're good
        } catch (error) {
            console.log(`❌ ${modelName} failed: ${error.message}`);
        }
    }
}

testGeminiAPI().catch(console.error);
