const fs = require('fs');
const PDFParser = require('pdf2json');

try {
    const dataBuffer = fs.readFileSync('dummy.pdf');
    console.log("File read. Parsing with pdf2json...");

    const pdfParser = new PDFParser(null, 1);

    pdfParser.on("pdfParser_dataError", errData => console.error("Parse Error:", errData.parserError));
    pdfParser.on("pdfParser_dataReady", pdfData => {
        console.log("Success:");
        console.log(pdfParser.getRawTextContent());
    });

    pdfParser.parseBuffer(dataBuffer);

} catch (e) {
    console.error("Runtime Error:", e);
}
