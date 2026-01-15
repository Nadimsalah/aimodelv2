
import stringSimilarity from 'string-similarity';

/**
 * Compares detected PDF brands against My Brands library.
 * @param {Array<{name: string, normalized_name: string}>} myBrands 
 * @param {Array<{name: string, normalized_name: string}>} detectedBrands 
 * @param {number} threshold - 0.0 to 1.0 (default 0.7)
 * @returns {Array} List of matches
 */
export function findBrandMatches(myBrands, detectedBrands, threshold = 0.7) {
    const matches = [];

    // Helper: Normalize strictly for comparison
    const norm = (str) => String(str).toLowerCase().trim().replace(/[^\w\s]/g, '');

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
                similarity: 100,
                match_type: 'exact'
            });
            return; // Skip fuzzy if exact found
        }

        // 2. Fuzzy Match Check
        // Jaro-Winkler via string-similarity is good for short strings
        // We compare against the list of myBrands names

        // This is O(N*M), slow for huge lists, but fine for prototypes (e.g. < 5000 brands).
        // For production, use Postgres trigram index.
        const candidates = myBrands.map(b => b.normalized_name);

        if (candidates.length > 0) {
            const bestMatch = stringSimilarity.findBestMatch(detectedNorm, candidates);
            const bestRating = bestMatch.bestMatch.rating; // 0 to 1

            if (bestRating >= threshold) {
                const matchedBrand = myBrands[bestMatch.bestMatchIndex];
                matches.push({
                    my_brand_id: matchedBrand.id,
                    my_brand_name: matchedBrand.name,
                    detected_brand_name: detected.name,
                    similarity: Math.round(bestRating * 100),
                    match_type: 'fuzzy'
                });
            }
        }
    });

    return matches.sort((a, b) => b.similarity - a.similarity);
}
