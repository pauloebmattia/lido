import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

// GET - Check if current user follows a specific user
export async function GET(request: Request) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const targetUserId = searchParams.get('user_id');

    if (!targetUserId) {
        return NextResponse.json({ error: 'user_id is required' }, { status: 400 });
    }

    const serviceClient = createServiceClient();
    const { data, error } = await serviceClient
        .from('user_follows')
        .select('id')
        .eq('follower_id', user.id)
        .eq('following_id', targetUserId)
        .single();

    if (error && error.code !== 'PGRST116') {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ isFollowing: !!data });
}

// POST - Follow a user
export async function POST(request: Request) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { user_id: targetUserId } = body;

    if (!targetUserId) {
        return NextResponse.json({ error: 'user_id is required' }, { status: 400 });
    }

    if (targetUserId === user.id) {
        return NextResponse.json({ error: 'Cannot follow yourself' }, { status: 400 });
    }

    const serviceClient = createServiceClient();
    const { error } = await serviceClient
        .from('user_follows')
        .insert({
            follower_id: user.id,
            following_id: targetUserId,
        });

    if (error) {
        if (error.code === '23505') {
            return NextResponse.json({ error: 'Already following' }, { status: 409 });
        }
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, action: 'followed' });
}

// DELETE - Unfollow a user
export async function DELETE(request: Request) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const targetUserId = searchParams.get('user_id');

    if (!targetUserId) {
        return NextResponse.json({ error: 'user_id is required' }, { status: 400 });
    }

    const serviceClient = createServiceClient();
    const { error } = await serviceClient
        .from('user_follows')
        .delete()
        .eq('follower_id', user.id)
        .eq('following_id', targetUserId);

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, action: 'unfollowed' });
}
