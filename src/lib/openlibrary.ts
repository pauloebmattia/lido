import { CleanBookData } from './google-books';

interface OpenLibraryDoc {
    key: string;
    title: string;
    author_name?: string[];
    first_publish_year?: number;
    isbn?: string[];
    publisher?: string[];
    language?: string[];
    cover_i?: number;
    subject?: string[];
    number_of_pages_median?: number;
}

export async function searchOpenLibrary(query: string, limit: number = 10): Promise<CleanBookData[]> {
    if (!query) return [];

    try {
        // q=title+author
        const searchUrl = `https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=${limit}&fields=key,title,author_name,first_publish_year,isbn,publisher,language,cover_i,subject,number_of_pages_median`;

        const res = await fetch(searchUrl);
        if (!res.ok) return [];

        const data = await res.json();
        const docs: OpenLibraryDoc[] = data.docs || [];

        return docs.map((doc) => {
            const isbn = doc.isbn?.[0] || null;
            const coverUrl = doc.cover_i
                ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-L.jpg`
                : null;
            const thumbnail = doc.cover_i
                ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg`
                : null;

            return {
                google_books_id: doc.key, // Using OL key as ID (e.g., "/works/OL123W")
                title: doc.title,
                subtitle: null,
                authors: doc.author_name || [],
                publisher: doc.publisher?.[0] || null,
                published_date: doc.first_publish_year?.toString() || null,
                description: null, // OpenLibrary search doesn't return description usually
                page_count: doc.number_of_pages_median || null,
                categories: doc.subject?.slice(0, 5) || [], // Limit categories
                averageRating: null,
                ratingsCount: null,
                language: doc.language?.[0] || 'en',
                cover_url: coverUrl,
                cover_thumbnail: thumbnail,
                isbn: isbn,
            };
        });

    } catch (error) {
        console.error('OpenLibrary Search Error:', error);
        return [];
    }
}
