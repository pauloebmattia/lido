import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ books: [] });
    }

    // 1. Get users I follow
    const { data: following } = await supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', user.id);

    if (!following || following.length === 0) {
        return NextResponse.json({ books: [] });
    }

    const followingIds = following.map(f => f.following_id);

    // 2. Get recent activity from these users (last 30 days)
    // We want unique books, but we want to know WHO read them
    const { data: activity } = await supabase
        .from('user_books')
        .select(`
            status,
            updated_at,
            book:books!book_id(*),
            user:profiles!user_id(username, display_name, avatar_url)
        `)
        .in('user_id', followingIds)
        .order('updated_at', { ascending: false })
        .limit(20);

    if (!activity) {
        return NextResponse.json({ books: [] });
    }

    // 3. Group by book
    const bookMap = new Map();

    activity.forEach((item: any) => {
        if (!item.book) return;

        if (!bookMap.has(item.book.id)) {
            bookMap.set(item.book.id, {
                book: item.book,
                friends: [],
                last_interaction: item.updated_at
            });
        }

        const entry = bookMap.get(item.book.id);
        // Avoid duplicate users for same book in this view
        if (!entry.friends.some((f: any) => f.username === item.user.username)) {
            entry.friends.push({
                user: item.user,
                status: item.status
            });
        }
    });

    const books = Array.from(bookMap.values());

    return NextResponse.json({ books });
}
