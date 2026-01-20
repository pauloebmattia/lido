import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const cursor = searchParams.get('cursor'); // ISO timestamp for pagination

    try {
        const supabase = await createClient();

        // Get current user (optional)
        const { data: { user } } = await supabase.auth.getUser();

        // Build query for user_feed view
        let query = supabase
            .from('user_feed')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(limit);

        // If cursor provided, get items older than cursor
        if (cursor) {
            query = query.lt('created_at', cursor);
        }

        // If user is logged in, filter to show only followed users' activities
        // For now, show all public activities
        const { data: feedItems, error } = await query;

        if (error) {
            throw error;
        }

        // Determine next cursor
        const nextCursor = feedItems && feedItems.length === limit
            ? feedItems[feedItems.length - 1].created_at
            : null;

        return NextResponse.json({
            items: feedItems || [],
            nextCursor,
            hasMore: nextCursor !== null,
        });
    } catch (error) {
        console.error('Feed API error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch feed. Please try again.' },
            { status: 500 }
        );
    }
}
