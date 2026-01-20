import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // 60 seconds max for this route

const GOOGLE_BOOKS_API = 'https://www.googleapis.com/books/v1/volumes';

// Helper to normalize dates from Google Books
const normalizeDate = (dateStr: string | undefined): string | null => {
    if (!dateStr) return null;
    if (dateStr.length === 4) return `${dateStr}-01-01`;
    if (dateStr.length === 7) return `${dateStr}-01`;
    return dateStr;
};

// Helper to get high-res cover URL
const getCoverUrl = (imageLinks: any, bookId: string): string => {
    if (imageLinks?.thumbnail) {
        return imageLinks.thumbnail
            .replace('http:', 'https:')
            .replace('&zoom=1', '&zoom=3')
            .replace('&edge=curl', '');
    }
    return `https://books.google.com/books/content?id=${bookId}&printsec=frontcover&img=1&zoom=3`;
};

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category') || 'fiction';
    const startIndex = parseInt(searchParams.get('startIndex') || '0', 10);
    const maxResults = 40; // Google Books max per request

    // Validate Service Role Key
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceRoleKey) {
        return NextResponse.json({
            error: 'Service Role Key não configurada. Adicione SUPABASE_SERVICE_ROLE_KEY ao .env.local'
        }, { status: 401 });
    }

    // Create Admin Supabase Client (bypasses RLS)
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        serviceRoleKey
    );

    const results: any[] = [];
    const errors: string[] = [];
    const skipped: string[] = [];

    try {
        // Fetch from Google Books - FORCE Portuguese language
        const query = `subject:${encodeURIComponent(category)}`;
        const apiKey = process.env.GOOGLE_BOOKS_API_KEY || '';
        const url = `${GOOGLE_BOOKS_API}?q=${query}&startIndex=${startIndex}&maxResults=${maxResults}&langRestrict=pt&printType=books&key=${apiKey}`;

        const response = await fetch(url);
        const data = await response.json();

        if (!data.items || data.items.length === 0) {
            return NextResponse.json({
                success: 0,
                skipped: 0,
                message: `Nenhum livro em português encontrado para "${category}" no índice ${startIndex}`,
                results: [],
                errors: []
            });
        }

        for (const item of data.items) {
            const bookData = item.volumeInfo;

            // Quality filters - STRICT for Brazilian Portuguese
            if (!bookData.title) {
                skipped.push(`Sem título: ${item.id}`);
                continue;
            }

            // MUST be Portuguese language
            if (bookData.language && bookData.language !== 'pt') {
                skipped.push(`Não é português: ${bookData.title} (${bookData.language})`);
                continue;
            }

            if (!bookData.imageLinks?.thumbnail && !bookData.imageLinks?.smallThumbnail) {
                skipped.push(`Sem capa: ${bookData.title}`);
                continue;
            }
            if (!bookData.description || bookData.description.length < 30) {
                skipped.push(`Descrição curta: ${bookData.title}`);
                continue;
            }

            // Get ISBN
            const isbn = bookData.industryIdentifiers?.find((id: any) => id.type === 'ISBN_13')?.identifier ||
                bookData.industryIdentifiers?.find((id: any) => id.type === 'ISBN_10')?.identifier ||
                `GBOOKS-${item.id}`; // Fallback to Google ID if no ISBN

            const coverUrl = getCoverUrl(bookData.imageLinks, item.id);

            try {
                const { data: inserted, error } = await supabase
                    .from('books')
                    .upsert({
                        google_books_id: item.id,
                        isbn: isbn,
                        title: bookData.title,
                        subtitle: bookData.subtitle || null,
                        authors: bookData.authors || ['Autor Desconhecido'],
                        publisher: bookData.publisher || null,
                        published_date: normalizeDate(bookData.publishedDate),
                        description: bookData.description,
                        page_count: bookData.pageCount || null,
                        language: bookData.language || 'pt',
                        cover_url: coverUrl,
                        cover_thumbnail: bookData.imageLinks?.smallThumbnail?.replace('http:', 'https:') || coverUrl,
                        categories: bookData.categories || [category],
                        avg_rating: bookData.averageRating || 0,
                        ratings_count: bookData.ratingsCount || 0,
                        is_verified: true,
                    }, { onConflict: 'isbn' })
                    .select('id, title');

                if (error) {
                    errors.push(`DB Error (${bookData.title}): ${error.message}`);
                } else if (inserted && inserted.length > 0) {
                    results.push({ id: inserted[0].id, title: inserted[0].title });
                }
            } catch (e: any) {
                errors.push(`Exception (${bookData.title}): ${e.message}`);
            }
        }

        return NextResponse.json({
            success: results.length,
            skippedCount: skipped.length,
            category,
            startIndex,
            results,
            skippedSamples: skipped.slice(0, 5), // Only return first 5 skipped for brevity
            errors
        });

    } catch (e: any) {
        return NextResponse.json({
            error: `Fetch Error: ${e.message}`
        }, { status: 500 });
    }
}
