
const { PDFDocument, StandardFonts, rgb } = require('pdf-lib');
const fs = require('fs');

async function createPdf() {
    const pdfDoc = await PDFDocument.create()
    const page = pdfDoc.addPage()
    const { width, height } = page.getSize()
    const fontSize = 30

    page.drawText('Trademark Test PDF', {
        x: 50,
        y: height - 4 * fontSize,
        size: fontSize,
        color: rgb(0, 0.53, 0.71),
    })

    page.drawText('Brand: ACME CORP', {
        x: 50, y: height - 6 * fontSize, size: 20
    });

    page.drawText('App No: 123456789', {
        x: 50, y: height - 7 * fontSize, size: 20
    });

    const pdfBytes = await pdfDoc.save()
    fs.writeFileSync('valid.pdf', pdfBytes);
    console.log('valid.pdf created');
}

createPdf();
