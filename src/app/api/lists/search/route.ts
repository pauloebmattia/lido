import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    if (!query || query.length < 2) {
        return NextResponse.json({ lists: [] });
    }

    const searchTerm = `%${query}%`;

    const { data: lists, error } = await supabase
        .from('book_lists')
        .select(`
            *,
            owner:profiles!user_id(username, display_name, avatar_url),
            items:list_items(count)
        `)
        .eq('is_public', true)
        .or(`name.ilike.${searchTerm},description.ilike.${searchTerm}`)
        .order('created_at', { ascending: false })
        .limit(20);

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ lists: lists || [] });
}
