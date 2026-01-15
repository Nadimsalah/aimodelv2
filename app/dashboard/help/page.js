'use client';
import { motion } from 'framer-motion';
import { HelpCircle, Code, Workflow, Database, Zap } from 'lucide-react';
import styles from './help.module.css';

export default function HelpPage() {
    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <h1 className={styles.title}>
                    <HelpCircle size={28} />
                    How Our AI Model Works
                </h1>
                <p className={styles.subtitle}>Technical documentation of the brand detection system</p>
            </header>

            {/* AI Workflow Overview */}
            <section className={styles.section}>
                <h2 className={styles.sectionTitle}>
                    <Workflow size={20} />
                    AI Workflow Overview
                </h2>
                <div className={styles.flowCard}>
                    <div className={styles.flowDiagram}>
                        <div className={styles.flowStep}>
                            <div className={styles.stepNumber}>1</div>
                            <h3>PDF Upload</h3>
                            <p>User uploads PDF to Supabase Storage</p>
                        </div>
                        <div className={styles.flowArrow}>→</div>
                        <div className={styles.flowStep}>
                            <div className={styles.stepNumber}>2</div>
                            <h3>AI Extraction</h3>
                            <p>Gemini AI extracts brand names</p>
                        </div>
                        <div className={styles.flowArrow}>→</div>
                        <div className={styles.flowStep}>
                            <div className={styles.stepNumber}>3</div>
                            <h3>Normalization</h3>
                            <p>Convert to lowercase & trim</p>
                        </div>
                        <div className={styles.flowArrow}>→</div>
                        <div className={styles.flowStep}>
                            <div className={styles.stepNumber}>4</div>
                            <h3>Matching</h3>
                            <p>Compare with brand library</p>
                        </div>
                        <div className={styles.flowArrow}>→</div>
                        <div className={styles.flowStep}>
                            <div className={styles.stepNumber}>5</div>
                            <h3>Results</h3>
                            <p>Display matches with scores</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Step 1: PDF Extraction */}
            <section className={styles.section}>
                <h2 className={styles.sectionTitle}>
                    <Code size={20} />
                    Step 1: PDF Extraction with Gemini AI
                </h2>
                <div className={styles.codeCard}>
                    <p className={styles.explanation}>
                        When you upload a PDF, we use <strong>Google Gemini AI</strong> to extract brand names.
                        The AI analyzes the document and identifies potential brand mentions.
                    </p>
                    <pre className={styles.codeBlock}>
                        {`// Extract brands from PDF using Gemini AI
const brands = await extractBrandsFromPdfWithGemini(
  pdfBuffer, 
  apiKey
);

// Example output:
// ["Nike", "Adidas", "Puma", "Reebok"]`}
                    </pre>
                    <div className={styles.techDetails}>
                        <strong>Technology:</strong> Google Gemini 1.5 Flash<br />
                        <strong>Input:</strong> PDF file as binary buffer<br />
                        <strong>Output:</strong> Array of detected brand names
                    </div>
                </div>
            </section>

            {/* Step 2: Normalization */}
            <section className={styles.section}>
                <h2 className={styles.sectionTitle}>
                    <Zap size={20} />
                    Step 2: Brand Normalization
                </h2>
                <div className={styles.codeCard}>
                    <p className={styles.explanation}>
                        After extraction, we normalize brand names to ensure consistent matching.
                        This involves converting to lowercase and removing extra whitespace.
                    </p>
                    <pre className={styles.codeBlock}>
                        {`// Normalize brand names
const normalized = brandName.toLowerCase().trim();

// Examples:
"NIKE"      → "nike"
"  Adidas " → "adidas"
"PUMA"      → "puma"`}
                    </pre>
                </div>
            </section>

            {/* Step 3: Matching Algorithm */}
            <section className={styles.section}>
                <h2 className={styles.sectionTitle}>
                    <Database size={20} />
                    Step 3: Brand Matching Algorithm
                </h2>
                <div className={styles.codeCard}>
                    <p className={styles.explanation}>
                        We use a two-tier matching system: <strong>Exact Match</strong> (100% similarity)
                        and <strong>Fuzzy Match</strong> (using Levenshtein distance algorithm).
                    </p>
                    <pre className={styles.codeBlock}>
                        {`function findBrandMatches(myBrands, detectedBrands, threshold = 70) {
  const matches = [];
  
  detectedBrands.forEach(detected => {
    // 1. Check for EXACT match
    if (myBrandMap.has(detected.normalized_name)) {
      matches.push({
        my_brand: match.name,
        detected_brand: detected.name,
        similarity: 100,
        match_type: 'exact'
      });
      return;
    }
    
    // 2. Check for FUZZY match using Levenshtein
    let bestSimilarity = 0;
    myBrands.forEach(myBrand => {
      const similarity = calculateSimilarity(
        detected.normalized_name,
        myBrand.normalized_name
      );
      if (similarity > bestSimilarity) {
        bestSimilarity = similarity;
        bestMatch = myBrand;
      }
    });
    
    // Only add if similarity >= threshold (70%)
    if (bestSimilarity >= threshold) {
      matches.push({
        my_brand: bestMatch.name,
        detected_brand: detected.name,
        similarity: bestSimilarity,
        match_type: 'fuzzy'
      });
    }
  });
  
  return matches.sort((a, b) => b.similarity - a.similarity);
}`}
                    </pre>
                </div>
            </section>

            {/* Levenshtein Distance */}
            <section className={styles.section}>
                <h2 className={styles.sectionTitle}>Levenshtein Distance Algorithm</h2>
                <div className={styles.codeCard}>
                    <p className={styles.explanation}>
                        The <strong>Levenshtein distance</strong> calculates how many single-character edits
                        (insertions, deletions, substitutions) are needed to transform one string into another.
                    </p>
                    <pre className={styles.codeBlock}>
                        {`function calculateSimilarity(str1, str2) {
  const maxLen = Math.max(str1.length, str2.length);
  if (maxLen === 0) return 100;
  
  // Calculate edit distance
  const dist = distance(str1.toLowerCase(), str2.toLowerCase());
  
  // Convert to percentage similarity
  return Math.round(((maxLen - dist) / maxLen) * 100);
}

// Examples:
calculateSimilarity("nike", "nike")     // 100% - exact match
calculateSimilarity("nike", "nikee")    // 80%  - 1 extra char
calculateSimilarity("adidas", "addidas") // 86%  - 1 char diff
calculateSimilarity("puma", "poma")     // 75%  - 1 substitution`}
                    </pre>
                    <div className={styles.exampleBox}>
                        <h4>Real-World Example:</h4>
                        <p><strong>Detected:</strong> "Coca-Cola" (from PDF)</p>
                        <p><strong>Library:</strong> "Coca Cola" (your database)</p>
                        <p><strong>Similarity:</strong> 90% (fuzzy match)</p>
                        <p><strong>Result:</strong> ✅ Match found!</p>
                    </div>
                </div>
            </section>

            {/* Database Flow */}
            <section className={styles.section}>
                <h2 className={styles.sectionTitle}>
                    <Database size={20} />
                    Database Storage Flow
                </h2>
                <div className={styles.codeCard}>
                    <p className={styles.explanation}>
                        The system stores data in multiple tables for efficient querying and analysis.
                    </p>
                    <pre className={styles.codeBlock}>
                        {`// 1. Store scan job
INSERT INTO scan_jobs (filename, storage_path, status)
VALUES ('document.pdf', 'uploads/abc123.pdf', 'processing');

// 2. Store detected brands
INSERT INTO pdf_brands (job_id, name, normalized_name)
VALUES 
  (job_id, 'Nike', 'nike'),
  (job_id, 'Adidas', 'adidas');

// 3. Store matches
INSERT INTO matches (job_id, my_brand, detected_brand, similarity, match_type)
VALUES 
  (job_id, 'Nike', 'Nike', 100, 'exact'),
  (job_id, 'Adidas', 'Addidas', 86, 'fuzzy');`}
                    </pre>
                </div>
            </section>

            {/* Contact */}
            <section className={styles.section}>
                <div className={styles.contactCard}>
                    <h3>Need More Help?</h3>
                    <p>Contact our technical support team for assistance.</p>
                    <p><strong>Email:</strong> support@legafin.com</p>
                </div>
            </section>
        </div>
    );
}
