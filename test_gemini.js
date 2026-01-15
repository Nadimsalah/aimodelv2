const apiKey = "AIzaSyC99x_1PypYnY7BTJuw68BP3VMSqyWENV0".trim();

const { GoogleGenerativeAI } = require("@google/generative-ai");

async function testModel(modelName) {
    const genAI = new GoogleGenerativeAI(apiKey);
    console.log(`Testing model: ${modelName}...`);
    try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent("Hello!");
        const response = await result.response;
        console.log(`SUCCESS: ${modelName} responded: ${response.text()}`);
        return true;
    } catch (error) {
        console.error(`FAILURE: ${modelName} - ${error.message}`);
        return false;
    }
}

async function run() {
    // Check 8b specifically as a fallback
    await testModel("gemini-1.5-flash-8b");
    await testModel("gemini-1.5-flash");
}

run();
