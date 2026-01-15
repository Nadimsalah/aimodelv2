// Initialize PDF.js worker - wait for library to load
let pdfjsLibLoaded = false;

// Wait for PDF.js to load
if (typeof pdfjsLib !== 'undefined') {
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    pdfjsLibLoaded = true;
} else {
    window.addEventListener('load', () => {
        if (typeof pdfjsLib !== 'undefined') {
            pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
            pdfjsLibLoaded = true;
        }
    });
}

// Common brand names database (extensive list)
const BRAND_DATABASE = [
    // Technology
    'Apple', 'Microsoft', 'Google', 'Amazon', 'Facebook', 'Meta', 'Twitter', 'X', 'LinkedIn', 'Instagram',
    'Samsung', 'Sony', 'LG', 'HP', 'Dell', 'Lenovo', 'Asus', 'Acer', 'NVIDIA', 'Intel', 'AMD', 'Qualcomm',
    'IBM', 'Oracle', 'Adobe', 'Salesforce', 'Cisco', 'Netflix', 'Spotify', 'Uber', 'Airbnb', 'Tesla',
    
    // Automotive
    'Toyota', 'Honda', 'Ford', 'BMW', 'Mercedes-Benz', 'Mercedes', 'Audi', 'Volkswagen', 'Volvo', 'Nissan',
    'Hyundai', 'Kia', 'Chevrolet', 'Jeep', 'Porsche', 'Ferrari', 'Lamborghini', 'Mazda', 'Subaru', 'Lexus',
    
    // Fashion & Luxury
    'Nike', 'Adidas', 'Puma', 'Reebok', 'Under Armour', 'Gucci', 'Prada', 'Louis Vuitton', 'LV', 'Chanel',
    'Versace', 'Armani', 'Calvin Klein', 'Tommy Hilfiger', 'Ralph Lauren', 'Zara', 'H&M', 'Uniqlo',
    
    // Food & Beverage
    'Coca-Cola', 'Pepsi', 'McDonald\'s', 'Starbucks', 'KFC', 'Burger King', 'Pizza Hut', 'Domino\'s',
    'Nestlé', 'Unilever', 'Kraft', 'Heinz', 'Kellogg\'s', 'General Mills', 'Mars', 'Hershey\'s',
    
    // Retail
    'Walmart', 'Target', 'Costco', 'Home Depot', 'Lowe\'s', 'IKEA', 'Best Buy', 'Macy\'s', 'Nordstrom',
    
    // Finance
    'Visa', 'Mastercard', 'American Express', 'PayPal', 'JPMorgan', 'Bank of America', 'Wells Fargo',
    'Goldman Sachs', 'Morgan Stanley', 'Citibank', 'Chase',
    
    // Airlines & Travel
    'American Airlines', 'Delta', 'United Airlines', 'Lufthansa', 'Emirates', 'British Airways',
    'Air France', 'KLM', 'Singapore Airlines', 'Qantas',
    
    // Energy & Utilities
    'ExxonMobil', 'Shell', 'BP', 'Chevron', 'Total', 'Gazprom', 'Saudi Aramco',
    
    // Pharmaceuticals
    'Pfizer', 'Johnson & Johnson', 'J&J', 'Novartis', 'Roche', 'Merck', 'GSK', 'GlaxoSmithKline',
    'AstraZeneca', 'Bayer', 'Sanofi',
    
    // Other
    'Disney', 'Nintendo', 'PlayStation', 'Xbox', 'Coca Cola', 'PepsiCo', 'Procter & Gamble', 'P&G',
    'General Electric', 'GE', '3M', 'Boeing', 'Airbus', 'FedEx', 'UPS', 'DHL'
];

// Extended patterns for brand detection
const BRAND_PATTERNS = [
    /\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\s+(Inc|LLC|Ltd|Corp|Corporation|Company|Co|Group|Holdings|International|Global)\b/gi,
    /\b[A-Z]{2,}\b/g, // Acronyms like IBM, HP, etc.
    /\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\s*[®™©]\b/gi, // Brands with trademark symbols
];

let extractedTextContent = '';
let selectedFile = null;

// DOM Elements - wait for DOM to be ready
let uploadArea, fileInput, fileInfo, fileName, fileSize, extractBtn, progressBar, progressFill;
let extractedTextContainer, extractedText, proceedBtn, step1, step2, brandCount, brandsList, statusMessage;

