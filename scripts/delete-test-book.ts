import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function deleteTestBook() {
    console.log('🗑️ Deleting "Test Indie Book"...');

    // Find the book first to be sure
    const { data: books } = await supabase
        .from('books')
        .select('id, title')
        .ilike('title', '%Test Indie Book%');

    if (!books || books.length === 0) {
        console.log('Test book not found.');
        return;
    }

    for (const book of books) {
        console.log(`Deleting "${book.title}" (${book.id})...`);
        const { error } = await supabase.from('books').delete().eq('id', book.id);
        if (error) console.error('Error deleting:', error);
        else console.log('Deleted successfully.');
    }
}

deleteTestBook();
