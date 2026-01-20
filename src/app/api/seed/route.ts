
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const GOOGLE_BOOKS_API = 'https://www.googleapis.com/books/v1/volumes';

// List of ISBNs or queries to seed
const SEED_QUERIES = [
    'isbn:9786558380542', // A Biblioteca da Meia-Noite
    'isbn:9786580309318', // Torto Arado
    'isbn:9788532530691', // O Conto da Aia
    'isbn:9786554250141', // Pequeno Manual Antirracista
    'isbn:9788535914849', // 1984
    'isbn:9788535909555', // A Revolução dos Bichos
    'isbn:9788595081536', // O Homem de Giz
    'isbn:9788551002933', // Sapiens
    'isbn:9788543807904', // O Sol é Para Todos
    'isbn:9786555600216', // Tudo é Rio
];

const normalizeDate = (dateStr: string | undefined) => {
    if (!dateStr) return null;
    if (dateStr.length === 4) return `${dateStr}-01-01`;
    if (dateStr.length === 7) return `${dateStr}-01`;
    return dateStr;
};

export async function GET(request: Request) {
    const cookieStore = await cookies();

    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        serviceRoleKey || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll()
                },
                setAll(cookiesToSet) {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) =>
                            cookieStore.set(name, value, options)
                        )
                    } catch {
                        // The `setAll` method was called from a Server Component.
                        // This can be ignored if you have middleware refreshing
                        // user sessions.
                    }
                },
            },
        }
    );

    // Check authentication ONLY if not using Service Role (Admin)
    if (!serviceRoleKey) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({
                error: 'Não autorizado. Você precisa estar logado para popular o banco de dados.',
                instruction: 'Acesse http://localhost:3000/login, faça login e tente novamente.'
            }, { status: 401 });
        }
    }

    const results = [];
    const errors = [];

    for (const query of SEED_QUERIES) {
        try {
            const response = await fetch(`${GOOGLE_BOOKS_API}?q=${query}&key=${process.env.GOOGLE_BOOKS_API_KEY || ''}`);
            const data = await response.json();

            if (!data.items || data.items.length === 0) {
                errors.push(`No results for ${query}`);
                continue;
            }

            const bookData = data.items[0].volumeInfo;
            const isbn = bookData.industryIdentifiers?.find((id: any) => id.type === 'ISBN_13')?.identifier ||
                bookData.industryIdentifiers?.find((id: any) => id.type === 'ISBN_10')?.identifier;

            if (!isbn) {
                errors.push(`No ISBN for ${query}`);
                continue;
            }

            const coverUrl = bookData.imageLinks?.thumbnail
                ? bookData.imageLinks.thumbnail.replace('http:', 'https:').replace('&zoom=1', '&zoom=3').replace('&edge=curl', '')
                : `https://books.google.com/books/content?id=${data.items[0].id}&printsec=frontcover&img=1&zoom=3`;

            const thumbnail = bookData.imageLinks?.smallThumbnail
                ? bookData.imageLinks.smallThumbnail.replace('http:', 'https:').replace('&edge=curl', '')
                : `https://books.google.com/books/content?id=${data.items[0].id}&printsec=frontcover&img=1&zoom=2`;

            // Upsert into Supabase
            const { data: inserted, error } = await supabase
                .from('books')
                .upsert({
                    google_books_id: data.items[0].id,
                    isbn: isbn,
                    title: bookData.title,
                    subtitle: bookData.subtitle,
                    authors: bookData.authors || [],
                    publisher: bookData.publisher,
                    published_date: normalizeDate(bookData.publishedDate),
                    description: bookData.description,
                    page_count: bookData.pageCount,
                    language: bookData.language,
                    cover_url: coverUrl,
                    cover_thumbnail: thumbnail,
                    categories: bookData.categories || [],
                    is_verified: true,
                }, { onConflict: 'isbn' })
                .select();

            if (error) {
                errors.push(`Supabase error for ${query}: ${error.message}`);
            } else {
                if (inserted && inserted.length > 0) {
                    results.push(inserted[0]);
                }
            }

        } catch (e: any) {
            errors.push(`Fetch error for ${query}: ${e.message}`);
        }
    }

    return NextResponse.json({
        success: results.length,
        results,
        errors
    });
}
