import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { notFound } from 'next/navigation';
import { ProfileClient } from './ProfileClient';

export default async function ProfilePage({ params }: { params: Promise<{ username: string }> }) {
    const { username } = await params;
    const supabase = await createClient(); // For auth
    const serviceClient = createServiceClient(); // For data fetching (Admin role)

    // 1. Get Current User (for NavBar and isFollowing check)
    const { data: { user: authUser } } = await supabase.auth.getUser();
    let currentUser = null;
    let isFollowing = false;

    if (authUser) {
        const { data: curr } = await serviceClient
            .from('profiles')
            .select('*')
            .eq('id', authUser.id)
            .single();
        currentUser = curr;
    }

    // 2. Get Target Profile
    const { data: profile } = await serviceClient
        .from('profiles')
        .select('*')
        .eq('username', username)
        .single();

    if (!profile) {
        notFound();
    }

    // 3. Fetch Data (Optimized with Service Client)
    // Counts (Real-time count might differ from column, but let's trust column OR fetch count)
    // User reported counts were wrong, so let's fetch real counts.

    const { count: booksCount } = await serviceClient
        .from('user_books')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', profile.id)
        .eq('status', 'read');

    const { count: reviewsCount } = await serviceClient
        .from('reviews')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', profile.id);

    const { count: followersCount } = await serviceClient
        .from('user_follows')
        .select('id', { count: 'exact', head: true })
        .eq('following_id', profile.id);

    const { count: followingCount } = await serviceClient
        .from('user_follows')
        .select('id', { count: 'exact', head: true })
        .eq('follower_id', profile.id);

    // Update profile counts in object (to pass correct data)
    profile.books_read = booksCount || 0;
    profile.reviews_count = reviewsCount || 0;
    profile.followers_count = followersCount || 0;
    profile.following_count = followingCount || 0;

    // 4. Check Following Status
    if (authUser && authUser.id !== profile.id) {
        const { data: followStatus } = await serviceClient
            .from('user_follows')
            .select('id')
            .eq('follower_id', authUser.id)
            .eq('following_id', profile.id)
            .single();

        isFollowing = !!followStatus;
    }

    // 5. Fetch Lists/Books/Reviews for Initial State
    const { data: books } = await serviceClient
        .from('user_books')
        .select('*, book:books(*)')
        .eq('user_id', profile.id)
        .eq('status', 'read')
        .order('finished_at', { ascending: false })
        .limit(10); // Limit initial for performance

    const { data: reviews } = await serviceClient
        .from('reviews')
        .select('*, book:books(*)')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false })
        .limit(10);

    // Format books
    const initialBooks = books ? books.map((b: any) => ({ ...b, book: b.book })) : [];
    const initialReviews = reviews ? reviews.map((r: any) => ({ ...r, book: r.book })) : [];

    return (
        <ProfileClient
            initialProfile={profile}
            currentUser={currentUser}
            initialIsFollowing={isFollowing}
            initialFollowersCount={followersCount || 0}
            initialFollowingCount={followingCount || 0}
            initialBooks={initialBooks}
            initialReviews={initialReviews}
        />
    );
}
