import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

// GET - Get comments for a review
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const reviewId = searchParams.get('review_id');

    if (!reviewId) {
        return NextResponse.json({ error: 'review_id is required' }, { status: 400 });
    }

    const supabase = await createClient();

    const { data: comments, error } = await supabase
        .from('review_comments')
        .select(`
            id,
            content,
            created_at,
            user:profiles!user_id(id, username, display_name, avatar_url)
        `)
        .eq('review_id', reviewId)
        .order('created_at', { ascending: true });

    if (error) {
        console.error('Error fetching comments:', error);
        return NextResponse.json({ comments: [] });
    }

    return NextResponse.json({ comments: comments || [] });
}

// POST - Add a comment to a review
export async function POST(request: Request) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { review_id, content } = await request.json();

    if (!review_id || !content?.trim()) {
        return NextResponse.json({ error: 'review_id and content are required' }, { status: 400 });
    }

    try {
        // Insert comment
        const { data: comment, error: insertError } = await supabase
            .from('review_comments')
            .insert({
                user_id: user.id,
                review_id: review_id,
                content: content.trim(),
            })
            .select(`
                id,
                content,
                created_at,
                user:profiles!user_id(id, username, display_name, avatar_url)
            `)
            .single();

        if (insertError) {
            console.error('Comment insert error:', insertError);
            return NextResponse.json({ error: 'Failed to add comment' }, { status: 500 });
        }

        // Increment comments count
        await supabase.rpc('increment_review_comments', { p_review_id: review_id });

        // Create notification for review author
        const { data: review } = await supabase
            .from('reviews')
            .select('user_id, book:books(id, title)')
            .eq('id', review_id)
            .single();

        if (review && review.user_id !== user.id) {
            await supabase.from('notifications').insert({
                user_id: review.user_id,
                actor_id: user.id,
                type: 'comment_review',
                data: {
                    review_id,
                    book_id: (review.book as any)?.id,
                    book_title: (review.book as any)?.title,
                    comment_preview: content.substring(0, 100),
                    link: `/books/${(review.book as any)?.id}`,
                },
            });
        }

        return NextResponse.json({ comment, success: true });
    } catch (error) {
        console.error('Comment error:', error);
        return NextResponse.json({ error: 'Failed to add comment' }, { status: 500 });
    }
}

// DELETE - Delete a comment
export async function DELETE(request: Request) {
    const { searchParams } = new URL(request.url);
    const commentId = searchParams.get('comment_id');

    if (!commentId) {
        return NextResponse.json({ error: 'comment_id is required' }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get comment to check ownership and get review_id
    const { data: comment } = await supabase
        .from('review_comments')
        .select('user_id, review_id')
        .eq('id', commentId)
        .single();

    if (!comment) {
        return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
    }

    if (comment.user_id !== user.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Delete comment
    const { error } = await supabase
        .from('review_comments')
        .delete()
        .eq('id', commentId);

    if (error) {
        return NextResponse.json({ error: 'Failed to delete comment' }, { status: 500 });
    }

    // Decrement comments count
    await supabase.rpc('decrement_review_comments', { p_review_id: comment.review_id });

    return NextResponse.json({ success: true });
}
