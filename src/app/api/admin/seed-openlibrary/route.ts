import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const OPEN_LIBRARY_API = 'https://openlibrary.org/search.json';
const OPEN_LIBRARY_COVERS = 'https://covers.openlibrary.org/b';

// Portuguese/Brazilian focused search queries for Open Library
const PORTUGUESE_QUERIES = [
    // Brazilian Authors
    'Machado de Assis',
    'Clarice Lispector',
    'Jorge Amado',
    'Érico Veríssimo',
    'Graciliano Ramos',
    'Rachel de Queiroz',
    'José Saramago',
    'Fernando Pessoa',
    'Lygia Fagundes Telles',
    'Rubem Fonseca',
    'Nélida Piñon',
    'João Ubaldo Ribeiro',
    'Luis Fernando Veríssimo',
    'Ziraldo',
    'Ana Maria Machado',
    'Monteiro Lobato',
    'Carlos Drummond de Andrade',
    'Cecília Meireles',
    'Vinicius de Moraes',
    'Mario Quintana',

    // Contemporary Brazilian
    'Conceição Evaristo',
    'Djamila Ribeiro',
    'Itamar Vieira Junior',
    'Carla Madeira',
    'Jeferson Tenório',
    'Natalia Borges Polesso',
    'Milton Hatoum',
    'Adriana Lisboa',
    'Michel Laub',
    'Daniel Galera',

    // Portuguese Language Searches
    'literatura brasileira',
    'romance brasileiro',
    'poesia brasileira',
    'contos brasileiros',
    'livros em português',
];

const normalizeDate = (dateStr: string | undefined): string | null => {
    if (!dateStr) return null;
    // Handle various date formats
    const year = dateStr.match(/\d{4}/)?.[0];
    if (year) return `${year}-01-01`;
    return null;
};

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const startIndex = parseInt(searchParams.get('startIndex') || '0', 10);
    const batchSize = parseInt(searchParams.get('batchSize') || '5', 10);

    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceRoleKey) {
        return NextResponse.json({ error: 'Service Role Key não configurada' }, { status: 401 });
    }

    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        serviceRoleKey
    );

    const results: any[] = [];
    const errors: string[] = [];
    const skipped: string[] = [];

    const batch = PORTUGUESE_QUERIES.slice(startIndex, startIndex + batchSize);

    for (const query of batch) {
        try {
            // Open Library API search
            const url = `${OPEN_LIBRARY_API}?q=${encodeURIComponent(query)}&language=por&limit=10`;

            const response = await fetch(url);
            const data = await response.json();

            if (!data.docs || data.docs.length === 0) {
                skipped.push(`Nenhum resultado: ${query}`);
                continue;
            }

            // Process up to 5 books per query
            for (const doc of data.docs.slice(0, 5)) {
                // Skip if no cover
                if (!doc.cover_i) {
                    skipped.push(`Sem capa: ${doc.title}`);
                    continue;
                }

                // Get or create ISBN
                const isbn = doc.isbn?.[0] || `OPENLIBRARY-${doc.key.replace('/works/', '')}`;

                // Build cover URLs
                const coverUrl = `${OPEN_LIBRARY_COVERS}/id/${doc.cover_i}-L.jpg`;
                const thumbnailUrl = `${OPEN_LIBRARY_COVERS}/id/${doc.cover_i}-M.jpg`;

                try {
                    const { data: inserted, error } = await supabase
                        .from('books')
                        .upsert({
                            google_books_id: doc.key || `ol-${doc.cover_i}`,
                            isbn: isbn,
                            title: doc.title,
                            subtitle: doc.subtitle || null,
                            authors: doc.author_name || ['Autor Desconhecido'],
                            publisher: doc.publisher?.[0] || null,
                            published_date: normalizeDate(doc.first_publish_year?.toString()),
                            description: doc.first_sentence?.[0] || `Obra de ${doc.author_name?.[0] || 'autor desconhecido'}`,
                            page_count: doc.number_of_pages_median || null,
                            language: 'pt',
                            cover_url: coverUrl,
                            cover_thumbnail: thumbnailUrl,
                            categories: doc.subject?.slice(0, 3) || ['Literatura'],
                            avg_rating: 0,
                            ratings_count: 0,
                            is_verified: true,
                        }, { onConflict: 'isbn' })
                        .select('id, title');

                    if (error) {
                        errors.push(`DB Error: ${error.message}`);
                    } else if (inserted && inserted.length > 0) {
                        results.push({ id: inserted[0].id, title: inserted[0].title });
                    }
                } catch (e: any) {
                    errors.push(`Exception: ${e.message}`);
                }
            }

            // Delay between queries to be respectful to API
            await new Promise(resolve => setTimeout(resolve, 500));

        } catch (e: any) {
            errors.push(`Fetch error (${query}): ${e.message}`);
        }
    }

    return NextResponse.json({
        success: results.length,
        skippedCount: skipped.length,
        totalQueries: PORTUGUESE_QUERIES.length,
        startIndex,
        endIndex: startIndex + batchSize,
        results,
        skipped: skipped.slice(0, 10),
        errors
    });
}
