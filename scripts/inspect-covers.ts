import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function inspectCovers() {
    const targetTitles = [
        'A Biblioteca da Meia-Noite',
        'Torto Arado',
        'O Conto da Aia',
        'Pequeno Manual Antirracista'
    ];

    const { data: books } = await supabase
        .from('books')
        .select('title, cover_url, cover_thumbnail')
        .in('title', targetTitles);

    if (!books) return;

    books.forEach(book => {
        console.log(`Title: ${book.title}`);
        console.log(`Cover URL: ${book.cover_url}`);
        console.log('---');
    });
}

inspectCovers();
