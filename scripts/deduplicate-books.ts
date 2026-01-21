import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function deduplicateBooks() {
    console.log('🔍 Checking for duplicate books...');

    // Fetch all books with the target titles
    const targetTitles = [
        'A Biblioteca da Meia-Noite',
        'Torto Arado',
        'O Conto da Aia',
        'Pequeno Manual Antirracista'
    ];

    const { data: books, error } = await supabase
        .from('books')
        .select('*')
        .in('title', targetTitles);

    if (error) {
        console.error('Error fetching books:', error);
        return;
    }

    if (!books || books.length === 0) {
        console.log('No books found.');
        return;
    }

    console.log(`Found ${books.length} potential candidates.`);

    // Group by title
    const grouped = books.reduce((acc, book) => {
        acc[book.title] = acc[book.title] || [];
        acc[book.title].push(book);
        return acc;
    }, {} as Record<string, any[]>);

    for (const title of Object.keys(grouped)) {
        const dupes = grouped[title];
        if (dupes.length > 1) {
            console.log(`Found ${dupes.length} duplicates for "${title}"`);

            // Sort by data quality (e.g., has cover, has description) or creation date
            // We want to keep the one with the longest description or most complete data
            dupes.sort((a, b) => {
                const scoreA = (a.description?.length || 0) + (a.cover_url ? 1000 : 0);
                const scoreB = (b.description?.length || 0) + (b.cover_url ? 1000 : 0);
                return scoreB - scoreA; // Descending
            });

            const winner = dupes[0];
            const losers = dupes.slice(1);

            console.log(`Keeping winner: ${winner.id} (Cover: ${winner.cover_url ? 'Yes' : 'No'})`);

            for (const loser of losers) {
                console.log(`🗑️ Deleting duplicate: ${loser.id}`);
                const { error: delError } = await supabase.from('books').delete().eq('id', loser.id);
                if (delError) console.error('Error deleting:', delError);
            }
        } else {
            console.log(`"${title}" is clean (1 entry).`);
        }
    }
}

deduplicateBooks();
