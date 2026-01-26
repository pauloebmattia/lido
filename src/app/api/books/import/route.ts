import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

// POST - Import a single book from Google Books data
export async function POST(request: Request) {
    const supabase = await createClient();

    // Auth check
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

    if (profile?.role !== 'admin') {
        return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const {
        google_books_id,
        title,
        subtitle,
        authors,
        publisher,
        published_date,
        description,
        page_count,
        language,
        categories,
        cover_url,
        cover_thumbnail,
        isbn,
    } = body;

    if (!title) {
        return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    try {
        // Check if book already exists
        if (google_books_id) {
            const { data: existing } = await supabase
                .from('books')
                .select('id')
                .eq('google_books_id', google_books_id)
                .single();

            if (existing) {
                return NextResponse.json({
                    error: 'Este livro já existe no catálogo',
                    book_id: existing.id
                }, { status: 409 });
            }
        }

        // Insert book
        const { data: book, error } = await supabase
            .from('books')
            .insert({
                google_books_id: google_books_id || null,
                title,
                subtitle: subtitle || null,
                authors: authors || [],
                publisher: publisher || null,
                published_date: published_date || null,
                description: description || null,
                page_count: page_count || null,
                language: language || 'pt',
                categories: categories || [],
                cover_url: cover_url || null,
                cover_thumbnail: cover_thumbnail || cover_url || null,
                isbn: isbn || null,
                added_by: user.id,
                is_verified: true, // Admin-imported books are verified
            })
            .select()
            .single();

        if (error) {
            console.error('Import error:', error);
            return NextResponse.json({ error: 'Failed to import book' }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            message: `"${title}" importado com sucesso!`,
            book
        });
    } catch (error) {
        console.error('Import error:', error);
        return NextResponse.json({ error: 'Failed to import book' }, { status: 500 });
    }
}
