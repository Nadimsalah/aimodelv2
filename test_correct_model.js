const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config({ path: '.env.local' });

async function testCorrectModel() {
    const apiKey = process.env.GEMINI_API_KEY;

    console.log('Testing Gemini API with correct model format...');
    console.log('API Key:', apiKey ? `${apiKey.substring(0, 15)}...` : 'NOT FOUND\n');

    if (!apiKey) {
        console.error('❌ GEMINI_API_KEY not found');
        return;
    }

    try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "models/gemini-2.5-flash" });

        console.log('Sending test request to models/gemini-2.5-flash...');
        const result = await model.generateContent('Say "Hello, PDF scanning is working!"');
        const response = await result.response;
        const text = response.text();

        console.log('\n✅ SUCCESS! Model is working!');
        console.log('Response:', text);
        console.log('\n🎉 PDF processing should now work correctly!');

    } catch (error) {
        console.error('\n❌ FAILED:', error.message);
        console.log('\nTrying models/gemini-flash-latest as fallback...');

        try {
            const genAI = new GoogleGenerativeAI(apiKey);
            const model = genAI.getGenerativeModel({ model: "models/gemini-flash-latest" });
            const result = await model.generateContent('Say hello');
            const response = await result.response;
            const text = response.text();

            console.log('✅ models/gemini-flash-latest works!');
            console.log('Response:', text);
            console.log('\n⚠️  Update brand-extractor.service.ts to use: models/gemini-flash-latest');

        } catch (error2) {
            console.error('❌ Fallback also failed:', error2.message);
        }
    }
}

testCorrectModel();