// Initialize DOM elements when page loads
function initializeElements() {
    uploadArea = document.getElementById('uploadArea');
    fileInput = document.getElementById('fileInput');
    fileInfo = document.getElementById('fileInfo');
    fileName = document.getElementById('fileName');
    fileSize = document.getElementById('fileSize');
    extractBtn = document.getElementById('extractBtn');
    progressBar = document.getElementById('progressBar');
    progressFill = document.getElementById('progressFill');
    extractedTextContainer = document.getElementById('extractedTextContainer');
    extractedText = document.getElementById('extractedText');
    proceedBtn = document.getElementById('proceedBtn');
    step1 = document.getElementById('step1');
    step2 = document.getElementById('step2');
    brandCount = document.getElementById('brandCount');
    brandsList = document.getElementById('brandsList');
    statusMessage = document.getElementById('statusMessage');
    
    if (!uploadArea || !fileInput) {
        console.error('Required DOM elements not found');
        return false;
    }
    
    return true;
}

// Wait for DOM to be ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        if (initializeElements()) {
            setupEventListeners();
        }
    });
} else {
    if (initializeElements()) {
        setupEventListeners();
    }
}

// Setup event listeners
function setupEventListeners() {

    // Upload area click handler
    uploadArea.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log('Upload area clicked');
        try {
            fileInput.click();
        } catch (error) {
            console.error('Error clicking file input:', error);
            showStatus('Error opening file dialog. Please try again.', 'error');
        }
    });

    // Drag and drop handlers
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.stopPropagation();
        uploadArea.classList.add('dragover');
    });

    uploadArea.addEventListener('dragleave', (e) => {
        e.preventDefault();
        e.stopPropagation();
        uploadArea.classList.remove('dragover');
    });

    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        e.stopPropagation();
        uploadArea.classList.remove('dragover');
        const files = e.dataTransfer.files;
        console.log('Files dropped:', files);
        if (files && files.length > 0) {
            handleFileSelect(files[0]);
        }
    });

    // File input change handler
    fileInput.addEventListener('change', (e) => {
        console.log('File input changed:', e.target.files);
        if (e.target.files && e.target.files.length > 0) {
            handleFileSelect(e.target.files[0]);
        } else {
            console.warn('No files selected');
        }
    });

    // Extract button handler
    extractBtn.addEventListener('click', () => {
        if (selectedFile) {
            extractTextFromFile(selectedFile);
        } else {
            alert('Please select a file first');
        }
    });

    // Proceed button handler
    proceedBtn.addEventListener('click', () => {
        extractBrands();
    });
    
    console.log('Event listeners set up successfully');
}

// Handle file selection
function handleFileSelect(file) {
    if (!file) {
        console.error('No file selected');
        return;
    }
    
    console.log('File selected:', file.name, file.type, file.size);
    
    // Validate file type
    const fileExtension = file.name.split('.').pop().toLowerCase();
    const allowedExtensions = ['pdf', 'xls', 'xlsx', 'doc', 'docx', 'txt'];
    
    if (!allowedExtensions.includes(fileExtension)) {
        showStatus('Unsupported file type. Please upload a PDF, Excel, Word, or Text file.', 'error');
        return;
    }
    
    selectedFile = file;
    fileName.textContent = file.name;
    fileSize.textContent = formatFileSize(file.size);
    fileInfo.style.display = 'block';
    extractedTextContainer.style.display = 'none';
    step2.style.display = 'none';
    progressBar.style.display = 'none';
    
    // Hide any previous status messages
    if (statusMessage) {
        statusMessage.style.display = 'none';
    }
}

// Format file size
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

// Extract text from file based on type
async function extractTextFromFile(file) {
    progressBar.style.display = 'block';
    progressFill.style.width = '10%';
    extractedTextContainer.style.display = 'none';
    
    const fileType = file.name.split('.').pop().toLowerCase();
    
    try {
        progressFill.style.width = '30%';
        let text = '';
        
        if (fileType === 'pdf') {
            text = await extractFromPDF(file);
        } else if (fileType === 'xls' || fileType === 'xlsx') {
            text = await extractFromExcel(file);
        } else if (fileType === 'doc' || fileType === 'docx') {
            text = await extractFromWord(file);
        } else if (fileType === 'txt') {
            text = await extractFromText(file);
        } else {
            throw new Error('Unsupported file type');
        }
        
        progressFill.style.width = '100%';
        extractedText.textContent = text || 'No text could be extracted from this file.';
        setTimeout(() => {
            progressBar.style.display = 'none';
            extractedTextContainer.style.display = 'block';
        }, 500);
        
    } catch (error) {
        console.error('Error extracting text:', error);
        progressBar.style.display = 'none';
        showStatus('Error extracting text: ' + error.message, 'error');
    }
}

