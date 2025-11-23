// Utility functions for ARASAAC API integration
// ARASAAC is a free pictogram database for AAC applications

const ARASAAC_BASE_URL = 'https://api.arasaac.org/api';

export interface ArasaacPictogram {
    _id: number;
    keywords: Array<{ keyword: string; }>;
}

/**
 * Search for pictograms by keyword
 * @param keyword - Search term in Spanish
 * @param limit - Maximum number of results (default: 10)
 * @returns Array of pictogram URLs and words
 */
export async function searchPictograms(keyword: string, limit: number = 10) {
    try {
        const normalizedKeyword = keyword.toLowerCase().trim();
        const response = await fetch(
            `${ARASAAC_BASE_URL}/pictograms/es/search/${encodeURIComponent(normalizedKeyword)}`
        );

        if (!response.ok) {
            throw new Error('Failed to fetch pictograms');
        }

        const data: ArasaacPictogram[] = await response.json();

        return data.slice(0, limit).map((pic) => ({
            word: pic.keywords[0]?.keyword || normalizedKeyword,
            url: `${ARASAAC_BASE_URL}/pictograms/${pic._id}?download=false`,
        }));
    } catch (error) {
        console.error('Error searching pictograms:', error);
        return [];
    }
}

/**
 * Get pictogram URL by ID
 * @param id - ARASAAC pictogram ID
 * @returns Pictogram URL
 */
export function getPictogramUrl(id: number): string {
    return `${ARASAAC_BASE_URL}/pictograms/${id}?download=false`;
}

/**
 * Get suggested pictograms for common AAC phrases
 */
export const COMMON_PICTOGRAMS = [
    { word: 'Quiero', id: 36994 },
    { word: 'agua', id: 2349 },
    { word: 'comer', id: 5486 },
    { word: 'jugar', id: 28308 },
    { word: 'dormir', id: 28309 },
    { word: 'baño', id: 28310 },
    { word: 'sí', id: 28311 },
    { word: 'no', id: 28312 },
    { word: 'mamá', id: 28313 },
    { word: 'papá', id: 28314 },
    { word: 'Hola', id: 5510 },
    { word: 'Adiós', id: 2340 },
    { word: 'Gracias', id: 5505 },
    { word: 'Por favor', id: 10000 },
].map(item => ({
    word: item.word,
    url: getPictogramUrl(item.id),
}));
