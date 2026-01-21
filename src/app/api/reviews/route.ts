import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

// GET - Fetch reviews for a book
export async function GET(request: Request) {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const bookId = searchParams.get('book_id');

    if (!bookId) {
        return NextResponse.json({ error: 'book_id is required' }, { status: 400 });
    }

    const { data, error } = await supabase
        .from('reviews')
        .select(`
            id,
            rating,
            content,
            contains_spoilers,
            likes_count,
            comments_count,
            created_at,
            user:profiles!user_id (
                id,
                username,
                display_name,
                avatar_url
            )
        `)
        .eq('book_id', bookId)
        .order('created_at', { ascending: false });

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ reviews: data });
}

// POST - Create a review
export async function POST(request: Request) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { book_id, rating, content, vibes, contains_spoilers } = body;

    if (!book_id || !rating) {
        return NextResponse.json({ error: 'book_id and rating are required' }, { status: 400 });
    }

    if (rating < 1 || rating > 5) {
        return NextResponse.json({ error: 'Rating must be between 1 and 5' }, { status: 400 });
    }

    // Check if user already reviewed this book
    const { data: existing } = await supabase
        .from('reviews')
        .select('id')
        .eq('user_id', user.id)
        .eq('book_id', book_id)
        .single();

    if (existing) {
        // Update existing review
        const { data, error } = await supabase
            .from('reviews')
            .update({
                rating,
                content: content || null,
                contains_spoilers: contains_spoilers || false,
                updated_at: new Date().toISOString(),
            })
            .eq('id', existing.id)
            .select()
            .single();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // Update vibes
        if (vibes && vibes.length > 0) {
            await supabase.from('review_vibes').delete().eq('review_id', existing.id);
            await supabase.from('review_vibes').insert(
                vibes.map((vibe_id: number) => ({ review_id: existing.id, vibe_id }))
            );
        }

        return NextResponse.json({ success: true, data, updated: true });
    }

    // Create new review
    const { data, error } = await supabase
        .from('reviews')
        .insert({
            user_id: user.id,
            book_id,
            rating,
            content: content || null,
            contains_spoilers: contains_spoilers || false,
        })
        .select()
        .single();

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Add vibes
    if (vibes && vibes.length > 0) {
        await supabase.from('review_vibes').insert(
            vibes.map((vibe_id: number) => ({ review_id: data.id, vibe_id }))
        );
    }

    // Also mark book as "read" in user_books if not already
    await supabase.from('user_books').upsert({
        user_id: user.id,
        book_id,
        status: 'read',
        finished_at: new Date().toISOString(),
    }, { onConflict: 'user_id,book_id' });

    // Award XP for the review
    try {
        // Check if book is an indie/published book (bonus XP)
        const { data: indieBook } = await supabase
            .from('published_books')
            .select('id')
            .eq('book_id', book_id)
            .single();

        const isIndie = !!indieBook;
        const xpAmount = isIndie ? 25 : 10; // 25 XP for indie, 10 XP for regular
        const eventType = isIndie ? 'indie_review' : 'review';

        // Call the add_xp RPC function
        await supabase.rpc('add_xp', {
            p_user_id: user.id,
            p_event_type: eventType,
            p_xp: xpAmount,
            p_book_id: book_id
        });
    } catch (xpError) {
        // XP award failure should not fail the review creation
        console.error('Failed to award XP:', xpError);
    }

    return NextResponse.json({ success: true, data, created: true });
}

// DELETE - Delete a review
export async function DELETE(request: Request) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const reviewId = searchParams.get('review_id');

    if (!reviewId) {
        return NextResponse.json({ error: 'review_id is required' }, { status: 400 });
    }

    const { error } = await supabase
        .from('reviews')
        .delete()
        .eq('id', reviewId)
        .eq('user_id', user.id); // Ensure user owns the review

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
}
