import { NextRequest, NextResponse } from 'next/server';

const GOOGLE_BOOKS_API = 'https://www.googleapis.com/books/v1/volumes';

// Clean and format book data
function cleanBookData(book: any) {
    const info = book.volumeInfo || {};
    const identifiers = info.industryIdentifiers || [];

    // Get ISBN (prefer ISBN-13)
    const isbn13 = identifiers.find((id: any) => id.type === 'ISBN_13');
    const isbn10 = identifiers.find((id: any) => id.type === 'ISBN_10');
    const isbn = isbn13?.identifier || isbn10?.identifier || null;

    // Get cover URLs
    const imageLinks = info.imageLinks || {};
    const coverUrl = imageLinks.large || imageLinks.medium || imageLinks.thumbnail || null;
    const coverThumbnail = imageLinks.smallThumbnail || imageLinks.thumbnail || null;

    return {
        google_books_id: book.id,
        isbn,
        title: info.title || 'Sem título',
        authors: info.authors || ['Autor desconhecido'],
        publisher: info.publisher || null,
        published_date: info.publishedDate || null,
        description: info.description || null,
        page_count: info.pageCount || null,
        categories: info.categories || [],
        language: info.language || null,
        cover_url: coverUrl?.replace('http:', 'https:'),
        cover_thumbnail: coverThumbnail?.replace('http:', 'https:'),
    };
}

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: googleId } = await params;

        if (!googleId) {
            return NextResponse.json(
                { error: 'Book ID is required' },
                { status: 400 }
            );
        }

        const apiKey = process.env.GOOGLE_BOOKS_API_KEY;
        const url = apiKey
            ? `${GOOGLE_BOOKS_API}/${googleId}?key=${apiKey}`
            : `${GOOGLE_BOOKS_API}/${googleId}`;

        const response = await fetch(url);

        if (!response.ok) {
            if (response.status === 404) {
                return NextResponse.json(
                    { error: 'Book not found' },
                    { status: 404 }
                );
            }
            throw new Error('Failed to fetch book');
        }

        const data = await response.json();
        const book = cleanBookData(data);

        return NextResponse.json({ book });
    } catch (error) {
        console.error('Error fetching book:', error);
        return NextResponse.json(
            { error: 'Failed to fetch book details' },
            { status: 500 }
        );
    }
}
