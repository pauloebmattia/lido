import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

// GET - Get friends' activity on a specific book
export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id: bookId } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ friends: [] });
    }

    // Get list of people the user follows
    const { data: following } = await supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', user.id);

    if (!following || following.length === 0) {
        return NextResponse.json({ friends: [] });
    }

    const followingIds = following.map(f => f.following_id);

    // Get user_books entries for this book from followed users
    const { data: friendsActivity } = await supabase
        .from('user_books')
        .select(`
            status,
            user:profiles!user_id (
                id,
                username,
                display_name,
                avatar_url
            )
        `)
        .eq('book_id', bookId)
        .in('user_id', followingIds);

    // Get reviews from followed users
    const { data: friendsReviews } = await supabase
        .from('reviews')
        .select(`
            rating,
            content,
            user:profiles!user_id (
                id,
                username,
                display_name,
                avatar_url
            )
        `)
        .eq('book_id', bookId)
        .in('user_id', followingIds);

    return NextResponse.json({
        friends: friendsActivity || [],
        reviews: friendsReviews || [],
    });
}
