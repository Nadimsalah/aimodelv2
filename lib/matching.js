
import { distance } from 'fastest-levenshtein';

/**
 * Calculate similarity percentage between two strings using Levenshtein distance
 */
function calculateSimilarity(str1, str2) {
    const maxLen = Math.max(str1.length, str2.length);
    if (maxLen === 0) return 100;
    const dist = distance(str1.toLowerCase(), str2.toLowerCase());
    return Math.round(((maxLen - dist) / maxLen) * 100);
}

/**
 * Compares detected PDF brands against My Brands library.
 * @param {Array<{name: string, normalized_name: string}>} myBrands 
 * @param {Array<{name: string, normalized_name: string}>} detectedBrands 
 * @param {number} threshold - 0 to 100 (default 70)
 * @returns {Array} List of matches
 */
export function findBrandMatches(myBrands, detectedBrands, threshold = 70) {
    const matches = [];

    // Optimization: Create a map of normalized My Brands for O(1) exact lookup
    const myBrandMap = new Map();
    myBrands.forEach(b => myBrandMap.set(b.normalized_name, b));

    detectedBrands.forEach(detected => {
        const detectedNorm = detected.normalized_name;

        // 1. Exact Match Check (High priority)
        if (myBrandMap.has(detectedNorm)) {
            const match = myBrandMap.get(detectedNorm);
            matches.push({
                my_brand_id: match.id,
                my_brand_name: match.name,
                detected_brand_name: detected.name,
                pdf_brand_id: detected.id,
                similarity: 100,
                match_type: 'exact'
            });
            return; // Skip fuzzy if exact found
        }

        // 2. Fuzzy Match Check using Levenshtein distance
        let bestMatch = null;
        let bestSimilarity = 0;

        myBrands.forEach(myBrand => {
            const similarity = calculateSimilarity(detectedNorm, myBrand.normalized_name);
            if (similarity > bestSimilarity) {
                bestSimilarity = similarity;
                bestMatch = myBrand;
            }
        });

        if (bestSimilarity >= threshold && bestMatch) {
            matches.push({
                my_brand_id: bestMatch.id,
                my_brand_name: bestMatch.name,
                detected_brand_name: detected.name,
                pdf_brand_id: detected.id,
                similarity: bestSimilarity,
                match_type: 'fuzzy'
            });
        }
    });

    return matches.sort((a, b) => b.similarity - a.similarity);
}
