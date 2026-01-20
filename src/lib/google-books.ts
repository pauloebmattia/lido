// =============================================================================
// Google Books API Integration
// =============================================================================

const GOOGLE_BOOKS_API = 'https://www.googleapis.com/books/v1/volumes';

export interface GoogleBookResult {
    id: string;
    volumeInfo: {
        title: string;
        subtitle?: string;
        authors?: string[];
        publisher?: string;
        publishedDate?: string;
        description?: string;
        industryIdentifiers?: Array<{
            type: string;
            identifier: string;
        }>;
        pageCount?: number;
        categories?: string[];
        imageLinks?: {
            thumbnail?: string;
            smallThumbnail?: string;
            small?: string;
            medium?: string;
            large?: string;
            extraLarge?: string;
        };
        language?: string;
    };
}

export interface CleanBookData {
    google_books_id: string;
    isbn: string | null;
    title: string;
    subtitle: string | null;
    authors: string[];
    publisher: string | null;
    published_date: string | null;
    description: string | null;
    page_count: number | null;
    language: string;
    cover_url: string | null;
    cover_thumbnail: string | null;
    categories: string[];
}

/**
 * Search books using Google Books API
 */
export async function searchGoogleBooks(query: string, maxResults = 10): Promise<GoogleBookResult[]> {
    const params = new URLSearchParams({
        q: query,
        maxResults: maxResults.toString(),
        langRestrict: 'pt', // Prioritize Portuguese
        printType: 'books',
    });

    const apiKey = process.env.GOOGLE_BOOKS_API_KEY;
    if (apiKey) {
        params.append('key', apiKey);
    }

    const response = await fetch(`${GOOGLE_BOOKS_API}?${params}`);

    if (!response.ok) {
        throw new Error(`Google Books API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.items || [];
}

/**
 * Get book details by ISBN
 */
export async function getBookByISBN(isbn: string): Promise<GoogleBookResult | null> {
    const results = await searchGoogleBooks(`isbn:${isbn}`, 1);
    return results[0] || null;
}

/**
 * Get book details by Google Books ID
 */
export async function getBookById(googleBooksId: string): Promise<GoogleBookResult | null> {
    const apiKey = process.env.GOOGLE_BOOKS_API_KEY;
    const url = apiKey
        ? `${GOOGLE_BOOKS_API}/${googleBooksId}?key=${apiKey}`
        : `${GOOGLE_BOOKS_API}/${googleBooksId}`;

    const response = await fetch(url);

    if (!response.ok) {
        if (response.status === 404) return null;
        throw new Error(`Google Books API error: ${response.statusText}`);
    }

    return response.json();
}

/**
 * Clean and normalize Google Books data for our database schema
 */
export function cleanBookData(book: GoogleBookResult): CleanBookData {
    const info = book.volumeInfo;

    // Extract ISBN (prefer ISBN_13)
    const isbn = info.industryIdentifiers?.find(i => i.type === 'ISBN_13')?.identifier
        || info.industryIdentifiers?.find(i => i.type === 'ISBN_10')?.identifier
        || null;

    // Get best quality cover image
    const imageLinks = info.imageLinks;
    const coverUrl = imageLinks?.extraLarge
        || imageLinks?.large
        || imageLinks?.medium
        || imageLinks?.small
        || imageLinks?.thumbnail
        || null;

    // Higher quality thumbnail (replace zoom parameter)
    const coverThumbnail = imageLinks?.thumbnail?.replace('zoom=1', 'zoom=2')
        || coverUrl
        || null;

    return {
        google_books_id: book.id,
        isbn,
        title: info.title,
        subtitle: info.subtitle || null,
        authors: info.authors || [],
        publisher: info.publisher || null,
        published_date: info.publishedDate || null,
        description: info.description || null,
        page_count: info.pageCount || null,
        language: info.language || 'pt',
        cover_url: coverUrl,
        cover_thumbnail: coverThumbnail,
        categories: info.categories || [],
    };
}

/**
 * Search and clean books in one call
 */
export async function searchAndCleanBooks(query: string, maxResults = 10): Promise<CleanBookData[]> {
    const results = await searchGoogleBooks(query, maxResults);
    return results.map(cleanBookData);
}
