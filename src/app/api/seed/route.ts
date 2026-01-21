import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
    const supabase = await createClient();

    // 1. Get a book to make Indie
    const { data: book } = await supabase.from('books').select('id, added_by').limit(1).single();

    if (book) {
        // Insert Indie Book
        const { error: indieError } = await supabase.from('early_access_books').insert({
            book_id: book.id,
            author_id: book.added_by || '00000000-0000-0000-0000-000000000000', // Warning: might fail constraint if user doesn't exist. assume added_by is valid or handle it.
            file_path: 'https://example.com/dummy.pdf',
            file_type: 'pdf',
            xp_bonus: 100,
            is_approved: true
        });
        if (indieError) console.error('Indie Error:', indieError);
    }

    // 2. Get User
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
        // Get badges
        const { data: badges } = await supabase.from('badges').select('id').limit(2);

        if (badges && badges.length > 0) {
            const inserts = badges.map(b => ({
                user_id: user.id,
                badge_id: b.id
            }));

            const { error: badgeError } = await supabase.from('user_badges').insert(inserts);
            if (badgeError) console.error('Badge Error:', badgeError);
        }
    }

    return NextResponse.json({ success: true, message: 'Seeding attempted' });
}
