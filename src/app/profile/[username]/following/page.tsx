import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { ConnectionsList } from '../ConnectionsList';
import { notFound } from 'next/navigation';

export default async function FollowingPage({ params }: { params: Promise<{ username: string }> }) {
    const { username } = await params;
    const supabase = await createClient();
    const serviceClient = createServiceClient();

    // 1. Get Current User
    const { data: { user: authUser } } = await supabase.auth.getUser();
    let currentUser = null;
    let myFollowingIds: string[] = [];

    if (authUser) {
        const { data: curr } = await serviceClient.from('profiles').select('*').eq('id', authUser.id).single();
        currentUser = curr;

        const { data: myFollows } = await serviceClient
            .from('follows')
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

    // 3. Get Following List (Bypassing RLS)
    const { data: connectionsData } = await serviceClient
        .from('follows')
        .select('following:profiles!following_id(*)')
        .eq('follower_id', profile.id);

    const connections = connectionsData ? connectionsData.map((d: any) => d.following) : [];

    return (
        <ConnectionsList
            username={username}
            type="following"
            initialProfile={profile}
            initialConnections={connections}
            currentUser={currentUser}
            initialFollowingIds={myFollowingIds}
        />
    );
}
