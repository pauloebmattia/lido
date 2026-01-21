import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

// POST - Add a book to a list
export async function POST(request: Request) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { list_id, book_id, note } = body;

    if (!list_id || !book_id) {
        return NextResponse.json({ error: 'list_id and book_id are required' }, { status: 400 });
    }

    // Verify user owns the list
    const { data: list } = await supabase
        .from('book_lists')
        .select('id')
        .eq('id', list_id)
        .eq('user_id', user.id)
        .single();

    if (!list) {
        return NextResponse.json({ error: 'List not found' }, { status: 404 });
    }

    // Get current max position
    const { data: maxPos } = await supabase
        .from('list_items')
        .select('position')
        .eq('list_id', list_id)
        .order('position', { ascending: false })
        .limit(1)
        .single();

    const position = (maxPos?.position || 0) + 1;

    const { data, error } = await supabase
        .from('list_items')
        .insert({
            list_id,
            book_id,
            note,
            position,
        })
        .select()
        .single();

    if (error) {
        if (error.code === '23505') {
            return NextResponse.json({ error: 'Book already in list' }, { status: 409 });
        }
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, item: data });
}

// DELETE - Remove a book from a list
export async function DELETE(request: Request) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const listId = searchParams.get('list_id');
    const bookId = searchParams.get('book_id');

    if (!listId || !bookId) {
        return NextResponse.json({ error: 'list_id and book_id are required' }, { status: 400 });
    }

    // Verify user owns the list
    const { data: list } = await supabase
        .from('book_lists')
        .select('id')
        .eq('id', listId)
        .eq('user_id', user.id)
        .single();

    if (!list) {
        return NextResponse.json({ error: 'List not found' }, { status: 404 });
    }

    const { error } = await supabase
        .from('list_items')
        .delete()
        .eq('list_id', listId)
        .eq('book_id', bookId);

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
}
