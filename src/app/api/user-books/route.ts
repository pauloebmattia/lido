import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

// GET - Fetch user's books
export async function GET(request: Request) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    let query = supabase
        .from('user_books')
        .select(`
            id,
            status,
            current_page,
            progress_percent,
            added_at,
            started_at,
            finished_at,
            book:books (
                id,
                title,
                subtitle,
                authors,
                cover_url,
                cover_thumbnail,
                page_count,
                avg_rating
            )
        `)
        .eq('user_id', user.id)
        .order('added_at', { ascending: false });

    if (status && status !== 'all') {
        query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ books: data });
}

// POST - Add book to user's list
export async function POST(request: Request) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { book_id, status } = body;

    if (!book_id || !status) {
        return NextResponse.json({ error: 'book_id and status are required' }, { status: 400 });
    }

    // Map frontend status to database enum
    const statusMap: Record<string, string> = {
        'want-to-read': 'want_to_read',
        'reading': 'reading',
        'read': 'read',
        'dnf': 'dnf'
    };

    const dbStatus = statusMap[status] || status;

    // Upsert user_book
    const { data, error } = await supabase
        .from('user_books')
        .upsert({
            user_id: user.id,
            book_id,
            status: dbStatus,
            started_at: dbStatus === 'reading' ? new Date().toISOString() : null,
            finished_at: dbStatus === 'read' ? new Date().toISOString() : null,
        }, { onConflict: 'user_id,book_id' })
        .select()
        .single();

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Create activity feed entry
    const activityType = dbStatus === 'reading' ? 'user_started_reading' :
        dbStatus === 'read' ? 'user_finished_book' :
            'user_added_to_list';

    await supabase.from('activity_feed').insert({
        user_id: user.id,
        activity_type: activityType,
        book_id,
        is_public: true,
    });

    // Update profile stats if finished reading
    if (dbStatus === 'read') {
        await supabase.rpc('add_user_xp', { p_user_id: user.id, p_xp: 20 });
    }

    return NextResponse.json({ success: true, data });
}

// DELETE - Remove book from list
export async function DELETE(request: Request) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const bookId = searchParams.get('book_id');

    if (!bookId) {
        return NextResponse.json({ error: 'book_id is required' }, { status: 400 });
    }

    const { error } = await supabase
        .from('user_books')
        .delete()
        .eq('user_id', user.id)
        .eq('book_id', bookId);

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
}
