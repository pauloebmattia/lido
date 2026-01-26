import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

// GET - Check if user liked a review
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const reviewId = searchParams.get('review_id');

    if (!reviewId) {
        return NextResponse.json({ error: 'review_id is required' }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ liked: false });
    }

    // Check if user already liked this review
    const { data: existingLike } = await supabase
        .from('review_likes')
        .select('id')
        .eq('user_id', user.id)
        .eq('review_id', reviewId)
        .single();

    return NextResponse.json({ liked: !!existingLike });
}

// POST - Toggle like on a review
export async function POST(request: Request) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { review_id } = await request.json();

    if (!review_id) {
        return NextResponse.json({ error: 'review_id is required' }, { status: 400 });
    }

    try {
        // Check if already liked
        const { data: existingLike } = await supabase
            .from('review_likes')
            .select('id')
            .eq('user_id', user.id)
            .eq('review_id', review_id)
            .single();

        if (existingLike) {
            // Unlike: Remove like
            await supabase
                .from('review_likes')
                .delete()
                .eq('id', existingLike.id);

            // Decrement count
            await supabase.rpc('decrement_review_likes', { p_review_id: review_id });

            return NextResponse.json({ liked: false, action: 'unliked' });
        } else {
            // Like: Add like
            const { error: insertError } = await supabase
                .from('review_likes')
                .insert({
                    user_id: user.id,
                    review_id: review_id,
                });

            if (insertError) {
                // Possibly table doesn't exist - fallback to just incrementing
                console.error('Like insert error:', insertError);
            }

            // Increment count
            await supabase.rpc('increment_review_likes', { review_id: review_id });

            // Create notification for review author
            const { data: review } = await supabase
                .from('reviews')
                .select('user_id, book:books(title)')
                .eq('id', review_id)
                .single();

            if (review && review.user_id !== user.id) {
                await supabase.from('notifications').insert({
                    user_id: review.user_id,
                    actor_id: user.id,
                    type: 'like_review',
                    data: {
                        review_id,
                        book_title: (review.book as any)?.title,
                        link: `/books/${review_id}`,
                    },
                });
            }

            return NextResponse.json({ liked: true, action: 'liked' });
        }
    } catch (error) {
        console.error('Like error:', error);
        return NextResponse.json({ error: 'Failed to toggle like' }, { status: 500 });
    }
}
