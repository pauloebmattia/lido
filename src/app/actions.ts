'use server';

import { createServiceClient } from '@/lib/supabase/service';
import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

const TABLE_NAME = 'follows'; // Explicitly matching the migration definition

export async function getFollowStatus(targetUserId: string) {
    const supabase = await createClient(); // Use auth client for reading acting as user
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { isFollowing: false };

    // Use Service Client for reading to avoid RLS lookup issues if any
    const serviceClient = createServiceClient();

    // First try 'follows'
    let { data, error } = await serviceClient
        .from(TABLE_NAME)
        .select('id')
        .eq('follower_id', user.id)
        .eq('following_id', targetUserId)
        .single();

    if (error && error.code === '42P01') {
        // Table not found, try user_follows fallback
        const { data: dataFallback } = await serviceClient
            .from('user_follows')
            .select('id')
            .eq('follower_id', user.id)
            .eq('following_id', targetUserId)
            .single();
        data = dataFallback;
    }

    return { isFollowing: !!data };
}

export async function toggleFollow(targetUserId: string, isFollowing: boolean) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        throw new Error('Unauthorized');
    }

    if (user.id === targetUserId) {
        throw new Error('Cannot follow yourself');
    }

    // Use Service Client for absolute power
    const serviceClient = createServiceClient();

    // Try primary table 'follows'
    let activeTable = TABLE_NAME;

    try {
        if (isFollowing) {
            // Unfollow
            let { error } = await serviceClient
                .from(activeTable)
                .delete()
                .eq('follower_id', user.id)
                .eq('following_id', targetUserId);

            if (error?.code === '42P01') {
                activeTable = 'user_follows';
                const res = await serviceClient
                    .from(activeTable)
                    .delete()
                    .eq('follower_id', user.id)
                    .eq('following_id', targetUserId);
                error = res.error;
            }

            if (error) throw error;
        } else {
            // Follow
            let { error } = await serviceClient
                .from(activeTable)
                .insert({
                    follower_id: user.id,
                    following_id: targetUserId
                });

            if (error?.code === '42P01') {
                activeTable = 'user_follows';
                const res = await serviceClient
                    .from(activeTable)
                    .insert({
                        follower_id: user.id,
                        following_id: targetUserId
                    });
                error = res.error;
            }

            if (error) {
                // Ignore unique constraint violation (already followed)
                if (error.code !== '23505') throw error;
            }
        }

        revalidatePath(`/profile/${targetUserId}`);
        revalidatePath(`/profile/${user.id}`);

        return { success: true, tableUsed: activeTable };
    } catch (error: any) {
        console.error('Toggle follow error:', error);
        return { success: false, error: `Table: ${activeTable} - ${error.message}` };
    }
}