// Show status message
function showStatus(message, type = 'info') {
    if (statusMessage) {
        statusMessage.textContent = message;
        statusMessage.className = 'status-message ' + type;
        statusMessage.style.display = 'block';
    } else {
        alert(message);
    }
}

// Extract text from PDF
async function extractFromPDF(file) {
    if (typeof pdfjsLib === 'undefined') {
        throw new Error('PDF.js library not loaded. Please refresh the page.');
    }
    
    try {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        let fullText = '';
        
        for (let i = 1; i <= pdf.numPages; i++) {
            progressFill.style.width = `${30 + (i / pdf.numPages) * 50}%`;
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            const pageText = textContent.items.map(item => item.str).join(' ');
            fullText += pageText + '\n';
        }
        
        return fullText;
    } catch (error) {
        console.error('PDF extraction error:', error);
        throw new Error('Failed to extract text from PDF: ' + error.message);
    }
}

// Extract text from Excel
async function extractFromExcel(file) {
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    let fullText = '';
    
    workbook.SheetNames.forEach((sheetName, index) => {
        progressFill.style.width = `${30 + ((index + 1) / workbook.SheetNames.length) * 50}%`;
        const sheet = workbook.Sheets[sheetName];
        const sheetText = XLSX.utils.sheet_to_txt(sheet);
        fullText += sheetText + '\n';
    });
    
    return fullText;
}

// Extract text from Word document
async function extractFromWord(file) {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    progressFill.style.width = '80%';
    return result.value;
}

// Extract text from plain text file
async function extractFromText(file) {
    const text = await file.text();
    progressFill.style.width = '100%';
    return text;
}

// Extract brand names from text
function extractBrands() {
    step1.style.display = 'none';
    step2.style.display = 'block';
    brandsList.innerHTML = '';
    
    const text = extractedText.textContent || extractedTextContent;
    const foundBrands = new Set();
    
    // Extract brands from database
    BRAND_DATABASE.forEach(brand => {
        const regex = new RegExp(`\\b${brand.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
        if (regex.test(text)) {
            foundBrands.add(brand);
        }
    });
    
    // Extract brands using patterns
    BRAND_PATTERNS.forEach(pattern => {
        const matches = text.match(pattern);
        if (matches) {
            matches.forEach(match => {
                // Clean up the match
                const cleaned = match.trim().replace(/[®™©]/g, '').trim();
                if (cleaned.length > 2 && cleaned.length < 50) {
                    // Check if it looks like a brand (starts with capital, has reasonable length)
                    if (/^[A-Z]/.test(cleaned)) {
                        foundBrands.add(cleaned);
                    }
                }
            });
        }
    });
    
    // Extract capitalized words/phrases that might be brands
    const capitalizedPattern = /\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/g;
    const capitalizedMatches = text.match(capitalizedPattern);
    if (capitalizedMatches) {
        capitalizedMatches.forEach(match => {
            // Filter out common words and short matches
            const commonWords = ['The', 'This', 'That', 'These', 'Those', 'There', 'Here', 'Where', 'When', 'What', 'Who', 'How', 'Why'];
            if (match.length > 3 && !commonWords.includes(match) && match.split(' ').length <= 3) {
                // Additional check: if it appears multiple times or has brand-like characteristics
                const count = (text.match(new RegExp(`\\b${match.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi')) || []).length;
                if (count >= 2 || match.length > 5) {
                    foundBrands.add(match);
                }
            }
        });
    }
    
    const brandsArray = Array.from(foundBrands).sort();
    
    // Animate counter
    animateCounter(0, brandsArray.length, brandCount);
    
    // Display brands with animation
    setTimeout(() => {
        brandsArray.forEach((brand, index) => {
            setTimeout(() => {
                const brandItem = document.createElement('div');
                brandItem.className = 'brand-item';
                brandItem.textContent = brand;
                brandsList.appendChild(brandItem);
            }, index * 50);
        });
    }, 100);
}

// Animate counter with real-time count
function animateCounter(start, end, element) {
    const duration = 2000; // 2 seconds
    const startTime = performance.now();
    
    function updateCounter(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Easing function for smooth animation
        const easeOutQuart = 1 - Math.pow(1 - progress, 4);
        const current = Math.floor(start + (end - start) * easeOutQuart);
        
        element.textContent = current;
        
        if (progress < 1) {
            requestAnimationFrame(updateCounter);
        } else {
            element.textContent = end;
        }
    }
    
    requestAnimationFrame(updateCounter);
}
