const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config({ path: '.env.local' });

async function listAvailableModels() {
    const apiKey = process.env.GEMINI_API_KEY;

    console.log('Listing available Gemini models...');
    console.log('API Key:', apiKey ? `${apiKey.substring(0, 15)}...` : 'NOT FOUND');
    console.log('');

    if (!apiKey) {
        console.error('❌ GEMINI_API_KEY not found in .env.local');
        return;
    }

    try {
        // Try to list models using the API
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);

        if (!response.ok) {
            console.error(`❌ API Error: ${response.status} ${response.statusText}`);
            const text = await response.text();
            console.error('Response:', text);

            if (response.status === 403) {
                console.log('\n⚠️  This suggests the Gemini API is not enabled for your project.');
                console.log('📝 To fix this:');
                console.log('   1. Go to: https://console.cloud.google.com/apis/library/generativelanguage.googleapis.com');
                console.log('   2. Select your project: projects/784874273234');
                console.log('   3. Click "ENABLE" to enable the Generative Language API');
            }
            return;
        }

        const data = await response.json();

        if (data.models && data.models.length > 0) {
            console.log(`✅ Found ${data.models.length} available models:\n`);
            data.models.forEach(model => {
                console.log(`  📦 ${model.name}`);
                if (model.displayName) console.log(`     Display Name: ${model.displayName}`);
                if (model.description) console.log(`     Description: ${model.description.substring(0, 80)}...`);
                console.log('');
            });
        } else {
            console.log('⚠️  No models found. The API key may not have access to any models.');
        }
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

listAvailableModels();
