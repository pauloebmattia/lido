import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { searchAndCleanBooks, CleanBookData } from '@/lib/google-books';
import { searchOpenLibrary } from '@/lib/openlibrary';

export const runtime = 'edge';

// Init Supabase client for Edge Runtime
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q');
    const maxResults = parseInt(searchParams.get('limit') || '10', 10);

    if (!query || query.trim().length < 2) {
        return NextResponse.json(
            { error: 'Query parameter "q" is required and must be at least 2 characters' },
            { status: 400 }
        );
    }

    try {
        const supabase = createClient(supabaseUrl, supabaseAnonKey);
        const searchQuery = query.trim();
        const results: CleanBookData[] = [];

        // 1. Search Internal Indie Books (Approved)
        const { data: internalBooks } = await supabase
            .from('early_access_books')
            .select(`
                book:books (
                    id,
                    title,
                    authors,
                    publisher,
                    published_date,
                    description,
                    page_count,
                    cover_thumbnail,
                    isbn,
                    categories,
                    avg_rating,
                    ratings_count
                )
            `)
            .eq('is_approved', true)
            .textSearch('book.title', `'${searchQuery}'`, { config: 'portuguese', type: 'websearch' })
            .limit(5);

        // Note: Full Text Search on joined tables is tricky in simple mode. 
        // A simpler approach for now without complex indexes:
        // Search books table directly and filter by those that are in early_access_books.
        // Or simpler: Just search 'books' table if we want ALL internal books (indie or not).
        // Let's search 'books' table directly for titles matching.

        const { data: booksData } = await supabase
            .from('books')
            .select('*')
            .ilike('title', `%${searchQuery}%`)
            .limit(5);

        if (booksData) {
            const mappedInternal: CleanBookData[] = booksData.map((b: any) => ({
                google_books_id: b.id, // Use UUID as ID
                title: b.title,
                authors: b.authors || [],
                description: b.description,
                page_count: b.page_count,
                categories: b.categories || [],
                isbn: b.isbn || null,
                subtitle: null,
                publisher: null,
                published_date: null,
                language: 'pt',
                cover_url: b.cover_url || null,
                cover_thumbnail: b.cover_url || null,
            }));

            results.push(...mappedInternal);
        }

        // 2. Search Google Books (if we need more results)
        if (results.length < maxResults) {
            const remaining = maxResults - results.length;
            const googleBooks = await searchAndCleanBooks(searchQuery, remaining);
            results.push(...googleBooks);
        }

        // 3. Search OpenLibrary (if still need more results)
        if (results.length < maxResults) {
            const remaining = maxResults - results.length;
            // Only search if we really need more (OL is slower sometimes and less standardized)
            const openLibraryBooks = await searchOpenLibrary(searchQuery, remaining);

            // Filter out duplicates (check against existing titles/authors vaguely or just append)
            // Simple check: check if title already exists in results
            const uniqueOL = openLibraryBooks.filter(olBook =>
                !results.some(r => r.title.toLowerCase() === olBook.title.toLowerCase())
            );

            results.push(...uniqueOL);
        }

        return NextResponse.json({
            query: searchQuery,
            count: results.length,
            books: results,
        });
    } catch (error) {
        console.error('Search API error:', error);
        return NextResponse.json(
            { error: 'Failed to search books.' },
            { status: 500 }
        );
    }
}
