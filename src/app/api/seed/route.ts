import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query');
    const count = parseInt(searchParams.get('count') || '5');

    const supabase = await createClient();

    // Auth check (simple version, ideally middleware)
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    if (!query) {
        // Fallback: Seed Badges for current user if no query
        // This preserves the original walkthrough function
        const { data: badges } = await supabase.from('badges').select('id').limit(2);

        if (badges && badges.length > 0) {
            const inserts = badges.map(b => ({
                user_id: user.id,
                badge_id: b.id
            }));
            await supabase.from('user_badges').insert(inserts);
        }
        return NextResponse.json({ success: true, message: 'Badges seeded (no query provided)' });
    }

    // 1. Fetch from Google Books
    const GOOGLE_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_BOOKS_API_KEY || ''; // Use env
    const res = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=${count}&key=${GOOGLE_API_KEY}`);
    const data = await res.json();

    if (!data.items) {
        return NextResponse.json({ error: 'No books found to seed' }, { status: 404 });
    }

    let addedCount = 0;

    for (const item of data.items) {
        const volumeInfo = item.volumeInfo;

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
