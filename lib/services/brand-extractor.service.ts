
import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// Define the extraction schema for Gemini
const extractionSchema = {
    type: SchemaType.OBJECT,
    properties: {
        brandName: { type: SchemaType.STRING, description: "The name of the trademark/brand" },
        applicationNumber: { type: SchemaType.STRING, description: "The application or registration number" },
        filingDate: { type: SchemaType.STRING, description: "Filing date (INID 151) in YYYY-MM-DD format" },
        expiryDate: { type: SchemaType.STRING, description: "Expiration date (INID 180) in YYYY-MM-DD format" },
        owner: { type: SchemaType.STRING, description: "Owner name and address (INID 732)" },
        niceClassification: {
            type: SchemaType.ARRAY,
            items: { type: SchemaType.STRING },
            description: "List of Nice classifications (INID 511)"
        },
        colors: { type: SchemaType.STRING, description: "Colors claimed (INID 591)" },
        description: { type: SchemaType.STRING, description: "A brief visual description of the mark/logo." },
        logo_bounding_box: {
            type: SchemaType.ARRAY,
            items: { type: SchemaType.NUMBER },
            description: "Bounding box of the logo [ymin, xmin, ymax, xmax] on a 0-1000 scale. ymin=top, xmin=left, ymax=bottom, xmax=right. If no logo, return empty array.",
        }
    },
    required: ["brandName", "applicationNumber", "logo_bounding_box"]
};

export class BrandExtractorService {
    private genAI: GoogleGenerativeAI;
    private model: any;

