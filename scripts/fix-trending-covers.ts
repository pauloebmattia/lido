import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load env tables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase credentials in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function searchGoogleCover(title: string, author?: string): Promise<string | null> {
    try {
        const query = `intitle:${title}${author ? `+inauthor:${author}` : ''}`;
        const res = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=1`);
        const data = await res.json();

        if (data.items && data.items[0]?.volumeInfo?.imageLinks) {
            // Prefer extraLarge, large, medium, small, thumbnail
            const links = data.items[0].volumeInfo.imageLinks;
            const url = links.extraLarge || links.large || links.medium || links.thumbnail || links.smallThumbnail;
            return url ? url.replace('http:', 'https:') : null;
        }
    } catch (e) {
        console.error(`Error searching Google for ${title}:`, e);
    }
    return null;
}

async function fixCovers() {
    console.log('🔍 Checking for books without covers...');

    const targetTitles = [
        'A Biblioteca da Meia-Noite',
        'Torto Arado',
        'O Conto da Aia',
        'Pequeno Manual Antirracista'
    ];

    console.log('Targeting specific books to force cover update:', targetTitles);

    const { data: books, error } = await supabase
        .from('books')
        .select('*')
        .in('title', targetTitles);

    if (error) {
        console.error('Error fetching books:', error);
        return;
    }

    const booksToFix = books || [];

    if (booksToFix.length === 0) {
        console.log('❌ No matching books found!');
        return;
    }

    console.log(`Found ${booksToFix.length} books to update.`);

    for (const book of booksToFix) {
        console.log(`Processing "${book.title}"...`);
        const firstAuthor = book.authors && book.authors.length > 0 ? book.authors[0] : undefined;

        const newCover = await searchGoogleCover(book.title, firstAuthor);

        if (newCover) {
            const { error: updateError } = await supabase
                .from('books')
                .update({ cover_url: newCover, cover_thumbnail: newCover })
                .eq('id', book.id);

            if (updateError) {
                console.error(`Failed to update ${book.title}:`, updateError);
            } else {
                console.log(`✅ Updated cover for "${book.title}"`);
            }
        } else {
            console.log(`❌ No cover found for "${book.title}"`);
        }

        // Politeness delay
        await new Promise(r => setTimeout(r, 500));
    }

    console.log('🎉 Finished fixing covers!');
}

fixCovers();
