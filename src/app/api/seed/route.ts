import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query') || '';
    const author = searchParams.get('author');
    const publisher = searchParams.get('publisher');
    const year = searchParams.get('year');
    const isbn = searchParams.get('isbn');
    const lang = searchParams.get('lang');
    const count = parseInt(searchParams.get('count') || '5');

    const supabase = await createClient();

    // ... (auth check) ...

    // ... (parts construction) ...

    const finalQuery = parts.join('+');

    const GOOGLE_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_BOOKS_API_KEY || '';
    let apiUrl = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(finalQuery)}&maxResults=${count}&key=${GOOGLE_API_KEY}`;

    // Add Language Restriction
    if (lang) {
        apiUrl += `&langRestrict=${lang}`;
    }

    console.log('Fetching Google Books:', apiUrl); // Debug log

    const res = await fetch(apiUrl);
    const data = await res.json();

    if (data.error) {
        console.error('Google API Error:', data.error);
        return NextResponse.json({ error: data.error.message || 'Google Books API Error' }, { status: res.status });
    }

    if (!data.items) {
        return NextResponse.json({ error: 'No books found for these filters' }, { status: 404 });
    }

    let addedCount = 0;

    for (const item of data.items) {
        const volumeInfo = item.volumeInfo;

        // Year filter check (soft filter if API didn't perfectly respect it)
        if (year && !volumeInfo.publishedDate?.includes(year)) {
            continue;
        }

        // 2. Insert into 'books' table first
        const { data: book, error: bookError } = await supabase
            .from('books')
            .upsert({
                google_books_id: item.id,
                title: volumeInfo.title,
                authors: volumeInfo.authors || ['Unknown'],
                description: volumeInfo.description,
                cover_url: volumeInfo.imageLinks?.thumbnail?.replace('http:', 'https:'),
                cover_thumbnail: volumeInfo.imageLinks?.smallThumbnail?.replace('http:', 'https:'),
                page_count: volumeInfo.pageCount,
                published_date: volumeInfo.publishedDate,
                publisher: volumeInfo.publisher,
                categories: volumeInfo.categories,
                added_by: user.id // Admin adds it
            }, { onConflict: 'google_books_id' })
            .select()
            .single();

        if (book) {
            // 3. Insert into 'early_access_books' as Mock Indie
            const { error: indieError } = await supabase.from('early_access_books').insert({
                book_id: book.id,
                author_id: user.id, // Current admin is the author of these seeds
                file_path: 'https://example.com/dummy.pdf',
                file_type: 'pdf',
                xp_bonus: 100,
                is_approved: false // Pending approval to test admin flow!
            });
            if (!indieError) addedCount++;
        }
    }

    return NextResponse.json({ success: true, count: addedCount, message: `Seeded ${addedCount} indie books from query '${query}'` });
}
