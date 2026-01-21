import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

// GET - Search users by username or display_name
export async function GET(request: Request) {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    if (!query || query.length < 2) {
        return NextResponse.json({ users: [] });
    }

    const searchTerm = `%${query}%`;

    const { data: users, error } = await supabase
        .from('profiles')
        .select('id, username, display_name, avatar_url, bio')
        .or(`username.ilike.${searchTerm},display_name.ilike.${searchTerm}`)
        .limit(20);

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ users: users || [] });
}
