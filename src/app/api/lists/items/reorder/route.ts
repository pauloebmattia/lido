import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function PUT(request: Request) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { items } = await request.json();

        if (!Array.isArray(items)) {
            return NextResponse.json({ error: 'Items must be an array' }, { status: 400 });
        }

        // Validate ownership of the list (checking the first item is enough for now, 
        // or we trust the RLS on the table to block updates if not owner.
        // But RLS on list_items checks "EXISTS (SELECT 1 FROM book_lists WHERE id = list_id AND user_id = auth.uid())"
        // So simple bulk update should work if the IDs belong to user's list.

        // Supabase doesn't support bulk update with different values easily in a single query without a stored procedure 
        // or some trickery. The easiest way for a small list is likely a loop or a specific upsert pattern.

        // Upsert requires all columns usually. We only want to update position.
        // Let's use a loop for now, it's inefficient but fine for small lists (<100 items).

        for (const item of items) {
            await supabase
                .from('list_items')
                .update({ position: item.position })
                .eq('id', item.id);
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Reorder error:', error);
        return NextResponse.json({ error: 'Failed to reorder' }, { status: 500 });
    }
}
