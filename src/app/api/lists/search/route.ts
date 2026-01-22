import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

// GET - Search public lists by name/description OR get popular lists
export async function GET(request: Request) {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const popular = searchParams.get('popular');
    const limit = parseInt(searchParams.get('limit') || '10');

    // Get current user to exclude their own lists
    const { data: { user } } = await supabase.auth.getUser();

    if (popular === 'true') {
        // Get most followed public lists
        const { data: popularLists, error } = await supabase
            .from('book_lists')
            .select(`
                *,
                list_items(count),
                owner:profiles!user_id(username, display_name, avatar_url)
            `)
            .eq('is_public', true)
            .neq('user_id', user?.id || '')
            .order('created_at', { ascending: false })
            .limit(limit);

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ lists: popularLists || [] });
    }

    if (query && query.length >= 2) {
        // Search public lists
        const { data: searchResults, error } = await supabase
            .from('book_lists')
            .select(`
                *,
                list_items(count),
                owner:profiles!user_id(username, display_name, avatar_url)
            `)
            .eq('is_public', true)
            .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
            .limit(limit);

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ lists: searchResults || [] });
    }

    return NextResponse.json({ lists: [] });
}
