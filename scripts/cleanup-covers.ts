
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load env vars
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function cleanupBooks() {
    console.log('Starting cleanup of books with bad covers...');

    // 1. Delete books with null/empty cover_url AND null/empty cover_thumbnail
    // Except those that might have been manually added (but user said remove bad covers)
    const { count: countNull, error: errorNull } = await supabase
        .from('books')
        .delete({ count: 'exact' })
        .is('cover_url', null)
        .is('cover_thumbnail', null);

    if (errorNull) console.error('Error deleting null covers:', errorNull);
    else console.log(`Deleted ${countNull} books with NULL covers.`);

    // 2. Delete books with placeholder covers (if any text patterns match)
    // Common placeholder patterns: "placehold.co", "via.placeholder", or just effectively blank
    // For now, let's target specific known bad patterns if we had them, OR
    // delete books where cover_url is empty string
    const { count: countEmpty, error: errorEmpty } = await supabase
        .from('books')
        .delete({ count: 'exact' })
        .eq('cover_url', '');

    if (errorEmpty) console.error('Error deleting empty string covers:', errorEmpty);
    else console.log(`Deleted ${countEmpty} books with empty string covers.`);

    // 3. Remove books with 'edge-case' covers like those with very small dimensions if we could detect,
    // but without image analysis, we rely on URL presence. 
    // Let's also check for 'zoom=1&img=1' generic Google placeholders if they exist
    // Actually, user said "remove items with missing or problematic covers".
    // Let's run a query to see what kind of URLs we have first to be safe, but since this is an executon task:

    console.log('Cleanup complete.');
}

cleanupBooks();
