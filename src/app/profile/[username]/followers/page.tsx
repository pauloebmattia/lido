import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { ConnectionsList } from '../ConnectionsList';
import { notFound } from 'next/navigation';

export default async function FollowersPage({ params }: { params: Promise<{ username: string }> }) {
    const { username } = await params;
    const supabase = await createClient();
    const serviceClient = createServiceClient(); // Bypasses RLS for lists

    // 1. Get Current User
    const { data: { user: authUser } } = await supabase.auth.getUser();
    let currentUser = null;
    let myFollowingIds: string[] = [];

    if (authUser) {
        const { data: curr } = await serviceClient.from('profiles').select('*').eq('id', authUser.id).single();
        currentUser = curr;

        // Fetch valid follows for current user (buttons state)
        // Using Service Client ensures we see them even if RLS is broken for "select own"
        const { data: myFollows } = await serviceClient
            .from('user_follows')
            .select('following_id')
            .eq('follower_id', authUser.id);

        if (myFollows) {
            myFollowingIds = myFollows.map(f => f.following_id);
        }
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

    // 3. Get Followers List (Bypassing RLS)
    const { data: connectionsData } = await serviceClient
        .from('user_follows')
        .select('follower:profiles!follower_id(*)')
        .eq('following_id', profile.id);

    const connections = connectionsData ? connectionsData.map((d: any) => d.follower) : [];

    return (
        <ConnectionsList
            username={username}
            type="followers"
            initialProfile={profile}
            initialConnections={connections}
            currentUser={currentUser}
            initialFollowingIds={myFollowingIds}
        />
    );
}