    constructor() {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            console.warn("GEMINI_API_KEY is not set");
        }
        this.genAI = new GoogleGenerativeAI(apiKey || "");
        this.model = this.genAI.getGenerativeModel({
            model: "models/gemini-2.5-flash",
            generationConfig: {
                responseMimeType: "application/json",
                responseSchema: extractionSchema as any,
            }
        });
    }

    /**
     * Converts a specific page of a PDF to an image buffer using pdftoppm
     */
    async convertPdfToImage(pdfPath: string, pageNumber: number = 1): Promise<Buffer> {
        return new Promise(async (resolve, reject) => {
            const tempPrefix = path.join(process.cwd(), `temp_${Date.now()}_${Math.random().toString(36).substring(7)}`);
            // pdftoppm -f N -l N -png input prefix
            // It will generate prefix-N.png if multiple, but with -singlefile it generates prefix.png
            try {
                // -r 300 for 300 DPI usually ensures good quality for OCR
                await execAsync(`pdftoppm -png -r 150 -f ${pageNumber} -l ${pageNumber} -singlefile "${pdfPath}" "${tempPrefix}"`);

                const imagePath = `${tempPrefix}.png`;
                if (!fs.existsSync(imagePath)) {
                    // Fallback check, sometimes it doesn't respect singlefile with some versions? No, it should.
                    reject(new Error("Failed to generate image from PDF: Output file not found"));
                    return;
                }

                const buffer = fs.readFileSync(imagePath);

                // Cleanup
                fs.unlinkSync(imagePath);

                resolve(buffer);
            } catch (error: any) {
                console.error("PDF Conversion Error:", error);

                // Cleanup on error
                try {
                    if (fs.existsSync(`${tempPrefix}.png`)) fs.unlinkSync(`${tempPrefix}.png`);
                } catch (e) { }

                reject(new Error(`Failed to convert PDF: ${error.message}`));
            }
        });
    }


    /**
     * Gets the total number of pages in the PDF using pdfinfo
     */
    async getPageCount(pdfPath: string): Promise<number> {
        try {
            // pdfinfo input
            const { stdout } = await execAsync(`pdfinfo "${pdfPath}"`);
            // Output format: "Pages: 10"
            const match = stdout.match(/Pages:\s+(\d+)/);
            if (match && match[1]) {
                return parseInt(match[1], 10);
            }
            return 0;
        } catch (error: any) {
            console.error("PDF Info Error:", error);
            // Fallback to 1 if we can't determine, or throw
            return 1;
        }
    }

    /**
     * Analyzes image with Gemini to extract data and logo coordinates
     */
    async analyzeWithGemini(imageBuffer: Buffer) {
        try {
            const prompt = `
                Analyze this trademark document page. Extract the following details:
                - Brand Name (Word mark)
                - Application Number
                - Filing Date (INID 151)
                - Expiry Date (INID 180)
                - Owner (INID 732)
                - Nice Classification (INID 511) - Extract as list of class numbers
                - Colors (INID 591)
                - Visual Description: A brief description of the visual element/logo.
                
                Also, identify the bounding box of the LOGO/Trademark Image.
                Return the bounding box as [ymin, xmin, ymax, xmax] where coordinates are normalized to 0-1000 scale.
                If there is no logo (only text), return [0,0,0,0] or empty array.
            `;

            const imagePart = {
                inlineData: {
                    data: imageBuffer.toString("base64"),
                    mimeType: "image/png"
                }
            };

            const result = await this.model.generateContent([prompt, imagePart]);
            const response = await result.response;
            const text = response.text();

            return JSON.parse(text);
        } catch (error: any) {
            console.error("Gemini Analysis Error:", error);
            throw new Error(`Gemini analysis failed: ${error.message}`);
        }
    }

    /**
     * Crops the logo from the original image using the coordinates
     */
    async cropLogo(imageBuffer: Buffer, boundingBox: number[], outputFilename: string): Promise<string> {
        try {
            if (!boundingBox || boundingBox.length !== 4 || boundingBox.every(c => c === 0)) {
                return ""; // No logo to crop
            }

            const [ymin, xmin, ymax, xmax] = boundingBox;

            // Get image metadata to calculate pixel coordinates
            const metadata = await sharp(imageBuffer).metadata();
            const width = metadata.width || 0;
            const height = metadata.height || 0;

            if (width === 0 || height === 0) throw new Error("Invalid image dimensions");

            // Convert 0-1000 scale to pixels
            const top = Math.round((ymin / 1000) * height);
            const left = Math.round((xmin / 1000) * width);
            const extractHeight = Math.round(((ymax - ymin) / 1000) * height);
            const extractWidth = Math.round(((xmax - xmin) / 1000) * width);

            // Validate crop area
            const safeTop = Math.max(0, top);
            const safeLeft = Math.max(0, left);
            const safeHeight = Math.min(extractHeight, height - safeTop);
            const safeWidth = Math.min(extractWidth, width - safeLeft);

            if (safeWidth <= 0 || safeHeight <= 0) {
                console.warn("Invalid crop dimensions calculated", { top, left, extractHeight, extractWidth });
                return "";
            }

            // Ensure public/logos directory exists
            const logosDir = path.join(process.cwd(), 'public', 'logos');
            if (!fs.existsSync(logosDir)) {
                fs.mkdirSync(logosDir, { recursive: true });
            }

            const outputPath = path.join(logosDir, outputFilename);
            const publicPath = `/logos/${outputFilename}`;

            await sharp(imageBuffer)
                .extract({ left: safeLeft, top: safeTop, width: safeWidth, height: safeHeight })
                .toFile(outputPath);

            return publicPath;
        } catch (error: any) {
            // Log but don't crash, return empty string for logo
            console.error("Logo Cropping Error:", error);
            return "";
        }
    }

    /**
     * Main method to process a PDF page
     */
    async extract(pdfPath: string, pageNumber: number = 1) {
        console.log(`Processing PDF: ${pdfPath}, Page: ${pageNumber}`);

        // 1. Convert PDF to Image
        const imageBuffer = await this.convertPdfToImage(pdfPath, pageNumber);

        // 2. Analyze with Gemini
        const data = await this.analyzeWithGemini(imageBuffer);

        // 3. Crop Logo if applicable
        let logoUrl = "";
        if (data.logo_bounding_box && Array.isArray(data.logo_bounding_box) && data.logo_bounding_box.length === 4) {
            const hasDimensions = data.logo_bounding_box.some((c: number) => c > 0);

            if (hasDimensions && data.applicationNumber) {
                // Clean application number for filename
                const safeAppNum = data.applicationNumber.replace(/[^a-zA-Z0-9]/g, '_');
                const logoFilename = `logo_${safeAppNum}.png`;

                logoUrl = await this.cropLogo(imageBuffer, data.logo_bounding_box, logoFilename);
            }
        }

        return {
            ...data,
            logoUrl
        };
    }
}
