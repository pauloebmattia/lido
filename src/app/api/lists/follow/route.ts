import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

// GET - Check if current user follows a list
export async function GET(request: Request) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ isFollowing: false });
    }

    const { searchParams } = new URL(request.url);
    const listId = searchParams.get('list_id');

    if (!listId) {
        return NextResponse.json({ error: 'list_id required' }, { status: 400 });
    }

    const { data } = await supabase
        .from('list_followers')
        .select('id')
        .eq('list_id', listId)
        .eq('user_id', user.id)
        .single();

    return NextResponse.json({ isFollowing: !!data });
}

// POST - Follow a list
export async function POST(request: Request) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { list_id } = body;

    if (!list_id) {
        return NextResponse.json({ error: 'list_id required' }, { status: 400 });
    }

    const { error } = await supabase
        .from('list_followers')
        .insert({ list_id, user_id: user.id });

    if (error) {
        if (error.code === '23505') {
            return NextResponse.json({ error: 'Already following' }, { status: 409 });
        }
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
}

// DELETE - Unfollow a list
export async function DELETE(request: Request) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const listId = searchParams.get('list_id');

    if (!listId) {
        return NextResponse.json({ error: 'list_id required' }, { status: 400 });
    }

    const { error } = await supabase
        .from('list_followers')
        .delete()
        .eq('list_id', listId)
        .eq('user_id', user.id);

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
}
