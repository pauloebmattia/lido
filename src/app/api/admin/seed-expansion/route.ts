import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { searchAndCleanBooks, CleanBookData } from '@/lib/google-books';

// List of specific titles to search
const TARGET_TITLES = [
    "O problema dos três corpos",
    "Mar Inquieto",
    "Antes que o café esfrie",
    "Os mentirosos"
];

// List of authors to fetch collections ("all" implies a good amount, let's say top 20 each)
const TARGET_AUTHORS = [
    "Colleen Hoover",
    "C.S. Lewis",
    "J.R.R. Tolkien",
    "Stephen King",
    "José Luís Peixoto",
    "Jorge Luis Borges"
];

export async function GET(request: Request) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Basic admin check (simplistic: just need to be logged in for now, or match specific email)
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const mode = searchParams.get('mode') || 'all'; // 'titles', 'authors', or 'all'
    const limitPerAuthor = parseInt(searchParams.get('limit') || '20', 10);

    const logs: string[] = [];
    let insertedCount = 0;
    let skippedCount = 0;

    async function processBook(book: CleanBookData) {
        // STRICT FILTER: Must have cover and description
        if (!book.cover_url && !book.cover_thumbnail) return 'skipped_no_cover';
        // if (!book.description) return 'skipped_no_desc'; // Optional: user preferred "more info" but cover is critical

        // Check if exists
        // Check if exists
        const { data: existing } = await supabase
            .from('books')
            .select('id, cover_url')
            .eq('google_books_id', book.google_books_id)
            .maybeSingle();

        if (existing) {
            // UPDATE COVER logic: If new cover is likely better (or just update to be safe with new cleaning logic)
            // We can just update the cover_url and cover_thumbnail
            if (book.cover_url && book.cover_url !== existing.cover_url) {
                await supabase
                    .from('books')
                    .update({
                        cover_url: book.cover_url,
                        cover_thumbnail: book.cover_thumbnail
                    })
                    .eq('id', existing.id);
                return 'updated_cover';
            }
            return 'skipped_exists';
        }

        // Insert
        let formattedDate: string | null = null;
        if (book.published_date) {
            const date = book.published_date;
            if (/^\d{4}$/.test(date)) formattedDate = `${date}-01-01`;
            else if (/^\d{4}-\d{2}$/.test(date)) formattedDate = `${date}-01`;
            else if (/^\d{4}-\d{2}-\d{2}$/.test(date)) formattedDate = date;
        }

        const { error } = await supabase.from('books').insert({
            title: book.title,
            subtitle: book.subtitle,
            authors: book.authors,
            publisher: book.publisher,
            published_date: formattedDate,
            description: book.description,
            page_count: book.page_count,
            cover_url: book.cover_url || book.cover_thumbnail, // Prefer High Res
            cover_thumbnail: book.cover_thumbnail,
            language: book.language,
            categories: book.categories,
            isbn: book.isbn,
            google_books_id: book.google_books_id,
            added_by: user!.id,
            is_verified: true // Admin added
        });

        if (error) {
            console.error(`Failed to insert ${book.title}:`, error);
            return 'error';
        }
        return 'inserted';
    }

    try {
        // 1. Process Specific Titles
        if (mode === 'all' || mode === 'titles') {
            for (const title of TARGET_TITLES) {
                logs.push(`🔍 Searching title: ${title}...`);
                // Search strict
                const results = await searchAndCleanBooks(`intitle:${title}`, 5);

                // Pick the BEST one (Cover + Desc)
                const bestMatch = results.find(b => b.cover_thumbnail && b.description) || results[0];

                if (bestMatch) {
                    const status = await processBook(bestMatch);
                    if (status === 'inserted') {
                        logs.push(`✅ Added: ${bestMatch.title}`);
                        insertedCount++;
                    } else if (status === 'updated_cover') {
                        logs.push(`✨ Updated Cover: ${bestMatch.title}`);
                        insertedCount++; // Count as success
                    } else {
                        logs.push(`⏭️ Skipped (${status}): ${bestMatch.title}`);
                        skippedCount++;
                    }
                } else {
                    logs.push(`❌ Not found: ${title}`);
                }
            }
        }

        // 2. Process Authors
        if (mode === 'all' || mode === 'authors') {
            for (const author of TARGET_AUTHORS) {
                logs.push(`🔍 Searching author: ${author}...`);
                const results = await searchAndCleanBooks(`inauthor:${author}`, limitPerAuthor);

                let authorAdded = 0;
                for (const book of results) {
                    const status = await processBook(book);
                    if (status === 'inserted') {
                        authorAdded++;
                        insertedCount++;
                    } else if (status === 'updated_cover') {
                        logs.push(`✨ Updated Cover: ${book.title}`);
                        authorAdded++;
                        insertedCount++;
                    } else if (status.startsWith('skipped')) {
                        skippedCount++;
                    }
                }
                logs.push(`📊 Author ${author}: Added ${authorAdded} new books.`);
            }
        }

        return NextResponse.json({
            success: true,
            inserted: insertedCount,
            skipped: skippedCount,
            logs
        });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
