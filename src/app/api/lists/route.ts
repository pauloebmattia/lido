import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

// GET - Fetch user's lists or a specific list
export async function GET(request: Request) {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const listId = searchParams.get('list_id');
    const userId = searchParams.get('user_id');

    if (listId) {
        // Fetch specific list with items
        const { data: list, error } = await supabase
            .from('book_lists')
            .select(`
                *,
                items:list_items (
                    id,
                    position,
                    note,
                    book:books (*)
                )
            `)
            .eq('id', listId)
            .single();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ list });
    }

    if (userId) {
        // Fetch user's lists
        const { data: lists, error } = await supabase
            .from('book_lists')
            .select('*, items:list_items(count)')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ lists });
    }

    return NextResponse.json({ error: 'user_id or list_id required' }, { status: 400 });
}

// POST - Create a new list
export async function POST(request: Request) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, description, is_public = true } = body;

    if (!name) {
        return NextResponse.json({ error: 'name is required' }, { status: 400 });
    }

    const { data, error } = await supabase
        .from('book_lists')
        .insert({
            user_id: user.id,
            name,
            description,
            is_public,
        })
        .select()
        .single();

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, list: data });
}

// PUT - Update a list
export async function PUT(request: Request) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { list_id, name, description, is_public } = body;

    if (!list_id) {
        return NextResponse.json({ error: 'list_id is required' }, { status: 400 });
    }

    const { data, error } = await supabase
        .from('book_lists')
        .update({
            name,
            description,
            is_public,
            updated_at: new Date().toISOString(),
        })
        .eq('id', list_id)
        .eq('user_id', user.id)
        .select()
        .single();

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, list: data });
}

// DELETE - Delete a list
export async function DELETE(request: Request) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const listId = searchParams.get('list_id');

    if (!listId) {
        return NextResponse.json({ error: 'list_id is required' }, { status: 400 });
    }

    const { error } = await supabase
        .from('book_lists')
        .delete()
        .eq('id', listId)
        .eq('user_id', user.id);

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
}
